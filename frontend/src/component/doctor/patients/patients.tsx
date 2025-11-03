import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { api } from '../../../utils/api';

interface Patient {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
    city: string;
    state: string;
  };
  medicalHistory: string;
  allergies: string;
  currentMedications: string;
}

const PatientsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        // Fetch all patients who have appointments with this doctor
        const response = await axios.post(api.getUrl(`${id}/doctor/getpatients`), {
          // Empty body will return all patients
        });
        
        if (response.data.success && response.data.patients) {
          // Transform the response to match our Patient interface
          const transformedPatients = response.data.patients.map((p: any) => ({
            _id: p._id || Math.random().toString(),
            user: {
              _id: p._id || '',
              name: p.name || 'Unknown',
              email: p.email || '',
              phoneNumber: p.phone || '',
              city: p.city || '',
              state: p.state || ''
            },
            medicalHistory: p.medicalHistory || '',
            allergies: p.allergies || '',
            currentMedications: p.currentMedications || ''
          }));
          setPatients(transformedPatients);
        } else {
          setPatients([]);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPatients();
    }
  }, [id]);

  const filteredPatients = patients.filter(patient =>
    patient.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 lg:ml-80 pt-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
            <h1 className="text-3xl font-bold text-center mb-2">Patient Management</h1>
            <p className="text-center text-blue-100">View and manage your patient information</p>
          </div>

          <div className="p-8">
            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search patients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Patients List */}
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
                <p className="text-gray-600">Patients will appear here once they book appointments with you.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatients.map((patient) => (
                  <motion.div
                    key={patient._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition duration-300"
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {patient.user.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold text-gray-900">{patient.user.name}</h3>
                        <p className="text-sm text-gray-600">{patient.user.email}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {patient.user.phoneNumber}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {patient.user.city}, {patient.user.state}
                      </div>
                    </div>

                    {patient.medicalHistory && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Medical History</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{patient.medicalHistory}</p>
                      </div>
                    )}

                    {patient.allergies && (
                      <div className="mt-2">
                        <h4 className="font-medium text-gray-900 mb-1">Allergies</h4>
                        <p className="text-sm text-red-600">{patient.allergies}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PatientsPage;
