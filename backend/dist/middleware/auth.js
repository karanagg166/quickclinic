"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authorizeroles = exports.isAuthenticatedUser = exports.isauthenticateuser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const usermodel_1 = __importDefault(require("../models/usermodel"));
const errorhander_1 = __importDefault(require("../utils/errorhander"));
const catchAsyncErrors_1 = __importDefault(require("./catchAsyncErrors"));
exports.isauthenticateuser = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new errorhander_1.default("Please Login to access this resource", 401));
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        return next(new errorhander_1.default("Server authentication configuration missing", 500));
    }
    try {
        const decodedData = jsonwebtoken_1.default.verify(token, jwtSecret);
        const user = await usermodel_1.default.findById(decodedData.id);
        if (!user) {
            return next(new errorhander_1.default("User belonging to this token no longer exists", 401));
        }
        req.user = user;
        next();
    }
    catch (error) {
        return next(new errorhander_1.default("Invalid or expired session token. Please log in again.", 401));
    }
});
exports.isAuthenticatedUser = exports.isauthenticateuser;
const authorizeroles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorhander_1.default("User not authenticated", 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errorhander_1.default(`Role: ${req.user.role} is not allowed to access this resource`, 403));
        }
        next();
    };
};
exports.authorizeroles = authorizeroles;
exports.authorizeRoles = exports.authorizeroles;
//# sourceMappingURL=auth.js.map