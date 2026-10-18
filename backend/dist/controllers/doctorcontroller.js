"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getdoctorreports = exports.getpatients = exports.getdoctorinfo = exports.schedule_of_day = exports.getTodaySchedule = exports.earnings = exports.applyForLeave = exports.change_date_appointment = exports.appointment_specific = exports.cancel_appointment = exports.updateDoctor = exports.updateSchedule = exports.createDoctor = void 0;
const catchAsyncErrors_1 = __importDefault(require("../middleware/catchAsyncErrors"));
const appointmentmodel_1 = __importDefault(require("../models/appointmentmodel"));
const doctormodel_1 = __importDefault(require("../models/doctormodel"));
const doctorschedulemodel_1 = __importDefault(require("../models/doctorschedulemodel"));
const leavemodel_1 = __importDefault(require("../models/leavemodel"));
const errorhander_1 = __importDefault(require("../utils/errorhander"));
const moment_1 = __importDefault(require("moment"));
const isSameDay = (d1, d2) => {
    return (0, moment_1.default)(d1).format('YYYY-MM-DD') === (0, moment_1.default)(d2).format('YYYY-MM-DD');
};
exports.createDoctor = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { specialization, experience, fees } = req.body;
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to create doctor profile for another user', 403));
    }
    if (!specialization || experience === undefined || fees === undefined) {
        return next(new errorhander_1.default('Specialization, experience, and fees are required', 400));
    }
    const existingDoctor = await doctormodel_1.default.findOne({ user: id });
    if (existingDoctor) {
        return next(new errorhander_1.default('Doctor profile already exists', 400));
    }
    const newDoctor = await doctormodel_1.default.create({
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
});
exports.updateSchedule = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { morning, evening } = req.body;
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to update another doctor schedule', 403));
    }
    let doctor = await doctormodel_1.default.findOne({ user: id });
    if (!doctor) {
        doctor = await doctormodel_1.default.create({
            user: id,
            specialization: 'General Physician',
            experience: 1,
            fees: 500,
        });
    }
    let existingSchedule = await doctorschedulemodel_1.default.findOne({ doctor: doctor._id });
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
    const newSchedule = await doctorschedulemodel_1.default.create({
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
});
exports.updateDoctor = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to update this doctor profile', 403));
    }
    const { specialization, experience, fees } = req.body;
    let doctor = await doctormodel_1.default.findOne({ user: id });
    if (!doctor) {
        doctor = await doctormodel_1.default.create({
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
    if (specialization !== undefined)
        doctor.specialization = specialization;
    if (experience !== undefined && !isNaN(Number(experience)))
        doctor.experience = Number(experience);
    if (fees !== undefined && !isNaN(Number(fees)))
        doctor.fees = Number(fees);
    await doctor.save();
    res.status(200).json({
        success: true,
        message: 'Doctor profile updated successfully',
        doctor,
    });
});
exports.cancel_appointment = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const { appointmentNumber } = req.body;
    const actingUserId = req.user?._id?.toString();
    const doctor = await doctormodel_1.default.findOne({ user: id });
    if (!doctor && req.user?.role !== 'admin') {
        return next(new errorhander_1.default('Doctor profile not found', 404));
    }
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to cancel this appointment', 403));
    }
    const appointment = await appointmentmodel_1.default.findOne({ appointmentNumber });
    if (!appointment) {
        return next(new errorhander_1.default('Appointment not found', 404));
    }
    if (req.user?.role !== 'admin' && appointment.doctor.toString() !== doctor?._id.toString()) {
        return next(new errorhander_1.default('This appointment does not belong to you', 403));
    }
    if (appointment.status === 'Canceled') {
        return res.status(200).json({
            success: true,
            message: 'Appointment is already cancelled',
        });
    }
    const schedule = await doctorschedulemodel_1.default.findOne({ doctor: appointment.doctor });
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
});
exports.appointment_specific = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to access these appointments', 403));
    }
    const doctor = await doctormodel_1.default.findOne({ user: id });
    if (!doctor) {
        return next(new errorhander_1.default('Doctor not found', 404));
    }
    const params = req.body.params || req.body || {};
    const { startDate, endDate, status } = params;
    const query = { doctor: doctor._id };
    if (status)
        query.status = status;
    if (startDate || endDate) {
        query.date = {};
        if (startDate)
            query.date.$gte = new Date(startDate);
        if (endDate)
            query.date.$lte = new Date(endDate);
    }
    const appointments = await appointmentmodel_1.default.find(query)
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
});
exports.change_date_appointment = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const { appointmentNumber, date, time } = req.body;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to reschedule this appointment', 403));
    }
    const appointment = await appointmentmodel_1.default.findOne({ appointmentNumber });
    if (!appointment) {
        return next(new errorhander_1.default('Appointment not found', 404));
    }
    const doctor = await doctormodel_1.default.findOne({ user: id });
    if (req.user?.role !== 'admin' && appointment.doctor.toString() !== doctor?._id.toString()) {
        return next(new errorhander_1.default('This appointment does not belong to your schedule', 403));
    }
    const schedule = await doctorschedulemodel_1.default.findOne({ doctor: appointment.doctor });
    if (!schedule) {
        return next(new errorhander_1.default('Doctor schedule not found', 404));
    }
    const newDate = new Date(date);
    const targetOccupied = schedule.occupiedSlots.some((slot) => isSameDay(slot.date, newDate) && slot.timeSlots.some((ts) => ts.timeSlot === time));
    if (targetOccupied) {
        return next(new errorhander_1.default('Requested target slot is already occupied', 400));
    }
    const oldDate = appointment.date;
    const oldTime = appointment.time;
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
    const slotIdx = schedule.occupiedSlots.findIndex((s) => isSameDay(s.date, newDate));
    if (slotIdx >= 0) {
        schedule.occupiedSlots[slotIdx].timeSlots.push({
            timeSlot: time,
            appointmentId: appointment._id,
        });
    }
    else {
        schedule.occupiedSlots.push({
            date: newDate,
            timeSlots: [{ timeSlot: time, appointmentId: appointment._id }],
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
});
exports.applyForLeave = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const { startDate, endDate, reason } = req.body;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to apply for leave for another doctor', 403));
    }
    if (!startDate || !endDate) {
        return next(new errorhander_1.default('Start date and end date are required', 400));
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return next(new errorhander_1.default('Invalid leave date format', 400));
    }
    if (start > end) {
        return next(new errorhander_1.default('Start date cannot be after end date', 400));
    }
    const doctor = await doctormodel_1.default.findOne({ user: id });
    if (!doctor) {
        return next(new errorhander_1.default('Doctor profile not found', 404));
    }
    const leave = await leavemodel_1.default.create({
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
});
exports.earnings = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to view another doctor earnings', 403));
    }
    const doctor = await doctormodel_1.default.findOne({ user: id });
    if (!doctor) {
        return next(new errorhander_1.default('Doctor not found', 404));
    }
    const appointments = await appointmentmodel_1.default.find({
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
});
exports.getTodaySchedule = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to view this schedule', 403));
    }
    const doctor = await doctormodel_1.default.findOne({ user: id });
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
    const todayAppointments = await appointmentmodel_1.default.find({
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
    const scheduleByTime = {};
    todayAppointments.forEach((app) => {
        const time = app.time;
        if (!scheduleByTime[time]) {
            scheduleByTime[time] = [];
        }
        scheduleByTime[time].push({
            appointmentNumber: app.appointmentNumber,
            patientName: app.patient?.user?.name || 'Patient',
            patientEmail: app.patient?.user?.email || '',
            patientPhone: app.patient?.user?.phoneNumber || '',
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
            patientName: app.patient?.user?.name || 'Patient',
            patientEmail: app.patient?.user?.email || '',
            patientPhone: app.patient?.user?.phoneNumber || '',
            time: app.time,
            date: app.date,
            status: app.status,
        })),
    });
});
exports.schedule_of_day = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const { date } = req.query;
    const doctor = await doctormodel_1.default.findOne({ user: id });
    if (!doctor) {
        return next(new errorhander_1.default('Doctor not found', 404));
    }
    const targetDate = date ? new Date(date) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);
    const appointments = await appointmentmodel_1.default.find({
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
});
exports.getdoctorinfo = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const doctor = await doctormodel_1.default.findOne({ user: id }).populate('user', 'name email phoneNumber city state');
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
});
exports.getpatients = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to access patient records for another doctor', 403));
    }
    const doctor = await doctormodel_1.default.findOne({ user: id });
    if (!doctor) {
        return next(new errorhander_1.default('Doctor profile not found', 404));
    }
    const { appointmentNumber } = req.body;
    if (appointmentNumber) {
        const appointment = await appointmentmodel_1.default.findOne({
            appointmentNumber,
            doctor: doctor._id,
        }).populate({
            path: 'patient',
            select: 'medicalHistory allergies currentMedications',
            populate: { path: 'user', select: 'name email phoneNumber city' },
        });
        if (!appointment) {
            return next(new errorhander_1.default('Appointment not found for this doctor', 404));
        }
        const p = appointment.patient;
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
    const appointments = await appointmentmodel_1.default.find({ doctor: doctor._id }).populate({
        path: 'patient',
        select: 'medicalHistory allergies currentMedications',
        populate: { path: 'user', select: 'name email phoneNumber city' },
    });
    const uniquePatientsMap = new Map();
    appointments.forEach((app) => {
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
});
exports.getdoctorreports = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const actingUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && actingUserId !== id) {
        return next(new errorhander_1.default('Not authorized to access reports for another doctor', 403));
    }
    const doctor = await doctormodel_1.default.findOne({ user: id });
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
    const query = { doctor: doctor._id };
    if (startDate || endDate) {
        query.date = {};
        if (startDate)
            query.date.$gte = new Date(startDate);
        if (endDate)
            query.date.$lte = new Date(endDate);
    }
    const appointments = await appointmentmodel_1.default.find(query);
    let totalAppointments = appointments.length;
    let completedAppointments = 0;
    let cancelledAppointments = 0;
    let totalEarnings = 0;
    const monthlyMap = {};
    appointments.forEach((app) => {
        const monthStr = (0, moment_1.default)(app.date).format('MMM YYYY');
        if (!monthlyMap[monthStr]) {
            monthlyMap[monthStr] = { appointments: 0, earnings: 0 };
        }
        monthlyMap[monthStr].appointments += 1;
        if (app.status === 'Completed') {
            completedAppointments += 1;
            totalEarnings += Number(app.fees) || 0;
            monthlyMap[monthStr].earnings += Number(app.fees) || 0;
        }
        else if (app.status === 'Canceled') {
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
});
//# sourceMappingURL=doctorcontroller.js.map