import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, MedicalServices, LocalPharmacy, BugReport, Refresh } from '@mui/icons-material';
import { api } from '../../../utils/api';
import axios from 'axios';

const MedicalInfoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPatientData = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(api.getUrl(`${id}/patient/info`));
      
      if (response.data.success && response.data.patient) {
        setPatientData(response.data.patient);
      }
    } catch (error: any) {
      console.error('Error fetching patient data:', error);
      // If patient doesn't exist yet, set empty data
      if (error.response?.status === 404) {
        setPatientData({
          medicalHistory: '',
          allergies: '',
          currentMedications: ''
        });
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPatientData();
  }, [id, fetchPatientData]);

  // Add event listener for page focus to refresh data
  useEffect(() => {
    const handleFocus = () => {
      fetchPatientData();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchPatientData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white">Loading medical information...</p>
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
          <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-8">
            <div className="text-center relative">
              <motion.button
                onClick={fetchPatientData}
                disabled={loading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-0 right-0 p-2 bg-white/20 hover:bg-white/30 rounded-full transition duration-300 disabled:opacity-50"
                title="Refresh medical data"
              >
                <Refresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
              <div className="text-6xl mb-4">🏥</div>
              <h1 className="text-3xl font-bold mb-2">Medical Information</h1>
              <p className="text-lg opacity-90">Your health records</p>
            </div>
          </div>

          <div className="p-8">
            {/* Medical History */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <MedicalServices className="mr-3 text-cyan-400" />
                Medical History
              </h2>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10"
              >
                {patientData?.medicalHistory ? (
                  <p className="text-gray-200 text-lg whitespace-pre-wrap">{patientData.medicalHistory}</p>
                ) : (
                  <p className="text-gray-400 italic">No medical history recorded yet.</p>
                )}
              </motion.div>
            </div>

            {/* Allergies */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <BugReport className="mr-3 text-red-400" />
                Allergies
              </h2>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10"
              >
                {patientData?.allergies ? (
                  <p className="text-gray-200 text-lg whitespace-pre-wrap">{patientData.allergies}</p>
                ) : (
                  <p className="text-gray-400 italic">No known allergies recorded.</p>
                )}
              </motion.div>
            </div>

            {/* Current Medications */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <LocalPharmacy className="mr-3 text-green-400" />
                Current Medications
              </h2>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10"
              >
                {patientData?.currentMedications ? (
                  <p className="text-gray-200 text-lg whitespace-pre-wrap">{patientData.currentMedications}</p>
                ) : (
                  <p className="text-gray-400 italic">No current medications recorded.</p>
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
                    to={`/patient/${id}/update_patient`}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Edit className="mr-2" />
                    Update Medical Info
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

export default MedicalInfoPage;

