import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import catchAsyncErrors from '../middleware/catchAsyncErrors';
import Appointment from '../models/appointmentmodel';
import Doctor from '../models/doctormodel';
import DoctorSchedule from '../models/doctorschedulemodel';
import User from '../models/usermodel';
import Patient from '../models/patientmodel';
import Conversation from '../models/conversationmodel';
import Message from '../models/messagemodel';
import Leave from '../models/leavemodel';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { sendNotification } from './notification.controller';
import { markPastAppointmentsAsCompleted as markPastAppointmentsUtil } from '../utils/markPastAppointments';
import { getReceiverSocketId, io } from '../socket';
import { AuthRequest } from '../middleware/auth';
import ErrorHander from '../utils/errorhander';

// Helper: Ensure date is compared cleanly (YYYY-MM-DD)
const isSameDay = (d1: Date | string, d2: Date | string): boolean => {
  return moment(d1).format('YYYY-MM-DD') === moment(d2).format('YYYY-MM-DD');
};

// Helper: Parse combined date and time
const parseSlotDateTime = (dateStr: string | Date, timeStr: string): Date => {
  const d = moment(dateStr).format('YYYY-MM-DD');
  return moment(`${d} ${timeStr}`, ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD h:mm A']).toDate();
};

export const newappointment = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { doc_id, date, time } = req.body;
    const actingUserId = req.user?._id;

    if (!doc_id || !date || !time) {
      return next(new ErrorHander('Doctor ID, date, and time are required', 400));
    }

    // Validate date format
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return next(new ErrorHander('Invalid appointment date format', 400));
    }

    // Validate that slot is not in the past
    const slotDateTime = parseSlotDateTime(date, time);
    if (slotDateTime.getTime() <= Date.now()) {
      return next(new ErrorHander('Cannot book an appointment in the past', 400));
    }

    // Find or create patient record for authenticated user
    let patient = await Patient.findOne({ user: actingUserId });
    if (!patient) {
      patient = await Patient.create({
        user: actingUserId,
        medicalHistory: '',
        allergies: '',
        currentMedications: '',
      });
    }

    // Find doctor and schedule
    const doctor = await Doctor.findById(doc_id).populate('user');
    if (!doctor) {
      return next(new ErrorHander('Doctor not found', 404));
    }

    const schedule = await DoctorSchedule.findOne({ doctor: doc_id });
    if (!schedule) {
      return next(new ErrorHander('Doctor has not published a schedule yet', 400));
    }

    // Check if doctor is on approved leave for this date
    const targetDateStart = moment(date).startOf('day').toDate();
    const targetDateEnd = moment(date).endOf('day').toDate();
    const doctorOnLeave = await Leave.findOne({
      doctor: doctor._id,
      $or: [{ status: 'Approved' }, { status: { $exists: false } }],
      startDate: { $lte: targetDateEnd },
      endDate: { $gte: targetDateStart },
    });

    if (doctorOnLeave) {
      return next(new ErrorHander('Doctor is on leave on the selected date', 400));
    }

    // Validate slot against published doctor working hours
    const allWorkingSlots: string[] = [];
    if (schedule.schedule?.morning) {
      schedule.schedule.morning.forEach((m) => {
        let cur = moment(m.startTime, 'HH:mm');
        const end = moment(m.endTime, 'HH:mm');
        while (cur.isBefore(end)) {
          allWorkingSlots.push(cur.format('HH:mm'));
          cur.add(10, 'minutes');
        }
      });
    }
    if (schedule.schedule?.evening) {
      schedule.schedule.evening.forEach((e) => {
        let cur = moment(e.startTime, 'HH:mm');
        const end = moment(e.endTime, 'HH:mm');
        while (cur.isBefore(end)) {
          allWorkingSlots.push(cur.format('HH:mm'));
          cur.add(10, 'minutes');
        }
      });
    }

    const formattedTime = moment(time, ['HH:mm', 'h:mm A']).format('HH:mm');
    if (allWorkingSlots.length > 0 && !allWorkingSlots.includes(formattedTime)) {
      return next(
        new ErrorHander('Requested time slot is outside published doctor working hours', 400)
      );
    }

    // Check availability in occupied slots
    const isSlotOccupied = schedule.occupiedSlots.some((slot) => {
      return (
        isSameDay(slot.date, appointmentDate) &&
        slot.timeSlots.some((ts) => ts.timeSlot === time || ts.timeSlot === formattedTime)
      );
    });

    if (isSlotOccupied) {
      return next(new ErrorHander('Selected time slot is already booked', 400));
    }

    // Check existing active appointment for this patient at the same time
    const existingPatientAppointment = await Appointment.findOne({
      date: appointmentDate,
      time,
      patient: patient._id,
      status: 'Scheduled',
    });
    if (existingPatientAppointment) {
      return next(
        new ErrorHander('You already have an appointment scheduled for this date and time', 400)
      );
    }

    const appointmentNumber = uuidv4();

    // Create appointment with trusted server fee and paid = false
    let appointment;
    try {
      appointment = await Appointment.create({
        doctor: doc_id,
        patient: patient._id,
        date: appointmentDate,
        time,
        fees: doctor.fees,
        paid: false,
        appointmentNumber,
        status: 'Scheduled',
      });
    } catch (err: any) {
      if (err.code === 11000) {
        return next(new ErrorHander('Selected time slot is already booked by another patient', 400));
      }
      throw err;
    }

    // Atomically update schedule occupiedSlots
    const dateStr = moment(appointmentDate).format('YYYY-MM-DD');
    const existingSlotIndex = schedule.occupiedSlots.findIndex((slot) =>
      isSameDay(slot.date, appointmentDate)
    );

    if (existingSlotIndex >= 0) {
      schedule.occupiedSlots[existingSlotIndex].timeSlots.push({
        timeSlot: time,
        appointmentId: appointment._id as Types.ObjectId,
      });
    } else {
      schedule.occupiedSlots.push({
        date: new Date(dateStr),
        timeSlots: [
          {
            timeSlot: time,
            appointmentId: appointment._id as Types.ObjectId,
          },
        ],
      });
    }

    await schedule.save();

    // Send notifications to patient and doctor
    try {
      const patientUser = await User.findById(actingUserId);
      const doctorUser = await User.findById((doctor as any).user?._id || (doctor as any).user);

      if (patientUser) {
        await sendNotification(
          actingUserId.toString(),
          actingUserId.toString(),
          'appointment_booked',
          `You have successfully booked an appointment with Dr. ${doctorUser?.name || 'Doctor'} on ${moment(
            date
          ).format('MMMM Do YYYY')} at ${time}`
        );
      }

      if (doctorUser) {
        await sendNotification(
          actingUserId.toString(),
          doctorUser._id.toString(),
          'new_appointment',
          `New appointment booked by ${patientUser?.name || 'Patient'} on ${moment(date).format(
            'MMMM Do YYYY'
          )} at ${time}`
        );
      }
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    // Initialize conversation
    try {
      const doctorUserId = (doctor as any).user?._id || (doctor as any).user;
      if (actingUserId && doctorUserId) {
        let conversation = await Conversation.findOne({
          participants: { $all: [doctorUserId.toString(), actingUserId.toString()] },
        });

        if (!conversation) {
          conversation = await Conversation.create({
            participants: [doctorUserId, actingUserId],
          });
        }
      }
    } catch (chatErr) {
      console.error('Conversation init error:', chatErr);
    }

    return res.status(201).json({
      success: true,
      appointment,
    });
  }
);

