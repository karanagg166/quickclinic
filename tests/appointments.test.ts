import request from 'supertest';
import moment from 'moment';
import { createApp } from '../backend/app';
import Appointment from '../backend/models/appointmentmodel';
import DoctorSchedule from '../backend/models/doctorschedulemodel';
import Leave from '../backend/models/leavemodel';
import {
  connectTestDb,
  clearTestDb,
  closeTestDb,
  createTestPatient,
  createTestDoctor,
} from './helpers/setup';

describe('Appointment Scheduling, Leaves, Rescheduling, & Cancellation', () => {
  const app = createApp();

  beforeAll(async () => {
    await connectTestDb();
    await Appointment.init();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  test('Rejects booking an appointment in the past', async () => {
    const { user: patientUser, token: patientToken } = await createTestPatient();
    const { doctor } = await createTestDoctor();

    // Create schedule for past date
    const pastDate = moment().subtract(2, 'days').format('YYYY-MM-DD');

    const res = await request(app)
      .post(`/api/v1/${patientUser._id}/patient/newappointment`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        date: pastDate,
        time: '10:00',
        doc_id: doctor._id.toString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot book an appointment in the past/i);
  });

  test('Blocks booking if doctor has approved leave on requested date', async () => {
    const { user: patientUser, token: patientToken } = await createTestPatient();
    const { doctor } = await createTestDoctor();

    const futureDate = moment().add(5, 'days').format('YYYY-MM-DD');

    // Create doctor leave covering futureDate
    await Leave.create({
      doctor: doctor._id,
      startDate: moment().add(4, 'days').toDate(),
      endDate: moment().add(6, 'days').toDate(),
      reason: 'Medical Conference',
    });

    // Also configure doctor's working schedule
    await DoctorSchedule.create({
      doctor: doctor._id,
      schedule: {
        morning: [{ startTime: '09:00', endTime: '12:00' }],
        evening: [],
      },
      occupiedSlots: [],
    });

    const res = await request(app)
      .post(`/api/v1/${patientUser._id}/patient/newappointment`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        date: futureDate,
        time: '10:00',
        doc_id: doctor._id.toString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/doctor is on leave/i);
  });

  test('Successfully books available slot and prevents concurrent double-booking of same slot', async () => {
    const { user: patient1, token: token1 } = await createTestPatient();
    const { user: patient2, token: token2 } = await createTestPatient();
    const { doctor } = await createTestDoctor();

    const futureDate = moment().add(3, 'days').format('YYYY-MM-DD');

    // Configure schedule
    await DoctorSchedule.create({
      doctor: doctor._id,
      schedule: {
        morning: [{ startTime: '09:00', endTime: '12:00' }],
        evening: [],
      },
      occupiedSlots: [],
    });

    // Patient 1 books 10:00
    const res1 = await request(app)
      .post(`/api/v1/${patient1._id}/patient/newappointment`)
      .set('Authorization', `Bearer ${token1}`)
      .send({
        date: futureDate,
        time: '10:00',
        doc_id: doctor._id.toString(),
      });

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);
    expect(res1.body.appointment).toBeDefined();
    expect(res1.body.appointment.paid).toBe(false);
    expect(res1.body.appointment.fees).toBe(doctor.fees);

    // Patient 2 attempts to book the same doctor at the same date and time
    const res2 = await request(app)
      .post(`/api/v1/${patient2._id}/patient/newappointment`)
      .set('Authorization', `Bearer ${token2}`)
      .send({
        date: futureDate,
        time: '10:00',
        doc_id: doctor._id.toString(),
      });

    expect(res2.status).toBe(400);
    expect(res2.body.success).toBe(false);
    expect(res2.body.message).toMatch(/already booked/i);
  });

  test('Safely rolls back and keeps original slot if target rescheduling slot is occupied', async () => {
    const { user: patient1, token: token1 } = await createTestPatient();
    const { user: patient2, token: token2 } = await createTestPatient();
    const { doctor } = await createTestDoctor();

    const futureDate = moment().add(4, 'days').format('YYYY-MM-DD');

    await DoctorSchedule.create({
      doctor: doctor._id,
      schedule: {
        morning: [{ startTime: '09:00', endTime: '12:00' }],
        evening: [],
      },
      occupiedSlots: [],
    });

    // Patient 1 books 09:30
    const book1 = await request(app)
      .post(`/api/v1/${patient1._id}/patient/newappointment`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ date: futureDate, time: '09:30', doc_id: doctor._id.toString() });
    const appointment1Id = book1.body.appointment._id;

    // Patient 2 books 10:30
    await request(app)
      .post(`/api/v1/${patient2._id}/patient/newappointment`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ date: futureDate, time: '10:30', doc_id: doctor._id.toString() });

    // Patient 1 tries to reschedule to 10:30 (already occupied by Patient 2)
    const resReschedule = await request(app)
      .put(`/api/v1/${patient1._id}/patient/change_date`)
      .set('Authorization', `Bearer ${token1}`)
      .send({
        appointmentId: appointment1Id,
        date: futureDate,
        time: '10:30',
      });

    expect(resReschedule.status).toBe(400);
    expect(resReschedule.body.success).toBe(false);
    expect(resReschedule.body.message).toMatch(/already (booked|occupied)/i);

    // Verify Patient 1 original appointment slot is preserved
    const checkApp = await Appointment.findById(appointment1Id);
    expect(checkApp!.time).toBe('09:30');
    expect(checkApp!.status).toBe('Scheduled');
  });

  test('Cancellation is idempotent and frees occupied slot in schedule', async () => {
    const { user: patientUser, token: patientToken } = await createTestPatient();
    const { doctor } = await createTestDoctor();

    const futureDate = moment().add(2, 'days').format('YYYY-MM-DD');

    await DoctorSchedule.create({
      doctor: doctor._id,
      schedule: {
        morning: [{ startTime: '09:00', endTime: '12:00' }],
        evening: [],
      },
      occupiedSlots: [],
    });

    const bookRes = await request(app)
      .post(`/api/v1/${patientUser._id}/patient/newappointment`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ date: futureDate, time: '11:00', doc_id: doctor._id.toString() });

    const appointmentId = bookRes.body.appointment._id;

    // First cancel call
    const cancelRes1 = await request(app)
      .put(`/api/v1/${patientUser._id}/patient/cancel_appointment`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ appointmentId });

    expect(cancelRes1.status).toBe(200);
    expect(cancelRes1.body.success).toBe(true);

    const cancelledApp = await Appointment.findById(appointmentId);
    expect(cancelledApp!.status).toBe('Canceled');

    // Second cancel call (idempotent)
    const cancelRes2 = await request(app)
      .put(`/api/v1/${patientUser._id}/patient/cancel_appointment`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ appointmentId });

    expect(cancelRes2.status).toBe(200);
    expect(cancelRes2.body.success).toBe(true);
    expect(cancelRes2.body.message).toMatch(/already cancel/i);
  });

  test('Non-owner cannot cancel another patient appointment', async () => {
    const { user: patient1, token: token1 } = await createTestPatient();
    const { user: patient2, token: token2 } = await createTestPatient();
    const { doctor } = await createTestDoctor();

    const futureDate = moment().add(3, 'days').format('YYYY-MM-DD');

    await DoctorSchedule.create({
      doctor: doctor._id,
      schedule: {
        morning: [{ startTime: '09:00', endTime: '12:00' }],
        evening: [],
      },
      occupiedSlots: [],
    });

    const bookRes = await request(app)
      .post(`/api/v1/${patient1._id}/patient/newappointment`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ date: futureDate, time: '11:30', doc_id: doctor._id.toString() });

    const appointmentId = bookRes.body.appointment._id;

    // Patient 2 attempts to cancel Patient 1's appointment
    const unauthorizedCancel = await request(app)
      .put(`/api/v1/${patient2._id}/patient/cancel_appointment`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ appointmentId });

    expect(unauthorizedCancel.status).toBe(403);
    expect(unauthorizedCancel.body.success).toBe(false);
  });
});
