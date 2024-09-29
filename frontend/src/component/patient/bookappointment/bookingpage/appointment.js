import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CitySelect,
  CountrySelect,
  StateSelect,
} from 'react-country-state-city';
import 'react-country-state-city/dist/react-country-state-city.css';
import './appointment.css'; // Custom CSS for animations and styling
import axios from 'axios';
import DoctorCard from '../doctorlist/doctorlist'; // Import the DoctorCard component
import appointment from '../../../../images/appointment1.jpg' 
const BookingPage = () => {
  // State and parameters
  const defaultCountryId = 101; // India’s ID according to the react-country-state-city library
  const [countryId, setCountryId] = useState(defaultCountryId); // Set India as default
  const [stateId, setStateId] = useState(0);
  const [city, setCityId] = useState('');
  const [state, setState] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experience, setExperience] = useState('');
  const [fees, setFees] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctors, setDoctors] = useState([]);
  const { id } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data } = await axios.get(`http://localhost:5000/api/v1/${id}/patient/specific_doctors`, {
        params: {
          state,
          city,
          fees,
          experience,
          doc_name: doctorName,
          specialty
        }
      });
console.log("data is here",data);
      if (data.success) {
        setDoctors(data.doctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const specialties = ['Cardiologist'];

  const getDynamicPadding = () => {
    const cardHeight = 200; // Approximate height of each doctor card
    const containerPadding = 50; // Base padding to avoid collision with the footer

    // Ensure doctors is an array and has a length property
    const numberOfDoctors = Array.isArray(doctors) ? doctors.length : 0;
    const extraPadding = numberOfDoctors > 3 ? (numberOfDoctors - 3) * cardHeight : 0;

    return { paddingBottom: `${containerPadding + extraPadding}px` };
  };

  return (
    <div className="flex justify-center items-center flex-col" style={getDynamicPadding()}>
      <h1 className="heading mt-8">Book an Appointment</h1>
      <div className="flex gap-36">
      <div className="animated-form "> 
          {/* Form Fields */}
        <h6>Country</h6>
        <CountrySelect
          defaultValue={{ isoCode: 'IN', name: 'India' }}
          onChange={(e) => setCountryId(e.id)}
          placeHolder="Select Country"
          required
        />

        <h6>State</h6>
        <StateSelect
          countryid={countryId}
          onChange={(e) => {
            setStateId(e.id);
            setState(e.value); // Assuming 'e.value' contains the state name
          }}
          placeHolder="Select State"
          required
        />

        <h6>City</h6>
        <CitySelect
          countryid={countryId}
          stateid={stateId}
          onChange={(e) => setCityId(e.name)}
          placeHolder="Select City"
          required
        />

        <h6>Specialty</h6>
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="animated-input"
          required
        >
          <option value="" disabled>
            Select Specialty
          </option>
          {specialties.map((spec, index) => (
            <option key={index} value={spec}>
              {spec}
            </option>
          ))}
        </select>

        <h6>Experience (Years)</h6>
        <input
          type="number"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          className="animated-input"
          placeholder="Enter Experience"
          min="0"
          required
        />

        <h6>Fees</h6>
        <input
          type="number"
          value={fees}
          onChange={(e) => setFees(e.target.value)}
          className="animated-input"
          placeholder="Enter Fees"
          min="0"
          required
        />

        <h6>Doctor's Name</h6>
        <input
          type="text"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
          className="animated-input"
          placeholder="Enter Doctor's Name"
          required
        />

        <button type="submit" onClick={handleSubmit} className="w-100 animated-button">
          Find Doctors
        </button>
        </div>
        <div className='flex justify-center items-center'>
          <img src={appointment} className='rounded-3xl shadow-2xl' alt='t' /> 
        </div>

      </div>

      {/* Render DoctorCard components */}
      <div className="doctor-cards-container">
        {doctors.map((doctor) => (
          <DoctorCard key={doctor._id} doctor={doctor} />
        ))}
      </div>
    </div>
  );
};

export default BookingPage;
