import React, { createContext, useContext, ReactNode } from 'react';

interface SocketContextType {
  // Add socket methods here when needed
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  // Socket.io implementation can be added here when needed
  // For now, just provide the context without actual socket connection
  // since Vercel serverless doesn't support persistent socket connections

  return (
    <SocketContext.Provider value={{}}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

