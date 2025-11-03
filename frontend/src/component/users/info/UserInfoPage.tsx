import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit, Phone, Email, LocationOn, CalendarToday, Refresh, MedicalServices } from '@mui/icons-material';
import { api } from '../../../utils/api';
import SimpleParticleBackground from '../../common/SimpleParticleBackground';
import GlassCard from '../../common/GlassCard';
import NeonButton from '../../common/NeonButton';
import { Mail, Phone as PhoneIcon, MapPin, Calendar, User as UserIcon, Stethoscope } from 'lucide-react';

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
      
      // Prioritize localStorage user ID - always use it if available
      // Only use URL param if localStorage doesn't have a user ID
      const localStorageUserId = authData?.user?._id;
      const userIdToFetch = localStorageUserId || urlId;
      
      // Set user data from localStorage immediately (as fallback)
      if (authData?.user) {
        setUserData(authData.user);
      }

      // Only fetch from API if:
      // 1. We have a user ID to fetch, AND
      // 2. We don't have localStorage data OR the ID to fetch is different from localStorage
      // This prevents unnecessary API calls when we already have the correct user data
      if (userIdToFetch && (!authData?.user || (localStorageUserId && userIdToFetch !== localStorageUserId))) {
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
      <div className="min-h-screen relative overflow-hidden">
        <SimpleParticleBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center pt-28">
          <GlassCard glow className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-400 mx-auto mb-4"></div>
              <p className="text-white/70">Loading user information...</p>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <SimpleParticleBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center pt-28">
          <GlassCard glow className="p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">User Not Found</h2>
              <p className="text-white/70 mb-6">Unable to load user information.</p>
              <NeonButton onClick={() => window.location.href = '/login'}>
                Go to Login
              </NeonButton>
            </div>
          </GlassCard>
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
    <div className="min-h-screen relative overflow-hidden">
      <SimpleParticleBackground />
      <div className="relative z-10 min-h-screen pt-28 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard glow className="overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-neon-500/20 to-cyan-500/20 backdrop-blur-sm border-b border-white/20 p-8">
                <div className="text-center relative">
                  <motion.button
                    onClick={fetchUserData}
                    disabled={loading}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute top-0 right-0 p-2 bg-white/20 hover:bg-white/30 rounded-full transition duration-300 disabled:opacity-50"
                    title="Refresh user data"
                  >
                    <Refresh className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
                  </motion.button>
                  <div className="text-6xl mb-4">{getRoleIcon(userData.role)}</div>
                  <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">{userData.name}</h1>
                  <p className="text-lg text-white/80 capitalize">{userData.role}</p>
                  {loading && (
                    <p className="text-sm text-white/60 mt-2">Updating information...</p>
                  )}
                </div>
          </div>

              <div className="p-8">
                {/* Personal Information */}
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">
                    <UserIcon className="w-6 h-6 text-neon-400" />
                    Personal Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20"
                    >
                      <div className="flex items-center mb-3">
                        <Mail className="text-neon-400 mr-3" />
                        <h3 className="font-semibold text-white">Email Address</h3>
                      </div>
                      <p className="text-lg text-white">{userData.email}</p>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20"
                    >
                      <div className="flex items-center mb-3">
                        <PhoneIcon className="text-cyan-400 mr-3" />
                        <h3 className="font-semibold text-white">Phone Number</h3>
                      </div>
                      <p className="text-lg text-white">{userData.phoneNumber || 'Not provided'}</p>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20"
                    >
                      <div className="flex items-center mb-3">
                        <MapPin className="text-neon-400 mr-3" />
                        <h3 className="font-semibold text-white">Location</h3>
                      </div>
                      <p className="text-lg text-white">
                        {userData.city && userData.state 
                          ? `${userData.city}, ${userData.state}` 
                          : 'Not provided'
                        }
                      </p>
                      {userData.pincode && (
                        <p className="text-sm text-white/70 mt-1">Pincode: {userData.pincode}</p>
                      )}
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20"
                    >
                      <div className="flex items-center mb-3">
                        <Calendar className="text-cyan-400 mr-3" />
                        <h3 className="font-semibold text-white">Member Since</h3>
                      </div>
                      <p className="text-lg text-white">
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
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">
                    <UserIcon className="w-6 h-6 text-neon-400" />
                    Account Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
                      <h3 className="font-semibold text-white mb-2">User ID</h3>
                      <p className="text-sm text-white/70 font-mono">{userData._id}</p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
                      <h3 className="font-semibold text-white mb-2">Account Status</h3>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/30 text-green-300 border border-green-400/50">
                        ✓ Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="text-center pt-6 border-t border-white/20">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <NeonButton
                      as={Link}
                      to={`/user/${userData?._id || urlId}/update`}
                      variant="outline"
                    >
                      <Edit className="mr-2" />
                      Update Profile
                    </NeonButton>

                    {userData.role === 'doctor' && (
                      <>
                        <NeonButton
                          as={Link}
                          to={`/doctor/${userData?._id || urlId}/professional_info`}
                          variant="outline"
                        >
                          <Stethoscope className="mr-2" />
                          View Professional Info
                        </NeonButton>
                        <NeonButton
                          as={Link}
                          to={`/doctor/${userData?._id || urlId}/update_doctor`}
                        >
                          <Edit className="mr-2" />
                          Update Professional Info
                        </NeonButton>
                      </>
                    )}

                    {userData.role === 'patient' && (
                      <>
                        <NeonButton
                          as={Link}
                          to={`/patient/${userData?._id || urlId}/medical_info`}
                          variant="outline"
                        >
                          <Stethoscope className="mr-2" />
                          View Medical Info
                        </NeonButton>
                        <NeonButton
                          as={Link}
                          to={`/patient/${userData?._id || urlId}/update_patient`}
                        >
                          <Edit className="mr-2" />
                          Update Medical Info
                        </NeonButton>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UserInfoPage;
