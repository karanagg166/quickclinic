import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button, Grid, Typography } from '@mui/material';
import './schedule.css';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const SchedulePage = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [appointments, setAppointments] = useState([]); // State for appointments
  const [loading, setLoading] = useState(false); // State for loading indicator
  const { id } = useParams();

  const processAppointments = useCallback((appointments) => {
    console.log("Raw appointments data:", appointments); // Log raw data for debugging
  
    // Initialize an object to group appointments by date
    const dateGroups = {};
  
    // Populate the dateGroups object
    appointments.forEach(appointment => {
      const date = new Date(appointment.date);
      const time = appointment.time;
  
      // Format the date
      const formattedDate = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(date);
  
      if (!dateGroups[formattedDate]) {
        dateGroups[formattedDate] = [];
      }
      dateGroups[formattedDate].push(time);
    });
  
    // Sort the dates and times
    const sortedDates = Object.keys(dateGroups).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split(' ');
      const [dayB, monthB, yearB] = b.split(' ');
  
      const dateA = new Date(`${monthA} ${dayA}, ${yearA}`);
      const dateB = new Date(`${monthB} ${dayB}, ${yearB}`);
  
      return dateA - dateB;
    }); // Sort dates considering day, month, and year
  
    const result = sortedDates.map(date => {
      const times = dateGroups[date];
      return {
        date: date,
        times: times.map(time => formatTime(time)).sort() // Sort times and format them
      };
    });
  
    console.log("Processed data:", result); // Log processed data for debugging
    return result;
  }, []); // Add an empty array as dependency to ensure memoization
  
  useEffect(() => {
    const submitSchedule = async () => {
      setLoading(true); // Start loading
      try {
        const response = await axios.put(`/api/v1/${id}/doctor/specific_appointment`, {
          params: {
            startDate,
            endDate,
            status: "Scheduled"
          }
        });

        const appointmentsData = response.data.appointments;
        const processedAppointments = processAppointments(appointmentsData);

        // Set processed appointments to state
        setAppointments(processedAppointments);

        // Print the processed appointments
        console.log(processedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false); // End loading
      }
    };

    if (startDate && endDate) {
      submitSchedule();
    }
  }, [startDate, endDate, id, processAppointments]); // Add processAppointments to dependency array

  const calculateDates = (type) => {
    const now = new Date();
    const startDateFormatted = now.toISOString().split('T')[0] + 'T' + now.toTimeString().split(' ')[0]; // Add current time to start date
    setStartDate(startDateFormatted);

    let end;
    switch (type) {
      case "Today's":
        end = new Date();
        end.setHours(23, 59, 59, 999); // Set to 11:59 PM
        break;
      case 'Weekly':
        end = new Date();
        end.setDate(end.getDate() + 6); // 6 days later
        end.setHours(23, 59, 59, 999); // Set to 11:59 PM
        break;
      case 'Monthly':
        end = new Date();
        end.setDate(end.getDate() + 29); // 29 days later
        end.setHours(23, 59, 59, 999); // Set to 11:59 PM
        break;
      default:
        return;
    }

    const endDateFormatted = end.toISOString().split('T')[0] + 'T' + end.toTimeString().split(' ')[0];
    setEndDate(endDateFormatted);
    setActiveSchedule(type); // Set the active schedule type
  };

  const handleScheduleClick = (type) => {
    calculateDates(type);
    console.log(`${type} schedule clicked`);
  };

  const formatTime = (time) => {
    if (!time || typeof time !== 'string') {
      return "Invalid Time"; // Handle cases where time is not a string or is empty
    }
  
    // Split time string into hours and minutes
    const timeParts = time.split(':');
    if (timeParts.length !== 2) {
      return "Invalid Time"; // Handle unexpected time format
    }
  
    let [hours, minutes] = timeParts.map(part => parseInt(part, 10));
  
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return "Invalid Time"; // Handle invalid hours or minutes
    }
  
    const period = hours >= 12 ? 'PM' : 'AM';
    const adjustedHours = hours % 12 || 12; // Convert to 12-hour format
  
    return `${adjustedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const isActive = (type) => activeSchedule === type;

  return (
    <div className="schedule-page-container">
      <motion.div
        className="schedule-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h3" component="h1" className="header-text">
          Doctor's Schedule
        </Typography>
      </motion.div>
      
      <motion.div
        className="schedule-options"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                className="schedule-button"
                onClick={() => handleScheduleClick("Today's")}
                style={{ 
                  backgroundColor: isActive("Today's") ? '#ff7e5f' : '#ffffff', 
                  color: isActive("Today's") ? '#ffffff' : '#ff7e5f' 
                }}
              >
                Today's Schedule
              </Button>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={4}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                className="schedule-button"
                onClick={() => handleScheduleClick('Weekly')}
                style={{ 
                  backgroundColor: isActive('Weekly') ? '#ff7e5f' : '#ffffff', 
                  color: isActive('Weekly') ? '#ffffff' : '#ff7e5f' 
                }}
              >
                Weekly Schedule
              </Button>
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={4}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                className="schedule-button"
                onClick={() => handleScheduleClick('Monthly')}
                style={{ 
                  backgroundColor: isActive('Monthly') ? '#ff7e5f' : '#ffffff', 
                  color: isActive('Monthly') ? '#ffffff' : '#ff7e5f' 
                }}
              >
                Monthly Schedule
              </Button>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>

      {/* Loading indicator */}
      {loading && <div>Loading...</div>}

      {/* Display processed appointments */}
      <div className="appointment-container">
        <Typography variant="h5" component="h2" className="appointment-heading">
          Processed Appointments
        </Typography>
        {appointments.length === 0 && !loading ? (
          <Typography>No appointments found.</Typography>
        ) : (
          appointments.map((entry, index) => (
            <div key={index} className="appointment-list-item">
              <Typography variant="h6" component="h3" className="appointment-date">
                {entry.date}
              </Typography>
              <ul className="appointment-list">
                {entry.times.map((time, idx) => (
                  <li key={idx} className="appointment-times">
                    {time}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SchedulePage;
