import request from 'supertest';
import { createApp } from '../backend/app';
import {
  connectTestDb,
  clearTestDb,
  closeTestDb,
} from './helpers/setup';

describe('Unified Routes, CORS Policy, & JSON 404 Handler', () => {
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

  describe('Unified API Route Prefixes', () => {
    test('Messages are reachable under unified /api/v1/message prefix', async () => {
      const res = await request(app).get('/api/v1/message/getmessages/dummy-id');
      // Should hit message route auth guard, returning 401 instead of 404
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Patient routes are reachable under /api/v1 prefix', async () => {
      const res = await request(app).get('/api/v1/dummy-id/patient/usual_history');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Doctor routes are reachable under /api/v1 prefix', async () => {
      const res = await request(app).get('/api/v1/dummy-id/doctor/info');
      // doctor/info is public discovery endpoint
      expect(res.status).not.toBe(404);
    });
  });

  describe('CORS Configuration & Preflight Headers', () => {
    test('Handles preflight OPTIONS with credentials and allowed headers for valid origin', async () => {
      const res = await request(app)
        .options('/api/v1/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

      expect([200, 204]).toContain(res.status);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    test('Allows Vercel preview domain pattern origins', async () => {
      const previewOrigin = 'https://quickclinic-git-feature-preview.vercel.app';
      const res = await request(app)
        .options('/api/v1/login')
        .set('Origin', previewOrigin)
        .set('Access-Control-Request-Method', 'POST');

      expect([200, 204]).toContain(res.status);
      expect(res.headers['access-control-allow-origin']).toBe(previewOrigin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    test('Does not echo arbitrary untrusted origins with credentials', async () => {
      const maliciousOrigin = 'https://malicious-phishing-site.com';
      const res = await request(app)
        .get('/api/health')
        .set('Origin', maliciousOrigin);

      // CORS middleware will reject or omit origin
      expect(res.headers['access-control-allow-origin']).not.toBe(maliciousOrigin);
    });
  });

  describe('Unknown API Routes JSON 404 Handler', () => {
    test('Returns clean JSON 404 for non-existent /api routes instead of HTML', async () => {
      const res = await request(app).get('/api/v1/non-existent-route-xyz');
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Resource not found: \/api\/v1\/non-existent-route-xyz/i);
    });
  });
});
