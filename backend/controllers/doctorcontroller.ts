import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import catchAsyncErrors from '../middleware/catchAsyncErrors';
import Appointment from '../models/appointmentmodel';
import Doctor from '../models/doctormodel';
import DoctorSchedule from '../models/doctorschedulemodel';
import User from '../models/usermodel';
import Leave from '../models/leavemodel';
import Patient from '../models/patientmodel';

export const createDoctor = catchAsyncErrors(async (req: Request, res: Response) => {
  const { specialization, experience, fees } = req.body;
  const { id } = req.params;

  // Validate input
  if (!specialization || !experience || !fees) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  // Check if doctor already exists
  const existingDoctor = await Doctor.findOne({ user: id });
  if (existingDoctor) {
    return res.status(400).json({ success: false, message: "Doctor already exists" });
  }

  // Create a new doctor document
  const newDoctor = new Doctor({
    user: id,
    specialization,
    experience,
    fees
  });

  // Save the new doctor document
  await newDoctor.save();

  return res.status(201).json({
    success: true,
    message: 'Doctor created successfully',
    doctor: newDoctor
  });
});

export const updateSchedule = catchAsyncErrors(async (req: Request, res: Response) => {
  const { morning, evening } = req.body; // Expecting schedule in the format { morning: [slots], evening: [slots] }
  const { id } = req.params; // Get doctor ID from URL parameters

  // Find the doctor by ID
  const doctor = await Doctor.findOne({ user: id });

  if (!doctor) {
    return res.status(404).json({ success: false, message: "Doctor not found" });
  }

  // Find the existing schedule for the doctor
  let existingSchedule = await DoctorSchedule.findOne({ doctor: doctor._id });

  if (existingSchedule) {
    // If schedule exists, update it
    existingSchedule.schedule = {
      morning: morning || existingSchedule.schedule.morning,
      evening: evening || existingSchedule.schedule.evening
    };

    await existingSchedule.save();

    return res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      schedule: existingSchedule
    });
  } else {
    // If schedule does not exist, create a new one
    const newSchedule = new DoctorSchedule({
      doctor: doctor._id,
      schedule: {
        morning: morning || [],
        evening: evening || []
      }
    });

    await newSchedule.save();

    return res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      schedule: newSchedule
    });
  }
});

export const updateDoctor = catchAsyncErrors(async (req: Request, res: Response) => {
  const { id } = req.params; // User ID from params
  const { specialization, experience, fees } = req.body; // Updated details

  // Check if doctor exists
  let doctor = await Doctor.findOne({ user: id });

  if (doctor) {
    // Update existing doctor details
    if (specialization) doctor.specialization = specialization;
    if (experience) doctor.experience = experience;
    if (fees) doctor.fees = fees;

    // Save updated doctor details
    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Doctor details updated successfully',
      doctor
    });
  } else {
    // Create a new doctor if one does not exist
    doctor = new Doctor({
      user: id,
      specialization: specialization || 'Not specified',
      experience: experience || 0,
      fees: fees || 0
    });

    // Save new doctor details
    await doctor.save();

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      doctor
    });
  }
});

export const schedule_of_day = catchAsyncErrors(async (req: Request, res: Response) => {
  const { id } = req.params; // Get userId from URL parameters

  if (!id) {
    return res.status(400).json({ success: false, message: "User ID parameter is required" });
  }

  // Find the doctor by user ID
  const doctor = await Doctor.findOne({ user: id });

  if (!doctor) {
    return res.status(404).json({ success: false, message: "Doctor not found" });
  }

  // Find the doctor's schedule
  const schedule = await DoctorSchedule.findOne({ doctor: doctor._id });

  if (!schedule) {
    return res.status(404).json({ success: false, message: "Schedule not found for this doctor" });
  }

  // Respond with the schedule
  res.status(200).json({
    success: true,
    schedule: {
      morning: schedule.schedule.morning,
      evening: schedule.schedule.evening,
      // Assuming schedule has uniform slots for weekdays, adjust as needed
      // Optional: Handling off days if needed
    }
  });
});

