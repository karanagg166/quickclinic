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

const PatientRoutes: React.FC = () => (
  <Routes>
    <Route path='/dashboard/:id' element={<PatientDashboard />} />
    <Route path='/dashboard/:id/appointment' element={<Appointment />} />
    <Route path='/dashboard/:id/history' element={<AppointmentHistory />} />
    <Route path='/dashboard/:id/cancel/postpond' element={<AppointmentActions />} />
    <Route path='/dashboard/:id/notifications' element={<NotificationsPage />} />
    <Route path='/:id/update_patient' element={<Updatepatient />} />
    <Route path='/:id/create_patient' element={<Createpatient />} />
    <Route path='/:id/medical_info' element={<MedicalInfoPage />} />
  </Routes>
);

export default PatientRoutes;
