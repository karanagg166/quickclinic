import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CitySelect,
  CountrySelect,
  StateSelect,
} from 'react-country-state-city';
import 'react-country-state-city/dist/react-country-state-city.css';
import axios from 'axios';
import { api } from '../../../../utils/api';
import DoctorCard from '../doctorlist/doctorlist';
import appointment from '../../../../images/appointment1.jpg';
import SimpleParticleBackground from '../../../common/SimpleParticleBackground';
import GlassCard from '../../../common/GlassCard';
import NeonButton from '../../../common/NeonButton';
import { Search, MapPin, User, Stethoscope, Clock, DollarSign, Calendar } from 'lucide-react';

interface Doctor {
  _id: string;
  user: {
    name: string;
    email: string;
    phoneNumber: string;
    city: string;
    state: string;
  };
  specialization: string;
  experience: number;
  fees: number;
}

const BookingPage: React.FC = () => {
  // State and parameters
  const defaultCountryId = 101; // India's ID according to the react-country-state-city library
  const [countryId, setCountryId] = useState<number>(defaultCountryId);
  const [stateId, setStateId] = useState<number>(0);
  const [city, setCityId] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>('');
  const [experience, setExperience] = useState<string>('');
  const [fees, setFees] = useState<string>('');
  const [doctorName, setDoctorName] = useState<string>('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const { id } = useParams<{ id: string }>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data } = await axios.get(api.getUrl(`${id}/patient/specific_doctors`), {
        params: {
          state,
          city,
          fees,
          experience,
          doc_name: doctorName,
          specialty
        }
      });
    console.log("data is here", data);

      if (data.success) {
        setDoctors(data.doctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const specialties = ['Cardiologist', 'Dermatologist', 'Neurologist', 'Orthopedist', 'Pediatrician', 'Psychiatrist', 'Gynecologist', 'General Physician'];


  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Particle Background */}
      <SimpleParticleBackground />
      
      {/* Main Content */}
      <div className="relative z-10 pt-28 pb-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold font-neon mb-6 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">
            Book an Appointment
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Find the perfect doctor for your healthcare needs
          </p>
        </motion.div>

        {/* Search Form and Image */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Search Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <GlassCard glow className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-neon-500 to-cyan-500 rounded-full flex items-center justify-center text-white mr-4">
                    <Search className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Search Doctors</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Location Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-white/90 mb-2">
                        <MapPin className="w-4 h-4 mr-2" />
                        Country
                      </label>
                      <CountrySelect
                        defaultValue={{ isoCode: 'IN', name: 'India' }}
                        onChange={(e: any) => setCountryId(e.id)}
                        placeHolder="Select Country"
                        required
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition duration-300"
                      />
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-medium text-white/90 mb-2">
                        <MapPin className="w-4 h-4 mr-2" />
                        State
                      </label>
                      <StateSelect
                        countryid={countryId}
                        onChange={(e: any) => {
                          setStateId(e.id);
                          setState(e.value);
                        }}
                        placeHolder="Select State"
                        required
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition duration-300"
                      />
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-medium text-white/90 mb-2">
                        <MapPin className="w-4 h-4 mr-2" />
                        City
                      </label>
                      <CitySelect
                        countryid={countryId}
                        stateid={stateId}
                        onChange={(e: any) => setCityId(e.name)}
                        placeHolder="Select City"
                        required
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition duration-300"
                      />
                    </div>
                  </div>

                  {/* Specialty and Experience */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-white/90 mb-2">
                        <Stethoscope className="w-4 h-4 mr-2" />
                        Specialty
                      </label>
                      <select
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition duration-300"
                        required
                      >
                        <option value="" disabled className="bg-gray-800">
                          Select Specialty
                        </option>
                        {specialties.map((spec, index) => (
                          <option key={index} value={spec} className="bg-gray-800">
                            {spec}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-medium text-white/90 mb-2">
                        <Clock className="w-4 h-4 mr-2" />
                        Experience (Years)
                      </label>
                      <input
                        type="number"
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition duration-300"
                        placeholder="Enter Experience"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  {/* Fees and Doctor Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-white/90 mb-2">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Fees
                      </label>
                      <input
                        type="number"
                        value={fees}
                        onChange={(e) => setFees(e.target.value)}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition duration-300"
                        placeholder="Enter Fees"
                        min="0"
                        required
                      />
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-medium text-white/90 mb-2">
                        <User className="w-4 h-4 mr-2" />
                        Doctor's Name
                      </label>
                      <input
                        type="text"
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-neon-500 focus:border-transparent transition duration-300"
                        placeholder="Enter Doctor's Name"
                        required
                      />
                    </div>
                  </div>

                  <NeonButton
                    type="submit"
                    size="lg"
                    className="w-full justify-center"
                  >
                    <Search className="w-5 h-5" />
                    Find Doctors
                  </NeonButton>
                </form>
              </GlassCard>
            </motion.div>

            {/* Image Section */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex justify-center items-center"
            >
              <GlassCard glow className="p-8">
                <div className="text-center">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, 2, -2, 0]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-neon-500 to-cyan-500 rounded-full flex items-center justify-center"
                  >
                    <Calendar className="w-16 h-16 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-4">Easy Booking</h3>
                  <p className="text-white/80 mb-6">
                    Find and book appointments with verified doctors in just a few clicks
                  </p>
                  <img 
                    src={appointment} 
                    className='rounded-2xl shadow-2xl max-w-sm w-full h-auto mx-auto' 
                    alt='Appointment booking illustration' 
                  />
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>

        {/* Doctor Results */}
        {doctors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold font-neon mb-4 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">
                Available Doctors
              </h2>
              <p className="text-white/80">
                {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} found matching your criteria
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor, index) => (
                <motion.div
                  key={doctor._id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <DoctorCard doctor={doctor} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
