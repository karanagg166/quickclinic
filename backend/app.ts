import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import Errormiddleware from './middleware/error';
import connectDB, { isDatabaseConnected, getDatabaseStatus } from './config/database';

// Import route modules
import userRoutes from './routes/user.routes';
import patientRoutes from './routes/patient.routes';
import doctorRoutes from './routes/doctor.routes';
import messageRoutes from './routes/message.routes';
import notificationRoutes from './routes/notification.routes';
import paymentRoutes from './routes/payment.routes';

// Load environment variables if not already loaded
dotenv.config({ path: 'backend/config/config.env' });

import { isOriginAllowed, getAllowedOrigins } from './utils/origin';

export { isOriginAllowed, getAllowedOrigins };

export const createApp = (): Application => {
  const app = express();

  // Middleware for parsing JSON and URL-encoded bodies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Parse cookies
  app.use(cookieParser());

  // Strict CORS policy - explicitly configured origins, never wildcard * with credentials
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'X-CSRF-Token',
      'X-Requested-With',
      'Accept',
      'Accept-Version',
      'Content-Length',
      'Content-MD5',
      'Content-Type',
      'Date',
      'X-Api-Version',
      'Authorization',
    ],
    exposedHeaders: ['Set-Cookie'],
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  // Security headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // Health and Readiness probes
  app.get('/api/health', (req: Request, res: Response) => {
    const check = req.query.check || req.query.type;
    const isReady = isDatabaseConnected();

    if (check === 'ready' || check === 'readiness') {
      if (!isReady) {
        return res.status(503).json({
          status: 'error',
          readiness: 'not_ready',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
        });
      }
      return res.status(200).json({
        status: 'ok',
        readiness: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    }

    // Default Liveness check
    return res.status(200).json({
      status: 'ok',
      message: 'API is working!',
      liveness: 'alive',
      database: isReady ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/ready', (req: Request, res: Response) => {
    const isReady = isDatabaseConnected();
    if (!isReady) {
      return res.status(503).json({
        status: 'error',
        readiness: 'not_ready',
        database: 'disconnected',
        details: getDatabaseStatus(),
        timestamp: new Date().toISOString(),
      });
    }
    return res.status(200).json({
      status: 'ok',
      readiness: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  });

  // Database Dependency Gate for /api/v1 routes
  app.use('/api/v1', async (req: Request, res: Response, next: NextFunction) => {
    if (!isDatabaseConnected()) {
      try {
        await connectDB();
      } catch (err: any) {
        return res.status(503).json({
          success: false,
          message: 'Database service is currently unavailable. Please try again later.',
        });
      }
    }
    next();
  });

  // Canonical Route Mounts (identical locally and in serverless)
  app.use('/api/v1/message', messageRoutes);
  app.use('/api/v1/patient', patientRoutes);
  app.use('/api/v1/doctor', doctorRoutes);
  app.use('/api/v1/notification', notificationRoutes);
  app.use('/api/v1/payment', paymentRoutes);

  // Top-level mounts for routes designed with internal prefixes
  app.use('/api/v1', patientRoutes);
  app.use('/api/v1', doctorRoutes);
  app.use('/api/v1', notificationRoutes);
  app.use('/api/v1', paymentRoutes);
  app.use('/api/v1', userRoutes);

  // 404 handler specifically for unknown API routes (returns JSON, never SPA HTML)
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Resource not found: ${req.originalUrl}`,
    });
  });

  // Error-handling middleware with CORS preservation
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    Errormiddleware(err, req, res, next);
  });

  return app;
};

const app = createApp();
export default app;
