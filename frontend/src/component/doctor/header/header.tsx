import React, { useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import NotificationsDropdown from "../../notifications/notifications";
import { Avatar, IconButton, Tooltip } from "@mui/material";
import DoctorSidebar from "../sidebar/DoctorSidebar";
import {
  Dashboard as DashboardIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  AttachMoney as EarningsIcon,
  EventBusy as LeaveIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  X as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../../auth/AuthContext';

const DoctorHeader: React.FC = () => {
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Sidebar should be open by default on desktop, only toggle on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { id: urlId } = useParams<{ id: string }>();

  const data = localStorage.getItem('authState');
  const fetchdata = data ? JSON.parse(data) : null;
  // Always prioritize localStorage first, then URL params as fallback
  const id = fetchdata?.user?._id || urlId;

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

  const handleProfileIconClick = () => {
    setShowProfileCard((prev) => !prev);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/user/home');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navigationItems = [
    {
      icon: <DashboardIcon fontSize="large" />,
      label: "Dashboard",
      path: `/doctor/dashboard/${id}`,
      tooltip: "View Dashboard"
    },
    {
      icon: <CalendarIcon fontSize="large" />,
      label: "Appointments",
      path: `/doctor/dashboard/${id}/appointments`,
      tooltip: "Manage Appointments"
    },
    {
      icon: <ScheduleIcon fontSize="large" />,
      label: "Schedule",
      path: `/doctor/dashboard/${id}/schedule`,
      tooltip: "Update Schedule"
    },
    {
      icon: <EarningsIcon fontSize="large" />,
      label: "Earnings",
      path: `/doctor/dashboard/${id}/earnings`,
      tooltip: "View Earnings"
    },
    {
      icon: <LeaveIcon fontSize="large" />,
      label: "Leave",
      path: `/doctor/dashboard/${id}/leave`,
      tooltip: "Apply for Leave"
    }
  ];

  return (
    <>
      <DoctorSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <header className="bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-xl">
        <div className="container mx-auto p-4 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-white/20 transition duration-300"
          >
            {isSidebarOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          {/* Logo Section */}
          <Link className="text-3xl font-bold tracking-wider hover:text-yellow-300 transition duration-300" to="/user/home">
            <span className="mr-2">👨‍⚕️</span>
            QuickClinic
          </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex space-x-6">
          {navigationItems.map((item, index) => (
            <Tooltip key={index} title={item.tooltip}>
              <Link 
                className="text-white hover:text-yellow-300 transition duration-300"
                to={item.path}
              >
                <IconButton className="text-white hover:text-yellow-300">
                  {item.icon}
                </IconButton>
              </Link>
            </Tooltip>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-white/20 transition duration-300"
          >
            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          {/* Profile Section */}
          <div className="relative">
            <IconButton onClick={handleProfileIconClick}>
              <Avatar
                className="hover:shadow-2xl transition duration-300 ease-in-out transform hover:scale-110 bg-gradient-to-r from-blue-500 to-indigo-500"
              >
                {fetchdata?.user?.name?.charAt(0) || 'D'}
              </Avatar>
            </IconButton>
            <span className="ml-2 text-lg font-semibold hidden sm:inline">
              Dr. {fetchdata?.user?.name}
            </span>

            {/* Profile Card */}
            {showProfileCard && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute right-0 mt-2 w-64 bg-white text-gray-900 shadow-xl rounded-lg p-4 z-50">
                  <h6 className="font-bold text-lg mb-2">Dr. {fetchdata?.user?.name}</h6>
                  <p className="text-sm text-gray-600 mb-1">{fetchdata?.user?.email}</p>
                  <p className="text-sm text-gray-600 mb-4">{fetchdata?.user?.phoneNumber}</p>
                  
                  <div className="space-y-2">
                    <Link
                      className="block w-full text-center bg-teal-600 hover:bg-teal-700 text-white py-2 px-3 rounded-lg shadow-md transition duration-300"
                      to={`/doctor/${id}/update_doctor`}
                      onClick={() => setShowProfileCard(false)}
                    >
                      <SettingsIcon className="inline mr-2" />
                      Update Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-center bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg shadow-md transition duration-300"
                    >
                      <LogoutIcon className="inline mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="lg:hidden bg-green-700 border-t border-green-500">
            <div className="container mx-auto p-4">
              <nav className="grid grid-cols-2 gap-4">
                {navigationItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-green-600 transition duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </motion.div>
      )}

        {/* Notifications Section */}
        <div className="bg-gray-800 p-2">
          <NotificationsDropdown />
        </div>
      </header>
    </>
  );
};

export default DoctorHeader;