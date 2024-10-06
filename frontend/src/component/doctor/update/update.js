import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Avatar, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { Save, LocalHospital, CurrencyRupee, Work, Badge } from '@mui/icons-material';
import axios from 'axios';

const DoctorPage = () => {
  const [doctorData, setDoctorData] = useState({
    specialization: '',
    experience: '',
    fees: '',
  });
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Get user ID from localStorage
  const id = JSON.parse(localStorage.getItem('authState')).user._id;

  // Fetch doctor data
  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const response = await axios.get(`/api/v1/${id}/doctor/me`);
        if (response.data) {
          setDoctorData(response.data); // Set doctor data
        } else {
          console.error('Unexpected response structure:', response.data);
        }
      } catch (error) {
        console.error('Error fetching doctor data:', error.message);
        setError('Failed to load doctor data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [id]);

  // Handle form changes
  const handleInputChange = (e) => {
    setDoctorData({
      ...doctorData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`http://localhost:5000/api/v1/${id}/doctor/update_doctor`,{ fees:doctorData.fees,
      specialization:doctorData.specialization,
      experience:doctorData.experience
    });
      setSuccess(true);
    } catch (error) {
      console.error('Error saving doctor data:', error.message);
      setError('Update failed. Please try again.');
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
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f0f4c3',
        padding: 3,
      }}
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <Box
        sx={{
          padding: 4,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          backgroundColor: '#fff',
          width: '100%',
          maxWidth: 600,
        }}
        component={motion.div}
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 70 }}
      >
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: '#4caf50', width: 60, height: 60 }}>
            <LocalHospital />
          </Avatar>
          <Typography
            variant="h4"
            sx={{ ml: 2, color: '#2e7d32' }}
            component={motion.div}
            initial={{ x: -30 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 80 }}
          >
            Doctor Profile
          </Typography>
        </Box>

        {loading ? (
          <CircularProgress sx={{ display: 'block', margin: 'auto', mb: 3 }} />
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Specialization"
              name="specialization"
              value={doctorData.specialization}
              onChange={handleInputChange}
              variant="outlined"
              margin="normal"
              InputProps={{
                startAdornment: <Badge sx={{ color: '#2e7d32' }} />,
              }}
              sx={{
                backgroundColor: '#e8f5e9',
              }}
            />
            <TextField
              fullWidth
              label="Years of Experience"
              name="experience"
              value={doctorData.experience}
              onChange={handleInputChange}
              type="number"
              variant="outlined"
              margin="normal"
              InputProps={{
                startAdornment: <Work sx={{ color: '#2e7d32' }} />,
              }}
              sx={{
                backgroundColor: '#e8f5e9',
              }}
            />
            <TextField
              fullWidth
              label="Consultation Fee"
              name="fees"
              value={doctorData.fees}
              onChange={handleInputChange}
              type="number"
              variant="outlined"
              margin="normal"
              InputProps={{
                startAdornment: <CurrencyRupee sx={{ color: '#2e7d32' }} />,
              }}
              sx={{
                backgroundColor: '#e8f5e9',
              }}
            />
            <Box
              sx={{
                mt: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {error && (
                <Typography
                  variant="body2"
                  sx={{ color: 'red' }}
                  component={motion.div}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {error}
                </Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                color="success"
                startIcon={<Save />}
                disabled={loading}
                component={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Save Changes
              </Button>
              {success && (
                <Typography
                  variant="body2"
                  sx={{ color: 'green' }}
                  component={motion.div}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  Profile Updated Successfully!
                </Typography>
              )}
            </Box>
          </form>
        )}
      </Box>
    </Box>
  );
};

export default DoctorPage;
