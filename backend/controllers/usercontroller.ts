import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import User, { IUser } from '../models/usermodel';
import ErrorHander from '../utils/errorhander';
import catchAsyncErrors from '../middleware/catchAsyncErrors';
import { sendToken } from '../utils/jwtToken';
import sendEmail from '../utils/sendemail';
import { AuthRequest } from '../middleware/auth';

const sanitizeUser = (user: any) => {
  const userObj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpire;
  return userObj;
};

export const registerUser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, role, phoneNumber, city, pincode, state } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return next(new ErrorHander('User already exists with this email', 400));
    }

    // Role check: Only allow patient or doctor self-registration
    const assignedRole = role === 'doctor' ? 'doctor' : 'patient';

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      phoneNumber,
      city,
      pincode,
      state,
    });

    return sendToken(user, 201, res);
  }
);

export const loginuser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorHander('Please enter email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new ErrorHander('Invalid email or password', 401));
    }

    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      return next(new ErrorHander('Invalid email or password', 401));
    }

    sendToken(user, 200, res);
  }
);

export const checkAuthStatus = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(200).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    res.status(200).json({
      success: true,
      user: sanitizeUser(req.user),
    });
  }
);

export const logout = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
);

export const forgetpassword = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    if (!email) {
      return next(new ErrorHander('Please provide an email address', 400));
    }

    const user = await User.findOne({ email });

    // Prevent account enumeration: return consistent response even if email is not found
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Link directly to frontend reset password page
    const frontendBaseUrl =
      process.env.FRONTEND_URL ||
      req.get('origin') ||
      `${req.protocol}://${req.get('host')}`;
    const resetPasswordUrl = `${frontendBaseUrl}/reset-password/${resetToken}`;

    const message = `Your password reset link is:\n\n${resetPasswordUrl}\n\nThis link will expire in 15 minutes. If you did not request this email, please ignore it.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'QuickClinic Password Recovery',
        message,
      });

      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorHander('Failed to send email. Please try again later.', 500));
    }
  }
);

export const resetPassword = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorHander('Password reset token is invalid or has expired', 400));
    }

    const { password, confirmpassword } = req.body;
    if (!password || !confirmpassword) {
      return next(new ErrorHander('Please provide password and confirmation password', 400));
    }

    if (password !== confirmpassword) {
      return next(new ErrorHander('Password and Confirm Password do not match', 400));
    }

    if (password.length < 8) {
      return next(new ErrorHander('Password should be greater than 8 characters', 400));
    }

    // Invalidate token so it cannot be reused
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendToken(user, 200, res);
  }
);

export const getuserdetail = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ErrorHander('Not authenticated', 401));
    }
    res.status(200).json({
      success: true,
      user: sanitizeUser(req.user),
    });
  }
);

export const checkuser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    if (!email) {
      return res.status(200).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email }).select('_id name role');
    if (user) {
      res.status(200).json({
        success: true,
        user,
      });
    } else {
      res.status(200).json({
        success: false,
        message: 'User not found',
      });
    }
  }
);

export const updatepassword = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user?._id).select('+password');
    if (!user) {
      return next(new ErrorHander('User not found', 404));
    }

    const isPasswordMatched = await user.comparePassword(req.body.oldpassword);
    if (!isPasswordMatched) {
      return next(new ErrorHander('Old password is not correct', 400));
    }

    if (req.body.newpassword !== req.body.confirmpassword) {
      return next(new ErrorHander('New password and confirm password do not match', 400));
    }

    if (req.body.newpassword.length < 8) {
      return next(new ErrorHander('Password should be greater than 8 characters', 400));
    }

    user.password = req.body.newpassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      user: sanitizeUser(user),
    });
  }
);

export const updateprofile = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const targetId = req.params.id || req.user?._id?.toString();
    const currentUserId = req.user?._id?.toString();

    // Verify ownership or admin privilege
    if (req.user?.role !== 'admin' && currentUserId !== targetId) {
      return next(new ErrorHander('Not authorized to update this profile', 403));
    }

    const user = await User.findById(targetId);
    if (!user) {
      return next(new ErrorHander('User not found', 404));
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.phoneNumber) user.phoneNumber = req.body.phoneNumber;
    if (req.body.pincode) user.pincode = req.body.pincode;
    if (req.body.city) user.city = req.body.city;
    if (req.body.state) user.state = req.body.state;

    // Email update check
    if (req.body.email && req.body.email !== user.email) {
      const emailTaken = await User.findOne({ email: req.body.email });
      if (emailTaken) {
        return next(new ErrorHander('Email address is already in use', 400));
      }
      user.email = req.body.email;
    }

    // Save will NOT re-hash unchanged password because of our fixed pre-save hook
    await user.save({ validateBeforeSave: true });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: sanitizeUser(user),
    });
  }
);

export const getAllUser = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Restrict all users list to admin or sanitized summary
    const users = await User.find().select('_id name email role city state');
    res.status(200).json({
      success: true,
      users,
    });
  }
);

export const getsingleUser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id).select(
      '_id name email role phoneNumber city state pincode'
    );
    if (!user) {
      return next(new ErrorHander(`User does not exist with Id: ${req.params.id}`, 404));
    }
    res.status(200).json({
      success: true,
      user,
    });
  }
);

export const deleteUser = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const currentUserId = req.user?._id?.toString();
    const targetId = req.params.id;

    if (req.user?.role !== 'admin' && currentUserId !== targetId) {
      return next(new ErrorHander('Not authorized to delete this user account', 403));
    }

    const user = await User.findById(targetId);
    if (!user) {
      return next(new ErrorHander('User not found', 404));
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  }
);
