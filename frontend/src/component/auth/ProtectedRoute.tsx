import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: ('patient' | 'doctor' | 'admin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { authState } = useAuth();
  const location = useLocation();

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!authState.success || !authState.user) {
    return <Navigate to="/user/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(authState.user.role)) {
    // If authenticated user does not have permission for this portal
    if (authState.user.role === 'doctor') {
      return <Navigate to={`/doctor/dashboard/${authState.user._id}`} replace />;
    }
    return <Navigate to={`/patient/dashboard/${authState.user._id}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
