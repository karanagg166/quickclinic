"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payment_1 = require("../controllers/payment");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.route('/payment').post(auth_1.isauthenticateuser, payment_1.createPaymentOrder);
router.route('/payment/order').post(auth_1.isauthenticateuser, payment_1.createPaymentOrder);
router.route('/payment/verify').post(auth_1.isauthenticateuser, payment_1.verifyPaymentSignature);
router.route('/payment/verify/:paymentId').get(auth_1.isauthenticateuser, payment_1.verifypayment);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map