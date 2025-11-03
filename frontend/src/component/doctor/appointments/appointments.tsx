import React, { useState } from 'react';
import axios from 'axios';
import { api } from '../../../utils/api';
import { useParams } from 'react-router-dom';

interface Appointment {
  _id: string;
  patient: {
    user: {
      name: string;
      email: string;
      phoneNumber: string;
      city: string;
      state: string;
    };
    allergies: string;
    currentMedications: string;
    medicalHistory: string;
  };
  date: string;
  time: string;
  status: string;
}

const AppointmentHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Define individual state for each filter field
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [status, setStatus] = useState<string>(''); // Status as a dropdown
  const [patientName, setPatientName] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Fetch search results from the backend with filters
  const handleSearch = async () => {
    try {
      // Build query parameters object with only non-empty values
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;
      if (city.trim()) params.city = city.trim();
      if (status) params.status = status;
      if (patientName.trim()) params.patientName = patientName.trim();

      const response = await axios.put(api.getUrl(`${id}/doctor/specific_appointment`), params);
      const data = response.data.appointments;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching search results:', error);
      alert('Error fetching appointments. Please try again.');
    }
  };

  // Handlers for input changes
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value);
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value);
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value);
  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value);
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value);
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value);
  const handlePatientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => setPatientName(e.target.value);

  return (
    <div className="appointment-history-container min-h-screen bg-gray-50 py-8 lg:ml-80 pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="search-card bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="search-title text-3xl font-bold text-gray-800 mb-6 text-center">Search Appointments</h2>
          <div className="filter-form grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="form-group">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">Start Date:</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={startDate}
                onChange={handleStartDateChange}
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">End Date:</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={endDate}
                onChange={handleEndDateChange}
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="form-group">
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">Start Time:</label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={startTime}
                onChange={handleStartTimeChange}
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="form-group">
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">End Time:</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={endTime}
                onChange={handleEndTimeChange}
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="form-group">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">City:</label>
              <input
                type="text"
                id="city"
                name="city"
                value={city}
                onChange={handleCityChange}
                placeholder="City"
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="form-group">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">Status:</label>
              <select
                id="status"
                name="status"
                value={status}
                onChange={handleStatusChange}
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Canceled">Canceled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-2">Patient Name:</label>
              <input
                type="text"
                id="patientName"
                name="patientName"
                value={patientName}
                onChange={handlePatientNameChange}
                placeholder="Patient Name"
                className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="form-group flex items-end">
              <button 
                onClick={handleSearch} 
                className="search-button w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition duration-300 transform hover:scale-105"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        <div className="appointment-list">
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No appointments found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {appointments.map((appointment) => (
                <div key={appointment._id} className="appointment-item bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Patient Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong className="text-gray-600">Patient Name:</strong> <span className="text-gray-800">{appointment.patient.user.name}</span></p>
                      <p><strong className="text-gray-600">Patient Email:</strong> <span className="text-gray-800">{appointment.patient.user.email}</span></p>
                      <p><strong className="text-gray-600">Patient Phone:</strong> <span className="text-gray-800">{appointment.patient.user.phoneNumber}</span></p>
                      <p><strong className="text-gray-600">Patient City:</strong> <span className="text-gray-800">{appointment.patient.user.city}</span></p>
                      <p><strong className="text-gray-600">Patient State:</strong> <span className="text-gray-800">{appointment.patient.user.state}</span></p>
                      <p><strong className="text-gray-600">Patient Allergies:</strong> <span className="text-gray-800">{appointment.patient.allergies || 'None'}</span></p>
                      <p><strong className="text-gray-600">Current Medications:</strong> <span className="text-gray-800">{appointment.patient.currentMedications || 'None'}</span></p>
                      <p><strong className="text-gray-600">Medical History:</strong> <span className="text-gray-800">{appointment.patient.medicalHistory || 'None'}</span></p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p><strong className="text-gray-600">Appointment Date:</strong> <span className="text-gray-800">{new Date(appointment.date).toLocaleDateString()}</span></p>
                      <p><strong className="text-gray-600">Appointment Time:</strong> <span className="text-gray-800">{appointment.time}</span></p>
                      <p><strong className="text-gray-600">Appointment Status:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                          appointment.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentHistory;
