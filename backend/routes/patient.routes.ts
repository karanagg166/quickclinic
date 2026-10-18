import express from 'express';
import {
  newappointment,
  updatepaymentstatus,
  alldoctors,
  cancelAppointment,
  appointment_of_a_period,
  appointment_history_all,
  appointment_specific,
  appointment_future,
  create_patient,
  change_date_appointment,
  specific_doctors,
  update_patient,
  appointment_bookings,
  markPastAppointmentsAsCompleted,
  get_patient_info,
  get_patient_dashboard_stats,
} from '../controllers/patientcontroller';
import { isauthenticateuser, authorizeroles } from '../middleware/auth';

const router = express.Router();

// Public doctor discovery and schedule availability
router.route("/patient/all_doctors").get(alldoctors);
router.route("/:id/patient/all_doctors").get(alldoctors);
router.route("/patient/specific_doctors").get(specific_doctors);
router.route("/:id/patient/specific_doctors").get(specific_doctors);
router.route("/patient/appointment_bookings").get(appointment_bookings);
router.route("/:id/patient/appointment_bookings").get(appointment_bookings);

// Authenticated patient routes
router.route("/:id/patient/newappointment").post(isauthenticateuser, authorizeroles("patient", "admin"), newappointment);
router.route("/patient/newappointment").post(isauthenticateuser, authorizeroles("patient", "admin"), newappointment);

router.route("/:id/patient/create_patient").post(isauthenticateuser, create_patient);
router.route("/:id/patient/info").get(isauthenticateuser, get_patient_info);
router.route("/:id/patient/dashboard_stats").get(isauthenticateuser, get_patient_dashboard_stats);
router.route("/:id/patient/update_payment_status").put(isauthenticateuser, authorizeroles("admin"), updatepaymentstatus);
router.route("/:id/patient/cancel_appointment").put(isauthenticateuser, cancelAppointment);
router.route("/:id/patient/appointment_of_a_period").get(isauthenticateuser, appointment_of_a_period);
router.route("/:id/patient/change_date").put(isauthenticateuser, change_date_appointment);
router.route("/:id/patient/usual_history").get(isauthenticateuser, appointment_history_all);
router.route("/:id/patient/specific_appointment").get(isauthenticateuser, appointment_specific);
router.route("/:id/patient/appointment_future").get(isauthenticateuser, appointment_future);
router.route("/:id/patient/update_patient").put(isauthenticateuser, update_patient);
router.route("/patient/mark-past-appointments-completed").put(isauthenticateuser, markPastAppointmentsAsCompleted);

export default router;
