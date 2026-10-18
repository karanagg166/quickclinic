"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = exports.connectDB = exports.getDatabaseHealth = exports.resetConnectionState = exports.resetDatabaseConnection = exports.getDatabaseStatus = exports.isDatabaseConnected = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
let cachedConnectionPromise = null;
let lastConnectionError = null;
const isDatabaseConnected = () => {
    return mongoose_1.default.connection.readyState === 1;
};
exports.isDatabaseConnected = isDatabaseConnected;
const getDatabaseStatus = () => {
    const readyStates = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
    };
    const state = readyStates[mongoose_1.default.connection.readyState] || "unknown";
    return {
        ready: mongoose_1.default.connection.readyState === 1,
        connected: mongoose_1.default.connection.readyState === 1,
        state,
        error: lastConnectionError ? lastConnectionError.message : undefined,
    };
};
exports.getDatabaseStatus = getDatabaseStatus;
const resetDatabaseConnection = async () => {
    cachedConnectionPromise = null;
    lastConnectionError = null;
    if (mongoose_1.default.connection.readyState !== 0) {
        try {
            await mongoose_1.default.disconnect();
        }
        catch {
        }
    }
};
exports.resetDatabaseConnection = resetDatabaseConnection;
exports.resetConnectionState = exports.resetDatabaseConnection;
exports.getDatabaseHealth = exports.getDatabaseStatus;
const connectDB = async (customUrl) => {
    if (mongoose_1.default.connection.readyState === 1) {
        return mongoose_1.default;
    }
    if (cachedConnectionPromise) {
        try {
            return await cachedConnectionPromise;
        }
        catch (err) {
            cachedConnectionPromise = null;
        }
    }
    const dbUrl = customUrl || process.env.DB_URL || process.env.MONGODB_URI || process.env.DB_URI;
    if (!dbUrl) {
        const error = new Error("Database URL not found in environment variables");
        lastConnectionError = error;
        throw error;
    }
    const connectOptions = {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    };
    cachedConnectionPromise = mongoose_1.default
        .connect(dbUrl, connectOptions)
        .then((m) => {
        lastConnectionError = null;
        console.log("Connected to database successfully");
        return m;
    })
        .catch((err) => {
        lastConnectionError = err;
        cachedConnectionPromise = null;
        console.error("Database connection error:", err);
        throw err;
    });
    return await cachedConnectionPromise;
};
exports.connectDB = connectDB;
exports.connectDatabase = exports.connectDB;
exports.default = exports.connectDB;
//# sourceMappingURL=database.js.map