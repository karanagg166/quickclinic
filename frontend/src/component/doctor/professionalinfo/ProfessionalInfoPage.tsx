import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, Refresh } from '@mui/icons-material';
import { GraduationCap, Briefcase, DollarSign } from 'lucide-react';
import { api } from '../../../utils/api';
import axios from 'axios';

const ProfessionalInfoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [doctorData, setDoctorData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDoctorData = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(api.getUrl(`${id}/doctor/info`));
      
      if (response.data.success && response.data.doctor) {
        setDoctorData(response.data.doctor);
      }
    } catch (error: any) {
      console.error('Error fetching doctor data:', error);
      // If doctor doesn't exist yet, set empty data
      if (error.response?.status === 404) {
        setDoctorData({
          specialization: '',
          experience: 0,
          fees: 0
        });
      }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white">Loading professional information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-24 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/20"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
            <div className="text-center relative">
              <motion.button
                onClick={fetchDoctorData}
                disabled={loading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-0 right-0 p-2 bg-white/20 hover:bg-white/30 rounded-full transition duration-300 disabled:opacity-50"
                title="Refresh professional data"
              >
                <Refresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
              <div className="text-6xl mb-4">👨‍⚕️</div>
              <h1 className="text-3xl font-bold mb-2">Professional Information</h1>
              <p className="text-lg opacity-90">Your practice details</p>
            </div>
          </div>

          <div className="p-8">
            {/* Specialization */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <GraduationCap className="mr-3 text-blue-400" />
                Specialization
              </h2>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10"
              >
                {doctorData?.specialization ? (
                  <p className="text-gray-200 text-lg">{doctorData.specialization}</p>
                ) : (
                  <p className="text-gray-400 italic">No specialization recorded yet.</p>
                )}
              </motion.div>
            </div>

            {/* Experience */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <Briefcase className="mr-3 text-green-400" />
                Experience
              </h2>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10"
              >
                {doctorData?.experience ? (
                  <p className="text-gray-200 text-lg">
                    {doctorData.experience} {doctorData.experience === 1 ? 'year' : 'years'} of experience
                  </p>
                ) : (
                  <p className="text-gray-400 italic">No experience recorded yet.</p>
                )}
              </motion.div>
            </div>

            {/* Consultation Fees */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <DollarSign className="mr-3 text-yellow-400" />
                Consultation Fees
              </h2>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10"
              >
                {doctorData?.fees ? (
                  <p className="text-gray-200 text-lg">
                    ₹{doctorData.fees} per consultation
                  </p>
                ) : (
                  <p className="text-gray-400 italic">No consultation fees set yet.</p>
                )}
              </motion.div>
            </div>

            {/* Action Buttons */}
            <div className="text-center pt-6 border-t border-white/20">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={`/doctor/${id}/update_doctor`}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Edit className="mr-2" />
                    Update Professional Info
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfessionalInfoPage;