export const updatepaymentstatus = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Only privileged admin or verified internal flows can manually force paid status
    if (req.user?.role !== 'admin') {
      return next(
        new ErrorHander(
          'Direct payment status mutation is restricted. Please use the /payment/verify endpoint.',
          403
        )
      );
    }

    const { appointmentNumber } = req.body;
    const appointment = await Appointment.findOne({ appointmentNumber });

    if (!appointment) {
      return next(new ErrorHander('Appointment not found', 404));
    }

    appointment.paid = true;
    await appointment.save();

    res.status(200).json({
      success: true,
      appointment,
      message: 'Successfully updated payment status',
    });
  }
);

export const alldoctors = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const doctors = await Doctor.find().populate({
      path: 'user',
      select: 'name email city state',
    });

    // Safe sanitized list for public doctor discovery
    const sanitizedDoctors = doctors
      .filter((doc) => doc.user != null)
      .map((doc) => ({
        _id: doc._id,
        user: doc.user,
        specialization: doc.specialization,
        experience: doc.experience,
        fees: doc.fees,
      }));

    res.status(200).json({
      success: true,
      doctors: sanitizedDoctors,
    });
  }
);

export const cancelAppointment = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { appointmentNumber, appointmentId } = req.body;
    const actingUserId = req.user?._id;

    if (!appointmentNumber && !appointmentId) {
      return next(new ErrorHander('Appointment identifier (appointmentNumber or appointmentId) is required', 400));
    }

    let appointment = null;
    if (appointmentId) {
      appointment = await Appointment.findById(appointmentId);
    } else if (appointmentNumber) {
      appointment = await Appointment.findOne({ appointmentNumber });
    }

    if (!appointment) {
      return next(new ErrorHander('Appointment not found', 404));
    }

    // Verify ownership
    const patient = await Patient.findById(appointment.patient);
    const isOwner =
      req.user?.role === 'admin' ||
      (patient && patient.user.toString() === actingUserId?.toString());

    if (!isOwner) {
      return next(new ErrorHander('Not authorized to cancel this appointment', 403));
    }

    // Idempotent: already canceled
    if (appointment.status === 'Canceled') {
      return res.status(200).json({
        success: true,
        message: 'Appointment is already cancelled',
        appointment,
      });
    }

    // Release slot from schedule
    const schedule = await DoctorSchedule.findOne({ doctor: appointment.doctor });
    if (schedule) {
      schedule.occupiedSlots = schedule.occupiedSlots
        .map((slot) => {
          if (isSameDay(slot.date, appointment.date)) {
            return {
              ...slot,
              timeSlots: slot.timeSlots.filter(
                (ts) => ts.timeSlot !== appointment.time && ts.appointmentId?.toString() !== (appointment._id as any)?.toString()
              ),
            };
          }
          return slot;
        })
        .filter((slot) => slot.timeSlots.length > 0);

      await schedule.save();
    }

    appointment.status = 'Canceled';
    await appointment.save();

    // Notify committed transition
    try {
      const patientUser = await User.findById(actingUserId);
      const doc = await Doctor.findById(appointment.doctor);
      if (actingUserId) {
        await sendNotification(
          actingUserId.toString(),
          actingUserId.toString(),
          'appointment_cancelled',
          `Your appointment ${appointment.appointmentNumber} has been cancelled.`
        );
      }
      if (doc?.user) {
        await sendNotification(
          actingUserId?.toString() || 'system',
          doc.user.toString(),
          'appointment_cancelled',
          `Appointment ${appointment.appointmentNumber} was cancelled by ${patientUser?.name || 'Patient'}.`
        );
      }
    } catch (notifErr) {
      console.error('Cancellation notification error:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment,
    });
  }
);

