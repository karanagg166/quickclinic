import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { api } from '../../../utils/api';
import { motion } from 'framer-motion';
import SimpleParticleBackground from '../../common/SimpleParticleBackground';
import GlassCard from '../../common/GlassCard';
import NeonButton from '../../common/NeonButton';
import { User, Mail, Phone, MapPin, GraduationCap, Briefcase, DollarSign, FileText } from 'lucide-react';

const DoctorUpdatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    specialization: '',
    experience: '',
    fees: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<any>(null);

  // Load current doctor data
  useEffect(() => {
    const loadDoctorData = async () => {
      try {
        setInitialLoading(true);
        
        // Load user data from localStorage
        const authState = localStorage.getItem('authState');
        const authData = authState ? JSON.parse(authState) : null;
        setUserData(authData?.user);

        // Load doctor-specific data
        const response = await axios.get(api.getUrl(`${id}/doctor/info`));
        if (response.data.success) {
          // Backend now returns 200 with empty/default values if doctor doesn't exist
          const doctorData = response.data.doctor || {};
          setFormData({
            specialization: doctorData.specialization || '',
            experience: doctorData.experience?.toString() || '',
            fees: doctorData.fees?.toString() || ''
          });
        }
      } catch (error) {
        console.error('Error loading doctor data:', error);
        // Set empty form data as fallback
        setFormData({
          specialization: '',
          experience: '',
          fees: ''
        });
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) {
      loadDoctorData();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build payload with only provided values (don't send empty strings for numeric fields if they weren't changed)
      const payload: any = {};
      
      if (formData.specialization && formData.specialization.trim() !== '') {
        payload.specialization = formData.specialization.trim();
      }
      
      if (formData.experience && formData.experience.trim() !== '') {
        const expValue = parseInt(formData.experience);
        if (!isNaN(expValue) && expValue >= 0) {
          payload.experience = expValue;
        }
      }
      
      if (formData.fees && formData.fees.trim() !== '') {
        const feesValue = parseInt(formData.fees);
        if (!isNaN(feesValue) && feesValue >= 0) {
          payload.fees = feesValue;
        }
      }

      console.log('Submitting doctor update:', payload);
      console.log('API URL:', api.getUrl(`${id}/doctor/update_doctor`));

      const response = await axios.post(api.getUrl(`${id}/doctor/update_doctor`), payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response received:', response.data);
      
      if (response.data.success) {
        // Update localStorage with the new doctor data
        const authState = localStorage.getItem('authState');
        const authData = authState ? JSON.parse(authState) : null;
        
        if (authData && response.data.doctor) {
          const updatedUser = { ...authData.user, ...response.data.doctor };
          const updatedAuthData = {
            ...authData,
            user: updatedUser
          };
          localStorage.setItem('authState', JSON.stringify(updatedAuthData));
          
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('userDataUpdated', { 
            detail: { user: updatedUser } 
          }));
          
          // Also dispatch doctor-specific event
          window.dispatchEvent(new CustomEvent('doctorDataUpdated', { 
            detail: { doctor: response.data.doctor } 
          }));
        }
        
        alert('Doctor information updated successfully!');
        
        // Reload the doctor data to show updated values in "Current" section
        const refreshResponse = await axios.get(api.getUrl(`${id}/doctor/info`));
        if (refreshResponse.data.success && refreshResponse.data.doctor) {
          const doctorData = refreshResponse.data.doctor;
          setFormData({
            specialization: doctorData.specialization || '',
            experience: doctorData.experience?.toString() || '',
            fees: doctorData.fees?.toString() || ''
          });
        }
      } else {
        alert('Update failed: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error updating doctor information:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error updating doctor information. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const specialties = [
    'Cardiologist',
    'Dermatologist',
    'Neurologist',
    'Orthopedist',
    'Pediatrician',
    'Psychiatrist',
    'Gynecologist',
    'General Physician',
    'Ophthalmologist',
    'ENT Specialist'
  ];

  if (initialLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <SimpleParticleBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center pt-28">
          <GlassCard glow className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-400 mx-auto mb-4"></div>
              <p className="text-white/70">Loading doctor information...</p>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SimpleParticleBackground />
      <div className="relative z-10 min-h-screen pt-28 p-6 lg:ml-80">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard glow className="overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-neon-500/20 to-cyan-500/20 backdrop-blur-sm border-b border-white/20 p-8">
                <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">Update Doctor Information</h1>
                <p className="text-center text-white/70">Keep your profile and professional details up to date</p>
              </div>

              <div className="p-8">
                {/* User Information Section */}
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">
                    <User className="w-6 h-6 text-neon-400" />
                    Personal Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                      <label className="text-sm font-medium text-white/80 mb-1 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Name
                      </label>
                      <p className="text-lg text-white">{userData?.name || 'N/A'}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                      <label className="text-sm font-medium text-white/80 mb-1 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </label>
                      <p className="text-lg text-white">{userData?.email || 'N/A'}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                      <label className="text-sm font-medium text-white/80 mb-1 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone
                      </label>
                      <p className="text-lg text-white">{userData?.phoneNumber || 'N/A'}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                      <label className="text-sm font-medium text-white/80 mb-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </label>
                      <p className="text-lg text-white">{userData?.city && userData?.state ? `${userData.city}, ${userData.state}` : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Current Professional Information Display */}
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">
                    <FileText className="w-6 h-6 text-neon-400" />
                    Current Professional Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
                    <div>
                      <label className="text-sm font-medium text-white/80 mb-1">Current Specialization</label>
                      <p className="text-lg font-semibold text-white">{formData.specialization || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/80 mb-1">Current Experience</label>
                      <p className="text-lg font-semibold text-white">{formData.experience ? `${formData.experience} years` : 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/80 mb-1">Current Consultation Fees</label>
                      <p className="text-lg font-semibold text-white">{formData.fees ? `₹${formData.fees}` : 'Not set'}</p>
                    </div>
                  </div>
                </div>

                {/* Professional Information Section */}
                <div>
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">
                    <GraduationCap className="w-6 h-6 text-neon-400" />
                    Update Professional Information
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="specialization" className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          Specialization *
                        </label>
                        <select
                          id="specialization"
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white transition duration-300"
                          required
                        >
                          <option value="" className="bg-gray-800">Select Specialization</option>
                          {specialties.map((specialty) => (
                            <option key={specialty} value={specialty} className="bg-gray-800">
                              {specialty}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="experience" className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Experience (Years) *
                        </label>
                        <input
                          type="number"
                          id="experience"
                          name="experience"
                          value={formData.experience}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white placeholder-white/50 transition duration-300"
                          placeholder="Enter years of experience"
                          min="0"
                          max="50"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="fees" className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Consultation Fees (₹) *
                      </label>
                      <input
                        type="number"
                        id="fees"
                        name="fees"
                        value={formData.fees}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white placeholder-white/50 transition duration-300"
                        placeholder="Enter consultation fees"
                        min="0"
                        step="50"
                        required
                      />
                    </div>

                    <div className="text-center pt-6">
                      <NeonButton
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Updating...
                          </div>
                        ) : (
                          'Update Professional Information'
                        )}
                      </NeonButton>
                    </div>
                  </form>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DoctorUpdatePage;
