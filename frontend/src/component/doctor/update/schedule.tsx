import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { api } from '../../../utils/api';

const Schedule: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [morningSlots, setMorningSlots] = useState<Array<{ startTime: string; endTime: string }>>([
    { startTime: '09:00', endTime: '12:00' }
  ]);
  const [eveningSlots, setEveningSlots] = useState<Array<{ startTime: string; endTime: string }>>([
    { startTime: '14:00', endTime: '17:00' }
  ]);
  const [loading, setLoading] = useState<boolean>(false);

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
      const response = await axios.post(api.getUrl(`${id}/doctor/update_schedule`), {
        morning: morningSlots,
        evening: eveningSlots
      });

      if (response.data.success) {
        alert('Schedule updated successfully!');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Error updating schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 lg:ml-80 pt-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">Update Schedule</h1>
          
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

            <div className="text-center">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
              >
                {loading ? 'Updating...' : 'Update Schedule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
