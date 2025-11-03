import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SimpleParticleBackground from '../../common/SimpleParticleBackground';
import GlassCard from '../../common/GlassCard';
import { Calendar, TrendingUp, DollarSign, CheckCircle, XCircle, BarChart } from 'lucide-react';

interface ReportData {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalEarnings: number;
  averageRating: number;
  monthlyStats: Array<{
    month: string;
    appointments: number;
    earnings: number;
  }>;
}

const ReportsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        // This would need to be implemented in the backend
        // For now, we'll show mock data
        setReportData({
          totalAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          totalEarnings: 0,
          averageRating: 0,
          monthlyStats: []
        });
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReportData();
    }
  }, [id, dateRange]);

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <SimpleParticleBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center pt-28">
          <GlassCard glow className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-400 mx-auto mb-4"></div>
              <p className="text-white/70">Loading reports...</p>
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
        <div className="max-w-6xl mx-auto space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard glow className="overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-neon-500/20 to-cyan-500/20 backdrop-blur-sm border-b border-white/20 p-8">
                <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
                  <BarChart className="w-8 h-8 text-neon-400" />
                  Analytics & Reports
                </h1>
                <p className="text-center text-white/70">Track your practice performance and insights</p>
              </div>

              <div className="p-8">
                {/* Date Range Selector */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white transition duration-300"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        End Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white transition duration-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-neon-500/30 to-cyan-500/30 backdrop-blur-sm border border-neon-400/50 text-white rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Total Appointments</p>
                        <p className="text-3xl font-bold">{reportData?.totalAppointments || 0}</p>
                      </div>
                      <Calendar className="w-8 h-8 text-neon-400" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-green-500/30 to-green-600/30 backdrop-blur-sm border border-green-400/50 text-white rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Completed</p>
                        <p className="text-3xl font-bold">{reportData?.completedAppointments || 0}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-red-500/30 to-red-600/30 backdrop-blur-sm border border-red-400/50 text-white rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Cancelled</p>
                        <p className="text-3xl font-bold">{reportData?.cancelledAppointments || 0}</p>
                      </div>
                      <XCircle className="w-8 h-8 text-red-400" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-cyan-500/30 to-neon-500/30 backdrop-blur-sm border border-cyan-400/50 text-white rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Total Earnings</p>
                        <p className="text-3xl font-bold">₹{reportData?.totalEarnings || 0}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-cyan-400" />
                    </div>
                  </motion.div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Monthly Appointments Chart */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-neon-400" />
                      Monthly Appointments
                    </h3>
                    <div className="text-center py-12 text-white/50">
                      <BarChart className="mx-auto h-12 w-12 mb-4 text-white/30" />
                      <p>Chart visualization will be implemented here</p>
                    </div>
                  </motion.div>

                  {/* Earnings Chart */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-cyan-400" />
                      Monthly Earnings
                    </h3>
                    <div className="text-center py-12 text-white/50">
                      <TrendingUp className="mx-auto h-12 w-12 mb-4 text-white/30" />
                      <p>Chart visualization will be implemented here</p>
                    </div>
                  </motion.div>
                </div>

                {/* Performance Metrics */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                        {reportData && reportData.totalAppointments > 0 
                          ? Math.round((reportData.completedAppointments / reportData.totalAppointments) * 100)
                          : 0}%
                      </div>
                      <p className="text-white/70">Completion Rate</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent mb-2">
                        {reportData?.averageRating || 0}/5
                      </div>
                      <p className="text-white/70">Average Rating</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-neon-400 bg-clip-text text-transparent mb-2">
                        ₹{reportData && reportData.totalAppointments > 0 
                          ? Math.round(reportData.totalEarnings / reportData.totalAppointments)
                          : 0}
                      </div>
                      <p className="text-white/70">Avg. per Appointment</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