export const change_date_appointment = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { appointmentNumber, appointmentId, date, time } = req.body;
    const actingUserId = req.user?._id;

    if ((!appointmentNumber && !appointmentId) || !date || !time) {
      return next(new ErrorHander('Appointment identifier (appointmentNumber or appointmentId), new date, and new time are required', 400));
    }

    let appointment = null;
    if (appointmentId) {
      appointment = await Appointment.findById(appointmentId);
    } else if (appointmentNumber) {
      appointment = await Appointment.findOne({ appointmentNumber });
    }

    if (!appointment) {
      return next(new ErrorHander('Appointment not found', 404));
    }

    const patient = await Patient.findById(appointment.patient);
    const isOwner =
      req.user?.role === 'admin' ||
      (patient && patient.user.toString() === actingUserId?.toString());

    if (!isOwner) {
      return next(new ErrorHander('Not authorized to reschedule this appointment', 403));
    }

    if (appointment.status !== 'Scheduled') {
      return next(
        new ErrorHander(`Cannot reschedule an appointment with status: ${appointment.status}`, 400)
      );
    }

    const newSlotDateTime = parseSlotDateTime(date, time);
    if (newSlotDateTime.getTime() <= Date.now()) {
      return next(new ErrorHander('Cannot reschedule to a past date and time', 400));
    }

    const schedule = await DoctorSchedule.findOne({ doctor: appointment.doctor });
    if (!schedule) {
      return next(new ErrorHander('Doctor schedule not found', 404));
    }

    const newDateObj = new Date(date);
    const newDateStr = moment(newDateObj).format('YYYY-MM-DD');

    // Check doctor leave on new date
    const onLeave = await Leave.findOne({
      doctor: appointment.doctor,
      status: 'Approved',
      startDate: { $lte: new Date(newDateStr) },
      endDate: { $gte: new Date(newDateStr) },
    });
    if (onLeave) {
      return next(new ErrorHander('Doctor is on leave on the new selected date', 400));
    }

    // Check availability of target slot
    const targetOccupied = schedule.occupiedSlots.some(
      (slot) =>
        isSameDay(slot.date, newDateObj) &&
        slot.timeSlots.some((ts) => ts.timeSlot === time)
    );
    if (targetOccupied) {
      return next(
        new ErrorHander('The requested target slot is already occupied. Original booking kept intact.', 400)
      );
    }

    // Save old slot details for rollback if needed
    const oldDate = appointment.date;
    const oldTime = appointment.time;

    // Atomically reserve new slot and release old slot
    // 1. Remove old slot
    schedule.occupiedSlots = schedule.occupiedSlots
      .map((slot) => {
        if (isSameDay(slot.date, oldDate)) {
          return {
            ...slot,
            timeSlots: slot.timeSlots.filter(
              (ts) => ts.timeSlot !== oldTime && ts.appointmentId?.toString() !== (appointment._id as any)?.toString()
            ),
          };
        }
        return slot;
      })
      .filter((slot) => slot.timeSlots.length > 0);

    // 2. Add new slot
    const existingSlotIndex = schedule.occupiedSlots.findIndex((slot) =>
      isSameDay(slot.date, newDateObj)
    );
    if (existingSlotIndex >= 0) {
      schedule.occupiedSlots[existingSlotIndex].timeSlots.push({
        timeSlot: time,
        appointmentId: appointment._id as Types.ObjectId,
      });
    } else {
      schedule.occupiedSlots.push({
        date: new Date(newDateStr),
        timeSlots: [
          {
            timeSlot: time,
            appointmentId: appointment._id as Types.ObjectId,
          },
        ],
      });
    }

    await schedule.save();

    // 3. Update appointment
    appointment.date = newDateObj;
    appointment.time = time;
    await appointment.save();

    // 4. Send notifications
    try {
      const patientUser = await User.findById(actingUserId);
      const doc = await Doctor.findById(appointment.doctor);
      if (actingUserId) {
        await sendNotification(
          actingUserId.toString(),
          actingUserId.toString(),
          'appointment_rescheduled',
          `Appointment rescheduled to ${moment(date).format('MMMM Do YYYY')} at ${time}.`
        );
      }
      if (doc?.user) {
        await sendNotification(
          actingUserId?.toString() || 'system',
          doc.user.toString(),
          'appointment_rescheduled',
          `Appointment was rescheduled by ${patientUser?.name || 'Patient'} to ${moment(date).format('MMMM Do YYYY')} at ${time}.`
        );
      }
    } catch (notifErr) {
      console.error('Reschedule notification error:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment,
    });
  }
);

