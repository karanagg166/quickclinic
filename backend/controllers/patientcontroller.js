const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const Doctor = require('../models/doctormodel');
const Patient= require('../models/patientmodel');
const { v4: uuidv4 } = require('uuid'); // Import the UUID package
const User = require('../models/usermodel');
const Appointment =require('../models/appointmentmodel');
const DoctorSchedule =require('../models/doctorschedulemodel');
const moment = require("moment");
exports.newappointment = catchAsyncErrors(async (req, res) => {
    const { id } = req.params; // Patient ID
    const { doc_id, date, time, paid } = req.body;

    // Generate a unique appointment number
    const appointmentNumber = uuidv4();

    // Find the patient and doctor
    const patient = await Patient.findOne({ user: id });
    const doctor = await Doctor.findById(doc_id);
    
    // Find the doctor's schedule
    const schedule = await DoctorSchedule.findOne({ doctor: doc_id });

    if (!patient || !doctor || !schedule) {
        return res.status(404).json({ success: false, message: "Doctor, Patient, or Schedule not found" });
    }

    // Check if the appointment already exists
    const existingAppointment = await Appointment.findOne({ date, time, patient: patient._id,status:"Scheduled"});
    if (existingAppointment) {
        return res.status(400).json({ success: false, message: "Appointment already exists" });
    }

    // Check if the requested time is available
    const isAvailable = !schedule.occupiedSlots.some(slot => 
        slot.date.toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0] &&
        slot.timeSlots.some(ts => ts.timeSlot === time)
    );

    if (!isAvailable) {
        return res.status(400).json({ success: false, message: "Selected time slot is not available" });
    }

    // Create a new appointment
    const appointment = await Appointment.create({
        doctor: doc_id,
        patient: patient._id,
        date,
        time,
        fees: doctor.fees, // Fetch fees from doctor's data
        paid,
        appointmentNumber,
        status: "Scheduled"
    });

    // Update DoctorSchedule with new occupied slot
    const dateStr = new Date(date).toISOString().split('T')[0];
    const existingSlot = schedule.occupiedSlots.find(slot => slot.date.toISOString().split('T')[0] === dateStr);

    if (existingSlot) {
        // Update the existing timeSlots for the date
        existingSlot.timeSlots.push({
            timeSlot: time,
            appointmentId: appointment._id
        });
    } else {
        // Add a new slot if no existing slot for the date
        schedule.occupiedSlots.push({
            date: new Date(date),
            timeSlots: [{
                timeSlot: time,
                appointmentId: appointment._id
            }]
        });
    }

    // Save the updated schedule
    await schedule.save();

    res.status(201).json({
        success: true,
        appointment
    });
});
exports.updatepaymentstatus = catchAsyncErrors(async (req, res, next) => {
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
    appointment.paid=true;
    await appointment.save();

    res.status(200).json({
        success: true,
       appointment,
       meesage:"succefully updated payment status"
    });
});
exports.alldoctors = catchAsyncErrors(async (req, res, next) => {
    // Fetch all doctors and populate the user details
    const alldocs = await Doctor.find()
        .populate({
            path: 'user', // Field in Doctor model that references the User model
            select: 'name email phoneNumber city state pincode', // Specify fields you want to include from the User model
        });

    res.status(200).json({
        success: true,
        doctors: alldocs
    });
});

exports.cancelAppointment = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params; // Patient ID from params
    const { appointmentNumber } = req.body; // Appointment number from body
