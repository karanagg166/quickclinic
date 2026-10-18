import request from 'supertest';
import moment from 'moment';
import { createApp } from '../backend/app';
import Appointment from '../backend/models/appointmentmodel';
import {
  connectTestDb,
  clearTestDb,
  closeTestDb,
  createTestPatient,
  createTestDoctor,
} from './helpers/setup';

describe('Payment Security, Order Binding, & Signature Verification', () => {
  const app = createApp();

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  test('Non-owner cannot create payment order for another patient appointment', async () => {
    const { patient: patient1 } = await createTestPatient();
    const { token: patient2Token } = await createTestPatient();
    const { doctor } = await createTestDoctor();

    const appointment = await Appointment.create({
      doctor: doctor._id,
      patient: patient1._id,
      date: moment().add(3, 'days').toDate(),
      time: '10:00',
      fees: 600,
      paid: false,
      appointmentNumber: 'APT-TEST-001',
      status: 'Scheduled',
    });

    const res = await request(app)
      .post('/api/v1/payment/order')
      .set('Authorization', `Bearer ${patient2Token}`)
      .send({ appointmentId: appointment._id.toString() });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  test('Authenticated owner creates payment order with server-derived fees', async () => {
    const { user: patientUser, patient: patient1, token: patientToken } = await createTestPatient();
    const { doctor } = await createTestDoctor({ fees: 750 });

    const appointment = await Appointment.create({
      doctor: doctor._id,
      patient: patient1._id,
      date: moment().add(3, 'days').toDate(),
      time: '10:00',
      fees: 750,
      paid: false,
      appointmentNumber: 'APT-TEST-002',
      status: 'Scheduled',
    });

    const res = await request(app)
      .post('/api/v1/payment/order')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ appointmentId: appointment._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order_id).toBeDefined();
    // 750 INR = 75000 paise
    expect(res.body.amount).toBe(75000);
    expect(res.body.currency).toBe('INR');

    // Verify appointment was updated with order ID
    const updatedApp = await Appointment.findById(appointment._id);
    expect(updatedApp!.razorpayOrderId).toBe(res.body.order_id);
  });

  test('Rejects signature verification with mismatched order ID', async () => {
    const { patient: patient1, token: patientToken } = await createTestPatient();
    const { doctor } = await createTestDoctor();

    const appointment = await Appointment.create({
      doctor: doctor._id,
      patient: patient1._id,
      date: moment().add(3, 'days').toDate(),
      time: '10:00',
      fees: 500,
      paid: false,
      appointmentNumber: 'APT-TEST-003',
      status: 'Scheduled',
      razorpayOrderId: 'order_expected_123',
    });

    const res = await request(app)
      .post('/api/v1/payment/verify')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        appointmentId: appointment._id.toString(),
        razorpay_order_id: 'order_mismatched_999',
        razorpay_payment_id: 'pay_test_123',
        razorpay_signature: 'sig_test_123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/does not match/i);
  });

  test('Rejects signature verification if signature is invalid', async () => {
    const { patient: patient1, token: patientToken } = await createTestPatient();
    const { doctor } = await createTestDoctor();

    const appointment = await Appointment.create({
      doctor: doctor._id,
      patient: patient1._id,
      date: moment().add(3, 'days').toDate(),
      time: '10:00',
      fees: 500,
      paid: false,
      appointmentNumber: 'APT-TEST-004',
      status: 'Scheduled',
      razorpayOrderId: 'order_test_123',
    });

    const res = await request(app)
      .post('/api/v1/payment/verify')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        appointmentId: appointment._id.toString(),
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_123',
        razorpay_signature: 'invalid_signature',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid payment signature/i);
  });

  test('Valid signature marks appointment as paid and subsequent call is idempotent', async () => {
    const { patient: patient1, token: patientToken } = await createTestPatient();
    const { doctor } = await createTestDoctor();

    const appointment = await Appointment.create({
      doctor: doctor._id,
      patient: patient1._id,
      date: moment().add(3, 'days').toDate(),
      time: '10:00',
      fees: 500,
      paid: false,
      appointmentNumber: 'APT-TEST-005',
      status: 'Scheduled',
      razorpayOrderId: 'order_valid_123',
    });

    // First verification
    const res1 = await request(app)
      .post('/api/v1/payment/verify')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        appointmentId: appointment._id.toString(),
        razorpay_order_id: 'order_valid_123',
        razorpay_payment_id: 'pay_valid_123',
        razorpay_signature: 'valid_test_signature',
      });

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);

    const verifiedApp = await Appointment.findById(appointment._id);
    expect(verifiedApp!.paid).toBe(true);
    expect(verifiedApp!.razorpayPaymentId).toBe('pay_valid_123');

    // Second verification (idempotent)
    const res2 = await request(app)
      .post('/api/v1/payment/verify')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        appointmentId: appointment._id.toString(),
        razorpay_order_id: 'order_valid_123',
        razorpay_payment_id: 'pay_valid_123',
        razorpay_signature: 'valid_test_signature',
      });

    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);
    expect(res2.body.message).toMatch(/already verified/i);
  });
});
