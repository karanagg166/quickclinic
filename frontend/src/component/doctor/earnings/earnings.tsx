import React, { useState } from 'react';
import { Container, TextField, Button, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { api } from '../../../utils/api';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import SimpleParticleBackground from '../../common/SimpleParticleBackground';
import GlassCard from '../../common/GlassCard';
import NeonButton from '../../common/NeonButton';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';

const EarningsPage: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [sum, setSum] = useState<number | null>(null);  // State for storing sum
  const [message, setMessage] = useState<string>('');  // State for storing message
  const { id } = useParams<{ id: string }>();

  const handleSubmit = async () => {
    // Convert dates to ISO string format
    const formattedStartDate = startDate ? startDate.toISOString() : null;
    const formattedEndDate = endDate ? endDate.toISOString() : null;

    try {
      const response = await axios.get(api.getUrl(`${id}/doctor/earnings`), {
        params: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      });

      // Extract data from response
      const { sum, message } = response.data;

      // Update state with the result
      setSum(sum);
      setMessage(message);
    } catch (error: any) {
      // Handle errors
      setMessage(`Error fetching data: ${error.response ? error.response.data.message : error.message}`);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                  <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
                    <DollarSign className="w-8 h-8 text-neon-400" />
                    Doctor Earnings
                  </h1>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Start Date
                      </label>
                      <DatePicker
                        value={startDate}
                        onChange={(newValue) => setStartDate(newValue)}
                        slots={{
                          textField: (params) => (
                            <TextField 
                              {...params} 
                              className="w-full"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  backdropFilter: 'blur(10px)',
                                  border: '2px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: '12px',
                                  color: 'white',
                                  '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: 'rgba(0, 255, 255, 0.5)',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#00ffff',
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: 'rgba(255, 255, 255, 0.8)',
                                },
                                '& .MuiInputBase-input': {
                                  color: 'white',
                                },
                              }}
                            />
                          )
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        End Date
                      </label>
                      <DatePicker
                        value={endDate}
                        onChange={(newValue) => setEndDate(newValue)}
                        slots={{
                          textField: (params) => (
                            <TextField 
                              {...params} 
                              className="w-full"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  backdropFilter: 'blur(10px)',
                                  border: '2px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: '12px',
                                  color: 'white',
                                  '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: 'rgba(0, 255, 255, 0.5)',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#00ffff',
                                  },
                                },
                                '& .MuiInputLabel-root': {
                                  color: 'rgba(255, 255, 255, 0.8)',
                                },
                                '& .MuiInputBase-input': {
                                  color: 'white',
                                },
                              }}
                            />
                          )
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-center mb-8">
                    <NeonButton onClick={handleSubmit}>
                      <TrendingUp className="mr-2" />
                      Get Earnings
                    </NeonButton>
                  </div>

                  {/* Display the result */}
                  {sum !== null && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-green-500/30 to-cyan-500/30 backdrop-blur-sm border border-green-400/50 rounded-lg p-6 mb-6"
                    >
                      <div className="text-center">
                        <DollarSign className="w-12 h-12 text-green-400 mx-auto mb-4" />
                        <Typography variant="h6" className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                          Earnings: ₹{sum.toFixed(2)}
                        </Typography>
                      </div>
                    </motion.div>
                  )}
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg ${
                        message.includes('Error') 
                          ? 'bg-red-500/30 backdrop-blur-sm border border-red-400/50' 
                          : 'bg-cyan-500/30 backdrop-blur-sm border border-cyan-400/50'
                      }`}
                    >
                      <Typography variant="body1" className={`text-center ${
                        message.includes('Error') ? 'text-red-300' : 'text-cyan-300'
                      }`}>
                        {message}
                      </Typography>
                    </motion.div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default EarningsPage;
