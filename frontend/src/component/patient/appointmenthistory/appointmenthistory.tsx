import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { api } from '../../../utils/api';

interface Doctor {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
    city: string;
    state: string;
    pincode: string;
  };
  specialization: string;
  experience: number;
  fees: number;
}

interface Appointment {
  _id: string;
  doctor: Doctor;
  patient: string;
  date: string;
  time: string;
  fees: number;
  paid: boolean;
  appointmentNumber: string;
  status: 'Scheduled' | 'Completed' | 'Canceled' | 'Postponed';
  __v: number;
}

const AppointmentHistory = () => {
  const { id } = useParams<{ id: string }>();

  // Define individual state for each filter field
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [city, setCity] = useState('');
  const [specialist, setSpecialist] = useState('');
  const [docName, setDocName] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch usual appointments from the backend
  const fetchUsualAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(api.getUrl(`${id}/patient/usual_history`));
      const data = response.data.appointments;
      console.log(response);
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching usual appointments:', error);
      setError('Error fetching appointment history');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch search results from the backend with filters
  const handleSearch = async () => {
    console.log("Search filters:", { startDate, endDate, startTime, endTime, city, specialist, docName });
    try {
      setLoading(true);
      
      // Build params object with only non-empty values
      const params: any = {};
      if (startDate && startDate.trim()) params.startDate = startDate;
      if (endDate && endDate.trim()) params.endDate = endDate;
      if (startTime && startTime.trim()) params.startTime = startTime;
      if (endTime && endTime.trim()) params.endTime = endTime;
      if (city && city.trim()) params.city = city;
      if (specialist && specialist.trim()) params.specialty = specialist;
      if (docName && docName.trim()) params.doc_name = docName;
      
      console.log("Sending params:", params);
      
      const response = await axios.get(api.getUrl(`${id}/patient/specific_appointment`), {
        params
      });
      const data = response.data.appointments;
      console.log("Filtered appointments:", data);
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching search results:', error);
      setError('Error fetching search results');
    } finally {
      setLoading(false);
    }
  };

  // Fetch usual appointments on component mount
  useEffect(() => {
    fetchUsualAppointments();
  }, [fetchUsualAppointments]);

  // Handlers for input changes
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value);
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value);
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value);
  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value);
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value);
  const handleSpecialistChange = (e: React.ChangeEvent<HTMLInputElement>) => setSpecialist(e.target.value);
  const handleDocNameChange = (e: React.ChangeEvent<HTMLInputElement>) => setDocName(e.target.value);

  // Clear all filters
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setEndTime('');
    setCity('');
    setSpecialist('');
    setDocName('');
    fetchUsualAppointments(); // Reload all appointments
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Canceled':
        return 'bg-red-100 text-red-800';
      case 'Postponed':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading appointment history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8 border-b-2 border-gray-200 pb-4">
            Search Appointments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="flex flex-col">
              <label htmlFor="startDate" className="text-sm font-semibold text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={startDate}
                onChange={handleStartDateChange}
                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-300"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="endDate" className="text-sm font-semibold text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={endDate}
                onChange={handleEndDateChange}
                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-300"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="startTime" className="text-sm font-semibold text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={startTime}
                onChange={handleStartTimeChange}
                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-300"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="endTime" className="text-sm font-semibold text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={endTime}
                onChange={handleEndTimeChange}
                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-300"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="city" className="text-sm font-semibold text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={city}
                onChange={handleCityChange}
                placeholder="Enter city"
                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-300"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="specialist" className="text-sm font-semibold text-gray-700 mb-2">
                Specialist
              </label>
              <input
                type="text"
                id="specialist"
                name="specialist"
                value={specialist}
                onChange={handleSpecialistChange}
                placeholder="Enter specialist"
                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-300"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="doctorName" className="text-sm font-semibold text-gray-700 mb-2">
                Doctor Name
              </label>
              <input
                type="text"
                id="doctorName"
                name="doctorName"
                value={docName}
                onChange={handleDocNameChange}
                placeholder="Enter doctor name"
                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-300"
              />
            </div>
            <div className="flex items-end gap-4">
              <button 
                onClick={handleSearch} 
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Apply Filters
              </button>
              <button 
                onClick={clearFilters} 
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Clear Filters
              </button>
            </div>
            
            {/* Debug Info */}
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Info:</h3>
              <div className="text-xs text-gray-600">
                <p>Current filters: {JSON.stringify({ startDate, endDate, startTime, endTime, city, specialist, docName })}</p>
                <p>Total appointments: {appointments.length}</p>
              </div>
              <div className="mt-2">
                <button 
                  onClick={() => {
                    setDocName('test');
                    handleSearch();
                  }}
                  className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                >
                  Test Filter with "test"
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-6">
          {appointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-xl p-12 text-center">
              <div className="text-gray-500 text-xl mb-4">No appointments found</div>
              <div className="text-gray-400">Try adjusting your search filters</div>
            </div>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment._id} className="bg-white rounded-lg shadow-xl p-6 border-l-4 border-blue-500 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                  <div className="flex items-center gap-4 mb-4 lg:mb-0">
                    <h3 className="text-2xl font-bold text-gray-800">
                      Dr. {appointment.doctor.user.name}
                    </h3>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Date</span>
                    <p className="text-lg font-medium text-gray-800">{new Date(appointment.date).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Time</span>
                    <p className="text-lg font-medium text-gray-800">{appointment.time}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Speciality</span>
                    <p className="text-lg font-medium text-gray-800 capitalize">{appointment.doctor.specialization}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">City</span>
                    <p className="text-lg font-medium text-gray-800">{appointment.doctor.user.city}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">State</span>
                    <p className="text-lg font-medium text-gray-800">{appointment.doctor.user.state}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Fees</span>
                    <p className="text-lg font-medium text-gray-800">₹{appointment.fees}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Payment Status</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      appointment.paid 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {appointment.paid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Doctor Phone</span>
                    <p className="text-lg font-medium text-gray-800">{appointment.doctor.user.phoneNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Doctor Email</span>
                    <p className="text-lg font-medium text-gray-800">{appointment.doctor.user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Appointment Number</span>
                    <p className="text-lg font-medium text-gray-800 font-mono bg-gray-100 px-3 py-1 rounded">{appointment.appointmentNumber}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentHistory;
