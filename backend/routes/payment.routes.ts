import express from 'express';
import { createPaymentOrder, verifyPaymentSignature, payment, verifypayment } from '../controllers/payment';
import { isauthenticateuser } from '../middleware/auth';

const router = express.Router();

router.route('/payment').post(isauthenticateuser, createPaymentOrder);
router.route('/payment/order').post(isauthenticateuser, createPaymentOrder);
router.route('/payment/verify').post(isauthenticateuser, verifyPaymentSignature);
router.route('/payment/verify/:paymentId').get(isauthenticateuser, verifypayment);

export default router;
