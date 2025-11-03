"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.getsingleUser = exports.getAllUser = exports.updateprofile = exports.updatepassword = exports.checkuser = exports.getuserdetail = exports.resetPassword = exports.forgetpassword = exports.logout = exports.checkAuthStatus = exports.loginuser = exports.registerUser = void 0;
const usermodel_1 = __importDefault(require("../models/usermodel"));
const errorhander_1 = __importDefault(require("../utils/errorhander"));
const catchAsyncErrors_1 = __importDefault(require("../middleware/catchAsyncErrors"));
const jwtToken_1 = require("../utils/jwtToken");
const sendemail_1 = __importDefault(require("../utils/sendemail"));
const crypto_1 = __importDefault(require("crypto"));
exports.registerUser = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { name, email, password, role, phoneNumber, city, pincode, state } = req.body;
    try {
        const user = await usermodel_1.default.create({
            name,
            email,
            password,
            role,
            phoneNumber,
            city,
            pincode,
            state
        });
        return (0, jwtToken_1.sendToken)(user, 201, res);
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((val) => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', '),
            });
        }
        else {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
});
exports.loginuser = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new errorhander_1.default("Please enter email and password", 400));
    }
    const user = await usermodel_1.default.findOne({ email }).select("+password");
    if (!user) {
        return next(new errorhander_1.default("Invalid email", 401));
    }
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
        return next(new errorhander_1.default("Invalid password", 401));
    }
    req.session.user = {
        id: user._id,
        email: user.email,
        name: user.name,
    };
    (0, jwtToken_1.sendToken)(user, 200, res);
});
exports.checkAuthStatus = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    if (!req.session.user) {
        return;
    }
    res.status(200).json({
        success: true,
        user: req.session.user,
    });
});
exports.logout = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });
        });
    }
    else {
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    }
});
exports.forgetpassword = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const user = await usermodel_1.default.findOne({ email: req.body.email });
    if (!user) {
        return next(new errorhander_1.default("Don't have an ID with this email", 404));
    }
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;
    const message = `Your password reset link is: \n\n ${resetPasswordUrl} \n\n If you did not request this email, please ignore it.`;
    try {
        await (0, sendemail_1.default)({
            email: user.email,
            subject: "E-commerce Password Recovery",
            message
        });
        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email}`
        });
    }
    catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new errorhander_1.default("Failed to send email. Please try again later.", 500));
    }
});
exports.resetPassword = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const resetPasswordToken = crypto_1.default.createHash("sha256").update(req.params.token).digest("hex");
    const user = await usermodel_1.default.findOne({
        resetPasswordToken,
        resetPasswordExpire: {
            $gt: Date.now()
        }
    });
    if (!user) {
        return next(new errorhander_1.default("reset password token is invalid", 400));
    }
    if (req.body.password != req.body.confirmpassword) {
        return next(new errorhander_1.default("reset password and cofirm password do not match", 400));
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    (0, jwtToken_1.sendToken)(user, 200, res);
});
exports.getuserdetail = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        user,
    });
});
exports.checkuser = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const { email } = req.body;
    try {
        const user = await usermodel_1.default.findOne({ email: email });
        if (user) {
            res.status(200).json({
                success: true,
                user,
            });
        }
        else {
            res.status(200).json({
                success: false,
                message: "User not found",
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
exports.updatepassword = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const user = await usermodel_1.default.findById(req.user?.id).select("+password");
    if (!user) {
        return next(new errorhander_1.default("User not found", 404));
    }
    const isPasswordMatched = await user.comparePassword(req.body.oldpassword);
    if (!isPasswordMatched) {
        return next(new errorhander_1.default("old password is not correct", 404));
    }
    if (req.body.newpassword != req.body.confirmpassword) {
        return next(new errorhander_1.default("reset password and cofirm password do not match", 400));
    }
    user.password = req.body.newpassword;
    await user.save();
    res.status(200).json({
        success: true,
        user,
    });
});
exports.updateprofile = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const user = await usermodel_1.default.findById(req.params.id);
    if (!user) {
        return next(new errorhander_1.default("User not found", 404));
    }
    console.log(user);
    if (req.body.name)
        user.name = req.body.name;
    if (req.body.email)
        user.email = req.body.email;
    if (req.body.phoneNumber)
        user.phoneNumber = req.body.phoneNumber;
    if (req.body.pincode)
        user.pincode = req.body.pincode;
    if (req.body.city)
        user.city = req.body.city;
    if (req.body.state)
        user.state = req.body.state;
    await user.save({ validateBeforeSave: true });
    res.status(200).json({
        success: true,
        user,
    });
});
exports.getAllUser = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const users = await usermodel_1.default.find();
    res.status(200).json({
        success: true,
        users
    });
});
exports.getsingleUser = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const user = await usermodel_1.default.findById(req.params.id);
    if (!user) {
        return next(new errorhander_1.default(`User does not exist with Id: ${req.params.id}`, 404));
    }
    res.status(200).json({
        success: true,
        user,
    });
});
exports.deleteUser = (0, catchAsyncErrors_1.default)(async (req, res, next) => {
    const user = await usermodel_1.default.findById(req.params.id);
    if (!user) {
        return next(new errorhander_1.default("User not found", 404));
    }
    await user.deleteOne();
    res.status(200).json({
        success: true,
        message: "User deleted successfully"
    });
});
//# sourceMappingURL=usercontroller.js.map