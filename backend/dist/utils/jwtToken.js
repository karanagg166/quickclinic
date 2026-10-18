"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = void 0;
const sendToken = (user, statusCode, res) => {
    const token = user.getJWTToken();
    const cookieExpireDays = Number(process.env.COOKIE_EXPIRE) || 7;
    const isProduction = process.env.NODE_ENV === 'production';
    const options = {
        expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
    };
    const userObj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    delete userObj.password;
    delete userObj.resetPasswordToken;
    delete userObj.resetPasswordExpire;
    res.status(statusCode).cookie("token", token, options).json({
        success: true,
        user: userObj,
        token,
    });
};
exports.sendToken = sendToken;
//# sourceMappingURL=jwtToken.js.map