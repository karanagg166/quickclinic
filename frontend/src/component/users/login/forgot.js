import React, { useState } from 'react';
import './LoginPage.css'; // Import the CSS file for styling
// Import Material-UI components and icons
import { Button } from '@mui/material';
import { Google, Brightness4, Brightness7 } from '@mui/icons-material';
import logo from './logo.svg';
import signupVisual from './login.png'; // Adjust your image path accordingly
import axios from 'axios';



const LoginPage = () => {
   
    
const [email,setemail]=useState('');




const onsubmit = async (e) => {
  e.preventDefault();
    try{
        const { data2 } = await axios.post('/api/v1/forget',{email})
        console.log(data2);
        if (data2) {
         
        } else {
           
          console.log("data hrrrrrr",data2);
      }
    }
    catch(error){
        <p>successfully link send to following mail</p>
       alert("this email don't exsist");
    }
    
};

  const [darkMode, setDarkMode] = useState(false);

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
          <Button className="google-signup" startIcon={<Google />}>
            Login with Google
          </Button>
          <div className="divider">Or sign up with email</div>
          <form className="signup-form">
            <input type="email" onChange={(e)=>setemail(e.target.value)} placeholder="Email" className="input-field" />
            
            
            <button type="submit" onClick={onsubmit} className="signup-button">Forget Password</button>
          </form>
          
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
