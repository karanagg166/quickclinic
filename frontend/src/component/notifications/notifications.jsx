// src/components/NotificationsDropdown.js

import React, { useState, useCallback } from 'react';
import { Notifications as NotificationsIcon, Delete as DeleteIcon, Inbox as InboxIcon } from '@mui/icons-material';
import axios from 'axios';

const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const id = JSON.parse(localStorage.getItem('authState'))?.user?._id;

  

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get(`/api/v1/notifications/${id}`);
      if (Array.isArray(response.data)) {
        setNotifications(response.data);
      } else {
        console.error('Fetched data is not an array');
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [id]); // Dependency on id to ensure it's updated when user changes

  const markAllAsRead = async () => {
    try {
      await axios.post(`/api/v1/marknotifications/${id}`);
      fetchNotifications(); // Refresh notifications after marking them as read
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await axios.delete(`/api/v1/notifications/${notificationId}`);
      fetchNotifications(); // Refresh notifications after deleting
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <div className="relative">
      {/* Notification Icon Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllAsRead(); // Mark notifications as read when opening
        }}
        className="p-2 rounded-full hover:bg-gray-200 focus:outline-none relative z-10"
      >
        <NotificationsIcon className="text-white" />
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-scroll"
          style={{ top: '100%' }} // Dropdown opens below the notification icon
        >
          <div className="p-4 border-b bg-gray-100">
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>

          {/* Notification List */}
          <div>
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-center p-4 border-b ${notification.read ? 'bg-gray-200 text-gray-500' : 'bg-white text-black'}`}
                >
                  <div className="flex-1">
                    <p className="text-sm">{notification.content}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                <InboxIcon className="text-4xl text-blue-500 mb-2" />
                <p>No notifications</p>
              </div>
            )}

            {/* Scroll hint if there are more than 5 notifications */}
            {notifications.length > 5 && (
              <div className="text-center p-2 text-gray-500">
                <p>Scroll for more...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;
