"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getdoctorinfo = exports.getTodaySchedule = exports.earnings = exports.applyForLeave = exports.getpatients = exports.change_date_appointment = exports.appointment_specific = exports.updatepaymentstatus = exports.cancel_appointment = exports.schedule_of_day = exports.updateDoctor = exports.updateSchedule = exports.createDoctor = void 0;
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
    console.log('updateDoctor called with:', { id, specialization, experience, fees, body: req.body });
    if (!id) {
        return res.status(400).json({
            success: false,
            message: 'Doctor ID is required'
        });
    }
    let doctor = await doctormodel_1.default.findOne({ user: id });
    if (doctor) {
        let updated = false;
        if (specialization !== undefined && specialization !== null) {
            doctor.specialization = specialization || '';
            updated = true;
            console.log('Updating specialization to:', specialization);
        }
        if (experience !== undefined && experience !== null) {
            const experienceValue = String(experience).trim();
            if (experienceValue !== '') {
                const parsedExperience = parseInt(experienceValue);
                if (!isNaN(parsedExperience)) {
                    doctor.experience = parsedExperience;
                    updated = true;
                    console.log('Updating experience to:', parsedExperience);
                }
            }
        }
        if (fees !== undefined && fees !== null) {
            const feesValue = String(fees).trim();
            if (feesValue !== '') {
                const parsedFees = parseInt(feesValue);
                if (!isNaN(parsedFees)) {
                    doctor.fees = parsedFees;
                    updated = true;
                    console.log('Updating fees to:', parsedFees);
                }
            }
        }
        if (!updated) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields provided for update'
            });
        }
        await doctor.save();
        doctor = await doctormodel_1.default.findOne({ user: id }).populate('user', 'name email phoneNumber city state');
        console.log('Doctor updated successfully:', {
            _id: doctor._id,
            specialization: doctor.specialization,
            experience: doctor.experience,
            fees: doctor.fees
        });
        res.status(200).json({
            success: true,
            message: 'Doctor details updated successfully',
            doctor: {
                specialization: doctor.specialization,
                experience: doctor.experience,
                fees: doctor.fees,
                user: doctor.user
            }
        });
    }
    else {
        const newDoctor = new doctormodel_1.default({
            user: id,
            specialization: specialization || 'Not specified',
            experience: (experience && String(experience).trim() !== '') ? parseInt(String(experience)) : 0,
            fees: (fees && String(fees).trim() !== '') ? parseInt(String(fees)) : 0
        });
        await newDoctor.save();
        await newDoctor.populate('user', 'name email phoneNumber city state');
        console.log('Doctor created successfully:', {
            _id: newDoctor._id,
            specialization: newDoctor.specialization,
            experience: newDoctor.experience,
            fees: newDoctor.fees
        });
        res.status(201).json({
            success: true,
            message: 'Doctor created successfully',
            doctor: {
                specialization: newDoctor.specialization,
                experience: newDoctor.experience,
                fees: newDoctor.fees,
                user: newDoctor.user
            }
        });
    }
});
exports.schedule_of_day = (0, catchAsyncErrors_1.default)(async (req, res) => {
    const { id } = req.params;
    console.log('schedule_of_day called with id:', id);
    if (!id) {
        return res.status(400).json({ success: false, message: "User ID parameter is required" });
    }
    const doctor = await doctormodel_1.default.findOne({ user: id });
    if (!doctor) {
        console.log('Doctor not found for user id:', id);
        return res.status(200).json({
            success: true,
            schedule: {
                morning: [],
                evening: []
            },
            message: 'Doctor not found. Please create doctor profile first.'
        });
    }
    const schedule = await doctorschedulemodel_1.default.findOne({ doctor: doctor._id });
    if (!schedule || !schedule.schedule) {
        console.log('Schedule not found for doctor:', doctor._id);
        return res.status(200).json({
            success: true,
            schedule: {
                morning: [],
                evening: []
            },
            message: 'Schedule not found. Please create a schedule first.'
        });
    }
    console.log('Schedule found:', {
        morning: schedule.schedule.morning?.length || 0,
        evening: schedule.schedule.evening?.length || 0
    });
    res.status(200).json({
        success: true,
        schedule: {
            morning: schedule.schedule.morning || [],
            evening: schedule.schedule.evening || [],
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
    console.log('appointment_specific called with id:', id, 'body:', req.body);
    const params = req.body.params || req.body || {};
    const { startDate, endDate, startTime, endTime, city, patientName, status } = params;
    console.log('Extracted params:', { startDate, endDate, startTime, endTime, city, patientName, status });
    const doctor = await doctormodel_1.default.findOne({ user: id });
    if (!doctor) {
        console.log('Doctor not found for id:', id);
        return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    console.log('Doctor found:', doctor._id);
    const now = new Date();
    const hundredYearsAgo = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
    const hundredYearsFromNow = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());
    const effectiveStartDate = startDate ? new Date(startDate) : hundredYearsAgo;
    const effectiveEndDate = endDate ? new Date(endDate) : hundredYearsFromNow;
    const defaultStartTime = startTime || '00:00:00';
    const defaultEndTime = endTime || '23:59:59';
    let appointments;
    try {
        appointments = await appointmentmodel_1.default.find({
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
        console.log(`Found ${appointments.length} appointments for doctor`);
    }
    catch (error) {
        console.error('Error finding appointments:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching appointments: ' + error.message
        });
    }
    let filteredAppointments = appointments;
    try {
        if (defaultStartTime !== '00:00:00' || defaultEndTime !== '23:59:59') {
            filteredAppointments = appointments.filter(app => {
                if (!app.time)
                    return false;
                const appTime = app.time.length === 5 ? app.time + ':00' : app.time;
                return appTime >= defaultStartTime && appTime <= defaultEndTime;
            });
        }
        if (city && city.trim() !== '') {
            filteredAppointments = filteredAppointments.filter(app => {
                try {
                    if (!app.patient || !app.patient.user)
                        return false;
                    const patientCity = String(app.patient.user.city || '').toLowerCase();
                    return patientCity.includes(city.toLowerCase().trim());
                }
                catch (error) {
                    console.error('Error filtering by city:', error);
                    return false;
                }
            });
        }
        if (patientName && patientName.trim() !== '') {
            filteredAppointments = filteredAppointments.filter(app => {
                try {
                    if (!app.patient || !app.patient.user)
                        return false;
                    const patientNameValue = String(app.patient.user.name || '').toLowerCase();
                    return patientNameValue.includes(patientName.toLowerCase().trim());
                }
                catch (error) {
                    console.error('Error filtering by patient name:', error);
                    return false;
                }
            });
        }
        if (status && status.trim() !== '') {
            filteredAppointments = filteredAppointments.filter(app => app.status === status);
        }
        console.log(`Returning ${filteredAppointments.length} filtered appointments out of ${appointments.length} total`);
        res.status(200).json({
            success: true,
            appointments: filteredAppointments
        });
    }
    catch (error) {
        console.error('Error filtering appointments:', error);
        return res.status(500).json({
            success: false,
            message: 'Error filtering appointments: ' + error.message,
            appointments: []
        });
    }
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
    const { id } = req.params;
    const { patientName, patient_phone, patient_email, appointmentNumber } = req.body;
    console.log('getpatients called with doctor id:', id, 'body:', req.body);
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
    try {
        const doctor = await doctormodel_1.default.findOne({ user: id });
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        const appointments = await appointmentmodel_1.default.find({ doctor: doctor._id })
            .populate({
            path: 'patient',
            select: 'medicalHistory allergies currentMedications',
            populate: {
                path: 'user',
                select: 'name email phoneNumber city state'
            }
        });
        const uniquePatientIds = new Set();
        const patientsList = [];
        appointments.forEach((appointment) => {
            if (appointment.patient && appointment.patient.user && !uniquePatientIds.has(appointment.patient.user._id.toString())) {
                uniquePatientIds.add(appointment.patient.user._id.toString());
                patientsList.push({
                    _id: appointment.patient._id,
                    name: appointment.patient.user.name,
                    email: appointment.patient.user.email,
                    phone: appointment.patient.user.phoneNumber,
                    city: appointment.patient.user.city,
                    state: appointment.patient.user.state,
                    medicalHistory: appointment.patient.medicalHistory,
                    allergies: appointment.patient.allergies,
                    currentMedications: appointment.patient.currentMedications,
                });
            }
        });
        console.log(`Found ${patientsList.length} unique patients for doctor`);
        return res.status(200).json({
            success: true,
            patients: patientsList
        });
    }
    catch (error) {
        console.error('Error fetching all patients:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching patients: ' + error.message
        });
    }
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
exports.getTodaySchedule = (0, catchAsyncErrors_1.default)(async (req, res) => {
    const { id } = req.params;
    const doctor = await doctormodel_1.default.findOne({ user: id });
    if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    const todayAppointments = await appointmentmodel_1.default.find({
        doctor: doctor._id,
        date: { $gte: today, $lte: endOfToday },
        status: 'Scheduled'
    })
        .populate({
        path: 'patient',
        select: 'medicalHistory allergies currentMedications',
        populate: {
            path: 'user',
            select: 'name email phoneNumber'
        }
    })
        .sort({ time: 1 });
    const scheduleByTime = {};
    todayAppointments.forEach(app => {
        const time = app.time;
        if (!scheduleByTime[time]) {
            scheduleByTime[time] = [];
        }
        scheduleByTime[time].push({
            appointmentNumber: app.appointmentNumber,
            patientName: app.patient?.user?.name || 'Unknown',
            patientEmail: app.patient?.user?.email || '',
            patientPhone: app.patient?.user?.phoneNumber || '',
            time: app.time,
            date: app.date,
            status: app.status
        });
    });
    res.status(200).json({
        success: true,
        totalAppointments: todayAppointments.length,
        schedule: scheduleByTime,
        appointments: todayAppointments.map(app => ({
            appointmentNumber: app.appointmentNumber,
            patientName: app.patient?.user?.name || 'Unknown',
            patientEmail: app.patient?.user?.email || '',
            patientPhone: app.patient?.user?.phoneNumber || '',
            time: app.time,
            date: app.date,
            status: app.status
        }))
    });
});
exports.getdoctorinfo = (0, catchAsyncErrors_1.default)(async (req, res) => {
    const { id } = req.params;
    console.log('getdoctorinfo called with id:', id);
    const doctor = await doctormodel_1.default.findOne({ user: id }).populate('user', 'name email phoneNumber city state');
    if (!doctor) {
        console.log('Doctor not found for user id:', id);
        return res.status(200).json({
            success: true,
            doctor: {
                specialization: '',
                experience: 0,
                fees: 0,
                user: null
            },
            message: 'Doctor profile not found. Please create one.'
        });
    }
    console.log('Doctor found:', {
        specialization: doctor.specialization,
        experience: doctor.experience,
        fees: doctor.fees
    });
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