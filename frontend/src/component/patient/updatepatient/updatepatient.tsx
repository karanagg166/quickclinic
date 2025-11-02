import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { api } from '../../../utils/api';

const PatientForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [medicalHistory, setMedicalHistory] = useState<string>('');
  const [allergies, setAllergies] = useState<string>('');
  const [currentMedications, setCurrentMedications] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch existing patient data
  const fetchPatientData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(api.getUrl(`${id}/patient/info`));
      
      if (response.data.success && response.data.patient) {
        setMedicalHistory(response.data.patient.medicalHistory || '');
        setAllergies(response.data.patient.allergies || '');
        setCurrentMedications(response.data.patient.currentMedications || '');
      }
    } catch (error: any) {
      // If patient doesn't exist yet, that's okay - fields will be empty
      if (error.response?.status !== 404) {
        console.error('Error fetching patient data:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(api.getUrl(`${id}/patient/create_patient`), {
        medicalHistory,
        allergies,
        currentMedications,
      });
      
      if (response.data.success) {
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('patientDataUpdated', { 
          detail: { patient: response.data.patient } 
        }));
        
        navigate(location.state?.from || `/patient/${id}/medical_info`);
        alert('Medical information updated successfully!');
      } else {
        alert('Update failed!');
      }
    } catch (error: any) {
      console.error('Error submitting patient information:', error);
      alert(error.response?.data?.message || 'Error updating medical information. Please try again.');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900'} transition-all duration-300 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading medical information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900'} transition-all duration-300`}>
      {/* Dark Mode Toggle */}
      <div 
        className="fixed top-20 right-4 z-50 cursor-pointer p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
        onClick={toggleDarkMode}
        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {darkMode ? (
          <Brightness7 className="text-yellow-400" fontSize="large" />
        ) : (
          <Brightness4 className="text-white" fontSize="large" />
        )}
      </div>

      {/* Main Container */}
      <div className="flex min-h-screen items-center justify-center p-8 pt-24">
        <div className={`w-full max-w-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-8 transition-all duration-300`}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏥</div>
            <h2 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              Update Medical Information
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Modify your medical details to keep your profile up to date
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="medicalHistory" className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Medical History
              </label>
              <textarea
                id="medicalHistory"
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600' 
                    : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:bg-white'
                }`}
                rows={4}
                placeholder="Please describe any previous medical conditions, surgeries, or treatments..."
              />
            </div>
            
            <div>
              <label htmlFor="allergies" className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Allergies
              </label>
              <textarea
                id="allergies"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600' 
                    : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:bg-white'
                }`}
                rows={2}
                placeholder="Please list any known allergies to medications, foods, or other substances..."
              />
            </div>
            
            <div>
              <label htmlFor="currentMedications" className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Current Medications
              </label>
              <textarea
                id="currentMedications"
                value={currentMedications}
                onChange={(e) => setCurrentMedications(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600' 
                    : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:bg-white'
                }`}
                rows={2}
                placeholder="Please list all current medications, including dosages and frequency..."
              />
            </div>
            
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:shadow-lg ${
                darkMode
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
              }`}
            >
              Update Medical Information
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientForm;