import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../backend/app';
import User from '../backend/models/usermodel';
import {
  connectTestDb,
  clearTestDb,
  closeTestDb,
  createTestPatient,
  createTestDoctor,
  JWT_SECRET_TEST,
} from './helpers/setup';

describe('Authentication, Passwords, & Role Security', () => {
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

  describe('Password Pre-Save Hook Behavior', () => {
    test('Hashes password once upon initial user creation', async () => {
      const plainPassword = 'securePassword123';
      const user = await User.create({
        name: 'Alice Patient',
        email: 'alice@example.com',
        password: plainPassword,
        role: 'patient',
        phoneNumber: '1234567890',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
      });

      const userInDb = await User.findById(user._id).select('+password');
      expect(userInDb!.password).not.toBe(plainPassword);
      const isMatch = await bcrypt.compare(plainPassword, userInDb!.password);
      expect(isMatch).toBe(true);
    });

    test('Does NOT re-hash unchanged password when updating profile attributes', async () => {
      const user = await User.create({
        name: 'Bob Patient',
        email: 'bob@example.com',
        password: 'initialPassword123',
        role: 'patient',
        phoneNumber: '1234567890',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
      });

      const originalHash = (await User.findById(user._id).select('+password'))!.password;

      // Update name and city without touching password
      user.name = 'Bob Updated';
      user.city = 'New York';
      await user.save();

      const updatedUser = await User.findById(user._id).select('+password');
      expect(updatedUser!.password).toBe(originalHash);

      // Verify login with original password still works
      const canVerify = await bcrypt.compare('initialPassword123', updatedUser!.password);
      expect(canVerify).toBe(true);
    });

    test('Re-hashes password only when password field is explicitly changed', async () => {
      const user = await User.create({
        name: 'Charlie Patient',
        email: 'charlie@example.com',
        password: 'firstPassword123',
        role: 'patient',
        phoneNumber: '1234567890',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
      });

      const firstHash = (await User.findById(user._id).select('+password'))!.password;

      user.password = 'secondPassword456';
      await user.save();

      const secondUser = await User.findById(user._id).select('+password');
      expect(secondUser!.password).not.toBe(firstHash);
      expect(await bcrypt.compare('secondPassword456', secondUser!.password)).toBe(true);
    });
  });

  describe('Password Hash Exposure Protection', () => {
    test('Registration response does not expose password hash', async () => {
      const res = await request(app).post('/api/v1/register').send({
        name: 'Dave Registration',
        email: 'dave@example.com',
        password: 'password123',
        role: 'patient',
        phoneNumber: '1234567890',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.password).toBeUndefined();
    });

    test('Login response does not expose password hash', async () => {
      await User.create({
        name: 'Eve Login',
        email: 'eve@example.com',
        password: 'password123',
        role: 'patient',
        phoneNumber: '1234567890',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
      });

      const res = await request(app).post('/api/v1/login').send({
        email: 'eve@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.password).toBeUndefined();
    });

    test('GET /api/v1/me does not expose password hash', async () => {
      const { user, token } = await createTestPatient();

      const res = await request(app)
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.password).toBeUndefined();
    });
  });

  describe('Authentication & Authorization Middleware Guards', () => {
    test('Rejects request without authentication token with 401', async () => {
      const res = await request(app).get('/api/v1/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Please login to access this resource/i);
    });

    test('Rejects invalid JWT token with 401', async () => {
      const res = await request(app)
        .get('/api/v1/me')
        .set('Authorization', 'Bearer invalid-garbage-token');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or expired|jwt/i);
    });

    test('Rejects expired JWT token with 401', async () => {
      const expiredToken = jwt.sign({ id: 'dummy_id' }, JWT_SECRET_TEST, { expiresIn: '-1s' });
      const res = await request(app)
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or expired|jwt/i);
    });

    test('Rejects token if user was deleted or no longer exists in database', async () => {
      const { user, token } = await createTestPatient();
      await User.findByIdAndDelete(user._id);

      const res = await request(app)
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/User not found|no longer exists/i);
    });

    test('Role guard rejects patient from accessing doctor management routes with 403', async () => {
      const { user: patientUser, token: patientToken } = await createTestPatient();
      const { user: doctorUser } = await createTestDoctor();

      const res = await request(app)
        .post(`/api/v1/${doctorUser._id}/doctor/update_schedule`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          schedule: [{ date: '2026-11-01', timeSlots: ['09:00'] }],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Role:?\s*\(?patient\)?\s*is not allowed/i);
    });
  });
});
