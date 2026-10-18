import dotenv from 'dotenv';
import http from 'http';
import app from './app';
import { initializeSocket } from './socket';
import connectDB from './config/database';

dotenv.config({ path: 'backend/config/config.env' });

const server = http.createServer(app);

// Initialize Socket.IO with server
export const io = initializeSocket(server);

// If running in persistent mode (not on Vercel), connect to database and listen
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;

  connectDB()
    .then(() => {
      server.listen(PORT, () => {
        console.log(`QuickClinic server is running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to connect to database during startup:', err);
      // Still start server so health endpoints can report status
      server.listen(PORT, () => {
        console.log(`Server started in degraded mode on port ${PORT} (Database down)`);
      });
    });
}

export { server };
export default app;
