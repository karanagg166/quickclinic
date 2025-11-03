import React, { useState } from 'react';
import { TextField, Button, Grid, Typography, InputAdornment } from '@mui/material';
import { CalendarToday, Comment } from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { api } from '../../../utils/api';
import { useParams } from 'react-router-dom';

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
    <div className="leave-page-container min-h-screen bg-gray-50 py-12 lg:ml-80 pt-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="leave-form bg-white rounded-lg shadow-xl p-8">
          <Typography variant="h4" component="h1" gutterBottom className="text-3xl font-bold text-gray-800 text-center mb-8">
            Apply for Leave
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  className="form-input"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    min: today,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  className="form-input"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    min: startDate || today,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Reason for Leave"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  multiline
                  rows={4}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Comment />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  className="form-input"
                  placeholder="Please provide a detailed reason for your leave request..."
                />
              </Grid>
              <Grid item xs={12} className="text-center">
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary" 
                  className="submit-button bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105"
                >
                  Submit Leave Request
                </Button>
              </Grid>
          </Grid>
        </form>
        </div>
      </motion.div>
      </div>
    </div>
  );
};

export default LeavePage;
