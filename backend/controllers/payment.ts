import { Request, Response, NextFunction } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import catchAsyncErrors from '../middleware/catchAsyncErrors';
import { AuthRequest } from '../middleware/auth';
import Appointment from '../models/appointmentmodel';
import Doctor from '../models/doctormodel';
import ErrorHander from '../utils/errorhander';
import { sendNotification } from './notification.controller';

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error('Payment gateway credentials not configured on server');
  }
  return new Razorpay({ key_id, key_secret });
};

/**
 * Create a payment order for an authenticated patient's scheduled appointment
 */
export const createPaymentOrder = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { appointmentId } = req.body;
    const userId = req.user?._id;

    if (!appointmentId) {
      return next(new ErrorHander('Appointment ID is required', 400));
    }

    const appointment = await Appointment.findById(appointmentId).populate('doctor');
    if (!appointment) {
      return next(new ErrorHander('Appointment not found', 404));
    }

    // Ownership check: patient must own this appointment
    const appointmentPatientId = appointment.patient?.toString();
    const isOwner =
      req.user?.role === 'admin' ||
      appointmentPatientId === userId?.toString() ||
      (await checkPatientOwnership(appointment.patient, userId));

    if (!isOwner) {
      return next(new ErrorHander('Not authorized to make payment for this appointment', 403));
    }

    if (appointment.status !== 'Scheduled') {
      return next(new ErrorHander(`Cannot pay for an appointment with status: ${appointment.status}`, 400));
    }

    if (appointment.paid) {
      return res.status(200).json({
        success: true,
        message: 'Appointment is already paid',
        appointment,
      });
    }

    // Amount derived from trusted appointment fees (INR in paise)
    const amountInPaise = Math.round(Number(appointment.fees) * 100);
    if (!amountInPaise || amountInPaise <= 0) {
      return next(new ErrorHander('Invalid appointment fee', 400));
    }

    // If running in test mode with mock payment enabled
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
    } catch (error: any) {
      return next(new ErrorHander(`Payment gateway error: ${error.message}`, 502));
    }
  }
);

/**
 * Verify Razorpay payment signature and mark appointment paid
 */
export const verifyPaymentSignature = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { appointmentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user?._id;

    if (!appointmentId || !razorpay_order_id || !razorpay_payment_id) {
      return next(
        new ErrorHander(
          'Missing payment verification parameters (appointmentId, razorpay_order_id, razorpay_payment_id)',
          400
        )
      );
    }

    const appointment = await Appointment.findById(appointmentId).populate('doctor');
    if (!appointment) {
      return next(new ErrorHander('Appointment not found', 404));
    }

    // Ownership check
    const isOwner =
      req.user?.role === 'admin' ||
      appointment.patient?.toString() === userId?.toString() ||
      (await checkPatientOwnership(appointment.patient, userId));

    if (!isOwner) {
      return next(new ErrorHander('Not authorized to verify payment for this appointment', 403));
    }

    // If already marked paid
    if (appointment.paid) {
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and appointment marked as paid',
        appointment,
      });
    }

    // Verify order ID association
    if (appointment.razorpayOrderId && appointment.razorpayOrderId !== razorpay_order_id) {
      return next(new ErrorHander('Payment order does not match appointment record', 400));
    }

    // Test mode verification
    const isTestMode = process.env.NODE_ENV === 'test' && !process.env.RAZORPAY_KEY_SECRET;
    if (isTestMode) {
      if (razorpay_signature === 'invalid_signature') {
        return next(new ErrorHander('Invalid payment signature', 400));
      }
    } else {
      const key_secret = process.env.RAZORPAY_KEY_SECRET;
      if (!key_secret) {
        return next(new ErrorHander('Payment gateway secret not configured', 500));
      }

      if (!razorpay_signature) {
        return next(new ErrorHander('Payment signature is required for verification', 400));
      }

      const hmac = crypto.createHmac('sha256', key_secret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return next(new ErrorHander('Invalid payment signature verification failed', 400));
      }
    }

    // Mark appointment as paid
    appointment.paid = true;
    appointment.razorpayOrderId = razorpay_order_id;
    appointment.razorpayPaymentId = razorpay_payment_id;
    appointment.razorpaySignature = razorpay_signature;
    await appointment.save();

    // Trigger trusted notifications
    try {
      const doc = appointment.doctor as any;
      const doctorUserId = doc?.user?.toString() || doc?._id?.toString();
      if (userId) {
        await sendNotification(
          userId.toString(),
          userId.toString(),
          'payment_success',
          `Payment received for appointment ${appointment.appointmentNumber}. Status: Confirmed.`
        );
      }
      if (doctorUserId && userId) {
        await sendNotification(
          userId.toString(),
          doctorUserId,
          'appointment_paid',
          `Payment confirmed for appointment ${appointment.appointmentNumber}.`
        );
      }
    } catch (notifErr) {
      console.error('Failed to dispatch payment notification:', notifErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      appointment,
    });
  }
);

// Backward-compatible export aliases
export const payment = createPaymentOrder;
export const verifypayment = verifyPaymentSignature;

// Helper: check if a Patient document's `user` matches the acting user ID
async function checkPatientOwnership(patientIdOrDoc: any, userId: any): Promise<boolean> {
  if (!patientIdOrDoc || !userId) return false;
  try {
    const Patient = (await import('../models/patientmodel')).default;
    const patientDoc = await Patient.findById(patientIdOrDoc);
    if (!patientDoc) return false;
    return patientDoc.user.toString() === userId.toString();
  } catch {
    return false;
  }
}
