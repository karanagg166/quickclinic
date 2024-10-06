import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaCalendarCheck, FaCalendarTimes } from 'react-icons/fa';
import { Button, Card, CardContent, Typography, Container, Grid } from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './cancel_postpond.css';
import { useParams } from 'react-router-dom';
import { format, parseISO, isSameDay } from 'date-fns';

const AppointmentActions = () => {
  const { id } = useParams();
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newDate, setNewDate] = useState(null);
  const [newTime, setNewTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctorSchedule, setDoctorSchedule] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await axios.get(`/api/v1/${id}/patient/appointment_future`);
      setAppointments(response.data.appointments || []);
    } catch (error) {
      setError('Error fetching appointments');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchAppointments();
    }
  }, [id, fetchAppointments]);

  const sortedAppointments = appointments
    .map(appointment => ({
      ...appointment,
      date: format(parseISO(appointment.date), 'd MMM yyyy'),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const handlePostponeClick = async (appointmentId, doc_id) => {
    setSelectedAppointment(selectedAppointment === appointmentId ? null : appointmentId);

    try {
      const response = await axios.get(`http://localhost:5000/api/v1/${id}/patient/appointment_bookings`, {
        params: { doc_id },
      });
    
      // Ensure that the response is an array
      if (Array.isArray(response.data.availableSlots)) {
        setDoctorSchedule(response.data.availableSlots);
      } else {
        setDoctorSchedule([]);
      }
    } catch (error) {
      setDoctorSchedule([]);
    }
  };

  useEffect(() => {
    if (newDate) {
      const selectedDateString = format(newDate, 'yyyy-MM-dd');
      const selectedSchedule = doctorSchedule.find(schedule => schedule.date === selectedDateString);
      setAvailableTimes(selectedSchedule ? selectedSchedule.slots : []);
    } else {
      setAvailableTimes([]);
    }
  }, [newDate, doctorSchedule]);

  const handleDateChange = (date) => {
    setNewDate(date);
  };

  const handlePostpone = async () => {
    try {
      // Format newDate as 'yyyy-MM-dd' and newTime as 'HH:mm' (or 'h:mm a' for 12-hour format with AM/PM)
      const formattedDate = format(newDate, 'yyyy-MM-dd');
      const formattedTime = newTime; // Ensure newTime is in 'HH:mm' or 'h:mm a' format
  console.log("appointment no",selectedAppointment);
      await axios.put(`http://localhost:5000/api/v1/${id}/patient/change_date`, {
        appointmentNumber: selectedAppointment,
        date: formattedDate,
        time: formattedTime,
      });
      alert("date chaged succedully");
      // Refresh appointments after postponing
      fetchAppointments();
      setSelectedAppointment(null); // Deselect appointment
    } catch (error) {
      console.error('Error postponing appointment:', error);
    }
  };
  const handleCancel = async (appointmentId) => {
    try {
      await axios.put(`http://localhost:5000/api/v1/${id}/patient/cancel_appointment`, {
        appointmentNumber: appointmentId,
      });
      // Refresh appointments after canceling
      fetchAppointments();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Filter function for DatePicker
  const filterDates = (date) => {
    // Ensure doctorSchedule is an array
    if (!Array.isArray(doctorSchedule)) {
      console.error('doctorSchedule is not an array:', doctorSchedule);
      return false;
    }
    return doctorSchedule.some(schedule => isSameDay(date, parseISO(schedule.date)));
  };

  if (loading) return <p>Loading appointments...</p>;
  if (error) return <p>{error}</p>;

  return (
    <Container className="appointment-actions-container">
      <Grid container spacing={3}>
        {sortedAppointments.length > 0 ? (
          sortedAppointments.map((appointment, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card className="appointment-card">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Doctor: {appointment.doctor.user.name || 'Unknown'}
                  </Typography>
                  <Typography variant="body1">Date: {appointment.date}</Typography>
                  <Typography variant="body1">Time: {appointment.time || 'Not specified'}</Typography>
                  <Typography variant="body1">Specialty: {appointment.doctor.specialization || 'Unknown'}</Typography>
                  <Typography variant="body1">City: {appointment.doctor.user.city || 'Unknown'}</Typography>
                  <Typography variant="body1">Email: {appointment.doctor.user.email || 'Unknown'}</Typography>
                  <Typography variant="body1">Phone No: {appointment.doctor.user.phoneNumber || 'Unknown'}</Typography>
                  <Typography variant="body1">Fees: {appointment.fees || 'Unknown'}</Typography>
                  <Typography variant="body1">Fees Paid: {appointment.paid ? 'Yes' : 'No'}</Typography>

                  <div className="button-container">
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<FaCalendarCheck />}
                      onClick={() => handlePostponeClick(appointment.appointmentNumber, appointment.doctor._id)}
                      className="action-button postpone-button"
                    >
                      Postpone
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<FaCalendarTimes />}
                      onClick={() => handleCancel(appointment.appointmentNumber)}
                      className="action-button cancel-button"
                    >
                      Cancel
                    </Button>
                  </div>

                  {selectedAppointment === appointment.appointmentNumber && (
                    <div className="date-picker-container">
                      <DatePicker
                        selected={newDate}
                        onChange={handleDateChange}
                        dateFormat="yyyy/MM/dd"
                        className="date-picker"
                        minDate={new Date()}
                        filterDate={filterDates}
                        placeholderText="Select a new date"
                      />
                      <select
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="time-picker"
                      >
                        <option value="">Select a time</option>
                        {availableTimes.map((time, index) => (
                          <option key={index} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={handlePostpone}
                        className="submit-button"
                      >
                        Submit
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Typography variant="h6" align="center">
            No upcoming appointments.
          </Typography>
        )}
      </Grid>
    </Container>
  );
};

export default AppointmentActions;