export const appointment_of_a_period = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { startDate, endDate } = req.body;
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to access these appointments', 403));
    }

    const patient = await Patient.findOne({ user: id });
    if (!patient) {
      return next(new ErrorHander('Patient profile not found', 404));
    }

    const effectiveStartDate = startDate ? new Date(startDate) : new Date(0);
    const effectiveEndDate = endDate ? new Date(endDate) : new Date(Date.now() + 100 * 365 * 24 * 3600 * 1000);

    const appointments = await Appointment.find({
      patient: patient._id,
      date: { $gte: effectiveStartDate, $lte: effectiveEndDate },
    }).populate({
      path: 'doctor',
      select: 'user specialization fees',
      populate: {
        path: 'user',
        select: 'name email phoneNumber city state',
      },
    });

    res.status(200).json({
      success: true,
      appointments,
    });
  }
);

export const appointment_history_all = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to access these appointments', 403));
    }

    const patient = await Patient.findOne({ user: id });
    if (!patient) {
      return next(new ErrorHander('Patient profile not found', 404));
    }

    const now = new Date();
    const appointments = await Appointment.find({
      patient: patient._id,
      date: { $lte: now },
    }).populate({
      path: 'doctor',
      select: 'user specialization fees',
      populate: {
        path: 'user',
        select: 'name email phoneNumber city state',
      },
    });

    res.status(200).json({
      success: true,
      appointments,
    });
  }
);

export const appointment_specific = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to access these appointments', 403));
    }

    const patient = await Patient.findOne({ user: id });
    if (!patient) {
      return next(new ErrorHander('Patient profile not found', 404));
    }

    const appointments = await Appointment.find({ patient: patient._id }).populate({
      path: 'doctor',
      select: 'user specialization experience fees',
      populate: {
        path: 'user',
        select: 'name city email phoneNumber state',
      },
    });

    res.status(200).json({
      success: true,
      appointments,
    });
  }
);

