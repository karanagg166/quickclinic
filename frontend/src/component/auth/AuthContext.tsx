import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { apiClient } from '../../utils/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  phoneNumber: string;
  city: string;
  state: string;
  pincode: string;
}

export interface AuthState {
  success: boolean;
  user: User | null;
  token?: string;
  loading?: boolean;
}

export interface AuthContextType {
  authState: AuthState;
  user?: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; message?: string }>;
  logout: () => Promise<void>;
  clearAuthState: () => void;
  revalidateAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const saved = localStorage.getItem('authState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.user && parsed.user._id && parsed.user._id.length === 24) {
          return { success: true, user: parsed.user, token: parsed.token, loading: true };
        }
      } catch {
        localStorage.removeItem('authState');
      }
    }
    return { success: false, user: null, loading: false };
  });

  // Revalidate restored browser session against server /api/v1/me
  const revalidateAuth = useCallback(async () => {
    try {
      const response = await apiClient.get('/me');
      if (response.data && response.data.success && response.data.user) {
        const verifiedUser = response.data.user;
        setAuthState((prev) => {
          const updated: AuthState = {
            success: true,
            user: verifiedUser,
            token: prev.token,
            loading: false,
          };
          localStorage.setItem('authState', JSON.stringify(updated));
          return updated;
        });
      } else {
        clearAuthState();
      }
    } catch (error) {
      // If server rejects session (401/403/invalid), invalidate local storage
      clearAuthState();
    }
  }, []);

  useEffect(() => {
    // Only verify if we have stored session or need initial check
    const saved = localStorage.getItem('authState');
    if (saved) {
      revalidateAuth();
    }
  }, [revalidateAuth]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const { data } = await apiClient.post('/login', { email, password });

      if (data && data.user) {
        const newAuthState: AuthState = {
          success: true,
          user: data.user,
          token: data.token,
          loading: false,
        };

        localStorage.setItem('authState', JSON.stringify(newAuthState));
        setAuthState(newAuthState);

        return { success: true, user: data.user };
      }

      return { success: false, message: 'Invalid response from server' };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      return { success: false, message };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.post('/logout');
    } catch (err) {
      console.warn('Server logout error:', err);
    } finally {
      clearAuthState();
    }
  };

  const clearAuthState = (): void => {
    setAuthState({
      success: false,
      user: null,
      loading: false,
    });
    localStorage.removeItem('authState');
  };

  return (
    <AuthContext.Provider
      value={{ authState, user: authState.user, login, logout, clearAuthState, revalidateAuth }}
    >
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

export default AuthContext;
