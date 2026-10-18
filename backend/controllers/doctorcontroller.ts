import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import catchAsyncErrors from '../middleware/catchAsyncErrors';
import Appointment from '../models/appointmentmodel';
import Doctor from '../models/doctormodel';
import DoctorSchedule from '../models/doctorschedulemodel';
import User from '../models/usermodel';
import Leave from '../models/leavemodel';
import Patient from '../models/patientmodel';
import { AuthRequest } from '../middleware/auth';
import ErrorHander from '../utils/errorhander';
import moment from 'moment';

const isSameDay = (d1: Date | string, d2: Date | string): boolean => {
  return moment(d1).format('YYYY-MM-DD') === moment(d2).format('YYYY-MM-DD');
};

export const createDoctor = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { specialization, experience, fees } = req.body;
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to create doctor profile for another user', 403));
    }

    if (!specialization || experience === undefined || fees === undefined) {
      return next(new ErrorHander('Specialization, experience, and fees are required', 400));
    }

    const existingDoctor = await Doctor.findOne({ user: id });
    if (existingDoctor) {
      return next(new ErrorHander('Doctor profile already exists', 400));
    }

    const newDoctor = await Doctor.create({
      user: id,
      specialization,
      experience: Number(experience),
      fees: Number(fees),
    });

    return res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      doctor: newDoctor,
    });
  }
);

export const updateSchedule = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { morning, evening } = req.body;
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to update another doctor schedule', 403));
    }

    let doctor = await Doctor.findOne({ user: id });
    if (!doctor) {
      // Auto-create basic doctor profile if user has doctor role
      doctor = await Doctor.create({
        user: id,
        specialization: 'General Physician',
        experience: 1,
        fees: 500,
      });
    }

    let existingSchedule = await DoctorSchedule.findOne({ doctor: doctor._id });

    if (existingSchedule) {
      existingSchedule.schedule = {
        morning: morning || existingSchedule.schedule.morning,
        evening: evening || existingSchedule.schedule.evening,
      };
      await existingSchedule.save();

      return res.status(200).json({
        success: true,
        message: 'Schedule updated successfully',
        schedule: existingSchedule,
      });
    }

    const newSchedule = await DoctorSchedule.create({
      doctor: doctor._id,
      schedule: {
        morning: morning || [],
        evening: evening || [],
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      schedule: newSchedule,
    });
  }
);

export const updateDoctor = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to update this doctor profile', 403));
    }

    const { specialization, experience, fees } = req.body;
    let doctor = await Doctor.findOne({ user: id });

    if (!doctor) {
      doctor = await Doctor.create({
        user: id,
        specialization: specialization || 'General Physician',
        experience: Number(experience) || 1,
        fees: Number(fees) || 500,
      });

      return res.status(200).json({
        success: true,
        message: 'Doctor profile created successfully',
        doctor,
      });
    }

    if (specialization !== undefined) doctor.specialization = specialization;
    if (experience !== undefined && !isNaN(Number(experience))) doctor.experience = Number(experience);
    if (fees !== undefined && !isNaN(Number(fees))) doctor.fees = Number(fees);

    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully',
      doctor,
    });
  }
);

export const cancel_appointment = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { appointmentNumber } = req.body;
    const actingUserId = req.user?._id?.toString();

    const doctor = await Doctor.findOne({ user: id });
    if (!doctor && req.user?.role !== 'admin') {
      return next(new ErrorHander('Doctor profile not found', 404));
    }

    if (req.user?.role !== 'admin' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to cancel this appointment', 403));
    }

    const appointment = await Appointment.findOne({ appointmentNumber });
    if (!appointment) {
      return next(new ErrorHander('Appointment not found', 404));
    }

    if (req.user?.role !== 'admin' && appointment.doctor.toString() !== doctor?._id.toString()) {
      return next(new ErrorHander('This appointment does not belong to you', 403));
    }

    if (appointment.status === 'Canceled') {
      return res.status(200).json({
        success: true,
        message: 'Appointment is already cancelled',
      });
    }

    const schedule = await DoctorSchedule.findOne({ doctor: appointment.doctor });
    if (schedule) {
      schedule.occupiedSlots = schedule.occupiedSlots
        .map((slot) => {
          if (isSameDay(slot.date, appointment.date)) {
            return {
              ...slot,
              timeSlots: slot.timeSlots.filter((ts) => ts.timeSlot !== appointment.time),
            };
          }
          return slot;
        })
        .filter((slot) => slot.timeSlots.length > 0);

      await schedule.save();
    }

    appointment.status = 'Canceled';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment,
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

    const doctor = await Doctor.findOne({ user: id });
    if (!doctor) {
      return next(new ErrorHander('Doctor not found', 404));
    }

    const params = req.body.params || req.body || {};
    const { startDate, endDate, status } = params;

    const query: any = { doctor: doctor._id };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query)
      .populate({
        path: 'patient',
        select: 'medicalHistory allergies currentMedications',
        populate: {
          path: 'user',
          select: 'name email phoneNumber city state',
        },
      })
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      appointments,
    });
  }
);

