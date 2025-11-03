import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { api } from '../../../../utils/api';
import { format, isSameDay, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../../common/GlassCard';
import NeonButton from '../../../common/NeonButton';
import { Calendar, Clock, DollarSign, User, Mail, Phone, Stethoscope, Award } from 'lucide-react';

interface Doctor {
  _id: string;
  user: {
    name: string;
    email: string;
    phoneNumber: string;
  };
  specialization: string;
  experience: number;
  fees: number;
}

interface DoctorCardProps {
  doctor: Doctor;
}

interface AvailableSlot {
  date: string;
  slots: string[];
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  const [doctorSchedule, setDoctorSchedule] = useState<AvailableSlot[]>([]);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  
  const data2 = localStorage.getItem('authState');
  const parsedData = data2 ? JSON.parse(data2) : null;
  const id = parsedData?.user?._id;
  const navigate = useNavigate();

  const handleBookClick = async () => {
    try {
      const response = await axios.get(api.getUrl(`${id}/patient/appointment_bookings`), {
        params: { doc_id: doctor._id },
      });
     
      if (Array.isArray(response.data.availableSlots)) {
        setDoctorSchedule(response.data.availableSlots);
        setShowCalendar(true);
        
        // Show alert if no schedule is available
        if (response.data.availableSlots.length === 0) {
          alert('This doctor has not set up their schedule yet. Please contact the doctor or try another doctor.');
        }
      } else {
        setDoctorSchedule([]);
        setShowCalendar(false);
        alert('Unable to load doctor schedule. Please try again.');
      }
    } catch (error: any) {
      console.error("Error fetching appointment bookings:", error);
      setDoctorSchedule([]);
      setShowCalendar(false);
      alert(error.response?.data?.message || 'Unable to load doctor schedule. Please try again.');
    }
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const selectedSchedule = doctorSchedule.find((schedule) => schedule.date === formattedDate);
      setAvailableTimes(selectedSchedule ? selectedSchedule.slots : []);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTime(e.target.value);
  };

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select a date and time before booking');
      return;
    }

    // Show the payment modal before proceeding
    setShowPaymentModal(true);
  };

  const handlePaymentChoice = async (mode: 'online' | 'offline') => {
    setShowPaymentModal(false);

    if (mode === 'online') {
      navigate('/payment-appointment');
    } else {
      // Validate required fields
      if (!selectedDate || !selectedTime || !doctor._id) {
        alert('Please select a date, time, and doctor before booking.');
        return;
      }

      const appointmentData = {
        date: selectedDate.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD format
        time: selectedTime,
        paid: false, 
        doc_id: doctor._id,
      };
      console.log("Appointment data being sent:", appointmentData);
      console.log("User ID:", id);
        
      try {
        const response = await axios.post(api.getUrl(`${id}/patient/newappointment`), appointmentData);
        
        if (response.data.success) {
          alert(`Appointment booked on ${format(selectedDate!, 'yyyy-MM-dd')} at ${selectedTime}`);
          setShowCalendar(false);
        } else {
          alert("Failed to book appointment. Please try again.");
        }
      } catch (error) {
        alert("An error occurred while booking the appointment. Please try again.");
      }
    }
  };

  const filterDates = (date: Date) => {
    if (!Array.isArray(doctorSchedule)) return false;
    return doctorSchedule.some((schedule) => isSameDay(date, parseISO(schedule.date)));
  };

  return (
    <GlassCard hover className="p-6">
      {/* Doctor Header */}
      <div className="flex items-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-neon-500 to-cyan-500 rounded-full flex items-center justify-center text-white mr-4">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{doctor.user.name}</h3>
          <p className="text-white/80 text-sm">{doctor.specialization}</p>
        </div>
      </div>

      {/* Doctor Details */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center">
          <Stethoscope className="w-4 h-4 text-cyan-400 mr-3" />
          <span className="text-white/90 text-sm">Specialty: <span className="text-white font-medium">{doctor.specialization}</span></span>
        </div>
        <div className="flex items-center">
          <DollarSign className="w-4 h-4 text-green-400 mr-3" />
          <span className="text-white/90 text-sm">Fees: <span className="text-white font-medium">₹{doctor.fees}</span></span>
        </div>
        <div className="flex items-center">
          <Award className="w-4 h-4 text-yellow-400 mr-3" />
          <span className="text-white/90 text-sm">Experience: <span className="text-white font-medium">{doctor.experience} years</span></span>
        </div>
        <div className="flex items-center">
          <Mail className="w-4 h-4 text-blue-400 mr-3" />
          <span className="text-white/90 text-sm truncate">{doctor.user.email}</span>
        </div>
        <div className="flex items-center">
          <Phone className="w-4 h-4 text-purple-400 mr-3" />
          <span className="text-white/90 text-sm">{doctor.user.phoneNumber}</span>
        </div>
      </div>

      <NeonButton
        onClick={handleBookClick}
        size="md"
        className="w-full justify-center"
      >
        <Calendar className="w-4 h-4" />
        Select Date
      </NeonButton>

      {showCalendar && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"
        >
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-cyan-400 mr-2" />
            <h6 className="text-lg font-semibold text-white">Select Date & Time</h6>
          </div>
          
          {doctorSchedule.length === 0 ? (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                ⚠️ This doctor has not set up their schedule yet. Please contact the doctor or try another doctor.
              </p>
            </div>
          ) : (
            <>
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                dateFormat="yyyy/MM/dd"
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition duration-300"
                filterDate={filterDates}
                placeholderText="Select a date"
              />
            </>
          )}
          
          {availableTimes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-4"
            >
              <label className="block text-sm font-medium text-white/90 mb-2">Select Time:</label>
              <select 
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition duration-300" 
                value={selectedTime} 
                onChange={handleTimeChange}
              >
                <option value="" className="bg-gray-800">Select a time</option>
                {availableTimes.map((time, index) => (
                  <option key={index} value={time} className="bg-gray-800">
                    {time}
                  </option>
                ))}
              </select>
            </motion.div>
          )}
          
          <NeonButton
            onClick={handleBookAppointment}
            disabled={!selectedDate || !selectedTime}
            size="md"
            className="w-full mt-4 justify-center"
          >
            <Calendar className="w-4 h-4" />
            Book Appointment
          </NeonButton>
        </motion.div>
      )}
      {/* Payment Modal */}
      {showPaymentModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowPaymentModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-6">Select Payment Mode</h3>
              <div className="space-y-4">
                <NeonButton
                  onClick={() => handlePaymentChoice('online')}
                  size="lg"
                  className="w-full justify-center"
                >
                  <DollarSign className="w-5 h-5" />
                  Pay Online
                </NeonButton>
                <NeonButton
                  onClick={() => handlePaymentChoice('offline')}
                  variant="outline"
                  size="lg"
                  className="w-full justify-center"
                >
                  <Clock className="w-5 h-5" />
                  Pay Offline
                </NeonButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </GlassCard>
  );
};

export default DoctorCard;
