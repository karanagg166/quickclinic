import React, { useState } from 'react';
import axios from 'axios';
import { api } from '../../../utils/api';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SimpleParticleBackground from '../../common/SimpleParticleBackground';
import GlassCard from '../../common/GlassCard';
import NeonButton from '../../common/NeonButton';
import { Search, Calendar, Clock, MapPin, User, Phone, Mail, FileText, AlertCircle, Pill } from 'lucide-react';

interface Appointment {
  _id: string;
  patient: {
    user: {
      name: string;
      email: string;
      phoneNumber: string;
      city: string;
      state: string;
    };
    allergies: string;
    currentMedications: string;
    medicalHistory: string;
  };
  date: string;
  time: string;
  status: string;
}

const AppointmentHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Define individual state for each filter field
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [status, setStatus] = useState<string>(''); // Status as a dropdown
  const [patientName, setPatientName] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Fetch search results from the backend with filters
  const handleSearch = async () => {
    try {
      // Build query parameters object with only non-empty values
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;
      if (city.trim()) params.city = city.trim();
      if (status) params.status = status;
      if (patientName.trim()) params.patientName = patientName.trim();

      const response = await axios.put(api.getUrl(`${id}/doctor/specific_appointment`), params);
      const data = response.data.appointments;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching search results:', error);
      alert('Error fetching appointments. Please try again.');
    }
  };

  // Handlers for input changes
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value);
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value);
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value);
  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value);
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value);
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value);
  const handlePatientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => setPatientName(e.target.value);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SimpleParticleBackground />
      <div className="relative z-10 min-h-screen pt-28 p-6 lg:ml-80">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search/Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard glow className="overflow-hidden">
              <div className="bg-gradient-to-r from-neon-500/20 to-cyan-500/20 backdrop-blur-sm border-b border-white/20 p-8">
                <h2 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
                  <Search className="w-8 h-8 text-neon-400" />
                  Search Appointments
                </h2>
                <p className="text-center text-white/70">Filter appointments by date, time, city, status, or patient name</p>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="startDate" className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={startDate}
                      onChange={handleStartDateChange}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white placeholder-white/50 transition duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={endDate}
                      onChange={handleEndDateChange}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white placeholder-white/50 transition duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="startTime" className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Start Time
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={startTime}
                      onChange={handleStartTimeChange}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white placeholder-white/50 transition duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="endTime" className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      End Time
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      name="endTime"
                      value={endTime}
                      onChange={handleEndTimeChange}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white placeholder-white/50 transition duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={city}
                      onChange={handleCityChange}
                      placeholder="Enter city"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white placeholder-white/50 transition duration-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="status" className="text-sm font-medium text-white/80 mb-2">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={status}
                      onChange={handleStatusChange}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white transition duration-300"
                    >
                      <option value="" className="bg-gray-800">Select Status</option>
                      <option value="Scheduled" className="bg-gray-800">Scheduled</option>
                      <option value="Canceled" className="bg-gray-800">Canceled</option>
                      <option value="Completed" className="bg-gray-800">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="patientName" className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Patient Name
                    </label>
                    <input
                      type="text"
                      id="patientName"
                      name="patientName"
                      value={patientName}
                      onChange={handlePatientNameChange}
                      placeholder="Enter patient name"
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white placeholder-white/50 transition duration-300"
                    />
                  </div>
                  <div className="flex items-end">
                    <NeonButton 
                      onClick={handleSearch}
                      className="w-full"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Apply Filters
                    </NeonButton>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Appointments List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {appointments.length === 0 ? (
              <GlassCard glow className="p-12">
                <div className="text-center">
                  <Search className="w-16 h-16 text-white/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No appointments found</h3>
                  <p className="text-white/70">Try adjusting your search filters to find appointments.</p>
                </div>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {appointments.map((appointment, index) => (
                  <motion.div
                    key={appointment._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <GlassCard glow className="overflow-hidden hover:border-neon-400/50 transition duration-300">
                      <div className="border-l-4 border-neon-400 pl-4">
                        <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                          <User className="w-5 h-5 text-neon-400" />
                          Patient Details
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-3">
                            <User className="w-4 h-4 text-neon-400 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-white/70">Patient Name</p>
                              <p className="text-white font-medium">{appointment.patient.user.name}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Mail className="w-4 h-4 text-neon-400 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-white/70">Email</p>
                              <p className="text-white font-medium">{appointment.patient.user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Phone className="w-4 h-4 text-neon-400 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-white/70">Phone</p>
                              <p className="text-white font-medium">{appointment.patient.user.phoneNumber}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-neon-400 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-white/70">Location</p>
                              <p className="text-white font-medium">{appointment.patient.user.city}, {appointment.patient.user.state}</p>
                            </div>
                          </div>
                          {appointment.patient.allergies && (
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-white/70">Allergies</p>
                                <p className="text-red-300 font-medium">{appointment.patient.allergies}</p>
                              </div>
                            </div>
                          )}
                          {appointment.patient.currentMedications && (
                            <div className="flex items-start gap-3">
                              <Pill className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-white/70">Current Medications</p>
                                <p className="text-white font-medium">{appointment.patient.currentMedications}</p>
                              </div>
                            </div>
                          )}
                          {appointment.patient.medicalHistory && (
                            <div className="flex items-start gap-3">
                              <FileText className="w-4 h-4 text-neon-400 mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-white/70">Medical History</p>
                                <p className="text-white font-medium">{appointment.patient.medicalHistory}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/20">
                          <div className="flex items-center gap-3 mb-3">
                            <Calendar className="w-4 h-4 text-neon-400" />
                            <p className="text-white/70">Date:</p>
                            <p className="text-white font-medium">{new Date(appointment.date).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-3 mb-3">
                            <Clock className="w-4 h-4 text-neon-400" />
                            <p className="text-white/70">Time:</p>
                            <p className="text-white font-medium">{appointment.time}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-white/70">Status:</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              appointment.status === 'Scheduled' 
                                ? 'bg-neon-500/30 text-neon-300 border border-neon-400/50' :
                              appointment.status === 'Completed' 
                                ? 'bg-green-500/30 text-green-300 border border-green-400/50' :
                                'bg-red-500/30 text-red-300 border border-red-400/50'
                            }`}>
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentHistory;
