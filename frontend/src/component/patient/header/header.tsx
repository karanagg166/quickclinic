import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import NotificationsDropdown from "../../notifications/notifications";
import { Avatar } from "@mui/material";
import PatientSidebar from "../sidebar/PatientSidebar";
import NeonButton from "../../common/NeonButton";
import { Stethoscope, Calendar, History, X, Menu, LogOut, User } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";


const PatientHeader = () => {
  const [showProfileCard, setShowProfileCard] = useState(false);
  // Sidebar should be open by default on desktop, only toggle on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  
  // Update sidebar state on window resize
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const { authState, logout } = useAuth();
  const data = localStorage.getItem('authState');
  const fetchdata = data ? JSON.parse(data) : null;
  const id = fetchdata?.user?._id;
  const navigate = useNavigate();

  const handleProfileIconClick = () => {
    setShowProfileCard((prev) => !prev);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleLogout = async () => {
    try {
      // Call AuthContext logout to update state
      await logout();
      // Redirect to login page
      navigate('/login');
      // Force a page reload to ensure all components update
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear localStorage and redirect
      localStorage.removeItem('authState');
      navigate('/login');
      window.location.reload();
    }
  };

  return (
    <>
      <PatientSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/10 backdrop-blur-md border-b border-white/20 shadow-2xl">
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Sidebar Toggle Button - Visible on all screen sizes */}
          <motion.button
            onClick={toggleSidebar}
            className="p-3 rounded-lg hover:bg-white/20 transition duration-300 flex items-center gap-2 bg-white/10 border border-white/20"
            title={isSidebarOpen ? "Close Menu" : "Open Menu"}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: isSidebarOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isSidebarOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
            </motion.div>
            <span className="hidden sm:inline text-sm font-medium text-white">Menu</span>
          </motion.button>

          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link className="text-3xl font-bold font-neon tracking-wider text-white hover:text-cyan-400 transition duration-300 flex items-center group" to="/user/home">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="mr-3"
              >
                <Stethoscope className="w-8 h-8 text-neon-400" />
              </motion.div>
              <span className="bg-gradient-to-r from-neon-400 to-cyan-400 bg-clip-text text-transparent">
                QuickClinic
              </span>
            </Link>
          </motion.div>

        {/* Desktop Navigation Links */}
        <motion.nav 
          className="hidden lg:flex space-x-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <NeonButton 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/patient/dashboard/${id}/appointment`)}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Book Appointment
          </NeonButton>
          
          <NeonButton 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/patient/dashboard/${id}/history`)}
            className="flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            History
          </NeonButton>
          
          <NeonButton 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/patient/dashboard/${id}/cancel/postpond`)}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </NeonButton>
        </motion.nav>

        {/* User Profile Section */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.button
            onClick={handleProfileIconClick}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Avatar
              className="hover:shadow-2xl transition duration-300 ease-in-out transform hover:scale-110 border-2 border-neon-400"
            />
            <span className="text-lg font-semibold text-white">{fetchdata?.user?.name}</span>
          </motion.button>

          {/* Profile Card */}
          {showProfileCard && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="absolute right-0 mt-2 w-64 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl"
            >
              <div className="text-white">
                <h6 className="font-bold text-lg mb-2">Name: {fetchdata?.user?.name}</h6>
                <h6 className="text-white/80 mb-1">Email: {fetchdata?.user?.email}</h6>
                <h6 className="text-white/80 mb-4">Phone: {fetchdata?.user?.phoneNumber}</h6>
                <div className="space-y-3">
                  <Link
                    className="block"
                    to={`/user/${id}/update`}
                  >
                    <NeonButton variant="outline" size="sm" className="w-full justify-center">
                      <User className="w-4 h-4" />
                      Update Info
                    </NeonButton>
                  </Link>
                  <NeonButton 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleLogout}
                    className="w-full justify-center"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </NeonButton>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

        {/* Notifications Section */}
        <div className="bg-white/5 backdrop-blur-sm border-t border-white/10 p-2">
          <NotificationsDropdown />
        </div>
      </header>
    </>
  );
};

export default PatientHeader;
