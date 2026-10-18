import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/usermodel';
import ErrorHander from '../utils/errorhander';
import catchAsyncErrors from './catchAsyncErrors';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const isauthenticateuser = catchAsyncErrors(async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Support token from cookie or Authorization header Bearer token
  let token = req.cookies?.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorHander("Please Login to access this resource", 401));
  }

  const jwtSecret = process.env.JWT_SECRET || "default_jwt_secret_for_tests";

  try {
    const decodedData = jwt.verify(token, jwtSecret) as { id: string };
    const user = await User.findById(decodedData.id);

    if (!user) {
      return next(new ErrorHander("User belonging to this token no longer exists", 401));
    }

    req.user = user;
    next();
  } catch (error: any) {
    return next(new ErrorHander("Invalid or expired session token. Please log in again.", 401));
  }
});

export const isAuthenticatedUser = isauthenticateuser;

export const authorizeroles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ErrorHander("User not authenticated", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHander(
          `Role: ${req.user.role} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};

export const authorizeRoles = authorizeroles;
