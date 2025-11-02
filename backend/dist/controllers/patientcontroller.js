"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointment_bookings = exports.update_patient = exports.specific_doctors = exports.change_date_appointment = exports.create_patient = exports.appointment_future = exports.appointment_specific = exports.appointment_history_all = exports.appointment_of_a_period = exports.cancelAppointment = exports.alldoctors = exports.updatepaymentstatus = exports.newappointment = void 0;
const catchAsyncErrors_1 = __importDefault(require("../middleware/catchAsyncErrors"));
const appointmentmodel_1 = __importDefault(require("../models/appointmentmodel"));
const doctormodel_1 = __importDefault(require("../models/doctormodel"));
const doctorschedulemodel_1 = __importDefault(require("../models/doctorschedulemodel"));
const usermodel_1 = __importDefault(require("../models/usermodel"));
const patientmodel_1 = __importDefault(require("../models/patientmodel"));
const uuid_1 = require("uuid");
const moment_1 = __importDefault(require("moment"));
const notification_controller_1 = require("./notification.controller");
exports.newappointment = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const { doc_id, date, time, paid } = req.body;
    const appointmentNumber = (0, uuid_1.v4)();
    const patient = await patientmodel_1.default.findOne({ user: id });
    const doctor = await doctormodel_1.default.findById(doc_id);
    const schedule = await doctorschedulemodel_1.default.findOne({ doctor: doc_id });
    console.log("patient and id", patient, id);
    if (!patient || !doctor || !schedule) {
        return res.status(404).json({ success: false, message: "Doctor, Patient, or Schedule not found" });
    }
    const existingAppointment = await appointmentmodel_1.default.findOne({ date, time, patient: patient._id, status: "Scheduled" });
    if (existingAppointment) {
        return res.status(400).json({ success: false, message: "Appointment already exists" });
    }
    const isAvailable = !schedule.occupiedSlots.some(slot => slot.date.toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0] &&
        slot.timeSlots.some(ts => ts.timeSlot === time));
    if (!isAvailable) {
        return res.status(400).json({ success: false, message: "Selected time slot is not available" });
    }
    const appointment = await appointmentmodel_1.default.create({
        doctor: doc_id,
        patient: patient._id,
        date,
        time,
        fees: doctor.fees,
        paid,
        appointmentNumber,
        status: "Scheduled"
    });
    const dateStr = new Date(date).toISOString().split('T')[0];
    const existingSlot = schedule.occupiedSlots.find(slot => slot.date.toISOString().split('T')[0] === dateStr);
    if (existingSlot) {
        existingSlot.timeSlots.push({
            timeSlot: time,
            appointmentId: appointment._id
        });
    }
    else {
        schedule.occupiedSlots.push({
            date: new Date(date),
            timeSlots: [{
                    timeSlot: time,
                    appointmentId: appointment._id
                }]
        });
    }
    await schedule.save();
    try {
        const patientUser = await usermodel_1.default.findById(id);
        const doctorUser = await usermodel_1.default.findById(doctor.user);
        if (patientUser) {
            await (0, notification_controller_1.sendNotification)(id, id, 'appointment_booked', `You have successfully booked an appointment with Dr. ${doctorUser?.name} on ${(0, moment_1.default)(date).format('MMMM Do YYYY')} at ${time}`);
        }
        if (doctorUser) {
            await (0, notification_controller_1.sendNotification)(id, doctor.user.toString(), 'new_appointment', `New appointment booked by ${patientUser?.name} on ${(0, moment_1.default)(date).format('MMMM Do YYYY')} at ${time}`);
        }
    }
    catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
    }
    res.status(201).json({
        success: true,
        appointment
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
exports.alldoctors = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const alldocs = await doctormodel_1.default.find()
        .populate({
        path: 'user',
        select: 'name email phoneNumber city state pincode',
    });
    res.status(200).json({
        success: true,
        doctors: alldocs
    });
});
exports.cancelAppointment = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const { appointmentNumber } = req.body;
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
    appointment.status = "Canceled";
    await appointment.save();
    try {
        const patientUser = await usermodel_1.default.findById(id);
        const doctorUser = await usermodel_1.default.findById(appointment.doctor);
        if (patientUser) {
            await (0, notification_controller_1.sendNotification)(id, id, 'appointment_cancelled', `You have cancelled your appointment with Dr. ${doctorUser?.name} on ${(0, moment_1.default)(appointment.date).format('MMMM Do YYYY')} at ${appointment.time}`);
        }
        if (doctorUser) {
            await (0, notification_controller_1.sendNotification)(id, appointment.doctor.toString(), 'appointment_cancelled', `Appointment cancelled by ${patientUser?.name} on ${(0, moment_1.default)(appointment.date).format('MMMM Do YYYY')} at ${appointment.time}`);
        }
    }
    catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
    }
    res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
        appointment
    });
});
exports.appointment_of_a_period = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { startDate, endDate } = req.body;
    const { id } = req.params;
    const patient = await patientmodel_1.default.findOne({ user: id });
    if (!patient) {
        return res.status(404).json({
            success: false,
            message: 'Patient not found'
        });
    }
    const now = new Date();
    const hundredYearsAgo = new Date(now.setFullYear(now.getFullYear() - 100));
    const hundredYearsFromNow = new Date(now.setFullYear(now.getFullYear() + 200));
    const effectiveStartDate = startDate ? new Date(startDate) : hundredYearsAgo;
    const effectiveEndDate = endDate ? new Date(endDate) : hundredYearsFromNow;
    if (effectiveEndDate < effectiveStartDate) {
        return res.status(400).json({
            success: false,
            message: 'End date must be after start date'
        });
    }
    const allAppointments = await appointmentmodel_1.default.find({ patient: patient._id })
        .populate({
        path: 'doctor',
        select: 'user',
        populate: {
            path: 'user',
            select: 'name email phoneNumber city state pincode',
        }
    });
    const filteredAppointments = allAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= effectiveStartDate && appointmentDate <= effectiveEndDate;
    });
    res.status(200).json({
        success: true,
        appointments: filteredAppointments
    });
});
exports.appointment_history_all = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const endDate = new Date();
    const patient = await patientmodel_1.default.findOne({ user: id });
    if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    const appointments = await appointmentmodel_1.default.find({ patient: patient._id })
        .populate({
        path: 'doctor',
        select: 'user',
        populate: {
            path: 'user',
            select: 'name email phoneNumber city state pincode',
        }
    });
    const pastAppointments = appointments.filter(app => new Date(app.date) <= endDate);
    res.status(200).json({
        success: true,
        appointments: pastAppointments
    });
});
exports.appointment_specific = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const { startDate, endDate, startTime, endTime, city, specialty, experience, fees, doc_name } = req.query;
    const startDateStr = startDate ? (Array.isArray(startDate) ? startDate[0] : startDate) : undefined;
    const endDateStr = endDate ? (Array.isArray(endDate) ? endDate[0] : endDate) : undefined;
    const startTimeStr = startTime ? (Array.isArray(startTime) ? startTime[0] : startTime) : undefined;
    const endTimeStr = endTime ? (Array.isArray(endTime) ? endTime[0] : endTime) : undefined;
    const cityStr = city ? (Array.isArray(city) ? city[0] : city) : undefined;
    const specialtyStr = specialty ? (Array.isArray(specialty) ? specialty[0] : specialty) : undefined;
    const experienceStr = experience ? (Array.isArray(experience) ? experience[0] : experience) : undefined;
    const feesStr = fees ? (Array.isArray(fees) ? fees[0] : fees) : undefined;
    const docNameStr = doc_name ? (Array.isArray(doc_name) ? doc_name[0] : doc_name) : undefined;
    console.log('Patient appointment filter request:', {
        id,
        startDateStr,
        endDateStr,
        startTimeStr,
        endTimeStr,
        cityStr,
        specialtyStr,
        experienceStr,
        feesStr,
        docNameStr
    });
    const hasFilters = !!(startDateStr?.trim() || endDateStr?.trim() || startTimeStr?.trim() || endTimeStr?.trim() ||
        cityStr?.trim() || specialtyStr?.trim() || experienceStr?.trim() || feesStr?.trim() || docNameStr?.trim());
    console.log('Has filters:', hasFilters);
    const patient = await patientmodel_1.default.findOne({ user: id });
    if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    if (!hasFilters) {
        console.log('No filters applied, returning all appointments');
        const allAppointments = await appointmentmodel_1.default.find({ patient: patient._id })
            .populate({
            path: 'doctor',
            select: 'specialization experience fees',
            populate: {
                path: 'user',
                select: 'name city email phoneNumber state'
            }
        });
        return res.status(200).json({
            success: true,
            appointments: allAppointments
        });
    }
    const now = new Date();
    const hundredYearsAgo = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
    const hundredYearsFromNow = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());
    const effectiveStartDate = startDateStr?.trim() ? new Date(startDateStr) : hundredYearsAgo;
    const effectiveEndDate = endDateStr?.trim() ? new Date(endDateStr) : hundredYearsFromNow;
    const defaultStartTime = startTimeStr?.trim() || '00:00:00';
    const defaultEndTime = endTimeStr?.trim() || '23:59:59';
    const appointments = await appointmentmodel_1.default.find({
        patient: patient._id,
        date: { $gte: effectiveStartDate, $lte: effectiveEndDate }
    })
        .populate({
        path: 'doctor',
        select: 'specialization experience fees',
        populate: {
            path: 'user',
            select: 'name city email phoneNumber state'
        }
    });
    console.log(`Found ${appointments.length} appointments in date range`);
    let filteredAppointments = appointments;
    if (startTimeStr?.trim() || endTimeStr?.trim()) {
        filteredAppointments = appointments.filter(app => {
            const appointmentDateTime = new Date(app.date);
            const appointmentTime = appointmentDateTime.toTimeString().substring(0, 8);
            return appointmentTime >= defaultStartTime && appointmentTime <= defaultEndTime;
        });
        console.log(`After time filter: ${filteredAppointments.length} appointments`);
    }
    if (cityStr?.trim()) {
        const cityLower = cityStr.toLowerCase().trim();
        filteredAppointments = filteredAppointments.filter(app => {
            const doctorCity = app.doctor?.user?.city;
            const match = doctorCity && doctorCity.toLowerCase().includes(cityLower);
            if (!match) {
                console.log('City filter - no match:', { doctorCity, filterCity: cityStr });
            }
            return match;
        });
        console.log(`After city filter: ${filteredAppointments.length} appointments`);
    }
    if (specialtyStr?.trim()) {
        const specialtyLower = specialtyStr.toLowerCase().trim();
        filteredAppointments = filteredAppointments.filter(app => {
            const doctorSpecialty = app.doctor?.specialization;
            const match = doctorSpecialty && doctorSpecialty.toLowerCase().includes(specialtyLower);
            if (!match) {
                console.log('Specialty filter - no match:', { doctorSpecialty, filterSpecialty: specialtyStr });
            }
            return match;
        });
        console.log(`After specialty filter: ${filteredAppointments.length} appointments`);
    }
    if (experienceStr?.trim()) {
        const minExperience = parseInt(experienceStr);
        if (!isNaN(minExperience)) {
            filteredAppointments = filteredAppointments.filter(app => {
                const exp = app.doctor?.experience;
                return exp && exp >= minExperience;
            });
            console.log(`After experience filter: ${filteredAppointments.length} appointments`);
        }
    }
    if (feesStr?.trim()) {
        const maxFees = parseInt(feesStr);
        if (!isNaN(maxFees)) {
            filteredAppointments = filteredAppointments.filter(app => {
                const fees = app.doctor?.fees;
                return fees && fees <= maxFees;
            });
            console.log(`After fees filter: ${filteredAppointments.length} appointments`);
        }
    }
    if (docNameStr?.trim()) {
        const nameLower = docNameStr.toLowerCase().trim();
        filteredAppointments = filteredAppointments.filter(app => {
            const doctorName = app.doctor?.user?.name;
            const match = doctorName && doctorName.toLowerCase().includes(nameLower);
            if (!match) {
                console.log('Name filter - no match:', { doctorName, filterName: docNameStr });
            }
            return match;
        });
        console.log(`After name filter: ${filteredAppointments.length} appointments`);
    }
    if (appointments.length > 0) {
        console.log('Sample appointment data structure:', {
            appointmentId: appointments[0]._id,
            doctor: appointments[0].doctor ? 'populated' : 'NOT populated',
            doctorUser: appointments[0].doctor?.user ? 'populated' : 'NOT populated',
            doctorCity: appointments[0].doctor?.user?.city,
            doctorSpecialization: appointments[0].doctor?.specialization,
            doctorExperience: appointments[0].doctor?.experience,
            doctorFees: appointments[0].doctor?.fees,
            doctorName: appointments[0].doctor?.user?.name
        });
    }
    console.log('Final filter results:', {
        totalAppointments: appointments.length,
        finalResults: filteredAppointments.length,
        filtersApplied: {
            startDate: startDateStr,
            endDate: endDateStr,
            startTime: startTimeStr,
            endTime: endTimeStr,
            city: cityStr,
            specialty: specialtyStr,
            experience: experienceStr,
            fees: feesStr,
            docName: docNameStr
        }
    });
    res.status(200).json({
        success: true,
        appointments: filteredAppointments
    });
});
exports.appointment_future = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const currentDate = new Date();
    const patient = await patientmodel_1.default.findOne({ user: id });
    if (!patient) {
        return res.status(404).json({
            success: false,
            message: 'Patient not found'
        });
    }
    const futureAppointments = await appointmentmodel_1.default.find({
        patient: patient._id,
        date: { $gt: currentDate },
        status: "Scheduled"
    })
        .populate({
        path: 'doctor',
        select: 'user specialization',
        populate: {
            path: 'user',
            select: 'name email phoneNumber city state pincode',
        }
    });
    res.status(200).json({
        success: true,
        appointments: futureAppointments
    });
});
exports.create_patient = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { medicalHistory, allergies, currentMedications } = req.body;
    const { id } = req.params;
    const patient = await patientmodel_1.default.findOne({ user: id });
    if (patient) {
        patient.medicalHistory = medicalHistory !== undefined ? medicalHistory : patient.medicalHistory;
        patient.allergies = allergies !== undefined ? allergies : patient.allergies;
        patient.currentMedications = currentMedications !== undefined ? currentMedications : patient.currentMedications;
        await patient.save();
        res.status(200).json({
            success: true,
            message: 'Patient profile updated successfully',
            patient
        });
    }
    const patient2 = await patientmodel_1.default.create({
        user: id,
        medicalHistory,
        allergies,
        currentMedications
    });
    res.status(201).json({
        success: true,
        message: 'Patient profile created successfully',
        patient2
    });
});
exports.change_date_appointment = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
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
    try {
        const patientUser = await usermodel_1.default.findById(id);
        const doctorUser = await usermodel_1.default.findById(appointment.doctor);
        if (patientUser) {
            await (0, notification_controller_1.sendNotification)(id, id, 'appointment_rescheduled', `You have rescheduled your appointment with Dr. ${doctorUser?.name} to ${(0, moment_1.default)(date).format('MMMM Do YYYY')} at ${time}`);
        }
        if (doctorUser) {
            await (0, notification_controller_1.sendNotification)(id, appointment.doctor.toString(), 'appointment_rescheduled', `Appointment rescheduled by ${patientUser?.name} to ${(0, moment_1.default)(date).format('MMMM Do YYYY')} at ${time}`);
        }
    }
    catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
    }
    res.status(200).json({
        success: true,
        message: 'Appointment date and time updated successfully'
    });
});
exports.specific_doctors = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { doc_name, city, state, experience, fees, specialty } = req.query;
    const doctors = await doctormodel_1.default.find()
        .populate({
        path: 'user',
        select: 'name city state email phoneNumber'
    });
    let filteredDoctors = doctors;
    if (city) {
        const lowerCaseCity = city.toLowerCase();
        filteredDoctors = filteredDoctors.filter(doc => doc.user.city.toLowerCase() === lowerCaseCity);
    }
    if (state) {
        const lowerCaseState = state.toLowerCase();
        filteredDoctors = filteredDoctors.filter(doc => doc.user.state.toLowerCase() === lowerCaseState);
    }
    if (specialty) {
        const lowerCaseSpecialty = specialty.toLowerCase();
        filteredDoctors = filteredDoctors.filter(doc => doc.specialization.toLowerCase() === lowerCaseSpecialty);
    }
    if (experience) {
        const expValue = parseInt(experience);
        filteredDoctors = filteredDoctors.filter(doc => doc.experience >= expValue);
    }
    if (fees) {
        const feesValue = parseInt(fees);
        filteredDoctors = filteredDoctors.filter(doc => doc.fees <= feesValue);
    }
    if (doc_name) {
        const lowerCaseDocName = doc_name.toLowerCase();
        filteredDoctors = filteredDoctors.filter(doc => doc.user.name.toLowerCase().includes(lowerCaseDocName));
    }
    res.status(200).json({
        success: true,
        doctors: filteredDoctors
    });
});
exports.update_patient = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const { medicalHistory, allergies, currentMedications } = req.body;
    const patient = await patientmodel_1.default.findOne({ user: id });
    if (!patient) {
        return res.status(404).json({
            success: false,
            message: 'Patient profile not found'
        });
    }
    patient.medicalHistory = medicalHistory !== undefined ? medicalHistory : patient.medicalHistory;
    patient.allergies = allergies !== undefined ? allergies : patient.allergies;
    patient.currentMedications = currentMedications !== undefined ? currentMedications : patient.currentMedications;
    await patient.save();
    try {
        const patientUser = await usermodel_1.default.findById(id);
        if (patientUser) {
            await (0, notification_controller_1.sendNotification)(id, id, 'profile_updated', 'Your patient profile has been updated successfully with new medical information');
        }
    }
    catch (notificationError) {
        console.error('Error sending notification:', notificationError);
    }
    res.status(200).json({
        success: true,
        message: 'Patient profile updated successfully',
        patient
    });
});
exports.appointment_bookings = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { doc_id } = req.query;
    const doctorSchedule = await doctorschedulemodel_1.default.findOne({ doctor: doc_id });
    if (!doctorSchedule) {
        return res.status(404).json({ message: "Doctor schedule not found." });
    }
    const availableSlots = [];
    const now = new Date();
    const endDate = (0, moment_1.default)(now).add(30, 'days').toDate();
    const generateSlots = (startTime, endTime) => {
        let slots = [];
        let currentTime = (0, moment_1.default)(startTime, "HH:mm");
        const end = (0, moment_1.default)(endTime, "HH:mm");
        while (currentTime.isBefore(end)) {
            slots.push(currentTime.format("HH:mm"));
            currentTime.add(10, 'minutes');
        }
        return slots;
    };
    for (let day = (0, moment_1.default)(now); day.isBefore(endDate); day.add(1, 'day')) {
        const dayOfWeek = day.day();
        let daySchedule;
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            daySchedule = doctorSchedule.schedule.sunday || doctorSchedule.schedule.saturday;
        }
        else {
            daySchedule = doctorSchedule.schedule;
        }
        if (!daySchedule) {
            continue;
        }
        const dateSlots = {
            date: day.format('YYYY-MM-DD'),
            slots: []
        };
        if (daySchedule.morning) {
            daySchedule.morning.forEach((morningShift) => {
                const morningSlots = generateSlots(morningShift.startTime, morningShift.endTime);
                dateSlots.slots.push(...morningSlots);
            });
        }
        if (daySchedule.evening) {
            daySchedule.evening.forEach((eveningShift) => {
                const eveningSlots = generateSlots(eveningShift.startTime, eveningShift.endTime);
                dateSlots.slots.push(...eveningSlots);
            });
        }
        availableSlots.push(dateSlots);
    }
    const bookedSlotsMap = new Map();
    doctorSchedule.occupiedSlots.forEach((occupied) => {
        const bookedDate = (0, moment_1.default)(occupied.date).format('YYYY-MM-DD');
        const bookedTimes = occupied.timeSlots.map((slot) => (0, moment_1.default)(slot.timeSlot, ["h:mm A"]).format("HH:mm"));
        if (bookedSlotsMap.has(bookedDate)) {
            bookedSlotsMap.set(bookedDate, [...bookedSlotsMap.get(bookedDate), ...bookedTimes]);
        }
        else {
            bookedSlotsMap.set(bookedDate, bookedTimes);
        }
    });
    availableSlots.forEach(availableDay => {
        const bookedTimesForDate = bookedSlotsMap.get(availableDay.date);
        if (bookedTimesForDate) {
            availableDay.slots = availableDay.slots.filter((slot) => !bookedTimesForDate.includes(slot));
        }
    });
    return res.status(200).json({ availableSlots });
});
//# sourceMappingURL=patientcontroller.js.map