export const change_date_appointment = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { appointmentNumber, date, time } = req.body;
    const actingUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to reschedule this appointment', 403));
    }

    const appointment = await Appointment.findOne({ appointmentNumber });
    if (!appointment) {
      return next(new ErrorHander('Appointment not found', 404));
    }

    const doctor = await Doctor.findOne({ user: id });
    if (req.user?.role !== 'admin' && appointment.doctor.toString() !== doctor?._id.toString()) {
      return next(new ErrorHander('This appointment does not belong to your schedule', 403));
    }

    const schedule = await DoctorSchedule.findOne({ doctor: appointment.doctor });
    if (!schedule) {
      return next(new ErrorHander('Doctor schedule not found', 404));
    }

    const newDate = new Date(date);
    const targetOccupied = schedule.occupiedSlots.some(
      (slot) => isSameDay(slot.date, newDate) && slot.timeSlots.some((ts) => ts.timeSlot === time)
    );
    if (targetOccupied) {
      return next(new ErrorHander('Requested target slot is already occupied', 400));
    }

    const oldDate = appointment.date;
    const oldTime = appointment.time;

    // Remove old slot
    schedule.occupiedSlots = schedule.occupiedSlots
      .map((slot) => {
        if (isSameDay(slot.date, oldDate)) {
          return {
            ...slot,
            timeSlots: slot.timeSlots.filter((ts) => ts.timeSlot !== oldTime),
          };
        }
        return slot;
      })
      .filter((slot) => slot.timeSlots.length > 0);

    // Add new slot
    const slotIdx = schedule.occupiedSlots.findIndex((s) => isSameDay(s.date, newDate));
    if (slotIdx >= 0) {
      schedule.occupiedSlots[slotIdx].timeSlots.push({
        timeSlot: time,
        appointmentId: appointment._id as Types.ObjectId,
      });
    } else {
      schedule.occupiedSlots.push({
        date: newDate,
        timeSlots: [{ timeSlot: time, appointmentId: appointment._id as Types.ObjectId }],
      });
    }

    await schedule.save();

    appointment.date = newDate;
    appointment.time = time;
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment,
    });
  }
);

export const applyForLeave = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { startDate, endDate, reason } = req.body;
    const actingUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to apply for leave for another doctor', 403));
    }

    if (!startDate || !endDate) {
      return next(new ErrorHander('Start date and end date are required', 400));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return next(new ErrorHander('Invalid leave date format', 400));
    }

    if (start > end) {
      return next(new ErrorHander('Start date cannot be after end date', 400));
    }

    const doctor = await Doctor.findOne({ user: id });
    if (!doctor) {
      return next(new ErrorHander('Doctor profile not found', 404));
    }

    const leave = await Leave.create({
      doctor: doctor._id,
      startDate: start,
      endDate: end,
      reason: reason || 'Personal Leave',
      status: 'Approved',
    });

    res.status(201).json({
      success: true,
      message: 'Leave applied successfully',
      leave,
    });
  }
);

export const earnings = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to view another doctor earnings', 403));
    }

    const doctor = await Doctor.findOne({ user: id });
    if (!doctor) {
      return next(new ErrorHander('Doctor not found', 404));
    }

    const appointments = await Appointment.find({
      doctor: doctor._id,
      status: 'Completed',
    });

    let sum = 0;
    appointments.forEach((app) => {
      sum += Number(app.fees) || 0;
    });

    res.status(200).json({
      success: true,
      sum,
      message: 'Successfully fetched earnings',
    });
  }
);

export const getTodaySchedule = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to view this schedule', 403));
    }

    const doctor = await Doctor.findOne({ user: id });
    if (!doctor) {
      return res.status(200).json({
        success: true,
        totalAppointments: 0,
        schedule: {},
        appointments: [],
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    const todayAppointments = await Appointment.find({
      doctor: doctor._id,
      date: { $gte: todayStart, $lte: todayEnd },
    })
      .populate({
        path: 'patient',
        select: 'medicalHistory allergies currentMedications',
        populate: {
          path: 'user',
          select: 'name email phoneNumber',
        },
      })
      .sort({ time: 1 });

    const scheduleByTime: { [key: string]: any[] } = {};
    todayAppointments.forEach((app) => {
      const time = app.time;
      if (!scheduleByTime[time]) {
        scheduleByTime[time] = [];
      }
      scheduleByTime[time].push({
        appointmentNumber: app.appointmentNumber,
        patientName: (app.patient as any)?.user?.name || 'Patient',
        patientEmail: (app.patient as any)?.user?.email || '',
        patientPhone: (app.patient as any)?.user?.phoneNumber || '',
        time: app.time,
        date: app.date,
        status: app.status,
      });
    });

    res.status(200).json({
      success: true,
      totalAppointments: todayAppointments.length,
      schedule: scheduleByTime,
      appointments: todayAppointments.map((app) => ({
        appointmentNumber: app.appointmentNumber,
        patientName: (app.patient as any)?.user?.name || 'Patient',
        patientEmail: (app.patient as any)?.user?.email || '',
        patientPhone: (app.patient as any)?.user?.phoneNumber || '',
        time: app.time,
        date: app.date,
        status: app.status,
      })),
    });
  }
);

export const schedule_of_day = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { date } = req.query;

    const doctor = await Doctor.findOne({ user: id });
    if (!doctor) {
      return next(new ErrorHander('Doctor not found', 404));
    }

    const targetDate = date ? new Date(date as string) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctor: doctor._id,
      date: { $gte: start, $lte: end },
    })
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email phoneNumber' },
      })
      .sort({ time: 1 });

    res.status(200).json({
      success: true,
      appointments,
    });
  }
);

