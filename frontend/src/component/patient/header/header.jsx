import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import NotificationsDropdown from "../../notifications/notifications";
import { Avatar, IconButton, Tooltip } from "@mui/material";

import HistoryIcon from '@mui/icons-material/History';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventBusyIcon from '@mui/icons-material/EventBusy';

const PatientHeader = () => {
  const [showProfileCard, setShowProfileCard] = useState(false);
  const data = localStorage.getItem('authState');
  const fetchdata = JSON.parse(data);
  const id = fetchdata.user._id;
  const navigate = useNavigate();

  const handleProfileIconClick = () => {
    setShowProfileCard((prev) => !prev);
  };

  return (
    <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl">
      <div className="container mx-auto p-4 flex items-center justify-between">
        {/* Logo Section */}
        <Link className="text-3xl font-bold tracking-wider hover:text-yellow-300 transition duration-300" to="/user/home">
          QuickClinic
        </Link>

        {/* Navigation Links */}
        <nav className="flex space-x-6">
          <Tooltip title="Book Appointment">
            <IconButton
              className="text-white hover:text-yellow-300 transition duration-300"
              onClick={() => navigate(`/patient/dashboard/${id}/appointment`)}
            >
              <CalendarTodayIcon fontSize="large" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Appointment History">
            <Link className="text-white hover:text-yellow-300" to={`/patient/dashboard/${id}/history`}>
              <IconButton>
                <HistoryIcon fontSize="large" />
              </IconButton>
            </Link>
          </Tooltip>
          <Tooltip title="Cancel/Postpone">
            <Link className="text-white hover:text-yellow-300" to={`/patient/dashboard/${id}/cancel/postpond`}>
              <IconButton>
                <EventBusyIcon fontSize="large" />
              </IconButton>
            </Link>
          </Tooltip>
        </nav>

        {/* User Profile Section */}
        <div className="relative">
          <IconButton onClick={handleProfileIconClick}>
            <Avatar
              src="https://via.placeholder.com/40"
              className="hover:shadow-2xl transition duration-300 ease-in-out transform hover:scale-110"
            />
          </IconButton>
          <span className="ml-2 text-lg font-semibold">{fetchdata.user.name}</span>

          {/* Profile Card */}
          {showProfileCard && (
            <motion.div
              className="absolute right-0 mt-2 w-56 bg-white text-gray-900 shadow-xl rounded-lg p-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h6 className="font-bold">Name: {fetchdata.user.name}</h6>
              <h6>Email: {fetchdata.user.email}</h6>
              <h6>Phone: {fetchdata.user.phoneNumber}</h6>
              <Link
                className="block mt-2 text-center bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-2 rounded-lg shadow-md transition duration-300"
                to={`/user/${id}/update`}
              >
                Update Info
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-gray-800 p-2">
        <NotificationsDropdown />
      </div>
    </header>
  );
};

export default PatientHeader;
