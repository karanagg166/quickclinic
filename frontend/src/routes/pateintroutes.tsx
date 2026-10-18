import React from 'react';
import { Route, Routes } from 'react-router-dom';
import PatientDashboard from '../component/patient/dashboard/Patient_Dashboard';
import Appointment from '../component/patient/bookappointment/bookingpage/appointment';
import AppointmentHistory from '../component/patient/appointmenthistory/appointmenthistory';
import AppointmentActions from '../component/patient/cancel_and_postpond/cancel_postpond';
import Updatepatient from '../component/patient/updatepatient/updatepatient';
import Createpatient from '../component/patient/createpatient/createpatient';
import NotificationsPage from '../component/patient/notifications/NotificationsPage';
import MedicalInfoPage from '../component/patient/medicalinfo/MedicalInfoPage';
import ProtectedRoute from '../component/auth/ProtectedRoute';

const PatientRoutes: React.FC = () => (
  <Routes>
    <Route
      path="/dashboard/:id"
      element={
        <ProtectedRoute allowedRoles={['patient', 'admin']}>
          <PatientDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/:id/appointment"
      element={
        <ProtectedRoute allowedRoles={['patient', 'admin']}>
          <Appointment />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/:id/history"
      element={
        <ProtectedRoute allowedRoles={['patient', 'admin']}>
          <AppointmentHistory />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/:id/cancel/postpond"
      element={
        <ProtectedRoute allowedRoles={['patient', 'admin']}>
          <AppointmentActions />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/:id/notifications"
      element={
        <ProtectedRoute allowedRoles={['patient', 'admin']}>
          <NotificationsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/:id/update_patient"
      element={
        <ProtectedRoute allowedRoles={['patient', 'admin']}>
          <Updatepatient />
        </ProtectedRoute>
      }
    />
    <Route
      path="/:id/create_patient"
      element={
        <ProtectedRoute allowedRoles={['patient', 'admin']}>
          <Createpatient />
        </ProtectedRoute>
      }
    />
    <Route
      path="/:id/medical_info"
      element={
        <ProtectedRoute allowedRoles={['patient', 'admin']}>
          <MedicalInfoPage />
        </ProtectedRoute>
      }
    />
  </Routes>
);

export default PatientRoutes;
