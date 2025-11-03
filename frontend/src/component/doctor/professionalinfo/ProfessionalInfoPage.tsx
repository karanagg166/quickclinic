import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, Refresh } from '@mui/icons-material';
import { GraduationCap, Briefcase, DollarSign } from 'lucide-react';
import { api } from '../../../utils/api';
import axios from 'axios';
import SimpleParticleBackground from '../../common/SimpleParticleBackground';
import GlassCard from '../../common/GlassCard';
import NeonButton from '../../common/NeonButton';

const ProfessionalInfoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [doctorData, setDoctorData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDoctorData = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(api.getUrl(`${id}/doctor/info`));
      
      if (response.data.success) {
        // Backend now returns 200 with empty/default values if doctor doesn't exist
        setDoctorData(response.data.doctor || {
          specialization: '',
          experience: 0,
          fees: 0
        });
      }
    } catch (error: any) {
      console.error('Error fetching doctor data:', error);
      // Fallback to empty data on any error
      setDoctorData({
        specialization: '',
        experience: 0,
        fees: 0
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDoctorData();
  }, [id, fetchDoctorData]);

  // Add event listener for page focus to refresh data
  useEffect(() => {
    const handleFocus = () => {
      fetchDoctorData();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchDoctorData]);

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <SimpleParticleBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center pt-28">
          <GlassCard glow className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-400 mx-auto mb-4"></div>
              <p className="text-white/70">Loading professional information...</p>
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
                <div className="text-center relative">
                  <motion.button
                    onClick={fetchDoctorData}
                    disabled={loading}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute top-0 right-0 p-2 bg-white/20 hover:bg-white/30 rounded-full transition duration-300 disabled:opacity-50"
                    title="Refresh professional data"
                  >
                    <Refresh className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
                  </motion.button>
                  <div className="text-6xl mb-4">👨‍⚕️</div>
                  <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">Professional Information</h1>
                  <p className="text-lg text-white/80">Your practice details</p>
                </div>
              </div>

              <div className="p-8">
                {/* Specialization */}
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">
                    <GraduationCap className="text-neon-400" />
                    Specialization
                  </h2>
                  
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20"
                  >
                    {doctorData?.specialization ? (
                      <p className="text-white text-lg">{doctorData.specialization}</p>
                    ) : (
                      <p className="text-white/50 italic">No specialization recorded yet.</p>
                    )}
                  </motion.div>
                </div>

                {/* Experience */}
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">
                    <Briefcase className="text-cyan-400" />
                    Experience
                  </h2>
                  
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20"
                  >
                    {doctorData?.experience ? (
                      <p className="text-white text-lg">
                        {doctorData.experience} {doctorData.experience === 1 ? 'year' : 'years'} of experience
                      </p>
                    ) : (
                      <p className="text-white/50 italic">No experience recorded yet.</p>
                    )}
                  </motion.div>
                </div>

                {/* Consultation Fees */}
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">
                    <DollarSign className="text-neon-400" />
                    Consultation Fees
                  </h2>
                  
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20"
                  >
                    {doctorData?.fees ? (
                      <p className="text-white text-lg">
                        ₹{doctorData.fees} per consultation
                      </p>
                    ) : (
                      <p className="text-white/50 italic">No consultation fees set yet.</p>
                    )}
                  </motion.div>
                </div>

                {/* Action Buttons */}
                <div className="text-center pt-6 border-t border-white/20">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to={`/doctor/${id}/update_doctor`}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-500 to-cyan-500 text-white border border-neon-400 hover:from-neon-400 hover:to-cyan-400 font-semibold rounded-lg transition duration-300 shadow-lg shadow-neon-500/25 hover:shadow-xl hover:shadow-neon-500/40"
                    >
                      <Edit className="mr-2" />
                      Update Professional Info
                    </Link>
                  </motion.div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalInfoPage;