export const cancel_appointment = catchAsyncErrors(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { appointmentNumber, startDate, endDate, startTime, endTime } = req.body;

  // Current date and time
  const now = new Date();

  // Default values for date and time if not provided
  const defaultStartDate = startDate ? new Date(startDate) : new Date(now.setHours(0, 0, 0, 0));
  const defaultEndDate = endDate ? new Date(endDate) : new Date(now.setDate(now.getDate() + 14));
  defaultEndDate.setHours(23, 59, 59, 999);

  const defaultStartTime = startTime || '00:00';
  const defaultEndTime = endTime || '23:59';

  // Convert start and end times to Date objects for comparison
  const parseTimeToDate = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  const startDateTime = parseTimeToDate(defaultStartDate, defaultStartTime);
  const endDateTime = parseTimeToDate(defaultEndDate, defaultEndTime);

  const doctor = await Doctor.findOne({ user: id });
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }

  const schedule = await DoctorSchedule.findOne({ doctor: doctor._id });
  if (!schedule) {
    return res.status(404).json({ success: false, message: 'Doctor schedule not found' });
  }

  if (appointmentNumber) {
    // Handle specific appointment cancellation
    const appointment = await Appointment.findOne({ appointmentNumber });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.status === 'Scheduled') {
      appointment.status = 'Canceled';
      await appointment.save();

      // Free the occupied slot
      schedule.occupiedSlots = schedule.occupiedSlots.map(slot => {
        if (slot.date.toISOString().split('T')[0] === appointment.date.toISOString().split('T')[0]) {
          return {
            ...slot,
            timeSlots: slot.timeSlots.filter(ts => ts.timeSlot !== appointment.time)
          };
        }
        return slot;
      }).filter(slot => slot.timeSlots.length > 0);

      await schedule.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment cancelled and slot freed successfully'
    });
  }

  // Handle bulk cancellation if appointmentNumber is not provided
  const appointments = await Appointment.find({
    doctor: doctor._id,
    date: { $gte: startDateTime, $lte: endDateTime },
    time: { $gte: defaultStartTime, $lte: defaultEndTime }
  });

  for (const appointment of appointments) {
    if (appointment.status === 'Scheduled') {
      appointment.status = 'Canceled';
      await appointment.save();

      // Free the occupied slot
      schedule.occupiedSlots = schedule.occupiedSlots.map(slot => {
        if (slot.date.toISOString().split('T')[0] === appointment.date.toISOString().split('T')[0]) {
          return {
            ...slot,
            timeSlots: slot.timeSlots.filter(ts => ts.timeSlot !== appointment.time)
          };
        }
        return slot;
      }).filter(slot => slot.timeSlots.length > 0);
    }
  }

  await schedule.save();

  res.status(200).json({
    success: true,
    message: 'Appointments cancelled and slots freed successfully'
  });
});

export const updatepaymentstatus = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { appointmentNumber } = req.body;

  // Find the appointment by appointment number
  const appointment = await Appointment.findOne({ appointmentNumber });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found',
    });
  }
  appointment.paid = true;
  await appointment.save();

  res.status(200).json({
    success: true,
    appointment,
    message: "successfully updated payment status"
  });
});

export const appointment_specific = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params; // Doctor ID
  // console.log('Request body:', req.body);
  const { startDate, endDate, startTime, endTime, city, patientName, status } = req.body.params;

  // console.log('Received startDate:', id);
  // console.log('Received endDate:', endDate);
  // console.log('Received startTime:', startTime);
  // console.log('Received endTime:', endTime);
  // console.log('Received city:', city);
  // console.log('Received patientName:', patientName);
  // console.log('Received status:', status);
  // Find the doctor
  const doctor = await Doctor.findOne({ user: id });
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }

  const now = new Date();

  const hundredYearsAgo = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
  const hundredYearsFromNow = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());
  const effectiveStartDate = startDate ? new Date(startDate) : hundredYearsAgo;
  const effectiveEndDate = endDate ? new Date(endDate) : hundredYearsFromNow;
  const defaultStartTime = startTime || '00:00:00';
  const defaultEndTime = endTime || '23:59:59';

  // Find all appointments for the doctor
  const appointments = await Appointment.find({
    doctor: doctor._id,
    date: { $gte: effectiveStartDate, $lte: effectiveEndDate }
  })
    .populate({
      path: 'patient', // Populate patient field
      select: 'medicalHistory allergies currentMedications',
      populate: {
        path: 'user', // Populate User model
        select: 'name email phoneNumber city state' // Select specific fields from User model
      }
    })
    .populate({
      path: 'doctor', // Populate doctor field
      select: 'specialization experience fees',
      populate: {
        path: 'user', // Populate User model
        select: 'name email phoneNumber city state' // Select specific fields from User model
      }
    });

  // Filter appointments based on start and end times
  const filteredAppointments = appointments.filter(app => {
    const appointmentDateTime = new Date(app.date);
    const appointmentTime = appointmentDateTime.toTimeString().substring(0, 8);

    return appointmentTime >= defaultStartTime && appointmentTime <= defaultEndTime;
  });

  // Filter appointments based on city
  const cityMatches = city ? filteredAppointments.filter(app => (app.doctor as any).user.city.toLowerCase() === city.toLowerCase()) : filteredAppointments;

  // Filter appointments based on patient name
  const nameMatches = patientName ? cityMatches.filter(app => (app.patient as any).name.toLowerCase().includes(patientName.toLowerCase())) : cityMatches;
  const statusmatches = status ? nameMatches.filter(app => app.status === status) : nameMatches;

  res.status(200).json({
    success: true,
    appointments: statusmatches
  });
});

