import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { api } from '../../../utils/api';
import SimpleParticleBackground from '../../common/SimpleParticleBackground';
import GlassCard from '../../common/GlassCard';
import { Search, User as UserIcon, Mail, Phone, MapPin, FileText, AlertCircle } from 'lucide-react';

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
      <div className="min-h-screen relative overflow-hidden">
        <SimpleParticleBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <GlassCard glow className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-400 mx-auto mb-4"></div>
              <p className="text-white/70">Loading patients...</p>
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
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard glow className="overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-neon-500/20 to-cyan-500/20 backdrop-blur-sm border-b border-white/20 p-8">
                <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">
                  Patient Management
                </h1>
                <p className="text-center text-white/70">View and manage your patient information</p>
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
                      className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white placeholder-white/50 transition duration-300"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-white/50" />
                    </div>
                  </div>
                </div>

                {/* Patients List */}
                {filteredPatients.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-white/50 mb-4 flex justify-center">
                      <UserIcon className="h-12 w-12" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No patients found</h3>
                    <p className="text-white/70">Patients will appear here once they book appointments with you.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPatients.map((patient) => (
                      <motion.div
                        key={patient._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-neon-400/50 hover:shadow-lg transition duration-300"
                      >
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-neon-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {patient.user.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <h3 className="font-semibold text-white">{patient.user.name}</h3>
                            <p className="text-sm text-white/70 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {patient.user.email}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-white/80">
                            <Phone className="w-4 h-4 mr-2" />
                            {patient.user.phoneNumber}
                          </div>
                          <div className="flex items-center text-white/80">
                            <MapPin className="w-4 h-4 mr-2" />
                            {patient.user.city}, {patient.user.state}
                          </div>
                        </div>

                        {patient.medicalHistory && (
                          <div className="mt-4 pt-4 border-t border-white/20">
                            <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Medical History
                            </h4>
                            <p className="text-sm text-white/70 line-clamp-2">{patient.medicalHistory}</p>
                          </div>
                        )}

                        {patient.allergies && (
                          <div className="mt-2">
                            <h4 className="font-medium text-white mb-1 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-red-400" />
                              Allergies
                            </h4>
                            <p className="text-sm text-red-300">{patient.allergies}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PatientsPage;
