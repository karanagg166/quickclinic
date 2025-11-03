import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { api } from '../../../utils/api';
import { motion } from 'framer-motion';
import SimpleParticleBackground from '../../common/SimpleParticleBackground';
import GlassCard from '../../common/GlassCard';
import NeonButton from '../../common/NeonButton';

const SchedulePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [morningSlots, setMorningSlots] = useState<Array<{ startTime: string; endTime: string }>>([
    { startTime: '09:00', endTime: '12:00' }
  ]);
  const [eveningSlots, setEveningSlots] = useState<Array<{ startTime: string; endTime: string }>>([
    { startTime: '14:00', endTime: '17:00' }
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Load existing schedule data
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setInitialLoading(true);
        const response = await axios.get(api.getUrl(`${id}/doctor/schedule`));
        
        if (response.data.success && response.data.schedule) {
          const schedule = response.data.schedule;
          if (schedule.morning && schedule.morning.length > 0) {
            setMorningSlots(schedule.morning);
          }
          if (schedule.evening && schedule.evening.length > 0) {
            setEveningSlots(schedule.evening);
          }
        }
      } catch (error) {
        console.error('Error loading schedule:', error);
        // Keep default values if schedule doesn't exist
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) {
      loadSchedule();
    }
  }, [id]);

  const addMorningSlot = () => {
    setMorningSlots([...morningSlots, { startTime: '09:00', endTime: '12:00' }]);
  };

  const addEveningSlot = () => {
    setEveningSlots([...eveningSlots, { startTime: '14:00', endTime: '17:00' }]);
  };

  const removeMorningSlot = (index: number) => {
    setMorningSlots(morningSlots.filter((_, i) => i !== index));
  };

  const removeEveningSlot = (index: number) => {
    setEveningSlots(eveningSlots.filter((_, i) => i !== index));
  };

  const updateMorningSlot = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...morningSlots];
    updated[index][field] = value;
    setMorningSlots(updated);
  };

  const updateEveningSlot = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const updated = [...eveningSlots];
    updated[index][field] = value;
    setEveningSlots(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, try to update the schedule
      const response = await axios.post(api.getUrl(`${id}/doctor/update_schedule`), {
        morning: morningSlots,
        evening: eveningSlots
      });

      if (response.data.success) {
        alert('Schedule updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      
      // If doctor not found, try to create doctor record first
      if (error.response?.data?.message === 'Doctor not found') {
        try {
          // Create doctor record with default values
          const createDoctorResponse = await axios.post(api.getUrl(`${id}/doctor/create_doctor`), {
            specialization: 'General Physician',
            experience: 1,
            fees: 500
          });

          if (createDoctorResponse.data.success) {
            // Now try to update schedule again
            const scheduleResponse = await axios.post(api.getUrl(`${id}/doctor/update_schedule`), {
              morning: morningSlots,
              evening: eveningSlots
            });

            if (scheduleResponse.data.success) {
              alert('Doctor profile created and schedule updated successfully!');
            }
          }
        } catch (createError: any) {
          console.error('Error creating doctor:', createError);
          alert(`Error: ${createError.response?.data?.message || 'Failed to create doctor profile and update schedule'}`);
        }
      } else {
        alert(`Error updating schedule: ${error.response?.data?.message || 'Please try again'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <SimpleParticleBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <GlassCard glow className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-400 mx-auto mb-4"></div>
              <p className="text-white/70">Loading schedule...</p>
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
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard glow className="overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-neon-500/20 to-cyan-500/20 backdrop-blur-sm border-b border-white/20 p-8">
                <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">Update Doctor Schedule</h1>
                <p className="text-center text-white/70">Set your availability for morning and evening slots</p>
              </div>

              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                {/* Morning Slots */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Morning Slots</h2>
                    <NeonButton
                      type="button"
                      onClick={addMorningSlot}
                      variant="outline"
                      size="sm"
                    >
                      Add Morning Slot
                    </NeonButton>
                  </div>
                  
                  <div className="space-y-4">
                    {morningSlots.map((slot, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-white/80 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateMorningSlot(index, 'startTime', e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white transition duration-300"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-white/80 mb-1">End Time</label>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateMorningSlot(index, 'endTime', e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white transition duration-300"
                          />
                        </div>
                        <NeonButton
                          type="button"
                          onClick={() => removeMorningSlot(index)}
                          variant="secondary"
                          size="sm"
                          className="mt-6"
                        >
                          Remove
                        </NeonButton>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evening Slots */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Evening Slots</h2>
                    <NeonButton
                      type="button"
                      onClick={addEveningSlot}
                      variant="outline"
                      size="sm"
                    >
                      Add Evening Slot
                    </NeonButton>
                  </div>
                  
                  <div className="space-y-4">
                    {eveningSlots.map((slot, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-white/80 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateEveningSlot(index, 'startTime', e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white transition duration-300"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-white/80 mb-1">End Time</label>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateEveningSlot(index, 'endTime', e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-neon-400 focus:border-neon-400 text-white transition duration-300"
                          />
                        </div>
                        <NeonButton
                          type="button"
                          onClick={() => removeEveningSlot(index)}
                          variant="secondary"
                          size="sm"
                          className="mt-6"
                        >
                          Remove
                        </NeonButton>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center pt-6">
                  <NeonButton
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Updating...
                      </div>
                    ) : (
                      'Update Schedule'
                    )}
                  </NeonButton>
                </div>
                </form>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
