import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, IconButton, CircularProgress } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';

const initialSchedule = {
  morning: [],
  evening: []
};

const DoctorSchedulePage = () => {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const id = JSON.parse(localStorage.getItem('authState')).user._id;

  // Fetch the schedule on component mount
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/v1/doctor/schedule/${id}`);
        setSchedule(response.data.schedule || initialSchedule);
      } catch (error) {
        console.error('Error fetching schedule:', error.message);
        setError('Failed to fetch schedule. Please try again.');
      }
    };
    fetchSchedule();
  }, [id]);

  // Handle time slot change
  const handleTimeSlotChange = (timeSlot, index, type, e) => {
    const newSchedule = { ...schedule };
    newSchedule[type][index][timeSlot] = e.target.value;
    setSchedule(newSchedule);
  };

  // Add time slot
  const handleAddSlot = (type) => {
    const newSchedule = { ...schedule };
    newSchedule[type].push({ startTime: '', endTime: '' });
    setSchedule(newSchedule);
  };

  // Remove time slot
  const handleRemoveSlot = (index, type) => {
    const newSchedule = { ...schedule };
    newSchedule[type].splice(index, 1);
    setSchedule(newSchedule);
  };

  // Handle submit
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
        // Post request to update the schedule
        const response = await axios.post(`/api/v1/${id}/doctor/update_schedule`, {
            morning: schedule.morning,
            evening: schedule.evening
        });

        // Handle success response
        if (response.data.success) {
            // Handle successful update (e.g., show a success message)
            console.log('Schedule updated successfully:', response.data.schedule);
        } else {
            // Handle error response from backend if any
            setError(response.data.message || 'Failed to update schedule. Please try again.');
        }
    } catch (error) {
        console.error('Error updating schedule:', error.message);
        setError('Failed to update schedule. Please try again.');
    } finally {
        setLoading(false);
    }
};


  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 3,
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
      }}
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <Typography variant="h4" sx={{ marginBottom: 3, color: '#2e7d32' }}>
        Update Doctor's Schedule
      </Typography>
      <Typography variant="h6" sx={{ marginBottom: 2, color: '#2e7d32' }}>
        Weekdays (Monday to Friday)
      </Typography>
      {['morning', 'evening'].map((type) => (
        <Box key={type} sx={{ width: '100%', maxWidth: 600, marginBottom: 4 }}>
          <Typography variant="h6" sx={{ marginBottom: 2, color: '#2e7d32' }}>
            {type.charAt(0).toUpperCase() + type.slice(1)} Slots
          </Typography>
          {schedule[type].map((slot, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
              <TextField
                fullWidth
                label="Start Time"
                variant="outlined"
                type="time"
                value={slot.startTime}
                onChange={(e) => handleTimeSlotChange('startTime', index, type, e)}
                sx={{ marginRight: 1 }}
              />
              <TextField
                fullWidth
                label="End Time"
                variant="outlined"
                type="time"
                value={slot.endTime}
                onChange={(e) => handleTimeSlotChange('endTime', index, type, e)}
                sx={{ marginRight: 1 }}
              />
              <IconButton onClick={() => handleRemoveSlot(index, type)} color="error">
                <Delete />
              </IconButton>
            </Box>
          ))}
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleAddSlot(type)}
          >
            Add Slot
          </Button>
        </Box>
      ))}
      <Button
        variant="contained"
        color="success"
        onClick={handleSubmit}
        disabled={loading}
        sx={{ marginTop: 3 }}
        component={motion.button}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Save Schedule
      </Button>
      {loading && <CircularProgress sx={{ display: 'block', marginTop: 3 }} />}
      {error && (
        <Typography variant="body2" sx={{ color: 'red', marginTop: 2 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default DoctorSchedulePage;
