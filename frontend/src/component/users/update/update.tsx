import React, { useState } from 'react';
import axios from 'axios';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import logo from './logo.svg';
import { useNavigate, useLocation } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { api } from '../../../utils/api';

const UpdatePage: React.FC = () => {
  const authState = localStorage.getItem('authState');
  const data = JSON.parse(authState || '{}');
  const user = data.user;
  
  const [name, setName] = useState<string>(user?.name || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [phone, setPhone] = useState<string>(user?.phoneNumber || '');
  const [pincode, setPincode] = useState<string>(user?.pincode || '');
  const [city, setCity] = useState<string>(user?.city || '');
  const [state, setState] = useState<string>(user?.state || '');
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPasswordFields, setShowPasswordFields] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password fields if password change is requested
    if (showPasswordFields && (oldPassword || newPassword || confirmPassword)) {
      if (!oldPassword || !newPassword || !confirmPassword) {
        alert("Please fill all password fields to change password");
        return;
      }
      if (newPassword !== confirmPassword) {
        alert("New password and confirm password do not match");
        return;
      }
      if (newPassword.length < 6) {
        alert("Password must be at least 6 characters long");
        return;
      }
    }
    
    try {
      // First update user profile info
      const { data } = await axios.put(api.getUrl(`users/${user._id}`), {
        name,
        email,
        phoneNumber: phone,
        pincode,
        city,
        state
      });
      
      // Then update password if password fields are filled
      if (showPasswordFields && oldPassword && newPassword && confirmPassword) {
        try {
          await axios.put(api.getUrl(`password/update`), {
            oldpassword: oldPassword,
            newpassword: newPassword,
            confirmpassword: confirmPassword
          });
        } catch (passwordError: any) {
          // If password update fails, still show success for profile update but warn about password
          alert("Profile updated, but password update failed: " + (passwordError.response?.data?.message || "Invalid old password"));
          // Clear password fields
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setShowPasswordFields(false);
          
          // Continue with navigation
          if (data.success) {
            const updatedAuthData = {
              ...JSON.parse(authState || '{}'),
              user: data.user
            };
            localStorage.setItem('authState', JSON.stringify(updatedAuthData));
            window.dispatchEvent(new CustomEvent('userDataUpdated', { 
              detail: { user: data.user } 
            }));
            
            // Navigate based on user role
            const userRole = data.user?.role || user?.role;
            const defaultPath = userRole === 'doctor' 
              ? `/doctor/dashboard/${user._id}` 
              : '/user/home';
            navigate(location.state?.from || defaultPath);
          }
          return;
        }
      }
      
      if (data.success) {
        // Update localStorage with the new user data
        const updatedAuthData = {
          ...JSON.parse(authState || '{}'),
          user: data.user
        };
        localStorage.setItem('authState', JSON.stringify(updatedAuthData));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('userDataUpdated', { 
          detail: { user: data.user } 
        }));
        
        // Navigate based on user role
        const userRole = data.user?.role || user?.role;
        const defaultPath = userRole === 'doctor' 
          ? `/doctor/dashboard/${user._id}` 
          : '/user/home';
        navigate(location.state?.from || defaultPath);
        
        alert("Update successful!");
        
        // Clear password fields if password was changed
        if (showPasswordFields && oldPassword && newPassword && confirmPassword) {
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setShowPasswordFields(false);
        }
      } else {
        alert("Update failed!");
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Update failed!");
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900'} transition-all duration-300`}>
      {/* Dark Mode Toggle */}
      <div 
        className="fixed top-4 right-4 z-50 cursor-pointer p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
        onClick={toggleDarkMode}
        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {darkMode ? (
          <Brightness7 className="text-yellow-400" fontSize="large" />
        ) : (
          <Brightness4 className="text-white" fontSize="large" />
        )}
      </div>

      {/* Main Container */}
      <div className="flex min-h-screen">
        {/* Left Side: Form Section */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className={`w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-8 transition-all duration-300`}>
            {/* Logo */}
            <div className="text-center mb-8">
              <img 
                src={logo} 
                alt="Logo" 
                className="w-16 h-16 mx-auto mb-4"
              />
            </div>
            
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Update Your Information
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Modify your details to keep your profile up to date
              </p>
            </div>

            {/* Form */}
            <form className="space-y-6" onSubmit={onUpdate}>
              <div>
                <input
                  type="text"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600' 
                      : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:bg-white'
                  }`}
                  value={name}
                />
              </div>

              <div>
                <input
                  type="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600' 
                      : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:bg-white'
                  }`}
                  value={email}
                />
              </div>

              <div>
                <PhoneInput
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(value) => setPhone(value || '')}
                  defaultCountry="IN"
                  inputFormat="national"
                  international={false}
                  className={`phone-input w-full ${
                    darkMode 
                      ? '[&>input]:bg-gray-700 [&>input]:border-gray-600 [&>input]:text-white [&>input]:placeholder-gray-400' 
                      : '[&>input]:bg-gray-50 [&>input]:border-gray-300 [&>input]:text-gray-800 [&>input]:placeholder-gray-500'
                  }`}
                />
              </div>

              <div>
                <input
                  type="text"
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="Pincode"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600' 
                      : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:bg-white'
                  }`}
                  value={pincode}
                />
              </div>

              <div>
                <input
                  type="text"
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600' 
                      : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:bg-white'
                  }`}
                  value={city}
                />
              </div>

              <div>
                <input
                  type="text"
                  onChange={(e) => setState(e.target.value)}
                  placeholder="State"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600' 
                      : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:bg-white'
                  }`}
                  value={state}
                />
              </div>

              {/* Password Change Section */}
              <div className="border-t border-gray-300 pt-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Change Password
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordFields(!showPasswordFields);
                      if (showPasswordFields) {
                        setOldPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }
                    }}
                    className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                      showPasswordFields
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {showPasswordFields ? 'Cancel' : 'Change Password'}
                  </button>
                </div>

                {showPasswordFields && (
                  <div className="space-y-4">
                    <div>
                      <input
                        type="password"
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Current Password"
                        className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600' 
                            : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:bg-white'
                        }`}
                        value={oldPassword}
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New Password"
                        className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600' 
                            : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:bg-white'
                        }`}
                        value={newPassword}
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm New Password"
                        className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600' 
                            : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:bg-white'
                        }`}
                        value={confirmPassword}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                  darkMode
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                }`}
              >
                Update
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePage;

