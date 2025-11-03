import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { api } from '../../../utils/api';
import { useAuth } from '../../auth/AuthContext';
import SimpleParticleBackground from '../../common/SimpleParticleBackground';
import GlassCard from '../../common/GlassCard';
import NeonButton from '../../common/NeonButton';
import { Mail, Lock, User, MapPin, Phone, UserPlus, Stethoscope, Eye, EyeOff } from 'lucide-react';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    phoneNumber: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(api.getUrl('register'), formData);
      if (response.data.success) {
        alert('Registration successful! Please login.');
        navigate('/user/login');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Particle Background */}
      <SimpleParticleBackground />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-neon-500 to-cyan-500 rounded-full flex items-center justify-center"
            >
              <UserPlus className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-4xl font-bold font-neon bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Create Your Account
            </h2>
            <p className="text-white/80">
              Join QuickClinic and start your healthcare journey
            </p>
            <p className="text-white/60 text-sm mt-2">
              Already have an account?{' '}
              <Link
                to="/user/login"
                className="text-neon-400 hover:text-cyan-400 transition-colors underline"
              >
                Sign in here
              </Link>
            </p>
          </motion.div>

          {/* Signup Form */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <GlassCard glow className="p-8">
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Name Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <label htmlFor="name" className="block text-sm font-medium text-white/90 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-400/50" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-neon-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                </motion.div>

                {/* Email Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-400/50" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-neon-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition-all"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </motion.div>

                {/* Role Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-white/90 mb-2">
                      I am a
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-400/50" />
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-neon-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition-all appearance-none"
                      >
                        <option value="patient" className="bg-slate-900">Patient</option>
                        <option value="doctor" className="bg-slate-900">Doctor</option>
                      </select>
                    </div>
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-white/90 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-400/50" />
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        required
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-neon-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition-all"
                        placeholder="+91 1234567890"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Location Fields */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-white/90 mb-2">
                      City
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-400/50" />
                      <input
                        id="city"
                        name="city"
                        type="text"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-neon-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition-all"
                        placeholder="City"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-white/90 mb-2">
                      State
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-400/50" />
                      <input
                        id="state"
                        name="state"
                        type="text"
                        required
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-neon-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition-all"
                        placeholder="State"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-white/90 mb-2">
                      Pincode
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-400/50" />
                      <input
                        id="pincode"
                        name="pincode"
                        type="text"
                        required
                        value={formData.pincode}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-neon-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition-all"
                        placeholder="Pincode"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Password Fields */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-400/50" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-10 pr-12 py-3 bg-white/5 border border-neon-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition-all"
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neon-400/50 hover:text-neon-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-400/50" />
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full pl-10 pr-12 py-3 bg-white/5 border border-neon-500/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition-all"
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neon-400/50 hover:text-neon-400 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <NeonButton
                    type="submit"
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                        Creating Account...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <UserPlus className="w-5 h-5 mr-2" />
                        Create Account
                      </span>
                    )}
                  </NeonButton>
                </motion.div>
              </form>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
