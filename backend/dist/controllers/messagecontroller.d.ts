import { Request, Response } from 'express';
export declare const sendMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMessages: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getconversations: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const lastmessage: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const groupids: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=messagecontroller.d.ts.map