import React, { createContext, useState, useContext, ReactNode } from 'react';
import axios from 'axios';
import { api } from '../../utils/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phoneNumber: string;
  city: string;
  state: string;
  pincode: string;
}

interface AuthState {
  success: boolean;
  user: User | null;
}

interface AuthContextType {
  authState: AuthState;
  login: (email: string, password: string) => Promise<AuthState | false>;
  logout: () => Promise<void>;
  clearAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const savedAuthState = localStorage.getItem('authState');
    if (savedAuthState) {
      try {
        const parsed = JSON.parse(savedAuthState);
        // Validate that the user ID is a valid MongoDB ObjectId (24 characters)
        if (parsed.user && parsed.user._id && parsed.user._id.length === 24) {
          return parsed;
        } else {
          console.warn('Invalid user ID in localStorage, clearing auth state');
          localStorage.removeItem('authState');
        }
      } catch (error) {
        console.error('Error parsing auth state from localStorage:', error);
        localStorage.removeItem('authState');
      }
    }
    return { success: false, user: null };
  });

  const login = async (email: string, password: string): Promise<AuthState | false> => {
    // console.log("backend api link",process.env.REACT_APP_API_URL);
    // console.log('All env vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP')));
    try {
    console.log('login url', api.getUrl('login'));
    const { data } = await axios.post(api.getUrl('login'), { email, password });

   
      if (data && data.user) {
        // Validate that the user ID is a valid MongoDB ObjectId (24 characters)
        if (!data.user._id || data.user._id.length !== 24) {
          console.error('Invalid user ID received:', data.user._id);
          alert('Invalid user data received. Please try logging in again.');
          return false;
        }

        const newAuthState: AuthState = {
          success: true,
          user: data.user,
        };

        // Update local storage and the auth state
        localStorage.setItem('authState', JSON.stringify(newAuthState));
        setAuthState(newAuthState);

        // Return the new auth state directly
        console.log("new auth state", newAuthState);
        console.log("auth context.tsx data is ", data);
        return newAuthState;
      } else {
        console.error('No user data received from login');
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      alert(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await axios.post(api.getUrl('logout'));
      setAuthState({
        success: false,
        user: null,
      });
      localStorage.removeItem('authState');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const clearAuthState = (): void => {
    setAuthState({
      success: false,
      user: null,
    });
    localStorage.removeItem('authState');
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, clearAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
