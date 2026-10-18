import http from 'http';
import app from './app';
declare const server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
export declare const io: import("socket.io").Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { server };
export default app;
//# sourceMappingURL=server.d.ts.map