"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const patientcontroller_1 = require("../controllers/patientcontroller");
const router = express_1.default.Router();
router.route("/:id/patient/newappointment").post(patientcontroller_1.newappointment);
router.route("/:id/patient/create_patient").post(patientcontroller_1.create_patient);
router.route("/:id/patient/update_payment_status").put(patientcontroller_1.updatepaymentstatus);
router.route("/:id/patient/all_doctors").get(patientcontroller_1.alldoctors);
router.route("/:id/patient/cancel_appointment").put(patientcontroller_1.cancelAppointment);
router.route("/:id/patient/appointment_of_a_period").get(patientcontroller_1.appointment_of_a_period);
router.route("/:id/patient/change_date").put(patientcontroller_1.change_date_appointment);
router.route("/:id/patient/usual_history").get(patientcontroller_1.appointment_history_all);
router.route("/:id/patient/specific_appointment").get(patientcontroller_1.appointment_specific);
router.route("/:id/patient/appointment_future").get(patientcontroller_1.appointment_future);
router.route("/:id/patient/specific_doctors").get(patientcontroller_1.specific_doctors);
router.route("/:id/patient/update_patient").put(patientcontroller_1.update_patient);
router.route("/:id/patient/appointment_bookings").get(patientcontroller_1.appointment_bookings);
router.route("/patient/mark-past-appointments-completed").put(patientcontroller_1.markPastAppointmentsAsCompleted);
exports.default = router;
//# sourceMappingURL=patient.routes.js.map