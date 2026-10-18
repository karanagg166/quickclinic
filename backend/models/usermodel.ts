import mongoose, { Document, Schema } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "patient" | "doctor" | "admin";
  phoneNumber: string;
  city: string;
  state: string;
  pincode: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
  getJWTToken(): string;
  comparePassword(enteredPassword: string): Promise<boolean>;
  getResetPasswordToken(): string;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, "Please enter your name"],
    maxLength: [30, "Name cannot exceed 30 characters"],
    minLength: [4, "Name should have more than 4 characters"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [8, "Password should be greater than 8 characters"],
    select: false,
  },
  role: {
    type: String,
    enum: ["patient", "doctor", "admin"],
    default: "patient",
  },
  phoneNumber: {
    type: String,
    required: [true, "Please enter your phone number"],
    validate: {
      validator: function(v: string) {
        return /\d{10}/.test(v); // Example for a 10-digit number
      },
      message: (props: any) => `${props.value} is not a valid phone number!`
    }
  },
  city: {
    type: String,
    required: [true, "Please enter your city"],
  },
  state: {
    type: String,
    required: [true, "Please enter your state"],
  },
  pincode: {
    type: String,
    required: [true, "Please enter your pincode"],
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

// Hash password before saving the user
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// Generate JWT token
userSchema.methods.getJWTToken = function (): string {
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET as string, {
    expiresIn: expiresIn,
  } as jwt.SignOptions);
};

// Compare passwords
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate reset password token
userSchema.methods.getResetPasswordToken = function (): string {
  // Generate a random token
  const resetToken = crypto.randomBytes(20).toString("hex");
  
  // Hash the token and set it to the resetPasswordToken field
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  
  // Set the token expiry time to 15 minutes from now
  this.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
  
  // Return the plain token for sending to the user
  return resetToken;
};

export default mongoose.model<IUser>("User", userSchema);