export const change_date_appointment = catchAsyncErrors(async (req: Request, res: Response) => {
  const { id } = req.params; // Patient ID from params
  const { appointmentNumber, date, time } = req.body;

  // Find the appointment to be updated
  const appointment = await Appointment.findOne({ appointmentNumber });
  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  // Find and update the doctor's schedule
  const schedule = await DoctorSchedule.findOne({ doctor: appointment.doctor });
  if (!schedule) {
    return res.status(404).json({ success: false, message: 'Doctor schedule not found' });
  }

  // Remove the old slot from the schedule
  schedule.occupiedSlots = schedule.occupiedSlots.map(slot => {
    if (slot.date.toISOString() === appointment.date.toISOString()) {
      return {
        ...slot,
        timeSlots: slot.timeSlots.filter(ts => ts.timeSlot !== appointment.time)
      };
    }
    return slot;
  }).filter(slot => slot.timeSlots.length > 0); // Remove slot if no time slots left

  // Save the updated schedule
  await schedule.save();

  // Update the appointment with new date and time
  appointment.date = date;
  appointment.time = time;
  await appointment.save();

  // Add the new slot to the schedule
  const newDate = new Date(date);
  const newTimeSlot = time;
  const existingSlot = schedule.occupiedSlots.find(slot => slot.date.toISOString() === newDate.toISOString());

  if (existingSlot) {
    existingSlot.timeSlots.push({ timeSlot: newTimeSlot, appointmentId: appointment._id as Types.ObjectId });
  } else {
    schedule.occupiedSlots.push({
      date: newDate,
      timeSlots: [{ timeSlot: newTimeSlot, appointmentId: appointment._id as Types.ObjectId }]
    });
  }

  // Save the updated schedule with the new slot
  await schedule.save();

  res.status(200).json({
    success: true,
    message: 'Appointment date and time updated successfully'
  });
});

