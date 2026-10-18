import React from 'react';
import { Route, Routes } from 'react-router-dom';
import DocDashboard from '../component/doctor/dashboard';
import Appointment from '../component/doctor/appointments/appointments';
import LeavePage from '../component/doctor/leave/leave';
import Schedule from '../component/doctor/update/schedule';
import EarningsPage from '../component/doctor/earnings/earnings';
import DoctorUpdatePage from '../component/doctor/update/update';
import SchedulePage from '../component/doctor/schedule/schedule';
import PatientsPage from '../component/doctor/patients/patients';
import ReportsPage from '../component/doctor/reports/reports';
import DoctorNotificationsPage from '../component/doctor/notifications/notifications';
import ProfessionalInfoPage from '../component/doctor/professionalinfo/ProfessionalInfoPage';
import ProtectedRoute from '../component/auth/ProtectedRoute';

const DoctorRoutes: React.FC = () => (
  <Routes>
    <Route
      path="/dashboard/:id"
      element={
        <ProtectedRoute allowedRoles={['doctor', 'admin']}>
          <DocDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/:id/appointments"
      element={
        <ProtectedRoute allowedRoles={['doctor', 'admin']}>
          <Appointment />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/:id/schedule"
      element={
        <ProtectedRoute allowedRoles={['doctor', 'admin']}>
          <SchedulePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/:id/patients"
      element={
        <ProtectedRoute allowedRoles={['doctor', 'admin']}>
          <PatientsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/:id/leave"
      element={
        <ProtectedRoute allowedRoles={['doctor', 'admin']}>
          <LeavePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/:id/earnings"
      element={
        <ProtectedRoute allowedRoles={['doctor', 'admin']}>
          <EarningsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/:id/reports"
      element={
        <ProtectedRoute allowedRoles={['doctor', 'admin']}>
          <ReportsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/:id/notifications"
      element={
        <ProtectedRoute allowedRoles={['doctor', 'admin']}>
          <DoctorNotificationsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/:id/update_doctor"
      element={
        <ProtectedRoute allowedRoles={['doctor', 'admin']}>
          <DoctorUpdatePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/:id/professional_info"
      element={
        <ProtectedRoute allowedRoles={['doctor', 'admin']}>
          <ProfessionalInfoPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/:id/update_schedule"
      element={
        <ProtectedRoute allowedRoles={['doctor', 'admin']}>
          <Schedule />
        </ProtectedRoute>
      }
    />
  </Routes>
);

export default DoctorRoutes;
