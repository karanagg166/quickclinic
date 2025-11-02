"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getdoctorinfo = exports.earnings = exports.applyForLeave = exports.getpatients = exports.change_date_appointment = exports.appointment_specific = exports.updatepaymentstatus = exports.cancel_appointment = exports.schedule_of_day = exports.updateDoctor = exports.updateSchedule = exports.createDoctor = void 0;
const catchAsyncErrors_1 = __importDefault(require("../middleware/catchAsyncErrors"));
const appointmentmodel_1 = __importDefault(require("../models/appointmentmodel"));
const doctormodel_1 = __importDefault(require("../models/doctormodel"));
const doctorschedulemodel_1 = __importDefault(require("../models/doctorschedulemodel"));
const usermodel_1 = __importDefault(require("../models/usermodel"));
const leavemodel_1 = __importDefault(require("../models/leavemodel"));
const patientmodel_1 = __importDefault(require("../models/patientmodel"));
exports.createDoctor = (0, catchAsyncErrors_1.default)(async (req, res) => {
    const { specialization, experience, fees } = req.body;
    const { id } = req.params;
    if (!specialization || !experience || !fees) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }
    const existingDoctor = await doctormodel_1.default.findOne({ user: id });
    if (existingDoctor) {
        return res.status(400).json({ success: false, message: "Doctor already exists" });
    }
    const newDoctor = new doctormodel_1.default({
        user: id,
        specialization,
        experience,
        fees
    });
    await newDoctor.save();
    return res.status(201).json({
        success: true,
        message: 'Doctor created successfully',
        doctor: newDoctor
    });
});
exports.updateSchedule = (0, catchAsyncErrors_1.default)(async (req, res) => {
    const { morning, evening } = req.body;
    const { id } = req.params;
    const doctor = await doctormodel_1.default.findOne({ user: id });
    if (!doctor) {
        return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    let existingSchedule = await doctorschedulemodel_1.default.findOne({ doctor: doctor._id });
    if (existingSchedule) {
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
    }
    else {
        const newSchedule = new doctorschedulemodel_1.default({
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
exports.updateDoctor = (0, catchAsyncErrors_1.default)(async (req, res) => {
    const { id } = req.params;
    const { specialization, experience, fees } = req.body;
    let doctor = await doctormodel_1.default.findOne({ user: id });
    if (doctor) {
        if (specialization)
            doctor.specialization = specialization;
        if (experience)
            doctor.experience = experience;
        if (fees)
            doctor.fees = fees;
        await doctor.save();
        res.status(200).json({
            success: true,
            message: 'Doctor details updated successfully',
            doctor
        });
    }
    else {
        doctor = new doctormodel_1.default({
            user: id,
            specialization: specialization || 'Not specified',
            experience: experience || 0,
            fees: fees || 0
        });
        await doctor.save();
        res.status(201).json({
            success: true,
            message: 'Doctor created successfully',
            doctor
        });
    }
});
exports.schedule_of_day = (0, catchAsyncErrors_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: "User ID parameter is required" });
    }
    const doctor = await doctormodel_1.default.findOne({ user: id });
    if (!doctor) {
        return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    const schedule = await doctorschedulemodel_1.default.findOne({ doctor: doctor._id });
    if (!schedule) {
        return res.status(404).json({ success: false, message: "Schedule not found for this doctor" });
    }
    res.status(200).json({
        success: true,
        schedule: {
            morning: schedule.schedule.morning,
            evening: schedule.schedule.evening,
        }
    });
});
exports.cancel_appointment = (0, catchAsyncErrors_1.default)(async (req, res) => {
    const { id } = req.params;
    const { appointmentNumber, startDate, endDate, startTime, endTime } = req.body;
    const now = new Date();
    const defaultStartDate = startDate ? new Date(startDate) : new Date(now.setHours(0, 0, 0, 0));
    const defaultEndDate = endDate ? new Date(endDate) : new Date(now.setDate(now.getDate() + 14));
    defaultEndDate.setHours(23, 59, 59, 999);
    const defaultStartTime = startTime || '00:00';
    const defaultEndTime = endTime || '23:59';
    const parseTimeToDate = (date, time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours, minutes, 0, 0);
        return newDate;
    };
    const startDateTime = parseTimeToDate(defaultStartDate, defaultStartTime);
    const endDateTime = parseTimeToDate(defaultEndDate, defaultEndTime);
    const doctor = await doctormodel_1.default.findOne({ user: id });
    if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const schedule = await doctorschedulemodel_1.default.findOne({ doctor: doctor._id });
    if (!schedule) {
        return res.status(404).json({ success: false, message: 'Doctor schedule not found' });
    }
    if (appointmentNumber) {
        const appointment = await appointmentmodel_1.default.findOne({ appointmentNumber });
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        if (appointment.status === 'Scheduled') {
            appointment.status = 'Canceled';
            await appointment.save();
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
    const appointments = await appointmentmodel_1.default.find({
        doctor: doctor._id,
        date: { $gte: startDateTime, $lte: endDateTime },
        time: { $gte: defaultStartTime, $lte: defaultEndTime }
    });
    for (const appointment of appointments) {
        if (appointment.status === 'Scheduled') {
            appointment.status = 'Canceled';
            await appointment.save();
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
exports.updatepaymentstatus = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const { appointmentNumber } = req.body;
    const appointment = await appointmentmodel_1.default.findOne({ appointmentNumber });
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
exports.appointment_specific = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const { startDate, endDate, startTime, endTime, city, patientName, status } = req.body.params;
    const doctor = await doctormodel_1.default.findOne({ user: id });
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
    const appointments = await appointmentmodel_1.default.find({
        doctor: doctor._id,
        date: { $gte: effectiveStartDate, $lte: effectiveEndDate }
    })
        .populate({
        path: 'patient',
        select: 'medicalHistory allergies currentMedications',
        populate: {
            path: 'user',
            select: 'name email phoneNumber city state'
        }
    })
        .populate({
        path: 'doctor',
        select: 'specialization experience fees',
        populate: {
            path: 'user',
            select: 'name email phoneNumber city state'
        }
    });
    const filteredAppointments = appointments.filter(app => {
        const appointmentDateTime = new Date(app.date);
        const appointmentTime = appointmentDateTime.toTimeString().substring(0, 8);
        return appointmentTime >= defaultStartTime && appointmentTime <= defaultEndTime;
    });
    const cityMatches = city ? filteredAppointments.filter(app => app.doctor.user.city.toLowerCase() === city.toLowerCase()) : filteredAppointments;
    const nameMatches = patientName ? cityMatches.filter(app => app.patient.name.toLowerCase().includes(patientName.toLowerCase())) : cityMatches;
    const statusmatches = status ? nameMatches.filter(app => app.status === status) : nameMatches;
    res.status(200).json({
        success: true,
        appointments: statusmatches
    });
});
exports.change_date_appointment = (0, catchAsyncErrors_1.default)(async (req, res) => {
    const { id } = req.params;
    const { appointmentNumber, date, time } = req.body;
    const appointment = await appointmentmodel_1.default.findOne({ appointmentNumber });
    if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    const schedule = await doctorschedulemodel_1.default.findOne({ doctor: appointment.doctor });
    if (!schedule) {
        return res.status(404).json({ success: false, message: 'Doctor schedule not found' });
    }
    schedule.occupiedSlots = schedule.occupiedSlots.map(slot => {
        if (slot.date.toISOString() === appointment.date.toISOString()) {
            return {
                ...slot,
                timeSlots: slot.timeSlots.filter(ts => ts.timeSlot !== appointment.time)
            };
        }
        return slot;
    }).filter(slot => slot.timeSlots.length > 0);
    await schedule.save();
    appointment.date = date;
    appointment.time = time;
    await appointment.save();
    const newDate = new Date(date);
    const newTimeSlot = time;
    const existingSlot = schedule.occupiedSlots.find(slot => slot.date.toISOString() === newDate.toISOString());
    if (existingSlot) {
        existingSlot.timeSlots.push({ timeSlot: newTimeSlot, appointmentId: appointment._id });
    }
    else {
        schedule.occupiedSlots.push({
            date: newDate,
            timeSlots: [{ timeSlot: newTimeSlot, appointmentId: appointment._id }]
        });
    }
    await schedule.save();
    res.status(200).json({
        success: true,
        message: 'Appointment date and time updated successfully'
    });
});
exports.getpatients = (0, catchAsyncErrors_1.default)(async (req, res) => {
    const { patientName, patient_phone, patient_email, appointmentNumber } = req.body;
    if (appointmentNumber) {
        const appointment = await appointmentmodel_1.default.findOne({ appointmentNumber }).populate({
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
                name: appointment.patient.user.name,
                email: appointment.patient.user.email,
                phone: appointment.patient.user.phoneNumber,
                medicalHistory: appointment.patient.medicalHistory,
                allergies: appointment.patient.allergies,
                currentMedications: appointment.patient.currentMedications,
            }
        });
    }
    if (patient_phone) {
        const user = await usermodel_1.default.findOne({ phone: patient_phone });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const patient = await patientmodel_1.default.findOne({ user: user._id }).populate('user', 'name email phone');
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        return res.status(200).json({
            success: true,
            patient: {
                name: patient.user.name,
                email: patient.user.email,
                phone: patient.user.phoneNumber,
                medicalHistory: patient.medicalHistory,
                allergies: patient.allergies,
                currentMedications: patient.currentMedications,
            }
        });
    }
    if (patient_email) {
        const user = await usermodel_1.default.findOne({ email: patient_email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const patient = await patientmodel_1.default.findOne({ user: user._id }).populate('user', 'name email phone');
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        return res.status(200).json({
            success: true,
            patient: {
                name: patient.user.name,
                email: patient.user.email,
                phone: patient.user.phoneNumber,
                medicalHistory: patient.medicalHistory,
                allergies: patient.allergies,
                currentMedications: patient.currentMedications,
            }
        });
    }
    if (patientName) {
        const users = await usermodel_1.default.find({ name: { $regex: patientName, $options: 'i' } });
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'No patients found with the given name' });
        }
        const patients = await patientmodel_1.default.find({ user: { $in: users.map(user => user._id) } }).populate('user', 'name email phone');
        if (patients.length === 0) {
            return res.status(404).json({ success: false, message: 'No patients found with the given name' });
        }
        const patientDetails = patients.map(patient => ({
            name: patient.user.name,
            email: patient.user.email,
            phone: patient.user.phoneNumber,
            medicalHistory: patient.medicalHistory,
            allergies: patient.allergies,
            currentMedications: patient.currentMedications,
        }));
        return res.status(200).json({
            success: true,
            patients: patientDetails
        });
    }
    res.status(400).json({
        success: false,
        message: 'Please provide at least one search parameter'
    });
});
exports.applyForLeave = (0, catchAsyncErrors_1.default)(async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const doctor = await doctormodel_1.default.findOne({ user: id });
    if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const conflictingAppointments = await appointmentmodel_1.default.find({
        doctor: doctor._id,
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        status: 'Scheduled'
    });
    if (conflictingAppointments.length > 0) {
        for (const appointment of conflictingAppointments) {
            appointment.status = 'Canceled';
            await appointment.save();
        }
    }
    const leave = new leavemodel_1.default({
        doctor: doctor._id,
        startDate,
        endDate,
        reason
    });
    await leave.save();
    res.status(201).json({
        success: true,
        message: 'Leave request submitted successfully, and conflicting appointments have been canceled',
        leave
    });
});
exports.earnings = (0, catchAsyncErrors_1.default)(async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    if (!startDate) {
        return res.status(400).json({
            success: false,
            message: "Start date is required."
        });
    }
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
        return res.status(400).json({
            success: false,
            message: "Invalid start date format."
        });
    }
    const end = endDate ? new Date(endDate) : new Date(start.getFullYear() + 100, start.getMonth(), start.getDate());
    if (isNaN(end.getTime())) {
        return res.status(400).json({
            success: false,
            message: "Invalid end date format."
        });
    }
    const startWithTime = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0);
    const endWithTime = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);
    const doctor = await doctormodel_1.default.findOne({ user: id });
    if (!doctor) {
        return res.status(404).json({
            success: false,
            message: "Doctor not found."
        });
    }
    let sum = 0;
    const appointments = await appointmentmodel_1.default.find({
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
exports.getdoctorinfo = (0, catchAsyncErrors_1.default)(async (req, res) => {
    const { id } = req.params;
    const doctor = await doctormodel_1.default.findOne({ user: id }).populate('user', 'name email phoneNumber city state');
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
//# sourceMappingURL=doctorcontroller.js.map