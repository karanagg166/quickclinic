import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
const [setOnlineUsers]=useState('');
  useEffect(() => {
    const authState = JSON.parse(localStorage.getItem('authState'));
    const userId = authState?.user?._id; // Get userId from localStorage or any other source

    if (userId) {
      console.log('Attempting to connect to socket server with userId:', userId);
      
      // Initialize socket with userId in the query
      const newSocket = io('', {
        query: { userId },
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
      });
      newSocket.on("getOnlineUsers", (users) => {
				setOnlineUsers(users);
			});
      return () => {
        console.log('Disconnecting from socket server');
        newSocket.disconnect();
      };
    }
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
