import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, Phone, Email, LocationOn, CalendarToday, Refresh, MedicalServices } from '@mui/icons-material';
import { api } from '../../../utils/api';

const UserInfoPage: React.FC = () => {
  const { id: urlId } = useParams<{ id: string }>();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      
      // First, try to get user data from localStorage as fallback
      const authState = localStorage.getItem('authState');
      const authData = authState ? JSON.parse(authState) : null;
      
      // Prioritize localStorage user ID if URL param doesn't work or doesn't exist
      // If localStorage has a user, use that ID instead of URL param
      const localStorageUserId = authData?.user?._id;
      const userIdToFetch = localStorageUserId || urlId;
      
      // Set user data from localStorage immediately (as fallback)
      if (authData?.user) {
        setUserData(authData.user);
      }

      // Only fetch from API if we have a valid user ID and it's different from what we already have
      // Or if we don't have localStorage data yet
      if (userIdToFetch && (!authData?.user || userIdToFetch !== localStorageUserId)) {
        try {
          const response = await fetch(api.getUrl(`userinfo/${userIdToFetch}`), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          const data = await response.json();
          
          if (response.ok && data.success && data.user) {
            // Handle both array response (from User.find) and single user object
            const user = Array.isArray(data.user) ? data.user[0] : data.user;
            
            if (user) {
              setUserData(user);
              
              // Update localStorage with the latest data
              const updatedAuthData = {
                ...authData,
                user: user
              };
              localStorage.setItem('authState', JSON.stringify(updatedAuthData));
            }
          } else {
            // User not found or error - only log if we don't have localStorage data
            if (!authData?.user) {
              if (data.message) {
                console.warn('User info not found:', data.message);
              } else {
                console.warn('Failed to fetch user data:', response.status, response.statusText);
              }
            }
            // Keep using localStorage data if available (already set above)
          }
        } catch (apiError) {
          // Only log error if we don't have localStorage data to fall back on
          if (!authData?.user) {
            console.error('Error fetching user data from API:', apiError);
          }
          // Keep using localStorage data if available (already set above)
        }
      } else if (!userIdToFetch && !authData?.user) {
        // No user ID available and no localStorage data
        console.warn('No user ID available to fetch user data');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }, [urlId]);

  useEffect(() => {
    fetchUserData();
  }, [urlId, fetchUserData]);

  // Add event listener for page focus to refresh data when user comes back
  useEffect(() => {
    const handleFocus = () => {
      fetchUserData();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authState' && e.newValue) {
        try {
          const newAuthData = JSON.parse(e.newValue);
          if (newAuthData?.user) {
            setUserData(newAuthData.user);
          }
        } catch (error) {
          console.error('Error parsing updated auth data:', error);
        }
      }
    };

    const handleUserDataUpdate = (e: CustomEvent) => {
      if (e.detail?.user) {
        setUserData(e.detail.user);
      }
    };

    // Listen for page focus events
    window.addEventListener('focus', handleFocus);
    
    // Listen for localStorage changes (when user updates info in another tab)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom user data update events
    window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    };
  }, [urlId, fetchUserData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">User Not Found</h2>
          <p className="text-gray-600 mb-6">Unable to load user information.</p>
          <Link 
            to="/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition duration-300"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'doctor':
        return '👨‍⚕️';
      case 'patient':
        return '👤';
      case 'admin':
        return '👨‍💼';
      default:
        return '👤';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'from-green-500 to-teal-500';
      case 'patient':
        return 'from-blue-500 to-indigo-500';
      case 'admin':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${getRoleColor(userData.role)} text-white p-8`}>
            <div className="text-center relative">
              <motion.button
                onClick={fetchUserData}
                disabled={loading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute top-0 right-0 p-2 bg-white/20 hover:bg-white/30 rounded-full transition duration-300 disabled:opacity-50"
                title="Refresh user data"
              >
                <Refresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
              <div className="text-6xl mb-4">{getRoleIcon(userData.role)}</div>
              <h1 className="text-3xl font-bold mb-2">{userData.name}</h1>
              <p className="text-lg opacity-90 capitalize">{userData.role}</p>
              {loading && (
                <p className="text-sm opacity-75 mt-2">Updating information...</p>
              )}
            </div>
          </div>

          <div className="p-8">
            {/* Personal Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <span className="mr-2">📋</span>
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100"
                >
                  <div className="flex items-center mb-3">
                    <Email className="text-blue-600 mr-3" />
                    <h3 className="font-semibold text-gray-700">Email Address</h3>
                  </div>
                  <p className="text-lg text-gray-900">{userData.email}</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-xl border border-green-100"
                >
                  <div className="flex items-center mb-3">
                    <Phone className="text-green-600 mr-3" />
                    <h3 className="font-semibold text-gray-700">Phone Number</h3>
                  </div>
                  <p className="text-lg text-gray-900">{userData.phoneNumber || 'Not provided'}</p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100"
                >
                  <div className="flex items-center mb-3">
                    <LocationOn className="text-purple-600 mr-3" />
                    <h3 className="font-semibold text-gray-700">Location</h3>
                  </div>
                  <p className="text-lg text-gray-900">
                    {userData.city && userData.state 
                      ? `${userData.city}, ${userData.state}` 
                      : 'Not provided'
                    }
                  </p>
                  {userData.pincode && (
                    <p className="text-sm text-gray-600 mt-1">Pincode: {userData.pincode}</p>
                  )}
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-100"
                >
                  <div className="flex items-center mb-3">
                    <CalendarToday className="text-orange-600 mr-3" />
                    <h3 className="font-semibold text-gray-700">Member Since</h3>
                  </div>
                  <p className="text-lg text-gray-900">
                    {userData.createdAt 
                      ? new Date(userData.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Unknown'
                    }
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Account Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <span className="mr-2">🔐</span>
                Account Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-700 mb-2">User ID</h3>
                  <p className="text-sm text-gray-600 font-mono">{userData._id}</p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-700 mb-2">Account Status</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    ✓ Active
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="text-center pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={`/user/${userData?._id || urlId}/update`}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Edit className="mr-2" />
                    Update Profile
                  </Link>
                </motion.div>

                {userData.role === 'doctor' && (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        to={`/doctor/${userData?._id || urlId}/professional_info`}
                        className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
                      >
                        <MedicalServices className="mr-2" />
                        View Professional Info
                      </Link>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        to={`/doctor/${userData?._id || urlId}/update_doctor`}
                        className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
                      >
                        <Edit className="mr-2" />
                        Update Professional Info
                      </Link>
                    </motion.div>
                  </>
                )}

                {userData.role === 'patient' && (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        to={`/patient/${userData?._id || urlId}/medical_info`}
                        className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
                      >
                        <MedicalServices className="mr-2" />
                        View Medical Info
                      </Link>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        to={`/patient/${userData?._id || urlId}/update_patient`}
                        className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
                      >
                        <Edit className="mr-2" />
                        Update Medical Info
                      </Link>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserInfoPage;