export const getdoctorinfo = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const doctor = await Doctor.findOne({ user: id }).populate(
      'user',
      'name email phoneNumber city state'
    );

    if (!doctor) {
      return res.status(200).json({
        success: true,
        doctor: {
          specialization: '',
          experience: 0,
          fees: 0,
          user: null,
        },
        message: 'Doctor profile not found. Please create one.',
      });
    }

    res.status(200).json({
      success: true,
      doctor: {
        _id: doctor._id,
        specialization: doctor.specialization || '',
        experience: doctor.experience || 0,
        fees: doctor.fees || 0,
        user: doctor.user,
      },
    });
  }
);

export const getpatients = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to access patient records for another doctor', 403));
    }

    const doctor = await Doctor.findOne({ user: id });
    if (!doctor) {
      return next(new ErrorHander('Doctor profile not found', 404));
    }

    const { appointmentNumber } = req.body;
    if (appointmentNumber) {
      const appointment = await Appointment.findOne({
        appointmentNumber,
        doctor: doctor._id,
      }).populate({
        path: 'patient',
        select: 'medicalHistory allergies currentMedications',
        populate: { path: 'user', select: 'name email phoneNumber city' },
      });

      if (!appointment) {
        return next(new ErrorHander('Appointment not found for this doctor', 404));
      }

      const p: any = appointment.patient;
      return res.status(200).json({
        success: true,
        patient: {
          name: p?.user?.name,
          email: p?.user?.email,
          phone: p?.user?.phoneNumber,
          medicalHistory: p?.medicalHistory,
          allergies: p?.allergies,
          currentMedications: p?.currentMedications,
        },
      });
    }

    // Return unique patients who have appointments with this doctor
    const appointments = await Appointment.find({ doctor: doctor._id }).populate({
      path: 'patient',
      select: 'medicalHistory allergies currentMedications',
      populate: { path: 'user', select: 'name email phoneNumber city' },
    });

    const uniquePatientsMap = new Map();
    appointments.forEach((app: any) => {
      if (app.patient && !uniquePatientsMap.has(app.patient._id.toString())) {
        uniquePatientsMap.set(app.patient._id.toString(), {
          _id: app.patient._id,
          name: app.patient.user?.name || 'Patient',
          email: app.patient.user?.email || '',
          phone: app.patient.user?.phoneNumber || '',
          medicalHistory: app.patient.medicalHistory || '',
          allergies: app.patient.allergies || '',
          currentMedications: app.patient.currentMedications || '',
        });
      }
    });

    res.status(200).json({
      success: true,
      patients: Array.from(uniquePatientsMap.values()),
    });
  }
);

/**
 * Real Doctor Reports Endpoint: Computes aggregate report data from actual appointments
 */
export const getdoctorreports = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const actingUserId = req.user?._id?.toString();

    if (req.user?.role !== 'admin' && actingUserId !== id) {
      return next(new ErrorHander('Not authorized to access reports for another doctor', 403));
    }

    const doctor = await Doctor.findOne({ user: id });
    if (!doctor) {
      return res.status(200).json({
        success: true,
        reportData: {
          totalAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          totalEarnings: 0,
          averageRating: 5,
          monthlyStats: [],
        },
      });
    }

    const query: any = { doctor: doctor._id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const appointments = await Appointment.find(query);

    let totalAppointments = appointments.length;
    let completedAppointments = 0;
    let cancelledAppointments = 0;
    let totalEarnings = 0;

    const monthlyMap: { [month: string]: { appointments: number; earnings: number } } = {};

    appointments.forEach((app) => {
      const monthStr = moment(app.date).format('MMM YYYY');
      if (!monthlyMap[monthStr]) {
        monthlyMap[monthStr] = { appointments: 0, earnings: 0 };
      }
      monthlyMap[monthStr].appointments += 1;

      if (app.status === 'Completed') {
        completedAppointments += 1;
        totalEarnings += Number(app.fees) || 0;
        monthlyMap[monthStr].earnings += Number(app.fees) || 0;
      } else if (app.status === 'Canceled') {
        cancelledAppointments += 1;
      }
    });

    const monthlyStats = Object.keys(monthlyMap).map((month) => ({
      month,
      appointments: monthlyMap[month].appointments,
      earnings: monthlyMap[month].earnings,
    }));

    res.status(200).json({
      success: true,
      reportData: {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        totalEarnings,
        averageRating: 5,
        monthlyStats,
      },
    });
  }
);