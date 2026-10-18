"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = exports.isOriginAllowed = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const error_1 = __importDefault(require("./middleware/error"));
const database_1 = __importStar(require("./config/database"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const patient_routes_1 = __importDefault(require("./routes/patient.routes"));
const doctor_routes_1 = __importDefault(require("./routes/doctor.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
dotenv_1.default.config({ path: 'backend/config/config.env' });
const getAllowedOrigins = () => {
    const envOrigins = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    const defaults = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://quickclinic.vercel.app',
    ];
    return Array.from(new Set([...envOrigins, ...defaults]));
};
const isOriginAllowed = (origin) => {
    if (!origin)
        return true;
    const allowed = getAllowedOrigins();
    if (allowed.includes(origin))
        return true;
    if (/^https:\/\/quickclinic(-[a-z0-9-]+)?\.vercel\.app$/.test(origin) ||
        /^https:\/\/quickclinic-[a-z0-9-]+-karan-aggarwals-projects\.vercel\.app$/.test(origin)) {
        return true;
    }
    return false;
};
exports.isOriginAllowed = isOriginAllowed;
const createApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    app.use((0, cookie_parser_1.default)());
    const corsOptions = {
        origin: (origin, callback) => {
            if (!origin || (0, exports.isOriginAllowed)(origin)) {
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
    app.use((0, cors_1.default)(corsOptions));
    app.options('*', (0, cors_1.default)(corsOptions));
    app.use((req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        next();
    });
    app.get('/api/health', (req, res) => {
        const check = req.query.check || req.query.type;
        const isReady = (0, database_1.isDatabaseConnected)();
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
        return res.status(200).json({
            status: 'ok',
            message: 'API is working!',
            liveness: 'alive',
            database: isReady ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString(),
        });
    });
    app.get('/api/ready', (req, res) => {
        const isReady = (0, database_1.isDatabaseConnected)();
        if (!isReady) {
            return res.status(503).json({
                status: 'error',
                readiness: 'not_ready',
                database: 'disconnected',
                details: (0, database_1.getDatabaseStatus)(),
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
    app.use('/api/v1', async (req, res, next) => {
        if (!(0, database_1.isDatabaseConnected)()) {
            try {
                await (0, database_1.default)();
            }
            catch (err) {
                return res.status(503).json({
                    success: false,
                    message: 'Database service is currently unavailable. Please try again later.',
                });
            }
        }
        next();
    });
    app.use('/api/v1/message', message_routes_1.default);
    app.use('/api/v1/patient', patient_routes_1.default);
    app.use('/api/v1/doctor', doctor_routes_1.default);
    app.use('/api/v1/notification', notification_routes_1.default);
    app.use('/api/v1/payment', payment_routes_1.default);
    app.use('/api/v1', patient_routes_1.default);
    app.use('/api/v1', doctor_routes_1.default);
    app.use('/api/v1', notification_routes_1.default);
    app.use('/api/v1', payment_routes_1.default);
    app.use('/api/v1', user_routes_1.default);
    app.all('/api/*', (req, res) => {
        res.status(404).json({
            success: false,
            message: `Resource not found: ${req.originalUrl}`,
        });
    });
    app.use((err, req, res, next) => {
        const origin = req.headers.origin;
        if (origin && (0, exports.isOriginAllowed)(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
        }
        (0, error_1.default)(err, req, res, next);
    });
    return app;
};
exports.createApp = createApp;
const app = (0, exports.createApp)();
exports.default = app;
//# sourceMappingURL=app.js.map