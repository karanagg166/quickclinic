import express from 'express';
import {
  createDoctor,
  updateDoctor,
  cancel_appointment,
  appointment_specific,
  change_date_appointment,
  applyForLeave,
  earnings,
  getdoctorinfo,
  updateSchedule,
  schedule_of_day,
  getTodaySchedule,
  getpatients,
  getdoctorreports,
} from '../controllers/doctorcontroller';
import { isauthenticateuser, authorizeroles } from '../middleware/auth';

const router = express.Router();

// Public doctor profile info
router.route("/:id/doctor/info").get(getdoctorinfo);
router.route("/:id/doctor/me").get(isauthenticateuser, getdoctorinfo);

// Doctor management and private schedule operations
router.route("/:id/doctor/create_doctor").post(isauthenticateuser, authorizeroles("doctor", "admin"), createDoctor);
router.route("/:id/doctor/update_schedule").post(isauthenticateuser, authorizeroles("doctor", "admin"), updateSchedule);
router.route("/:id/doctor/update_doctor").post(isauthenticateuser, authorizeroles("doctor", "admin"), updateDoctor);
router.route("/:id/doctor/cancel_appointment").put(isauthenticateuser, authorizeroles("doctor", "admin"), cancel_appointment);
router.route("/:id/doctor/specific_appointment").put(isauthenticateuser, authorizeroles("doctor", "admin"), appointment_specific);
router.route("/:id/doctor/change_date").put(isauthenticateuser, authorizeroles("doctor", "admin"), change_date_appointment);
router.route("/:id/doctor/leave").post(isauthenticateuser, authorizeroles("doctor", "admin"), applyForLeave);
router.route("/:id/doctor/earnings").get(isauthenticateuser, authorizeroles("doctor", "admin"), earnings);
router.route("/:id/doctor/reports").get(isauthenticateuser, authorizeroles("doctor", "admin"), getdoctorreports);
router.route("/:id/doctor/today_schedule").get(isauthenticateuser, authorizeroles("doctor", "admin"), getTodaySchedule);
router.route("/:id/doctor/schedule").get(isauthenticateuser, authorizeroles("doctor", "admin"), schedule_of_day);
router.route("/:id/doctor/getpatients").post(isauthenticateuser, authorizeroles("doctor", "admin"), getpatients);

export default router;
