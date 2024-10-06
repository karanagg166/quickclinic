import React, { useState } from 'react';
import './LoginPage.css'; // Import the CSS file for styling
// Import Material-UI components and icons
import { Button } from '@mui/material';
import { auth, provider, signInWithPopup } from '../../firebase/firebase';
import { Google, Brightness4, Brightness7 } from '@mui/icons-material';
import logo from './logo.svg';
import signupVisual from './login.png'; // Adjust your image path accordingly
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setemail] = useState('');
  const [password, setpassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [darkMode, setDarkMode] = useState(false);

  const onsubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await login(email, password);
      console.log("login page data is here", data);

      if (data.success) {
        // If the login is successful, navigate to the home page
        const id = data.user._id;
        const role = data.user.role;
        console.log("Login successful, redirecting to home page...", data);
        if (role === 'patient') {
          navigate(`/patient/dashboard/${id}`);
        } else {
          navigate(`/doctor/dashboard/${id}`);
        }

      } else {
        // If login fails (e.g., wrong credentials), navigate to the signup page
        alert("Login failed, try again ");
        navigate('/user/login');
      }
    } catch (error) {
      console.error("Error during login: ", error);
      // Optionally, navigate to an error page or display an error message to the user
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const email = user.email;
      const { data } = await axios.post("/api/v1/checkuser", {
        email
      })
      if (data.success) {
        const newAuthState = {
          success: true,
          user: data.user,
        };
        localStorage.setItem('authState', JSON.stringify(newAuthState));
        navigate('/user/home');
      } else {
        alert("This email is not registered")
        navigate('/user/signup');
      }

    } catch (error) {
      console.error("Error during Google Login: ", error);
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
          <h2>Login 🔑</h2>
          <p>Enter your email and password to create your account</p>
          <Button className="google-signup" onClick={handleGoogleLogin} startIcon={<Google />}>
            Login with Google
          </Button>
          <div className="divider">Or sign up with email</div>
          <form className="signup-form">
            <input 
              type="email" 
              onChange={(e) => setemail(e.target.value)} 
              placeholder="Email" 
              className="input-field" 
            />
            <input 
              type={showPassword ? 'text' : 'password'} 
              onChange={(e) => setpassword(e.target.value)} 
              placeholder="Password" 
              className="input-field" 
            />
            <div className="password-visibility">
              <input 
                type="checkbox" 
                id="show-password" 
                checked={showPassword} 
                onChange={() => setShowPassword(!showPassword)} 
              />
              <label htmlFor="show-password">Show Password</label>
            </div>
            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            <button type="submit" onClick={onsubmit} className="signup-button">Login</button>
          </form>
          <p className="login-link">
            <a href='/user/signup'> Don't have an account? Signup </a>
          </p>
          <p className="login-link">
            <a href='/user/forgot'> Forgot password </a>
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

export default LoginPage;
