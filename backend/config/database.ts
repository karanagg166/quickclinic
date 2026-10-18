import mongoose from "mongoose";

let cachedConnectionPromise: Promise<typeof mongoose> | null = null;
let lastConnectionError: Error | null = null;

export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export const getDatabaseStatus = () => {
  const readyStates: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const state = readyStates[mongoose.connection.readyState] || "unknown";
  return {
    ready: mongoose.connection.readyState === 1,
    connected: mongoose.connection.readyState === 1,
    state,
    error: lastConnectionError ? lastConnectionError.message : undefined,
  };
};

export const resetDatabaseConnection = async (): Promise<void> => {
  cachedConnectionPromise = null;
  lastConnectionError = null;
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnect errors
    }
  }
};

export const resetConnectionState = resetDatabaseConnection;
export const getDatabaseHealth = getDatabaseStatus;

export const connectDB = async (customUrl?: string): Promise<typeof mongoose> => {
  // If already fully connected, return mongoose instance
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // If a connection attempt is currently in progress, reuse the existing promise
  if (cachedConnectionPromise) {
    try {
      return await cachedConnectionPromise;
    } catch (err) {
      // If the cached promise rejected, reset it and proceed to retry
      cachedConnectionPromise = null;
    }
  }

  const dbUrl = customUrl || process.env.DB_URL || process.env.MONGODB_URI || process.env.DB_URI;
  if (!dbUrl) {
    const error = new Error("Database URL not found in environment variables");
    lastConnectionError = error;
    throw error;
  }

  // Set up connection options
  const connectOptions: mongoose.ConnectOptions = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  cachedConnectionPromise = mongoose
    .connect(dbUrl, connectOptions)
    .then((m) => {
      lastConnectionError = null;
      console.log("Connected to database successfully");
      return m;
    })
    .catch((err) => {
      lastConnectionError = err;
      cachedConnectionPromise = null; // Reset so next request can retry
      console.error("Database connection error:", err);
      throw err;
    });

  return await cachedConnectionPromise;
};

export const connectDatabase = connectDB;
export default connectDB;