export const appointment_future = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to access these appointments', 403));
    }

    const patient = await Patient.findOne({ user: id });
    if (!patient) {
      return next(new ErrorHander('Patient profile not found', 404));
    }

    const appointments = await Appointment.find({
      patient: patient._id,
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      status: 'Scheduled',
    }).populate({
      path: 'doctor',
      select: 'user specialization fees',
      populate: {
        path: 'user',
        select: 'name email phoneNumber city state',
      },
    });

    res.status(200).json({
      success: true,
      appointments,
    });
  }
);

export const get_patient_dashboard_stats = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to access dashboard stats', 403));
    }

    const patient = await Patient.findOne({ user: id });
    if (!patient) {
      return next(new ErrorHander('Patient profile not found', 404));
    }

    const patientUser = await User.findById(id);
    const currentDate = new Date();

    const upcomingAppointments = await Appointment.countDocuments({
      patient: patient._id,
      date: { $gt: currentDate },
      status: 'Scheduled',
    });

    const completedAppointments = await Appointment.countDocuments({
      patient: patient._id,
      status: 'Completed',
    });

    let doctorsInCity = 0;
    if (patientUser?.city) {
      const doctors = await Doctor.find().populate({ path: 'user', select: 'city' });
      doctorsInCity = doctors.filter(
        (doc: any) => doc.user?.city?.toLowerCase() === patientUser.city?.toLowerCase()
      ).length;
    }

    res.status(200).json({
      success: true,
      stats: {
        upcomingAppointments,
        completedAppointments,
        doctorsInCity,
      },
    });
  }
);

export const markPastAppointmentsAsCompleted = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const result = await markPastAppointmentsUtil();
    res.status(200).json({
      success: true,
      message: `Successfully processed past appointments`,
      updatedCount: result.updatedCount,
      matchedCount: result.matchedCount,
    });
  }
);

export const get_patient_info = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();

    // Verify ownership or doctor/admin privilege
    if (req.user?.role !== 'admin' && req.user?.role !== 'doctor' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to access this patient medical profile', 403));
    }

    const patient = await Patient.findOne({ user: id }).populate(
      'user',
      'name email phoneNumber city state'
    );
    if (!patient) {
      return next(new ErrorHander('Patient profile not found', 404));
    }

    res.status(200).json({
      success: true,
      patient: {
        _id: patient._id,
        medicalHistory: patient.medicalHistory || '',
        allergies: patient.allergies || '',
        currentMedications: patient.currentMedications || '',
        user: patient.user,
      },
    });
  }
);

export const create_patient = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to manage this patient profile', 403));
    }

    const { medicalHistory, allergies, currentMedications } = req.body;
    let patient = await Patient.findOne({ user: id });

    if (patient) {
      if (medicalHistory !== undefined) patient.medicalHistory = medicalHistory;
      if (allergies !== undefined) patient.allergies = allergies;
      if (currentMedications !== undefined) patient.currentMedications = currentMedications;
      await patient.save();

      return res.status(200).json({
        success: true,
        message: 'Patient profile updated successfully',
        patient,
      });
    }

    patient = await Patient.create({
      user: id,
      medicalHistory: medicalHistory || '',
      allergies: allergies || '',
      currentMedications: currentMedications || '',
    });

    res.status(201).json({
      success: true,
      message: 'Patient profile created successfully',
      patient,
    });
  }
);

export const update_patient = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to update this patient profile', 403));
    }

    const { medicalHistory, allergies, currentMedications } = req.body;
    let patient = await Patient.findOne({ user: id });
    if (!patient) {
      patient = await Patient.create({
        user: id,
        medicalHistory: medicalHistory || '',
        allergies: allergies || '',
        currentMedications: currentMedications || '',
      });
    } else {
      if (medicalHistory !== undefined) patient.medicalHistory = medicalHistory;
      if (allergies !== undefined) patient.allergies = allergies;
      if (currentMedications !== undefined) patient.currentMedications = currentMedications;
      await patient.save();
    }

    res.status(200).json({
      success: true,
      message: 'Patient profile updated successfully',
      patient,
    });
  }
);