console.log("appointment NUmber",appointmentNumber);
    // Find the appointment
    const appointment = await Appointment.findOne({ appointmentNumber });
    if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Find and update the doctor's schedule
    const schedule = await DoctorSchedule.findOne({ doctor: appointment.doctor });
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
    // Save the updated schedule
    await schedule.save();
 appointment.status="Canceled";
 await appointment.save();
    res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully',
        appointment
    });
});
exports.appointment_of_a_period = catchAsyncErrors(async (req, res, next) => {
    const { startDate, endDate } = req.body;
    const { id } = req.params; // Patient ID

    // Find the patient by ID
    const patient = await Patient.findOne({ user: id });
    if (!patient) {
        return res.status(404).json({
            success: false,
            message: 'Patient not found'
        });
    }

    // Default to very old and very future dates if null
    const now = new Date();
    const hundredYearsAgo = new Date(now.setFullYear(now.getFullYear() - 100));
    const hundredYearsFromNow = new Date(now.setFullYear(now.getFullYear() + 200));

    const effectiveStartDate = startDate ? new Date(startDate) : hundredYearsAgo;
    const effectiveEndDate = endDate ? new Date(endDate) : hundredYearsFromNow;

    // Ensure endDate is after startDate
    if (effectiveEndDate < effectiveStartDate) {
        return res.status(400).json({
            success: false,
            message: 'End date must be after start date'
        });
    }

    // Find appointments for the specified patient and date range
    const allAppointments = await Appointment.find({ patient: patient._id })
        .populate({
            path: 'doctor', // Field in Appointment model that references the Doctor model
            select: 'user', // Include only the user field (or other necessary fields) from the Doctor model
            populate: {
                path: 'user', // Populate the user field in Doctor model
                select: 'name email phoneNumber city state pincode', // Specify fields to include from the User model
            }
        });

    // Filter appointments based on the date range
    const filteredAppointments = allAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate >= effectiveStartDate && appointmentDate <= effectiveEndDate;
    });

    res.status(200).json({
        success: true,
        appointments: filteredAppointments
    });
});
exports.appointment_history_all = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const endDate = new Date(); // Current date and time

    // Find the patient for the specified user
    const patient = await Patient.findOne({ user: id });

    if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Find all appointments for the patient with doctor details populated
    const appointments = await Appointment.find({ patient: patient._id })
        .populate({
            path: 'doctor', // Field in Appointment model that references the Doctor model
            select: 'user', // Include only the user field (or other necessary fields) from the Doctor model
            populate: {
                path: 'user', // Populate the user field in Doctor model
                select: 'name email phoneNumber city state pincode', // Specify fields to include from the User model
            }
        });

    // Filter for past appointments
    const pastAppointments = appointments.filter(app => new Date(app.date) <= endDate);
console.log("hi");
    res.status(200).json({
        success: true,
        appointments: pastAppointments
    });
});
exports.appointment_specific = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { startDate, endDate, startTime, endTime,city,specialty,experience,fees,doc_name } = req.body;

    const patient = await Patient.findOne({ user: id });

    if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const now = new Date();
   
    const hundredYearsAgo = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
    const hundredYearsFromNow = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());

    const effectiveStartDate = startDate ? new Date(startDate) : hundredYearsAgo;
    const effectiveEndDate = endDate ? new Date(endDate) : hundredYearsFromNow;
    const defaultStartTime = startTime || '00:00:00';
    const defaultEndTime = endTime || '23:59:59';

    // Find all appointments for the patient
    const appointments = await Appointment.find({
        patient: patient._id,
        date: { $gte: effectiveStartDate, $lte: effectiveEndDate }
    })
    .populate({
        path: 'doctor', // Populate doctor field
        select: 'specialization experience fees', // Select specific fields from Doctor model
        populate: {
            path: 'user', // Populate User model
            select: 'name city email phoneNumber state' // Select specific fields from User model
        }
    });

    // Filter appointments based on start and end times
    const filteredAppointments = appointments.filter(app => {
        const appointmentDateTime = new Date(app.date);
        const appointmentTime = appointmentDateTime.toTimeString().substring(0, 8);

        return appointmentTime >= defaultStartTime && appointmentTime <= defaultEndTime;
    });
 // Filter appointments based on city
const cityMatches = city ? filteredAppointments.filter(app => app.doctor.user.city.toLowerCase() === city.toLowerCase()) : appointments;

// Filter appointments based on specialty
const specialtyMatches = specialty ? cityMatches.filter(app => app.doctor.specialization.toLowerCase() === specialty.toLowerCase()) : cityMatches;


// Filter appointments based on experience
const experienceMatches = experience ? specialtyMatches.filter(app => app.doctor.experience >= experience) : specialtyMatches;

// Filter appointments based on fees
const feesMatches = fees ? experienceMatches.filter(app => app.doctor.fees <= fees) : experienceMatches;

