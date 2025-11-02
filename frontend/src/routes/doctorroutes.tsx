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

const DoctorRoutes: React.FC = () => (
  <Routes>
    <Route path='/dashboard/:id' element={<DocDashboard />} />
    <Route path='/dashboard/:id/appointments' element={<Appointment />} />
    <Route path='/dashboard/:id/schedule' element={<SchedulePage />} />
    <Route path='/dashboard/:id/patients' element={<PatientsPage />} />
    <Route path='/dashboard/:id/leave' element={<LeavePage />} />
    <Route path='/dashboard/:id/earnings' element={<EarningsPage />} />
    <Route path='/dashboard/:id/reports' element={<ReportsPage />} />
    <Route path='/dashboard/:id/notifications' element={<DoctorNotificationsPage />} />
    <Route path='/:id/update_doctor' element={<DoctorUpdatePage />} />
    <Route path='/:id/professional_info' element={<ProfessionalInfoPage />} />
    <Route path='/:id/update_schedule' element={<Schedule />} />
  </Routes>
);

export default DoctorRoutes;
