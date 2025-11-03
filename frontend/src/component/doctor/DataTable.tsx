import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { api } from '../../utils/api';
import GlassCard from '../common/GlassCard';

interface Appointment {
  appointmentNumber: string;
  patientName: string;
  time: string;
  date: string;
  status: 'Scheduled' | 'Completed' | 'Canceled';
}

const DataTable: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodayAppointments = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await axios.get(api.getUrl(`${id}/doctor/today_schedule`));
        
        if (response.data.success && response.data.appointments) {
          const transformedAppointments = response.data.appointments.map((app: any) => ({
            appointmentNumber: app.appointmentNumber,
            patientName: app.patientName || 'Unknown',
            time: app.time,
            date: new Date(app.date).toLocaleDateString(),
            status: app.status
          }));
          setAppointments(transformedAppointments);
        } else {
          setAppointments([]);
        }
      } catch (error) {
        console.error('Error fetching today\'s appointments:', error);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayAppointments();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'Completed':
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'Canceled':
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
      default:
        return 'bg-white/10 text-white/70 border border-white/20';
    }
  };

  if (loading) {
    return (
      <GlassCard glow className="overflow-hidden p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-400 mx-auto mb-4"></div>
          <p className="text-white/70">Loading appointments...</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard glow className="overflow-hidden">
      <div className="px-6 py-4 border-b border-white/20">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">Today's Appointments ({appointments.length})</h3>
      </div>
      {appointments.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-white/70">No appointments scheduled for today.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Appointment Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {appointments.map((appointment) => (
                <tr key={appointment.appointmentNumber} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{appointment.patientName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white/90">{appointment.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white/90">{appointment.appointmentNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
};

export default DataTable;