export const specific_doctors = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { doc_name, city, state, experience, fees, specialty } = req.query;

    const doctors = await Doctor.find().populate({
      path: 'user',
      select: 'name city state email',
    });

    let filtered = doctors.filter((doc) => doc.user != null);

    if (city && typeof city === 'string' && city.trim()) {
      const c = city.toLowerCase().trim();
      filtered = filtered.filter((doc: any) => doc.user?.city?.toLowerCase() === c);
    }

    if (state && typeof state === 'string' && state.trim()) {
      const s = state.toLowerCase().trim();
      filtered = filtered.filter((doc: any) => doc.user?.state?.toLowerCase() === s);
    }

    if (specialty && typeof specialty === 'string' && specialty.trim()) {
      const sp = specialty.toLowerCase().trim();
      filtered = filtered.filter(
        (doc) => doc.specialization && doc.specialization.toLowerCase().includes(sp)
      );
    }

    if (experience && !isNaN(Number(experience))) {
      filtered = filtered.filter((doc) => doc.experience >= Number(experience));
    }

    if (fees && !isNaN(Number(fees))) {
      filtered = filtered.filter((doc) => doc.fees <= Number(fees));
    }

    if (doc_name && typeof doc_name === 'string' && doc_name.trim()) {
      const dn = doc_name.toLowerCase().trim();
      filtered = filtered.filter((doc: any) =>
        doc.user?.name?.toLowerCase().includes(dn)
      );
    }

    const sanitized = filtered.map((doc) => ({
      _id: doc._id,
      user: doc.user,
      specialization: doc.specialization,
      experience: doc.experience,
      fees: doc.fees,
    }));

    res.status(200).json({
      success: true,
      doctors: sanitized,
    });
  }
);

export const appointment_bookings = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { doc_id } = req.query;

    if (!doc_id) {
      return next(new ErrorHander('Doctor ID (doc_id) is required', 400));
    }

    const doctor = await Doctor.findById(doc_id);
    if (!doctor) {
      return next(new ErrorHander('Doctor not found', 404));
    }

    const doctorSchedule = await DoctorSchedule.findOne({ doctor: doc_id });
    if (!doctorSchedule) {
      return res.status(200).json({
        success: true,
        message: 'Doctor has not set up their schedule yet',
        availableSlots: [],
      });
    }

    // Fetch approved doctor leaves to filter out leave dates
    const leaves = await Leave.find({
      doctor: doc_id,
      status: 'Approved',
    });

    const isDoctorOnLeave = (targetDate: moment.Moment): boolean => {
      return leaves.some((l) => {
        const start = moment(l.startDate).startOf('day');
        const end = moment(l.endDate).endOf('day');
        return targetDate.isBetween(start, end, 'day', '[]');
      });
    };

    const generateSlots = (startTime: string, endTime: string) => {
      const slots: string[] = [];
      let cur = moment(startTime, 'HH:mm');
      const end = moment(endTime, 'HH:mm');
      while (cur.isBefore(end)) {
        slots.push(cur.format('HH:mm'));
        cur.add(10, 'minutes');
      }
      return slots;
    };

    const availableSlots: any[] = [];
    const now = moment();
    const horizon = moment().add(30, 'days');

    // Build booked map
    const bookedSlotsMap = new Map<string, string[]>();
    doctorSchedule.occupiedSlots.forEach((occ: any) => {
      const d = moment(occ.date).format('YYYY-MM-DD');
      const times = occ.timeSlots.map((ts: any) =>
        moment(ts.timeSlot, ['HH:mm', 'h:mm A']).format('HH:mm')
      );
      if (bookedSlotsMap.has(d)) {
        bookedSlotsMap.set(d, [...(bookedSlotsMap.get(d) || []), ...times]);
      } else {
        bookedSlotsMap.set(d, times);
      }
    });

    for (let day = moment(now); day.isBefore(horizon); day.add(1, 'day')) {
      // Skip if on leave
      if (isDoctorOnLeave(day)) {
        continue;
      }

      const dateStr = day.format('YYYY-MM-DD');
      const isToday = day.isSame(now, 'day');
      const slotsForDay: string[] = [];

      const sched = doctorSchedule.schedule;
      if (sched?.morning) {
        sched.morning.forEach((m) => slotsForDay.push(...generateSlots(m.startTime, m.endTime)));
      }
      if (sched?.evening) {
        sched.evening.forEach((e) => slotsForDay.push(...generateSlots(e.startTime, e.endTime)));
      }

      const booked = bookedSlotsMap.get(dateStr) || [];
      let remaining = slotsForDay.filter((s) => !booked.includes(s));

      // Filter past slots if today
      if (isToday) {
        const curTimeStr = now.format('HH:mm');
        remaining = remaining.filter((s) => s > curTimeStr);
      }

      availableSlots.push({
        date: dateStr,
        slots: remaining,
      });
    }

    return res.status(200).json({ availableSlots });
  }
);