// Filter appointments based on doctor name
const nameMatches = doc_name ? feesMatches.filter(app => app.doctor.user.name.toLowerCase().includes(doc_name.toLowerCase())) : feesMatches;


    res.status(200).json({
        success: true,
        appointments:nameMatches
    });
});
exports.appointment_future = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const currentDate = new Date(); // Current date and time

    // Find the patient by user ID
    const patient = await Patient.findOne({ user: id });

    if (!patient) {
        return res.status(404).json({
            success: false,
            message: 'Patient not found'
        });
    }

    // Retrieve all future appointments for the patient with doctor details populated
    const futureAppointments = await Appointment.find({
        patient: patient._id,
        date: { $gt: currentDate }, // Only future appointments
        status:"Scheduled"
    })
    .populate({
        path: 'doctor', // Field in Appointment model that references the Doctor model
        select: 'user specialization', // Include only the user field (or other necessary fields) from the Doctor model
        populate: {
            path: 'user', // Populate the user field in Doctor model
            select: 'name email phoneNumber city state pincode', // Specify fields to include from the User model
        }
    });

    res.status(200).json({
        success: true,
        appointments: futureAppointments
    });
});
exports.create_patient = catchAsyncErrors(async (req, res) => {
    const {  medicalHistory, allergies, currentMedications } = req.body;
const {id}=req.params;

    // Check if a patient with this user already exists
    const patient = await Patient.findOne({ user:id });
    if (patient) {
        patient.medicalHistory = medicalHistory !== undefined ? medicalHistory : patient.medicalHistory;
    patient.allergies = allergies !== undefined ? allergies : patient.allergies;
    patient.currentMedications = currentMedications !== undefined ? currentMedications : patient.currentMedications;

    // Save updated patient details
    await patient.save();

    res.status(200).json({
        success: true,
        message: 'Patient profile updated successfully',
        patient
    });
    }

    // Create a new patient profile linked to the user
    const patient2 = await Patient.create({
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
exports.change_date_appointment = catchAsyncErrors(async (req, res) => {
    const { id } = req.params; // Patient ID from params
    const { appointmentNumber, date, time } = req.body;
console.log(appointmentNumber);
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
        existingSlot.timeSlots.push({ timeSlot: newTimeSlot, appointmentId: appointment._id });
    } else {
        schedule.occupiedSlots.push({
            date: newDate,
            timeSlots: [{ timeSlot: newTimeSlot, appointmentId: appointment._id }]
        });
    }

    // Save the updated schedule with the new slot
    await schedule.save();

    res.status(200).json({
        success: true,
        message: 'Appointment date and time updated successfully'
    });
});
exports.specific_doctors = catchAsyncErrors(async (req, res, next) => {
    const { doc_name, city, state, experience, fees, specialty } = req.body;

    // Fetch all doctors and populate user to get name, city, and state
    const doctors = await Doctor.find()
        .populate({
            path: 'user',
            select: 'name city state email phoneNumber'
        });

    // Filter by exact matches
    let filteredDoctors = doctors;

    if (city) {
        const lowerCaseCity = city.toLowerCase();
        filteredDoctors = filteredDoctors.filter(doc => 
            doc.user.city.toLowerCase() === lowerCaseCity
        );
    }

    if (state) {
        const lowerCaseState = state.toLowerCase();
        filteredDoctors = filteredDoctors.filter(doc => 
            doc.user.state.toLowerCase() === lowerCaseState
        );
    }

    if (specialty) {
        const lowerCaseSpecialty = specialty.toLowerCase();
        filteredDoctors = filteredDoctors.filter(doc => 
            doc.specialization.toLowerCase() === lowerCaseSpecialty
        );
    }

    // Apply other filters if provided
    if (experience) {
        filteredDoctors = filteredDoctors.filter(doc => 
            doc.experience >= experience
        );
    }

    if (fees) {
        filteredDoctors = filteredDoctors.filter(doc => 
            doc.fees <= fees
        );
    }

    if (doc_name) {
        const lowerCaseDocName = doc_name.toLowerCase();
        filteredDoctors = filteredDoctors.filter(doc => 
            doc.user.name.toLowerCase().includes(lowerCaseDocName)
        );
    }

    res.status(200).json({
        success: true,
        doctors: filteredDoctors
    });
});
exports.update_patient = catchAsyncErrors(async (req, res) => {
    const { id } = req.params; // Patient ID from params
    const { medicalHistory, allergies, currentMedications } = req.body; // Updated details

    // Find the patient by user ID
    const patient = await Patient.findOne({ user: id });
    
    if (!patient) {
        return res.status(404).json({
            success: false,
            message: 'Patient profile not found'
        });
    }

    // Update patient details
    patient.medicalHistory = medicalHistory !== undefined ? medicalHistory : patient.medicalHistory;
    patient.allergies = allergies !== undefined ? allergies : patient.allergies;
    patient.currentMedications = currentMedications !== undefined ? currentMedications : patient.currentMedications;

    // Save updated patient details
    await patient.save();

    res.status(200).json({
        success: true,
        message: 'Patient profile updated successfully',
        patient
    });
});

exports.appointment_bookings = catchAsyncErrors(async (req, res) => {
    const { doc_id } = req.query;
console.log(doc_id);
    // Get doctor schedule
    const doctorSchedule = await DoctorSchedule.findOne({ doctor: doc_id });

    if (!doctorSchedule) {
        return res.status(404).json({ message: "Doctor schedule not found." });
    }

    const availableSlots = [];
    const now = new Date();
    const endDate = moment(now).add(30, 'days').toDate();

    // Helper function to generate time slots
    const generateSlots = (startTime, endTime) => {
        let slots = [];
        let currentTime = moment(startTime, "HH:mm");
        const end = moment(endTime, "HH:mm");

        while (currentTime.isBefore(end)) {
            slots.push(currentTime.format("HH:mm"));
            currentTime.add(10, 'minutes');
        }
        return slots;
    };

    // Generate all available slots for the next 30 days
    for (let day = moment(now); day.isBefore(endDate); day.add(1, 'day')) {
        const dayOfWeek = day.day(); // Get the day of the week (0 = Sunday, 6 = Saturday)

        let daySchedule;
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Custom schedules for Sunday and Saturday
            daySchedule = doctorSchedule.schedule.sunday || doctorSchedule.schedule.saturday;
        } else {
            daySchedule = doctorSchedule.schedule;
        }

        if (!daySchedule) {
            continue; // Skip if no schedule is found for this day
        }

        const dateSlots = {
            date: day.format('YYYY-MM-DD'),
            slots: []
        };

        // Generate morning slots if available
        if (daySchedule.morning) {
            daySchedule.morning.forEach(morningShift => {
                const morningSlots = generateSlots(morningShift.startTime, morningShift.endTime);
                dateSlots.slots.push(...morningSlots);
            });
        }

        // Generate evening slots if available
        if (daySchedule.evening) {
            daySchedule.evening.forEach(eveningShift => {
                const eveningSlots = generateSlots(eveningShift.startTime, eveningShift.endTime);
                dateSlots.slots.push(...eveningSlots);
            });
        }

        // Add the available slots for this date to the final result
        availableSlots.push(dateSlots);
    }

    // Create a map to hold booked slots by date
    const bookedSlotsMap = new Map();

    // Iterate over the occupied slots and add them to the map, converting time to 24-hour format
    doctorSchedule.occupiedSlots.forEach(occupied => {
        const bookedDate = moment(occupied.date).format('YYYY-MM-DD');
        const bookedTimes = occupied.timeSlots.map(slot => moment(slot.timeSlot, ["h:mm A"]).format("HH:mm")); // Convert to 24-hour format

        // If the date already exists in the map, append new time slots
        if (bookedSlotsMap.has(bookedDate)) {
            bookedSlotsMap.set(bookedDate, [...bookedSlotsMap.get(bookedDate), ...bookedTimes]);
        } else {
            // Otherwise, create a new entry in the map
            bookedSlotsMap.set(bookedDate, bookedTimes);
        }
    });

    // Now remove the booked slots from the available slots
    availableSlots.forEach(availableDay => {
        const bookedTimesForDate = bookedSlotsMap.get(availableDay.date); // Get the booked times for this date

        if (bookedTimesForDate) {
            // Remove the booked time slots from the available slots
            availableDay.slots = availableDay.slots.filter(slot => !bookedTimesForDate.includes(slot));
        }
    });

    // Return the final available slots after removing the booked ones
    return res.status(200).json({ availableSlots });
});

