import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { api } from '../../../utils/api';
import { useParams } from 'react-router-dom';
import SimpleParticleBackground from '../../common/SimpleParticleBackground';
import GlassCard from '../../common/GlassCard';
import NeonButton from '../../common/NeonButton';
import { Calendar, FileText } from 'lucide-react';

const LeavePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }
    
    if (!reason || !reason.trim()) {
      alert('Please provide a reason for your leave request.');
      return;
    }

    try {
      const { data } = await axios.post(api.getUrl(`${id}/doctor/leave`), {
        startDate,
        endDate,
        reason: reason.trim(),
      });

      if (data.success) {
        alert('Leave request submitted successfully!');
        // Reset form
        setStartDate('');
        setEndDate('');
        setReason('');
      } else {
        alert(data.message || 'Error submitting leave request. Please try again.');
      }
    } catch (error: any) {
      console.error('Error submitting leave request:', error);
      const errorMessage = error.response?.data?.message || 'Error submitting leave request. Please try again.';
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SimpleParticleBackground />
      <div className="relative z-10 min-h-screen pt-28 p-6 lg:ml-80">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard glow className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  Apply for Leave
                </h1>
                <p className="text-white/70">Submit your leave request for approval</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Start Date */}
                  <div>
                    <label className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={today}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white placeholder-white/50 transition duration-300"
                      required
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || today}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white placeholder-white/50 transition duration-300"
                      required
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Reason for Leave
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    placeholder="Please provide a detailed reason for your leave request..."
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white placeholder-white/50 transition duration-300 resize-none"
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="text-center pt-4">
                  <NeonButton type="submit" className="w-full md:w-auto px-8 py-3">
                    Submit Leave Request
                  </NeonButton>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LeavePage;
