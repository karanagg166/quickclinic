import mongoose from "mongoose";
export declare const isDatabaseConnected: () => boolean;
export declare const getDatabaseStatus: () => {
    ready: boolean;
    connected: boolean;
    state: string;
    error: string;
};
export declare const resetDatabaseConnection: () => Promise<void>;
export declare const resetConnectionState: () => Promise<void>;
export declare const getDatabaseHealth: () => {
    ready: boolean;
    connected: boolean;
    state: string;
    error: string;
};
export declare const connectDB: (customUrl?: string) => Promise<typeof mongoose>;
export declare const connectDatabase: (customUrl?: string) => Promise<typeof mongoose>;
export default connectDB;
//# sourceMappingURL=database.d.ts.map