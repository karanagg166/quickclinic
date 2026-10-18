"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointment_bookings = exports.specific_doctors = exports.update_patient = exports.create_patient = exports.get_patient_info = exports.markPastAppointmentsAsCompleted = exports.get_patient_dashboard_stats = exports.appointment_future = exports.appointment_specific = exports.appointment_history_all = exports.appointment_of_a_period = exports.change_date_appointment = exports.cancelAppointment = exports.alldoctors = exports.updatepaymentstatus = exports.newappointment = void 0;
const catchAsyncErrors_1 = __importDefault(require("../middleware/catchAsyncErrors"));
const appointmentmodel_1 = __importDefault(require("../models/appointmentmodel"));
const doctormodel_1 = __importDefault(require("../models/doctormodel"));
const doctorschedulemodel_1 = __importDefault(require("../models/doctorschedulemodel"));
const usermodel_1 = __importDefault(require("../models/usermodel"));
const patientmodel_1 = __importDefault(require("../models/patientmodel"));
const conversationmodel_1 = __importDefault(require("../models/conversationmodel"));
const leavemodel_1 = __importDefault(require("../models/leavemodel"));
const uuid_1 = require("uuid");
const moment_1 = __importDefault(require("moment"));
const notification_controller_1 = require("./notification.controller");
const markPastAppointments_1 = require("../utils/markPastAppointments");
const errorhander_1 = __importDefault(require("../utils/errorhander"));
const isSameDay = (d1, d2) => {
    return (0, moment_1.default)(d1).format('YYYY-MM-DD') === (0, moment_1.default)(d2).format('YYYY-MM-DD');
};
const parseSlotDateTime = (dateStr, timeStr) => {
    const d = (0, moment_1.default)(dateStr).format('YYYY-MM-DD');
    return (0, moment_1.default)(`${d} ${timeStr}`, ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD h:mm A']).toDate();
};
exports.newappointment = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { doc_id, date, time } = req.body;
    const actingUserId = req.user?._id;
    if (!doc_id || !date || !time) {
        return next(new errorhander_1.default('Doctor ID, date, and time are required', 400));
    }
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
        return next(new errorhander_1.default('Invalid appointment date format', 400));
    }
    const slotDateTime = parseSlotDateTime(date, time);
    if (slotDateTime.getTime() <= Date.now()) {
        return next(new errorhander_1.default('Cannot book an appointment in the past', 400));
    }
    let patient = await patientmodel_1.default.findOne({ user: actingUserId });
    if (!patient) {
        patient = await patientmodel_1.default.create({
            user: actingUserId,
            medicalHistory: '',
            allergies: '',
            currentMedications: '',
        });
    }
    const doctor = await doctormodel_1.default.findById(doc_id).populate('user');
    if (!doctor) {
        return next(new errorhander_1.default('Doctor not found', 404));
    }
    const schedule = await doctorschedulemodel_1.default.findOne({ doctor: doc_id });
    if (!schedule) {
        return next(new errorhander_1.default('Doctor has not published a schedule yet', 400));
    }
    const targetDateStart = (0, moment_1.default)(date).startOf('day').toDate();
    const targetDateEnd = (0, moment_1.default)(date).endOf('day').toDate();
    const doctorOnLeave = await leavemodel_1.default.findOne({
        doctor: doctor._id,
        $or: [{ status: 'Approved' }, { status: { $exists: false } }],
        startDate: { $lte: targetDateEnd },
        endDate: { $gte: targetDateStart },
    });
    if (doctorOnLeave) {
        return next(new errorhander_1.default('Doctor is on leave on the selected date', 400));
    }
    const allWorkingSlots = [];
    if (schedule.schedule?.morning) {
        schedule.schedule.morning.forEach((m) => {
            let cur = (0, moment_1.default)(m.startTime, 'HH:mm');
            const end = (0, moment_1.default)(m.endTime, 'HH:mm');
            while (cur.isBefore(end)) {
                allWorkingSlots.push(cur.format('HH:mm'));
                cur.add(10, 'minutes');
            }
        });
    }
    if (schedule.schedule?.evening) {
        schedule.schedule.evening.forEach((e) => {
            let cur = (0, moment_1.default)(e.startTime, 'HH:mm');
            const end = (0, moment_1.default)(e.endTime, 'HH:mm');
            while (cur.isBefore(end)) {
                allWorkingSlots.push(cur.format('HH:mm'));
                cur.add(10, 'minutes');
            }
        });
    }
    const formattedTime = (0, moment_1.default)(time, ['HH:mm', 'h:mm A']).format('HH:mm');
    if (allWorkingSlots.length > 0 && !allWorkingSlots.includes(formattedTime)) {
        return next(new errorhander_1.default('Requested time slot is outside published doctor working hours', 400));
    }
    const isSlotOccupied = schedule.occupiedSlots.some((slot) => {
        return (isSameDay(slot.date, appointmentDate) &&
            slot.timeSlots.some((ts) => ts.timeSlot === time || ts.timeSlot === formattedTime));
    });
    if (isSlotOccupied) {
        return next(new errorhander_1.default('Selected time slot is already booked', 400));
    }
    const existingPatientAppointment = await appointmentmodel_1.default.findOne({
        date: appointmentDate,
        time,
        patient: patient._id,
        status: 'Scheduled',
    });
    if (existingPatientAppointment) {
        return next(new errorhander_1.default('You already have an appointment scheduled for this date and time', 400));
    }
    const appointmentNumber = (0, uuid_1.v4)();
    let appointment;
    try {
        appointment = await appointmentmodel_1.default.create({
            doctor: doc_id,
            patient: patient._id,
            date: appointmentDate,
            time,
            fees: doctor.fees,
            paid: false,
            appointmentNumber,
            status: 'Scheduled',
        });
    }
    catch (err) {
        if (err.code === 11000) {
            return next(new errorhander_1.default('Selected time slot is already booked by another patient', 400));
        }
        throw err;
    }
    const dateStr = (0, moment_1.default)(appointmentDate).format('YYYY-MM-DD');
    const existingSlotIndex = schedule.occupiedSlots.findIndex((slot) => isSameDay(slot.date, appointmentDate));
    if (existingSlotIndex >= 0) {
        schedule.occupiedSlots[existingSlotIndex].timeSlots.push({
            timeSlot: time,
            appointmentId: appointment._id,
        });
    }
    else {
        schedule.occupiedSlots.push({
            date: new Date(dateStr),
            timeSlots: [
                {
                    timeSlot: time,
                    appointmentId: appointment._id,
                },
            ],
        });
    }
    await schedule.save();
    try {
        const patientUser = await usermodel_1.default.findById(actingUserId);
        const doctorUser = await usermodel_1.default.findById(doctor.user?._id || doctor.user);
        if (patientUser) {
            await (0, notification_controller_1.sendNotification)(actingUserId.toString(), actingUserId.toString(), 'appointment_booked', `You have successfully booked an appointment with Dr. ${doctorUser?.name || 'Doctor'} on ${(0, moment_1.default)(date).format('MMMM Do YYYY')} at ${time}`);
        }
        if (doctorUser) {
            await (0, notification_controller_1.sendNotification)(actingUserId.toString(), doctorUser._id.toString(), 'new_appointment', `New appointment booked by ${patientUser?.name || 'Patient'} on ${(0, moment_1.default)(date).format('MMMM Do YYYY')} at ${time}`);
        }
    }
    catch (notifErr) {
        console.error('Notification error:', notifErr);
    }
    try {
        const doctorUserId = doctor.user?._id || doctor.user;
        if (actingUserId && doctorUserId) {
            let conversation = await conversationmodel_1.default.findOne({
                participants: { $all: [doctorUserId.toString(), actingUserId.toString()] },
            });
            if (!conversation) {
                conversation = await conversationmodel_1.default.create({
                    participants: [doctorUserId, actingUserId],
                });
            }
        }
    }
    catch (chatErr) {
        console.error('Conversation init error:', chatErr);
    }
    return res.status(201).json({
        success: true,
        appointment,
    });
});
exports.updatepaymentstatus = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return next(new errorhander_1.default('Direct payment status mutation is restricted. Please use the /payment/verify endpoint.', 403));
    }
    const { appointmentNumber } = req.body;
    const appointment = await appointmentmodel_1.default.findOne({ appointmentNumber });
    if (!appointment) {
        return next(new errorhander_1.default('Appointment not found', 404));
    }
    appointment.paid = true;
    await appointment.save();
    res.status(200).json({
        success: true,
        appointment,
        message: 'Successfully updated payment status',
    });
});
exports.alldoctors = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const doctors = await doctormodel_1.default.find().populate({
        path: 'user',
        select: 'name email city state',
    });
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
});
exports.cancelAppointment = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { appointmentNumber, appointmentId } = req.body;
    const actingUserId = req.user?._id;
    if (!appointmentNumber && !appointmentId) {
        return next(new errorhander_1.default('Appointment identifier (appointmentNumber or appointmentId) is required', 400));
    }
    let appointment = null;
    if (appointmentId) {
        appointment = await appointmentmodel_1.default.findById(appointmentId);
    }
    else if (appointmentNumber) {
        appointment = await appointmentmodel_1.default.findOne({ appointmentNumber });
    }
    if (!appointment) {
        return next(new errorhander_1.default('Appointment not found', 404));
    }
    const patient = await patientmodel_1.default.findById(appointment.patient);
    const isOwner = req.user?.role === 'admin' ||
        (patient && patient.user.toString() === actingUserId?.toString());
    if (!isOwner) {
        return next(new errorhander_1.default('Not authorized to cancel this appointment', 403));
    }
    if (appointment.status === 'Canceled') {
        return res.status(200).json({
            success: true,
            message: 'Appointment is already cancelled',
            appointment,
        });
    }
    const schedule = await doctorschedulemodel_1.default.findOne({ doctor: appointment.doctor });
    if (schedule) {
        schedule.occupiedSlots = schedule.occupiedSlots
            .map((slot) => {
            if (isSameDay(slot.date, appointment.date)) {
                return {
                    ...slot,
                    timeSlots: slot.timeSlots.filter((ts) => ts.timeSlot !== appointment.time && ts.appointmentId?.toString() !== appointment._id?.toString()),
                };
            }
            return slot;
        })
            .filter((slot) => slot.timeSlots.length > 0);
        await schedule.save();
    }
    appointment.status = 'Canceled';
    await appointment.save();
    try {
        const patientUser = await usermodel_1.default.findById(actingUserId);
        const doc = await doctormodel_1.default.findById(appointment.doctor);
        if (actingUserId) {
            await (0, notification_controller_1.sendNotification)(actingUserId.toString(), actingUserId.toString(), 'appointment_cancelled', `Your appointment ${appointment.appointmentNumber} has been cancelled.`);
        }
        if (doc?.user) {
            await (0, notification_controller_1.sendNotification)(actingUserId?.toString() || 'system', doc.user.toString(), 'appointment_cancelled', `Appointment ${appointment.appointmentNumber} was cancelled by ${patientUser?.name || 'Patient'}.`);
        }
    }
    catch (notifErr) {
        console.error('Cancellation notification error:', notifErr);
    }
    res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
        appointment,
    });
});
exports.change_date_appointment = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { appointmentNumber, appointmentId, date, time } = req.body;
    const actingUserId = req.user?._id;
    if ((!appointmentNumber && !appointmentId) || !date || !time) {
        return next(new errorhander_1.default('Appointment identifier (appointmentNumber or appointmentId), new date, and new time are required', 400));
    }
    let appointment = null;
    if (appointmentId) {
        appointment = await appointmentmodel_1.default.findById(appointmentId);
    }
    else if (appointmentNumber) {
        appointment = await appointmentmodel_1.default.findOne({ appointmentNumber });
    }
    if (!appointment) {
        return next(new errorhander_1.default('Appointment not found', 404));
    }
    const patient = await patientmodel_1.default.findById(appointment.patient);
    const isOwner = req.user?.role === 'admin' ||
        (patient && patient.user.toString() === actingUserId?.toString());
    if (!isOwner) {
        return next(new errorhander_1.default('Not authorized to reschedule this appointment', 403));
    }
    if (appointment.status !== 'Scheduled') {
        return next(new errorhander_1.default(`Cannot reschedule an appointment with status: ${appointment.status}`, 400));
    }
    const newSlotDateTime = parseSlotDateTime(date, time);
    if (newSlotDateTime.getTime() <= Date.now()) {
        return next(new errorhander_1.default('Cannot reschedule to a past date and time', 400));
    }
    const schedule = await doctorschedulemodel_1.default.findOne({ doctor: appointment.doctor });
    if (!schedule) {
        return next(new errorhander_1.default('Doctor schedule not found', 404));
    }
    const newDateObj = new Date(date);
    const newDateStr = (0, moment_1.default)(newDateObj).format('YYYY-MM-DD');
    const onLeave = await leavemodel_1.default.findOne({
        doctor: appointment.doctor,
        status: 'Approved',
        startDate: { $lte: new Date(newDateStr) },
        endDate: { $gte: new Date(newDateStr) },
    });
    if (onLeave) {
        return next(new errorhander_1.default('Doctor is on leave on the new selected date', 400));
    }
    const targetOccupied = schedule.occupiedSlots.some((slot) => isSameDay(slot.date, newDateObj) &&
        slot.timeSlots.some((ts) => ts.timeSlot === time));
    if (targetOccupied) {
        return next(new errorhander_1.default('The requested target slot is already occupied. Original booking kept intact.', 400));
    }
    const oldDate = appointment.date;
    const oldTime = appointment.time;
    schedule.occupiedSlots = schedule.occupiedSlots
        .map((slot) => {
        if (isSameDay(slot.date, oldDate)) {
            return {
                ...slot,
                timeSlots: slot.timeSlots.filter((ts) => ts.timeSlot !== oldTime && ts.appointmentId?.toString() !== appointment._id?.toString()),
            };
        }
        return slot;
    })
        .filter((slot) => slot.timeSlots.length > 0);
    const existingSlotIndex = schedule.occupiedSlots.findIndex((slot) => isSameDay(slot.date, newDateObj));
    if (existingSlotIndex >= 0) {
        schedule.occupiedSlots[existingSlotIndex].timeSlots.push({
            timeSlot: time,
            appointmentId: appointment._id,
        });
    }
    else {
        schedule.occupiedSlots.push({
            date: new Date(newDateStr),
            timeSlots: [
                {
                    timeSlot: time,
                    appointmentId: appointment._id,
                },
            ],
        });
    }
    await schedule.save();
    appointment.date = newDateObj;
    appointment.time = time;
    await appointment.save();
    try {
        const patientUser = await usermodel_1.default.findById(actingUserId);
        const doc = await doctormodel_1.default.findById(appointment.doctor);
        if (actingUserId) {
            await (0, notification_controller_1.sendNotification)(actingUserId.toString(), actingUserId.toString(), 'appointment_rescheduled', `Appointment rescheduled to ${(0, moment_1.default)(date).format('MMMM Do YYYY')} at ${time}.`);
        }
        if (doc?.user) {
            await (0, notification_controller_1.sendNotification)(actingUserId?.toString() || 'system', doc.user.toString(), 'appointment_rescheduled', `Appointment was rescheduled by ${patientUser?.name || 'Patient'} to ${(0, moment_1.default)(date).format('MMMM Do YYYY')} at ${time}.`);
        }
    }
    catch (notifErr) {
        console.error('Reschedule notification error:', notifErr);
    }
    res.status(200).json({
        success: true,
        message: 'Appointment rescheduled successfully',
        appointment,
    });
});
exports.appointment_of_a_period = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { startDate, endDate } = req.body;
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to access these appointments', 403));
    }
    const patient = await patientmodel_1.default.findOne({ user: id });
    if (!patient) {
        return next(new errorhander_1.default('Patient profile not found', 404));
    }
    const effectiveStartDate = startDate ? new Date(startDate) : new Date(0);
    const effectiveEndDate = endDate ? new Date(endDate) : new Date(Date.now() + 100 * 365 * 24 * 3600 * 1000);
    const appointments = await appointmentmodel_1.default.find({
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
});
exports.appointment_history_all = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to access these appointments', 403));
    }
    const patient = await patientmodel_1.default.findOne({ user: id });
    if (!patient) {
        return next(new errorhander_1.default('Patient profile not found', 404));
    }
    const now = new Date();
    const appointments = await appointmentmodel_1.default.find({
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
});
exports.appointment_specific = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to access these appointments', 403));
    }
    const patient = await patientmodel_1.default.findOne({ user: id });
    if (!patient) {
        return next(new errorhander_1.default('Patient profile not found', 404));
    }
    const appointments = await appointmentmodel_1.default.find({ patient: patient._id }).populate({
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
});
exports.appointment_future = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to access these appointments', 403));
    }
    const patient = await patientmodel_1.default.findOne({ user: id });
    if (!patient) {
        return next(new errorhander_1.default('Patient profile not found', 404));
    }
    const appointments = await appointmentmodel_1.default.find({
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
});
exports.get_patient_dashboard_stats = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to access dashboard stats', 403));
    }
    const patient = await patientmodel_1.default.findOne({ user: id });
    if (!patient) {
        return next(new errorhander_1.default('Patient profile not found', 404));
    }
    const patientUser = await usermodel_1.default.findById(id);
    const currentDate = new Date();
    const upcomingAppointments = await appointmentmodel_1.default.countDocuments({
        patient: patient._id,
        date: { $gt: currentDate },
        status: 'Scheduled',
    });
    const completedAppointments = await appointmentmodel_1.default.countDocuments({
        patient: patient._id,
        status: 'Completed',
    });
    let doctorsInCity = 0;
    if (patientUser?.city) {
        const doctors = await doctormodel_1.default.find().populate({ path: 'user', select: 'city' });
        doctorsInCity = doctors.filter((doc) => doc.user?.city?.toLowerCase() === patientUser.city?.toLowerCase()).length;
    }
    res.status(200).json({
        success: true,
        stats: {
            upcomingAppointments,
            completedAppointments,
            doctorsInCity,
        },
    });
});
exports.markPastAppointmentsAsCompleted = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const result = await (0, markPastAppointments_1.markPastAppointmentsAsCompleted)();
    res.status(200).json({
        success: true,
        message: `Successfully processed past appointments`,
        updatedCount: result.updatedCount,
        matchedCount: result.matchedCount,
    });
});
exports.get_patient_info = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && req.user?.role !== 'doctor' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to access this patient medical profile', 403));
    }
    const patient = await patientmodel_1.default.findOne({ user: id }).populate('user', 'name email phoneNumber city state');
    if (!patient) {
        return next(new errorhander_1.default('Patient profile not found', 404));
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
});
exports.create_patient = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to manage this patient profile', 403));
    }
    const { medicalHistory, allergies, currentMedications } = req.body;
    let patient = await patientmodel_1.default.findOne({ user: id });
    if (patient) {
        if (medicalHistory !== undefined)
            patient.medicalHistory = medicalHistory;
        if (allergies !== undefined)
            patient.allergies = allergies;
        if (currentMedications !== undefined)
            patient.currentMedications = currentMedications;
        await patient.save();
        return res.status(200).json({
            success: true,
            message: 'Patient profile updated successfully',
            patient,
        });
    }
    patient = await patientmodel_1.default.create({
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
});
exports.update_patient = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to update this patient profile', 403));
    }
    const { medicalHistory, allergies, currentMedications } = req.body;
    let patient = await patientmodel_1.default.findOne({ user: id });
    if (!patient) {
        patient = await patientmodel_1.default.create({
            user: id,
            medicalHistory: medicalHistory || '',
            allergies: allergies || '',
            currentMedications: currentMedications || '',
        });
    }
    else {
        if (medicalHistory !== undefined)
            patient.medicalHistory = medicalHistory;
        if (allergies !== undefined)
            patient.allergies = allergies;
        if (currentMedications !== undefined)
            patient.currentMedications = currentMedications;
        await patient.save();
    }
    res.status(200).json({
        success: true,
        message: 'Patient profile updated successfully',
        patient,
    });
});
exports.specific_doctors = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { doc_name, city, state, experience, fees, specialty } = req.query;
    const doctors = await doctormodel_1.default.find().populate({
        path: 'user',
        select: 'name city state email',
    });
    let filtered = doctors.filter((doc) => doc.user != null);
    if (city && typeof city === 'string' && city.trim()) {
        const c = city.toLowerCase().trim();
        filtered = filtered.filter((doc) => doc.user?.city?.toLowerCase() === c);
    }
    if (state && typeof state === 'string' && state.trim()) {
        const s = state.toLowerCase().trim();
        filtered = filtered.filter((doc) => doc.user?.state?.toLowerCase() === s);
    }
    if (specialty && typeof specialty === 'string' && specialty.trim()) {
        const sp = specialty.toLowerCase().trim();
        filtered = filtered.filter((doc) => doc.specialization && doc.specialization.toLowerCase().includes(sp));
    }
    if (experience && !isNaN(Number(experience))) {
        filtered = filtered.filter((doc) => doc.experience >= Number(experience));
    }
    if (fees && !isNaN(Number(fees))) {
        filtered = filtered.filter((doc) => doc.fees <= Number(fees));
    }
    if (doc_name && typeof doc_name === 'string' && doc_name.trim()) {
        const dn = doc_name.toLowerCase().trim();
        filtered = filtered.filter((doc) => doc.user?.name?.toLowerCase().includes(dn));
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
});
exports.appointment_bookings = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { doc_id } = req.query;
    if (!doc_id) {
        return next(new errorhander_1.default('Doctor ID (doc_id) is required', 400));
    }
    const doctor = await doctormodel_1.default.findById(doc_id);
    if (!doctor) {
        return next(new errorhander_1.default('Doctor not found', 404));
    }
    const doctorSchedule = await doctorschedulemodel_1.default.findOne({ doctor: doc_id });
    if (!doctorSchedule) {
        return res.status(200).json({
            success: true,
            message: 'Doctor has not set up their schedule yet',
            availableSlots: [],
        });
    }
    const leaves = await leavemodel_1.default.find({
        doctor: doc_id,
        status: 'Approved',
    });
    const isDoctorOnLeave = (targetDate) => {
        return leaves.some((l) => {
            const start = (0, moment_1.default)(l.startDate).startOf('day');
            const end = (0, moment_1.default)(l.endDate).endOf('day');
            return targetDate.isBetween(start, end, 'day', '[]');
        });
    };
    const generateSlots = (startTime, endTime) => {
        const slots = [];
        let cur = (0, moment_1.default)(startTime, 'HH:mm');
        const end = (0, moment_1.default)(endTime, 'HH:mm');
        while (cur.isBefore(end)) {
            slots.push(cur.format('HH:mm'));
            cur.add(10, 'minutes');
        }
        return slots;
    };
    const availableSlots = [];
    const now = (0, moment_1.default)();
    const horizon = (0, moment_1.default)().add(30, 'days');
    const bookedSlotsMap = new Map();
    doctorSchedule.occupiedSlots.forEach((occ) => {
        const d = (0, moment_1.default)(occ.date).format('YYYY-MM-DD');
        const times = occ.timeSlots.map((ts) => (0, moment_1.default)(ts.timeSlot, ['HH:mm', 'h:mm A']).format('HH:mm'));
        if (bookedSlotsMap.has(d)) {
            bookedSlotsMap.set(d, [...(bookedSlotsMap.get(d) || []), ...times]);
        }
        else {
            bookedSlotsMap.set(d, times);
        }
    });
    for (let day = (0, moment_1.default)(now); day.isBefore(horizon); day.add(1, 'day')) {
        if (isDoctorOnLeave(day)) {
            continue;
        }
        const dateStr = day.format('YYYY-MM-DD');
        const isToday = day.isSame(now, 'day');
        const slotsForDay = [];
        const sched = doctorSchedule.schedule;
        if (sched?.morning) {
            sched.morning.forEach((m) => slotsForDay.push(...generateSlots(m.startTime, m.endTime)));
        }
        if (sched?.evening) {
            sched.evening.forEach((e) => slotsForDay.push(...generateSlots(e.startTime, e.endTime)));
        }
        const booked = bookedSlotsMap.get(dateStr) || [];
        let remaining = slotsForDay.filter((s) => !booked.includes(s));
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
});
//# sourceMappingURL=patientcontroller.js.map