"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.getsingleUser = exports.getAllUser = exports.updateprofile = exports.updatepassword = exports.checkuser = exports.getuserdetail = exports.resetPassword = exports.forgetpassword = exports.logout = exports.checkAuthStatus = exports.loginuser = exports.registerUser = void 0;
const crypto_1 = __importDefault(require("crypto"));
const usermodel_1 = __importDefault(require("../models/usermodel"));
const errorhander_1 = __importDefault(require("../utils/errorhander"));
const catchAsyncErrors_1 = __importDefault(require("../middleware/catchAsyncErrors"));
const jwtToken_1 = require("../utils/jwtToken");
const sendemail_1 = __importDefault(require("../utils/sendemail"));
const sanitizeUser = (user) => {
    const userObj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete userObj.password;
    delete userObj.resetPasswordToken;
    delete userObj.resetPasswordExpire;
    return userObj;
};
exports.registerUser = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { name, email, password, role, phoneNumber, city, pincode, state } = req.body;
    const existing = await usermodel_1.default.findOne({ email });
    if (existing) {
        return next(new errorhander_1.default('User already exists with this email', 400));
    }
    const assignedRole = role === 'doctor' ? 'doctor' : 'patient';
    const user = await usermodel_1.default.create({
        name,
        email,
        password,
        role: assignedRole,
        phoneNumber,
        city,
        pincode,
        state,
    });
    return (0, jwtToken_1.sendToken)(user, 201, res);
});
exports.loginuser = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new errorhander_1.default('Please enter email and password', 400));
    }
    const user = await usermodel_1.default.findOne({ email }).select('+password');
    if (!user) {
        return next(new errorhander_1.default('Invalid email or password', 401));
    }
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
        return next(new errorhander_1.default('Invalid email or password', 401));
    }
    (0, jwtToken_1.sendToken)(user, 200, res);
});
exports.checkAuthStatus = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
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
});
exports.logout = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
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
});
exports.forgetpassword = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return next(new errorhander_1.default('Please provide an email address', 400));
    }
    const user = await usermodel_1.default.findOne({ email });
    if (!user) {
        return res.status(200).json({
            success: true,
            message: 'If an account with this email exists, a password reset link has been sent.',
        });
    }
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    const frontendBaseUrl = process.env.FRONTEND_URL ||
        req.get('origin') ||
        `${req.protocol}://${req.get('host')}`;
    const resetPasswordUrl = `${frontendBaseUrl}/reset-password/${resetToken}`;
    const message = `Your password reset link is:\n\n${resetPasswordUrl}\n\nThis link will expire in 15 minutes. If you did not request this email, please ignore it.`;
    try {
        await (0, sendemail_1.default)({
            email: user.email,
            subject: 'QuickClinic Password Recovery',
            message,
        });
        return res.status(200).json({
            success: true,
            message: 'If an account with this email exists, a password reset link has been sent.',
        });
    }
    catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new errorhander_1.default('Failed to send email. Please try again later.', 500));
    }
});
exports.resetPassword = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const resetPasswordToken = crypto_1.default
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    const user = await usermodel_1.default.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) {
        return next(new errorhander_1.default('Password reset token is invalid or has expired', 400));
    }
    const { password, confirmpassword } = req.body;
    if (!password || !confirmpassword) {
        return next(new errorhander_1.default('Please provide password and confirmation password', 400));
    }
    if (password !== confirmpassword) {
        return next(new errorhander_1.default('Password and Confirm Password do not match', 400));
    }
    if (password.length < 8) {
        return next(new errorhander_1.default('Password should be greater than 8 characters', 400));
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    (0, jwtToken_1.sendToken)(user, 200, res);
});
exports.getuserdetail = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    if (!req.user) {
        return next(new errorhander_1.default('Not authenticated', 401));
    }
    res.status(200).json({
        success: true,
        user: sanitizeUser(req.user),
    });
});
exports.checkuser = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return res.status(200).json({ success: false, message: 'Email is required' });
    }
    const user = await usermodel_1.default.findOne({ email }).select('_id name role');
    if (user) {
        res.status(200).json({
            success: true,
            user,
        });
    }
    else {
        res.status(200).json({
            success: false,
            message: 'User not found',
        });
    }
});
exports.updatepassword = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const user = await usermodel_1.default.findById(req.user?._id).select('+password');
    if (!user) {
        return next(new errorhander_1.default('User not found', 404));
    }
    const isPasswordMatched = await user.comparePassword(req.body.oldpassword);
    if (!isPasswordMatched) {
        return next(new errorhander_1.default('Old password is not correct', 400));
    }
    if (req.body.newpassword !== req.body.confirmpassword) {
        return next(new errorhander_1.default('New password and confirm password do not match', 400));
    }
    if (req.body.newpassword.length < 8) {
        return next(new errorhander_1.default('Password should be greater than 8 characters', 400));
    }
    user.password = req.body.newpassword;
    await user.save();
    res.status(200).json({
        success: true,
        message: 'Password updated successfully',
        user: sanitizeUser(user),
    });
});
exports.updateprofile = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const targetId = req.params.id || req.user?._id?.toString();
    const currentUserId = req.user?._id?.toString();
    if (req.user?.role !== 'admin' && currentUserId !== targetId) {
        return next(new errorhander_1.default('Not authorized to update this profile', 403));
    }
    const user = await usermodel_1.default.findById(targetId);
    if (!user) {
        return next(new errorhander_1.default('User not found', 404));
    }
    if (req.body.name)
        user.name = req.body.name;
    if (req.body.phoneNumber)
        user.phoneNumber = req.body.phoneNumber;
    if (req.body.pincode)
        user.pincode = req.body.pincode;
    if (req.body.city)
        user.city = req.body.city;
    if (req.body.state)
        user.state = req.body.state;
    if (req.body.email && req.body.email !== user.email) {
        const emailTaken = await usermodel_1.default.findOne({ email: req.body.email });
        if (emailTaken) {
            return next(new errorhander_1.default('Email address is already in use', 400));
        }
        user.email = req.body.email;
    }
    await user.save({ validateBeforeSave: true });
    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: sanitizeUser(user),
    });
});
exports.getAllUser = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const users = await usermodel_1.default.find().select('_id name email role city state');
    res.status(200).json({
        success: true,
        users,
    });
});
exports.getsingleUser = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const user = await usermodel_1.default.findById(req.params.id).select('_id name email role phoneNumber city state pincode');
    if (!user) {
        return next(new errorhander_1.default(`User does not exist with Id: ${req.params.id}`, 404));
    }
    res.status(200).json({
        success: true,
        user,
    });
});
exports.deleteUser = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const currentUserId = req.user?._id?.toString();
    const targetId = req.params.id;
    if (req.user?.role !== 'admin' && currentUserId !== targetId) {
        return next(new errorhander_1.default('Not authorized to delete this user account', 403));
    }
    const user = await usermodel_1.default.findById(targetId);
    if (!user) {
        return next(new errorhander_1.default('User not found', 404));
    }
    await user.deleteOne();
    res.status(200).json({
        success: true,
        message: 'User deleted successfully',
    });
});
//# sourceMappingURL=usercontroller.js.map