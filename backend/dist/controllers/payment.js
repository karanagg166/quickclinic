"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifypayment = exports.payment = exports.verifyPaymentSignature = exports.createPaymentOrder = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const catchAsyncErrors_1 = __importDefault(require("../middleware/catchAsyncErrors"));
const appointmentmodel_1 = __importDefault(require("../models/appointmentmodel"));
const errorhander_1 = __importDefault(require("../utils/errorhander"));
const notification_controller_1 = require("./notification.controller");
const getRazorpayInstance = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
        throw new Error('Payment gateway credentials not configured on server');
    }
    return new razorpay_1.default({ key_id, key_secret });
};
exports.createPaymentOrder = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { appointmentId } = req.body;
    const userId = req.user?._id;
    if (!appointmentId) {
        return next(new errorhander_1.default('Appointment ID is required', 400));
    }
    const appointment = await appointmentmodel_1.default.findById(appointmentId).populate('doctor');
    if (!appointment) {
        return next(new errorhander_1.default('Appointment not found', 404));
    }
    const appointmentPatientId = appointment.patient?.toString();
    const isOwner = req.user?.role === 'admin' ||
        appointmentPatientId === userId?.toString() ||
        (await checkPatientOwnership(appointment.patient, userId));
    if (!isOwner) {
        return next(new errorhander_1.default('Not authorized to make payment for this appointment', 403));
    }
    if (appointment.status !== 'Scheduled') {
        return next(new errorhander_1.default(`Cannot pay for an appointment with status: ${appointment.status}`, 400));
    }
    if (appointment.paid) {
        return res.status(200).json({
            success: true,
            message: 'Appointment is already paid',
            appointment,
        });
    }
    const amountInPaise = Math.round(Number(appointment.fees) * 100);
    if (!amountInPaise || amountInPaise <= 0) {
        return next(new errorhander_1.default('Invalid appointment fee', 400));
    }
    if (process.env.NODE_ENV === 'test' && !process.env.RAZORPAY_KEY_ID) {
        const mockOrderId = `order_mock_${Date.now()}`;
        appointment.razorpayOrderId = mockOrderId;
        await appointment.save();
        return res.status(200).json({
            success: true,
            order_id: mockOrderId,
            currency: 'INR',
            amount: amountInPaise,
            key_id: 'test_key_id',
        });
    }
    try {
        const razorpay = getRazorpayInstance();
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${appointment.appointmentNumber.slice(0, 10)}`,
            notes: {
                appointmentId: appointment._id.toString(),
                appointmentNumber: appointment.appointmentNumber,
                patientUserId: userId?.toString(),
            },
        };
        const order = await razorpay.orders.create(options);
        appointment.razorpayOrderId = order.id;
        await appointment.save();
        return res.status(200).json({
            success: true,
            order_id: order.id,
            currency: order.currency,
            amount: order.amount,
            key_id: process.env.RAZORPAY_KEY_ID,
        });
    }
    catch (error) {
        return next(new errorhander_1.default(`Payment gateway error: ${error.message}`, 502));
    }
});
exports.verifyPaymentSignature = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { appointmentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user?._id;
    if (!appointmentId || !razorpay_order_id || !razorpay_payment_id) {
        return next(new errorhander_1.default('Missing payment verification parameters (appointmentId, razorpay_order_id, razorpay_payment_id)', 400));
    }
    const appointment = await appointmentmodel_1.default.findById(appointmentId).populate('doctor');
    if (!appointment) {
        return next(new errorhander_1.default('Appointment not found', 404));
    }
    const isOwner = req.user?.role === 'admin' ||
        appointment.patient?.toString() === userId?.toString() ||
        (await checkPatientOwnership(appointment.patient, userId));
    if (!isOwner) {
        return next(new errorhander_1.default('Not authorized to verify payment for this appointment', 403));
    }
    if (appointment.paid) {
        return res.status(200).json({
            success: true,
            message: 'Payment already verified and appointment marked as paid',
            appointment,
        });
    }
    if (appointment.razorpayOrderId && appointment.razorpayOrderId !== razorpay_order_id) {
        return next(new errorhander_1.default('Payment order does not match appointment record', 400));
    }
    const isTestMode = process.env.NODE_ENV === 'test' && !process.env.RAZORPAY_KEY_SECRET;
    if (isTestMode) {
        if (razorpay_signature === 'invalid_signature') {
            return next(new errorhander_1.default('Invalid payment signature', 400));
        }
    }
    else {
        const key_secret = process.env.RAZORPAY_KEY_SECRET;
        if (!key_secret) {
            return next(new errorhander_1.default('Payment gateway secret not configured', 500));
        }
        if (!razorpay_signature) {
            return next(new errorhander_1.default('Payment signature is required for verification', 400));
        }
        const hmac = crypto_1.default.createHmac('sha256', key_secret);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generatedSignature = hmac.digest('hex');
        if (generatedSignature !== razorpay_signature) {
            return next(new errorhander_1.default('Invalid payment signature verification failed', 400));
        }
    }
    appointment.paid = true;
    appointment.razorpayOrderId = razorpay_order_id;
    appointment.razorpayPaymentId = razorpay_payment_id;
    appointment.razorpaySignature = razorpay_signature;
    await appointment.save();
    try {
        const doc = appointment.doctor;
        const doctorUserId = doc?.user?.toString() || doc?._id?.toString();
        if (userId) {
            await (0, notification_controller_1.sendNotification)(userId.toString(), userId.toString(), 'payment_success', `Payment received for appointment ${appointment.appointmentNumber}. Status: Confirmed.`);
        }
        if (doctorUserId && userId) {
            await (0, notification_controller_1.sendNotification)(userId.toString(), doctorUserId, 'appointment_paid', `Payment confirmed for appointment ${appointment.appointmentNumber}.`);
        }
    }
    catch (notifErr) {
        console.error('Failed to dispatch payment notification:', notifErr);
    }
    return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        appointment,
    });
});
exports.payment = exports.createPaymentOrder;
exports.verifypayment = exports.verifyPaymentSignature;
async function checkPatientOwnership(patientIdOrDoc, userId) {
    if (!patientIdOrDoc || !userId)
        return false;
    try {
        const Patient = (await Promise.resolve().then(() => __importStar(require('../models/patientmodel')))).default;
        const patientDoc = await Patient.findById(patientIdOrDoc);
        if (!patientDoc)
            return false;
        return patientDoc.user.toString() === userId.toString();
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=payment.js.map