import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { api } from '../../utils/api';
import GlassCard from '../common/GlassCard';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color }) => {
  return (
    <GlassCard glow className="p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent mt-2">{value}</p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </GlassCard>
  );
};

const SummaryCards: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    totalEarnings: 0,
    averageRating: 4.8
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch today's schedule to get today's appointment count
        const todayScheduleResponse = await axios.get(api.getUrl(`${id}/doctor/today_schedule`));
        const todayCount = todayScheduleResponse.data.success ? todayScheduleResponse.data.totalAppointments : 0;
        
        // Fetch all appointments for total count
        // We'll get a count by fetching appointments with a very wide date range
        let totalCount = 0;
        try {
          // Use a wide date range to get all appointments (past 100 years to future 100 years)
          const today = new Date();
          const hundredYearsAgo = new Date(today.getFullYear() - 100, 0, 1);
          const hundredYearsFromNow = new Date(today.getFullYear() + 100, 11, 31);
          
          const allAppointmentsResponse = await axios.put(api.getUrl(`${id}/doctor/specific_appointment`), {
            startDate: hundredYearsAgo.toISOString().split('T')[0],
            endDate: hundredYearsFromNow.toISOString().split('T')[0]
          });
          
          if (allAppointmentsResponse.data.success && Array.isArray(allAppointmentsResponse.data.appointments)) {
            totalCount = allAppointmentsResponse.data.appointments.length;
          }
        } catch (error) {
          console.error('Error fetching all appointments:', error);
          // If this fails, we'll just use 0 for total count
          totalCount = 0;
        }
        
        // Fetch earnings for this month
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        let earnings = 0;
        try {
          const earningsResponse = await axios.get(api.getUrl(`${id}/doctor/earnings`), {
            params: {
              startDate: firstDayOfMonth.toISOString(),
              endDate: lastDayOfMonth.toISOString()
            }
          });
          earnings = earningsResponse.data.sum || 0;
        } catch (error) {
          console.error('Error fetching earnings:', error);
        }
        
        setStats({
          totalAppointments: totalCount,
          todayAppointments: todayCount,
          totalEarnings: earnings,
          averageRating: 4.8 // Placeholder for now
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [id]);

  const cards = [
    { 
      title: 'Total Appointments', 
      value: loading ? '...' : stats.totalAppointments, 
      icon: '📅', 
      color: 'bg-blue-100' 
    },
    { 
      title: 'Today\'s Appointments', 
      value: loading ? '...' : stats.todayAppointments, 
      icon: '⏰', 
      color: 'bg-green-100' 
    },
    { 
      title: 'Total Earnings', 
      value: loading ? '...' : `₹${stats.totalEarnings.toFixed(2)}`, 
      icon: '💰', 
      color: 'bg-yellow-100' 
    },
    { 
      title: 'Patient Reviews', 
      value: stats.averageRating, 
      icon: '⭐', 
      color: 'bg-purple-100' 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => (
        <SummaryCard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
        />
      ))}
    </div>
  );
};

export default SummaryCards;
