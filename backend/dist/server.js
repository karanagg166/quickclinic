"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.io = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const socket_1 = require("./socket");
const database_1 = __importDefault(require("./config/database"));
dotenv_1.default.config({ path: 'backend/config/config.env' });
const server = http_1.default.createServer(app_1.default);
exports.server = server;
exports.io = (0, socket_1.initializeSocket)(server);
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 5000;
    (0, database_1.default)()
        .then(() => {
        server.listen(PORT, () => {
            console.log(`QuickClinic server is running on port ${PORT}`);
        });
    })
        .catch((err) => {
        console.error('Failed to connect to database during startup:', err);
        server.listen(PORT, () => {
            console.log(`Server started in degraded mode on port ${PORT} (Database down)`);
        });
    });
}
exports.default = app_1.default;
//# sourceMappingURL=server.js.map