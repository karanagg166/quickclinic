import request from 'supertest';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createApp } from '../backend/app';
import User from '../backend/models/usermodel';
import {
  connectTestDb,
  clearTestDb,
  closeTestDb,
} from './helpers/setup';

describe('Password Reset & Token Recovery Workflow', () => {
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

  test('POST /api/v1/password/forget prevents account enumeration with uniform response', async () => {
    await User.create({
      name: 'Existing User',
      email: 'exists@example.com',
      password: 'password123',
      role: 'patient',
      phoneNumber: '1234567890',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
    });

    const resExisting = await request(app)
      .post('/api/v1/password/forget')
      .send({ email: 'exists@example.com' });

    expect(resExisting.status).toBe(200);
    expect(resExisting.body.success).toBe(true);
    expect(resExisting.body.message).toMatch(/If an account with this email exists/i);

    const resNonExisting = await request(app)
      .post('/api/v1/password/forget')
      .send({ email: 'nonexistent@example.com' });

    expect(resNonExisting.status).toBe(200);
    expect(resNonExisting.body.success).toBe(true);
    expect(resNonExisting.body.message).toMatch(/If an account with this email exists/i);
  });

  test('Valid reset token updates password and consumes token (single-use)', async () => {
    const rawResetToken = 'valid_test_token_123456789';
    const hashedToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    const user = await User.create({
      name: 'Reset Patient',
      email: 'resetme@example.com',
      password: 'oldPassword123',
      role: 'patient',
      phoneNumber: '1234567890',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      resetPasswordToken: hashedToken,
      resetPasswordExpire: new Date(Date.now() + 15 * 60 * 1000), // 15 mins in future
    });

    const newPassword = 'brandNewPassword999';

    // First use: Should succeed
    const res = await request(app)
      .put(`/api/v1/password/reset/${rawResetToken}`)
      .send({
        password: newPassword,
        confirmpassword: newPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify token was cleared from DB (single-use invalidation)
    const updatedUser = await User.findById(user._id).select('+password');
    expect(updatedUser!.resetPasswordToken).toBeUndefined();
    expect(updatedUser!.resetPasswordExpire).toBeUndefined();

    // Verify new password works
    expect(await bcrypt.compare(newPassword, updatedUser!.password)).toBe(true);

    // Second use: Must fail because token has been consumed
    const resReused = await request(app)
      .put(`/api/v1/password/reset/${rawResetToken}`)
      .send({
        password: 'anotherPassword888',
        confirmpassword: 'anotherPassword888',
      });

    expect(resReused.status).toBe(400);
    expect(resReused.body.success).toBe(false);
    expect(resReused.body.message).toMatch(/invalid or has expired/i);
  });

  test('Rejects expired reset token with 400', async () => {
    const rawResetToken = 'expired_token_12345';
    const hashedToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    await User.create({
      name: 'Expired Token User',
      email: 'expired@example.com',
      password: 'oldPassword123',
      role: 'patient',
      phoneNumber: '1234567890',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      resetPasswordToken: hashedToken,
      resetPasswordExpire: new Date(Date.now() - 1000), // in the past
    });

    const res = await request(app)
      .put(`/api/v1/password/reset/${rawResetToken}`)
      .send({
        password: 'newPassword123',
        confirmpassword: 'newPassword123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid or has expired/i);
  });

  test('Rejects mismatched password and confirmation with 400', async () => {
    const rawResetToken = 'mismatch_token_123';
    const hashedToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    await User.create({
      name: 'Mismatch User',
      email: 'mismatch@example.com',
      password: 'oldPassword123',
      role: 'patient',
      phoneNumber: '1234567890',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      resetPasswordToken: hashedToken,
      resetPasswordExpire: new Date(Date.now() + 15 * 60 * 1000),
    });

    const res = await request(app)
      .put(`/api/v1/password/reset/${rawResetToken}`)
      .send({
        password: 'passwordA123',
        confirmpassword: 'passwordB123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/do not match/i);
  });

  test('Rejects password shorter than 8 characters with 400', async () => {
    const rawResetToken = 'short_token_123';
    const hashedToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    await User.create({
      name: 'Short Pass User',
      email: 'short@example.com',
      password: 'oldPassword123',
      role: 'patient',
      phoneNumber: '1234567890',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      resetPasswordToken: hashedToken,
      resetPasswordExpire: new Date(Date.now() + 15 * 60 * 1000),
    });

    const res = await request(app)
      .put(`/api/v1/password/reset/${rawResetToken}`)
      .send({
        password: 'short',
        confirmpassword: 'short',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/greater than 8 characters/i);
  });
});
