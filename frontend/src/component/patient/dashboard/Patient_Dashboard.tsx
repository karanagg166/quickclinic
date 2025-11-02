import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../common/GlassCard';
import SimpleParticleBackground from '../../common/SimpleParticleBackground';
import NeonButton from '../../common/NeonButton';
import { Calendar, Clock, Users, Stethoscope, Heart, Zap, User, History, X, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { api } from '../../../utils/api';
import url_to_doctor_image1 from '../../../images/1.jpg';
import url_to_doctor_image2 from '../../../images/2.jpg';
import url_to_doctor_image3 from '../../../images/3.jpg';
import menstrualcycle from '../../../images/mens.jpg';
import acne from '../../../images/acne.jpg';
import cold_cough from '../../../images/cold_cough.jpg';
import child_not from '../../../images/child.avif';
import depp from '../../../images/depp.jpg';
import dentist from '../../../images/oral.png';
import gynecologist from '../../../images/Gynecologist.jpg';
import nutrition from '../../../images/Nutrition.jpg';
import physiotherapist from '../../../images/Physiotherapist.jpg';
import { Link, useParams } from 'react-router-dom';

const PatientDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    completedAppointments: 0,
    doctorsInCity: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(api.getUrl(`${id}/patient/dashboard_stats`));
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Refresh stats when page gains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchDashboardStats();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchDashboardStats]);
  
  const consultationOptions = [
    { title: 'Period doubts or Pregnancy', image: menstrualcycle },
    { title: 'Acne, pimple or skin issues', image: acne },
    { title: 'Cold, cough or fever', image: cold_cough },
    { title: 'Child not feeling well', image: child_not },
    { title: 'Depression or anxiety', image: depp },
  ];

  const specialties = [
    { title: 'Dentist', image: dentist },
    { title: 'Gynecologist/Obstetrician', image: gynecologist },
    { title: 'Dietitian/Nutrition', image: nutrition },
    { title: 'Physiotherapist', image: physiotherapist }
  ];

  return (
    <>
      <div className='app-container relative min-h-screen py-8 pt-28'>
        <SimpleParticleBackground />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold font-neon mb-6 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">
              Welcome to Your Dashboard
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Manage your health with our advanced healthcare platform
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            {[
              { 
                icon: <Clock className="w-8 h-8" />, 
                title: "Upcoming", 
                value: loading ? "..." : stats.upcomingAppointments.toString(), 
                color: "from-green-500 to-emerald-500" 
              },
              { 
                icon: <CheckCircle className="w-8 h-8" />, 
                title: "Total Successful", 
                value: loading ? "..." : stats.completedAppointments.toString(), 
                color: "from-blue-500 to-cyan-500" 
              },
              { 
                icon: <Users className="w-8 h-8" />, 
                title: "Doctors in Your City", 
                value: loading ? "..." : stats.doctorsInCity.toString(), 
                color: "from-purple-500 to-violet-500" 
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              >
                <GlassCard glow className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center text-white`}>
                    {stat.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{stat.value}</h3>
                  <p className="text-white/80">{stat.title}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                title: "Find the best doctors in your vicinity",
                description: "With the help of our intelligent algorithms, now locate the best doctors around your vicinity at total ease.",
                imageUrl: url_to_doctor_image1,
                url: "/doctors",
                icon: <Stethoscope className="w-8 h-8" />
              },
              {
                title: "Schedule appointments with expert doctors",
                description: "Find experienced specialist doctors with expert ratings and reviews and book your appointments hassle-free.",
                imageUrl: url_to_doctor_image2,
                url: "/appointments",
                icon: <Calendar className="w-8 h-8" />
              },
              {
                title: "Book face-to-face appointments",
                description: "Can't go to the hospital? Book video call appointments with your doctor within the app in a few minutes.",
                imageUrl: url_to_doctor_image3,
                url: "/video-appointments",
                icon: <Heart className="w-8 h-8" />
              }
            ].map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              >
                <GlassCard hover className="overflow-hidden">
                  <div className="relative">
                    <img 
                      src={card.imageUrl} 
                      alt={card.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-r from-neon-500 to-cyan-500 rounded-full flex items-center justify-center text-white">
                      {card.icon}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                    <p className="text-white/80 mb-4 leading-relaxed">{card.description}</p>
                    <Link
                      to={card.url}
                      className="inline-flex items-center text-cyan-400 hover:text-cyan-300 font-medium transition duration-300"
                    >
                      Learn More
                      <Zap className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
          
          {/* Quick Actions Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-neon text-center mb-8 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  to: `/patient/${id}/update_patient`,
                  icon: <User className="w-8 h-8" />,
                  title: "Update Patient Info",
                  description: "Update your medical history, allergies, and medications",
                  gradient: "from-blue-500 to-cyan-500"
                },
                {
                  to: `/patient/dashboard/${id}/appointment`,
                  icon: <Calendar className="w-8 h-8" />,
                  title: "Book Appointment",
                  description: "Schedule a new appointment with a doctor",
                  gradient: "from-green-500 to-emerald-500"
                },
                {
                  to: `/patient/dashboard/${id}/history`,
                  icon: <History className="w-8 h-8" />,
                  title: "Appointment History",
                  description: "View your past appointments",
                  gradient: "from-purple-500 to-violet-500"
                },
                {
                  to: `/patient/dashboard/${id}/cancel/postpond`,
                  icon: <X className="w-8 h-8" />,
                  title: "Manage Appointments",
                  description: "Cancel or reschedule appointments",
                  gradient: "from-orange-500 to-red-500"
                }
              ].map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link to={action.to}>
                    <GlassCard hover className="p-6 text-center h-full">
                      <motion.div
                        className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${action.gradient} flex items-center justify-center text-white`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        {action.icon}
                      </motion.div>
                      <h3 className="text-xl font-bold text-white mb-2">{action.title}</h3>
                      <p className="text-white/80 text-sm leading-relaxed">{action.description}</p>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      
      <div className="relative py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold font-neon mb-4 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">
              Consult top doctors online for any health concern
            </h1>
            <p className="text-xl text-white/80">
              Private online consultations with verified doctors in all specialties
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
            {consultationOptions.map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <GlassCard hover className="p-4 text-center">
                  <img 
                    src={option.image} 
                    alt={option.title}
                    className="w-16 h-16 mx-auto mb-4 rounded-full object-cover"
                  />
                  <h3 className="text-lg font-bold text-white mb-2">{option.title}</h3>
                </GlassCard>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-neon mb-8 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">
              Book an appointment for an in-clinic consultation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {specialties.map((specialty, index) => (
                <motion.div
                  key={specialty.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <GlassCard hover className="p-6 text-center">
                    <img 
                      src={specialty.image} 
                      alt={specialty.title}
                      className="w-20 h-20 mx-auto mb-4 rounded-full object-cover"
                    />
                    <h3 className="text-lg font-bold text-white">{specialty.title}</h3>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Link to={'/appointment/appointment.js'}>
              <NeonButton size="lg">
                <Zap className="w-5 h-5" />
                Consult Now
              </NeonButton>
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PatientDashboard;
