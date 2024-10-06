import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './appointment.css'; // Import custom CSS

const AppointmentHistory = () => {
  const { id } = useParams();

  // Define individual state for each filter field
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState(''); // Status as a dropdown
  const [patientName, setPatientName] = useState('');
  const [appointments, setAppointments] = useState([]);

  // Fetch search results from the backend with filters
  const handleSearch = async () => {
    console.log(startDate);
    try {
      const response = await axios.put(`/api/v1/${id}/doctor/specific_appointment`, {
        params: {
          startDate,
          endDate,
          startTime,
          endTime,
          city,
          status, // Use status for filtering
          patientName
        }
      });
      const data = response.data.appointments;
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  // Handlers for input changes
  const handleStartDateChange = (e) => setStartDate(e.target.value);
  const handleEndDateChange = (e) => setEndDate(e.target.value);
  const handleStartTimeChange = (e) => setStartTime(e.target.value);
  const handleEndTimeChange = (e) => setEndTime(e.target.value);
  const handleCityChange = (e) => setCity(e.target.value);
  const handleStatusChange = (e) => setStatus(e.target.value);
  const handlePatientNameChange = (e) => setPatientName(e.target.value);

  return (
    <div className="appointment-history-container">
      <div className="search-card">
        <h2 className="search-title">Search Appointments</h2>
        <div className="filter-form">
          <div className="form-group">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={startDate}
              onChange={handleStartDateChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={endDate}
              onChange={handleEndDateChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="startTime">Start Time:</label>
            <input
              type="time"
              id="startTime"
              name="startTime"
              value={startTime}
              onChange={handleStartTimeChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="endTime">End Time:</label>
            <input
              type="time"
              id="endTime"
              name="endTime"
              value={endTime}
              onChange={handleEndTimeChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="city">City:</label>
            <input
              type="text"
              id="city"
              name="city"
              value={city}
              onChange={handleCityChange}
              placeholder="City"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="status">Status:</label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={handleStatusChange}
              className="form-input"
            >
              <option value="">Select Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Canceled">Canceled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="patientName">Patient Name:</label>
            <input
              type="text"
              id="patientName"
              name="patientName"
              value={patientName}
              onChange={handlePatientNameChange}
              placeholder="Patient Name"
              className="form-input"
            />
          </div>
          <button onClick={handleSearch} className="search-button">Apply Filters</button>
        </div>
      </div>

      <div className="appointment-list">
        {appointments.length === 0 ? (
          <p>No appointments found.</p>
        ) : (
          appointments.map((appointment) => (
            <div key={appointment._id} className="appointment-item">
              <p>Patient Details:</p>
              <p><strong>Patient Name:</strong> {appointment.patient.user.name}</p>
              <p><strong>Patient Email:</strong> {appointment.patient.user.email}</p>
              <p><strong>Patient No:</strong> {appointment.patient.user.phoneNumber}</p>
              <p><strong>Patient City:</strong> {appointment.patient.user.city}</p>
              <p><strong>Patient State:</strong> {appointment.patient.user.state}</p>
              <p><strong>Patient Allergies:</strong> {appointment.patient.allergies}</p>
              <p><strong>Patient current medications:</strong> {appointment.patient.currentMedications}</p>
              <p><strong>Patient medical history:</strong> {appointment.patient.medicalHistory}</p>  
              <p><strong>Appointment Date:</strong> {appointment.date}</p>
              <p><strong>Appointment Time:</strong> {appointment.time}</p>
              <p><strong>Appointment Status:</strong> {appointment.status}</p>
            </div>
          ))
        )}
      </div> 
    </div>
  );
};

export default AppointmentHistory;
