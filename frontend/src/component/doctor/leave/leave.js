import React, { useState } from 'react';
import { TextField, Button, Grid, Typography, InputAdornment } from '@mui/material';
import { CalendarToday, Comment } from '@mui/icons-material';
import { motion } from 'framer-motion';
import './leave.css';
import axios from 'axios';
import { useParams } from 'react-router-dom';
const LeavePage = () => {
    const {id}=useParams();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log({ startDate, endDate, reason });
  
    try {
      const { data } = await axios.post(`/api/v1/${id}/doctor/leave`, {
        startDate,
        endDate,
        reason,
      });
  
      console.log('Response data:', data);
      // Optionally, handle the response, like showing a success message or redirecting
    } catch (error) {
      console.error('Error submitting leave request:', error);
      // Optionally, handle the error, like showing an error message
    }
  };

  return (
    <div className="leave-page-container">
      <motion.div
        className="leave-form"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Apply for Leave
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
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
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" className="submit-button">
                Submit Leave Request
              </Button>
            </Grid>
          </Grid>
        </form>
      </motion.div>
    </div>
  );
};

export default LeavePage;
