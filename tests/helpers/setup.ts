import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../../backend/models/usermodel';
import Doctor from '../../backend/models/doctormodel';
import Patient from '../../backend/models/patientmodel';

let mongoServer: MongoMemoryServer | null = null;
export const JWT_SECRET_TEST = 'quickclinic_test_jwt_secret_12345';
process.env.JWT_SECRET = JWT_SECRET_TEST;
process.env.NODE_ENV = 'test';

export const connectTestDb = async (): Promise<string> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  return uri;
};

export const clearTestDb = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
};

export const closeTestDb = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

export const generateTestToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET_TEST, { expiresIn: '1d' });
};

export const createTestPatient = async (overrides: any = {}) => {
  const user = await User.create({
    name: 'Test Patient',
    email: `patient_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
    password: 'password123',
    role: 'patient',
    gender: 'other',
    phoneNumber: '9876543210',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    ...overrides,
  });

  const patient = await Patient.create({
    user: user._id,
    name: user.name,
    email: user.email,
  });

  const token = generateTestToken(user._id.toString());
  return { user, patient, token };
};

export const createTestDoctor = async (overrides: any = {}) => {
  const user = await User.create({
    name: 'Dr. Test Specialist',
    email: `doctor_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
    password: 'password123',
    role: 'doctor',
    gender: 'other',
    phoneNumber: '9876543210',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    ...overrides,
  });

  const doctor = await Doctor.create({
    user: user._id,
    name: user.name,
    email: user.email,
    fees: 500,
    specialization: 'Cardiology',
    experience: 10,
    startTime: '09:00',
    endTime: '17:00',
  });

  const token = generateTestToken(user._id.toString());
  return { user, doctor, token };
};
