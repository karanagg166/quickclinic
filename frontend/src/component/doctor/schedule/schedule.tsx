import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { api } from '../../../utils/api';
import { motion } from 'framer-motion';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 lg:ml-80 pt-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
            <h1 className="text-3xl font-bold text-center mb-2">Update Doctor Schedule</h1>
            <p className="text-center text-blue-100">Set your availability for morning and evening slots</p>
          </div>

          <div className="p-8">
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Morning Slots */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Morning Slots</h2>
                <button
                  type="button"
                  onClick={addMorningSlot}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition duration-300"
                >
                  Add Morning Slot
                </button>
              </div>
              
              <div className="space-y-4">
                {morningSlots.map((slot, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateMorningSlot(index, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateMorningSlot(index, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMorningSlot(index)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md transition duration-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Evening Slots */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Evening Slots</h2>
                <button
                  type="button"
                  onClick={addEveningSlot}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition duration-300"
                >
                  Add Evening Slot
                </button>
              </div>
              
              <div className="space-y-4">
                {eveningSlots.map((slot, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateEveningSlot(index, 'startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateEveningSlot(index, 'endTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEveningSlot(index)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md transition duration-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center pt-6">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-12 rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  'Update Schedule'
                )}
              </motion.button>
            </div>
          </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SchedulePage;
