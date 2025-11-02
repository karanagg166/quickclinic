"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        if (mongoose_1.default.connection.readyState === 1) {
            console.log("Database already connected");
            return;
        }
        const dbUrl = process.env.DB_URL || process.env.MONGODB_URI;
        if (!dbUrl) {
            throw new Error("Database URL not found in environment variables");
        }
        await mongoose_1.default.connect(dbUrl, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("Connected to database successfully");
    }
    catch (err) {
        console.error("Database connection error:", err);
        if (process.env.VERCEL) {
            throw err;
        }
        else {
            process.exit(1);
        }
    }
};
exports.default = connectDB;
//# sourceMappingURL=database.js.map