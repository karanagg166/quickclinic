import React, { useState } from 'react';
import './update.css'; // Import the CSS file for styling
import axios from 'axios';

import { Brightness4, Brightness7 } from '@mui/icons-material';
import logo from './logo.svg'; // Adjust your image path accordingly

import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; // Import the default styles

const UpdatePage = () => {
    const authState = localStorage.getItem('authState');
    const data = JSON.parse(authState);
    const user=data.user;
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [pincode, setPincode] = useState(user.pincode || '');
  const [city, setCity] = useState(user.city || '');
  const [state, setState] = useState(user.state || '');
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location

  const onUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put(`/api/v1/users/${user._id}`, {
        name,
        email,
        phoneNumber: phone,
        pincode,
        city,
        state
      });
      if (data.success) {
        // Redirect to the previous page
        navigate(location.state?.from || '/user/home'); // Use 'from' state or fallback to a default page
        alert("Update successful!");
      } else {
        // Handle unsuccessful update
        alert("Update failed!");
      }
    } catch (error) {
      alert(error.response.data.message);
      // Handle update error (e.g., show an error message)
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`update-page-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Dark Mode Toggle Icon */}
      <div className="dark-mode-toggle" onClick={toggleDarkMode}>
        {darkMode ? <Brightness7 /> : <Brightness4 />}
      </div>

      {/* Left Side: Form Section */}
      <div className="form-container">
        <div className="form-content">
          <div className="logo">
            <img src={logo} alt="Logo" />
          </div>
          <h2>Update Your Information</h2>
          <p>Modify your details to keep your profile up to date</p>
          <form className="update-form" onSubmit={onUpdate}>
            <input
              type="text"
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="input-field"
              value={name}
            />
            <input
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="input-field"
              value={email}
            />
            <PhoneInput
              placeholder="Enter phone number"
              value={phone}
              onChange={setPhone}
              className="phone-input"
              defaultCountry="IN"
            />
            <input
              type="text"
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Pincode"
              className="input-field"
              value={pincode}
            />
            <input
              type="text"
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="input-field"
              value={city}
            />
            <input
              type="text"
              onChange={(e) => setState(e.target.value)}
              placeholder="State"
              className="input-field"
              value={state}
            />
            <button type="submit" className="update-button">
              Update
            </button>
          </form>
        </div>
      </div>

      {/* Right Side: Image Section */}
      
    </div>
  );
};

export default UpdatePage;
