"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const doctorcontroller_1 = require("../controllers/doctorcontroller");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.route("/:id/doctor/info").get(doctorcontroller_1.getdoctorinfo);
router.route("/:id/doctor/me").get(auth_1.isauthenticateuser, doctorcontroller_1.getdoctorinfo);
router.route("/:id/doctor/create_doctor").post(auth_1.isauthenticateuser, (0, auth_1.authorizeroles)("doctor", "admin"), doctorcontroller_1.createDoctor);
router.route("/:id/doctor/update_schedule").post(auth_1.isauthenticateuser, (0, auth_1.authorizeroles)("doctor", "admin"), doctorcontroller_1.updateSchedule);
router.route("/:id/doctor/update_doctor").post(auth_1.isauthenticateuser, (0, auth_1.authorizeroles)("doctor", "admin"), doctorcontroller_1.updateDoctor);
router.route("/:id/doctor/cancel_appointment").put(auth_1.isauthenticateuser, (0, auth_1.authorizeroles)("doctor", "admin"), doctorcontroller_1.cancel_appointment);
router.route("/:id/doctor/specific_appointment").put(auth_1.isauthenticateuser, (0, auth_1.authorizeroles)("doctor", "admin"), doctorcontroller_1.appointment_specific);
router.route("/:id/doctor/change_date").put(auth_1.isauthenticateuser, (0, auth_1.authorizeroles)("doctor", "admin"), doctorcontroller_1.change_date_appointment);
router.route("/:id/doctor/leave").post(auth_1.isauthenticateuser, (0, auth_1.authorizeroles)("doctor", "admin"), doctorcontroller_1.applyForLeave);
router.route("/:id/doctor/earnings").get(auth_1.isauthenticateuser, (0, auth_1.authorizeroles)("doctor", "admin"), doctorcontroller_1.earnings);
router.route("/:id/doctor/reports").get(auth_1.isauthenticateuser, (0, auth_1.authorizeroles)("doctor", "admin"), doctorcontroller_1.getdoctorreports);
router.route("/:id/doctor/today_schedule").get(auth_1.isauthenticateuser, (0, auth_1.authorizeroles)("doctor", "admin"), doctorcontroller_1.getTodaySchedule);
router.route("/:id/doctor/schedule").get(auth_1.isauthenticateuser, (0, auth_1.authorizeroles)("doctor", "admin"), doctorcontroller_1.schedule_of_day);
router.route("/:id/doctor/getpatients").post(auth_1.isauthenticateuser, (0, auth_1.authorizeroles)("doctor", "admin"), doctorcontroller_1.getpatients);
exports.default = router;
//# sourceMappingURL=doctor.routes.js.map