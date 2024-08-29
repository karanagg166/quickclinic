import React, { useState } from 'react';
import './signup.css'; // Import the CSS file for styling
import axios from 'axios';
import { Button } from '@mui/material';
import { Google, Brightness4, Brightness7 } from '@mui/icons-material';
import logo from './logo.svg';
import signupVisual from './doctor.png'; // Adjust your image path accordingly
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; // Import the default styles

const SignupPage = () => {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(''); // State for role selection
  const [phone, setPhone] = useState('');
  const [pincode, setPincode] = useState(''); // State for pincode
  const [specialty, setSpecialty] = useState(''); // State for specialty
  const [darkMode, setDarkMode] = useState(false);
  const [city, setcity] = useState('');

  const navigation = useNavigate();

  const onSignup = async (e) => {
    e.preventDefault();
    const phoneNumber=phone;
    try {
      const { data } = await axios.post('http://localhost:5000/api/v1/register', {
        name,
        email,
        password,
        role,
        phoneNumber,
        pincode,
        city, // Include pincode in the request
        specialty: role === 'doctor' ? specialty : undefined, // Include specialty if role is doctor
      });
      console.log("data is here", data);
      if (data.success) {
        login(email, password);
        navigation('/');
      } else {
        console.log(data);
      }
    } catch (error) {
      alert(error.response.data.message);
      // Handle signup error (e.g., show an error message)
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`login-page-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Dark Mode Toggle Icon */}
      <div className="dark-mode-toggle" onClick={toggleDarkMode}>
        {darkMode ? <Brightness7 /> : <Brightness4 />}
      </div>

      {/* Left Side: Form Section */}
      <div className="form-container">
        <div className="form-content">
          <div className="logo">
            {/* Replace with your logo */}
            <img src={logo} alt="Logo" />
          </div>
          <h2>Sign up 🔑</h2>
          <p>Enter details to create your account</p>
          <Button className="google-signup" startIcon={<Google />}>
            Sign up with Google
          </Button>
          <div className="divider">Or sign up with email</div>
          <form className="signup-form" onSubmit={(e) => e.preventDefault()}>
            <div className="name-fields">
              <input
                type="text"
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="input-field"
                value={name}
              />
            </div>
            <input
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="input-field"
              value={email}
            />
            <input
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input-field"
              value={password}
            />

            {/* Phone Number Input */}
            <PhoneInput
              placeholder="Enter phone number"
              value={phone}
              onChange={setPhone}
              className="phone-input" // Apply same styling as other input fields
              defaultCountry="IN"
            />

            {/* Pincode Input */}
            <input
              type="text"
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Pincode"
              className="input-field"
              value={pincode}
            />
             <input
              type="text"
              onChange={(e) => setcity(e.target.value)}
              placeholder="City"
              className="input-field"
              value={city}
            />

            {/* Role Selection */}
            <div className="role-selection">
              <label>Select your role:</label>
              <select
                className="input-field"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Select Role</option>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            {/* Specialty Selection for Doctors */}
            {role === 'doctor' && (
              <div className="specialty-selection">
                <label>Select your specialty:</label>
                <select
                  className="input-field"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                >
                  <option value="">Select Specialty</option>
                  <option value="cardiologist">Cardiologist</option>
                  <option value="neurologist">Neurologist</option>
                  <option value="orthopedic">Orthopedic</option>
                  {/* Add more specialties as needed */}
                </select>
              </div>
            )}

            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            <button type="submit" onClick={onSignup} className="signup-button">
              Sign up
            </button>
          </form>
          <p className="login-link">
            Already have an account? <a href="/login">Login now</a>
          </p>
        </div>
      </div>

      {/* Right Side: Image Section */}
      <div className="image-container">
        <img src={signupVisual} alt="Signup Visual" className="signup-image" />
      </div>
    </div>
  );
};

export default SignupPage;
