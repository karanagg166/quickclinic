import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../backend/app';
import {
  connectDatabase,
  resetConnectionState,
  getDatabaseHealth,
} from '../backend/config/database';

describe('Database Connection, Caching, Recovery, & Health Checks', () => {
  let mongoServer: MongoMemoryServer;
  let validUri: string;
  const app = createApp();

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    validUri = mongoServer.getUri();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.disconnect();
    resetConnectionState();
  });

  test('Liveness check (/api/health) returns 200 even when database is disconnected', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.liveness).toBe('alive');
    expect(res.body.database).toBe('disconnected');
  });

  test('Readiness check (/api/ready) returns 503 when database is disconnected', async () => {
    const res = await request(app).get('/api/ready');
    expect(res.status).toBe(503);
    expect(res.body.readiness).toBe('not_ready');
    expect(res.body.database).toBe('disconnected');
  });

  test('/api/health?check=ready returns 503 when database is disconnected', async () => {
    const res = await request(app).get('/api/health?check=ready');
    expect(res.status).toBe(503);
    expect(res.body.readiness).toBe('not_ready');
    expect(res.body.database).toBe('disconnected');
  });

  test('Dependency gate returns 503 for /api/v1 routes when database is unavailable', async () => {
    const res = await request(app).get('/api/v1/patient/all');
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Database service is currently unavailable/i);
  });

  test('Concurrent initialization reuses single connection promise and prevents storms', async () => {
    process.env.DB_URI = validUri;

    // Trigger 5 concurrent calls
    const promises = [
      connectDatabase(),
      connectDatabase(),
      connectDatabase(),
      connectDatabase(),
      connectDatabase(),
    ];

    const results = await Promise.all(promises);
    expect(results).toHaveLength(5);
    expect(mongoose.connection.readyState).toBe(1);

    // After connection, readiness check returns 200
    const readyRes = await request(app).get('/api/ready');
    expect(readyRes.status).toBe(200);
    expect(readyRes.body.readiness).toBe('ready');
    expect(readyRes.body.database).toBe('connected');
  });

  test('Handles DNS / unreachable connection failure, resets cached promise, and enables recovery', async () => {
    // Attempt connection to non-existent host
    process.env.DB_URI = 'mongodb://nonexistent-cluster-host-fake.example.com:27017/test?connectTimeoutMS=1000&serverSelectionTimeoutMS=1000';

    await expect(connectDatabase()).rejects.toThrow();

    // Verify health reports disconnected
    const health = getDatabaseHealth();
    expect(health.connected).toBe(false);

    // Verify recovery: pointing to valid URI now succeeds
    process.env.DB_URI = validUri;
    await expect(connectDatabase()).resolves.toBeDefined();
    expect(mongoose.connection.readyState).toBe(1);
    expect(getDatabaseHealth().connected).toBe(true);
  });
});