export const getpatients = catchAsyncErrors(async (req: Request, res: Response) => {
  const { patientName, patient_phone, patient_email, appointmentNumber } = req.body;

  // If appointmentNumber is provided, find the appointment and populate the patient details
  if (appointmentNumber) {
    const appointment = await Appointment.findOne({ appointmentNumber }).populate({
      path: 'patient',
      select: 'medicalHistory allergies currentMedications',
      populate: {
        path: 'user',
        select: 'name email phone'
      }
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    return res.status(200).json({
      success: true,
      patient: {
        name: (appointment.patient as any).user.name,
        email: (appointment.patient as any).user.email,
        phone: (appointment.patient as any).user.phoneNumber,
        medicalHistory: (appointment.patient as any).medicalHistory,
        allergies: (appointment.patient as any).allergies,
        currentMedications: (appointment.patient as any).currentMedications,
      }
    });
  }

  // If patient_phone is provided, find the patient by phone number
  if (patient_phone) {
    const user = await User.findOne({ phone: patient_phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const patient = await Patient.findOne({ user: user._id }).populate('user', 'name email phone');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    return res.status(200).json({
      success: true,
      patient: {
        name: (patient.user as any).name,
        email: (patient.user as any).email,
        phone: (patient.user as any).phoneNumber,
        medicalHistory: patient.medicalHistory,
        allergies: patient.allergies,
        currentMedications: patient.currentMedications,
      }
    });
  }

  // If patient_email is provided, find the patient by email
  if (patient_email) {
    const user = await User.findOne({ email: patient_email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const patient = await Patient.findOne({ user: user._id }).populate('user', 'name email phone');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    return res.status(200).json({
      success: true,
      patient: {
        name: (patient.user as any).name,
        email: (patient.user as any).email,
        phone: (patient.user as any).phoneNumber,
        medicalHistory: patient.medicalHistory,
        allergies: patient.allergies,
        currentMedications: patient.currentMedications,
      }
    });
  }

  // If no specific search parameters, find all patients whose names include patientName
  if (patientName) {
    const users = await User.find({ name: { $regex: patientName, $options: 'i' } });
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'No patients found with the given name' });
    }

    const patients = await Patient.find({ user: { $in: users.map(user => user._id) } }).populate('user', 'name email phone');
    if (patients.length === 0) {
      return res.status(404).json({ success: false, message: 'No patients found with the given name' });
    }

    const patientDetails = patients.map(patient => ({
      name: (patient.user as any).name,
      email: (patient.user as any).email,
      phone: (patient.user as any).phoneNumber,
      medicalHistory: patient.medicalHistory,
      allergies: patient.allergies,
      currentMedications: patient.currentMedications,
    }));

    return res.status(200).json({
      success: true,
      patients: patientDetails
    });
  }

  // If no parameters are provided
  res.status(400).json({
    success: false,
    message: 'Please provide at least one search parameter'
  });
});

export const applyForLeave = catchAsyncErrors(async (req: Request, res: Response) => {
  const { id } = req.params; // Doctor ID from URL params
  const { startDate, endDate, reason } = req.body;

  // Validate input
  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Find the doctor by user ID
  const doctor = await Doctor.findOne({ user: id });
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }

  // Check if the doctor has any scheduled appointments during the leave period
  const conflictingAppointments = await Appointment.find({
    doctor: doctor._id,
    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    status: 'Scheduled' // Only consider appointments that are not already canceled or completed
  });

  // If there are conflicting appointments, cancel them
  if (conflictingAppointments.length > 0) {
    for (const appointment of conflictingAppointments) {
      appointment.status = 'Canceled';
      await appointment.save();
      // Notify the patient about the cancellation (if needed)
    }
  }

  // Create a new leave request
  const leave = new Leave({
    doctor: doctor._id,
    startDate,
    endDate,
    reason
  });

  // Save the leave request
  await leave.save();

  res.status(201).json({
    success: true,
    message: 'Leave request submitted successfully, and conflicting appointments have been canceled',
    leave
  });
});

export const earnings = catchAsyncErrors(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query; // Use req.query for query parameters

  if (!startDate) {
    return res.status(400).json({
      success: false,
      message: "Start date is required."
    });
  }

  // Parse startDate and endDate
  const start = new Date(startDate as string);

  if (isNaN(start.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid start date format."
    });
  }

  // Set endDate to 100 years after startDate if not provided
  const end = endDate ? new Date(endDate as string) : new Date(start.getFullYear() + 100, start.getMonth(), start.getDate());

  if (isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid end date format."
    });
  }

  // Add time to both dates
  const startWithTime = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0);
  const endWithTime = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);

  const doctor = await Doctor.findOne({ user: id });
  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: "Doctor not found."
    });
  }

  let sum = 0;
  const appointments = await Appointment.find({
    doctor: doctor._id,
    date: { $gte: startWithTime, $lte: endWithTime },
    status: "Completed"
  });

  appointments.forEach(appointment => {
    sum += appointment.fees;
  });

  return res.status(200).json({
    sum,
    message: "Successfully fetched earnings.",
    success: true
  });
});

/**
 * Get doctor information by user ID
 */
export const getdoctorinfo = catchAsyncErrors(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Find the doctor by user ID
  const doctor = await Doctor.findOne({ user: id }).populate('user', 'name email phoneNumber city state');

  // Check if doctor exists
  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor profile not found'
    });
  }

  res.status(200).json({
    success: true,
    doctor: {
      specialization: doctor.specialization || '',
      experience: doctor.experience || 0,
      fees: doctor.fees || 0,
      user: doctor.user
    }
  });
});
