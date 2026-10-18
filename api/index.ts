import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import app from '../backend/app';
import connectDB from '../backend/config/database';

// Ensure environment variables are loaded
dotenv.config();

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // Initialize database connection for serverless invocation
  try {
    await connectDB();
  } catch (error: any) {
    console.error('Database connection error in serverless handler:', error?.message || error);
    // Continue: if request is liveness (/api/health) it will respond 200;
    // if /api/ready or DB-dependent /api/v1 routes, they will return 503 Service Unavailable.
  }

  // Delegate to shared Express application with lifecycle resolution
  return new Promise<void>((resolve, reject) => {
    res.on('finish', () => resolve());
    res.on('close', () => resolve());
    res.on('error', (err) => reject(err));

    app(req as any, res as any, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
