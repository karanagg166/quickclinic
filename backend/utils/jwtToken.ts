import { Response } from 'express';
import { IUser } from '../models/usermodel';

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const token = user.getJWTToken();

  const cookieExpireDays = Number(process.env.COOKIE_EXPIRE) || 7;
  const isProduction = process.env.NODE_ENV === 'production';

  // Cookie options
  const options: {
    expires: Date;
    httpOnly: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'none' | 'strict';
  } = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  };

  const userObj = typeof (user as any).toObject === 'function' ? (user as any).toObject() : { ...user };
  delete (userObj as any).password;
  delete (userObj as any).resetPasswordToken;
  delete (userObj as any).resetPasswordExpire;

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user: userObj,
    token,
  });
};
