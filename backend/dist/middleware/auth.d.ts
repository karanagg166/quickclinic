import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/usermodel';
export interface AuthRequest extends Request {
    user?: IUser;
}
export declare const isauthenticateuser: (req: Request, res: Response, next: NextFunction) => void;
export declare const isAuthenticatedUser: (req: Request, res: Response, next: NextFunction) => void;
export declare const authorizeroles: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const authorizeRoles: (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map