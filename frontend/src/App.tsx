import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './component/layout/header/Header';
import Footer from './component/layout/footer/footer';
import { AuthProvider } from './component/auth/AuthContext';
import PatientRoutes from './routes/pateintroutes';
import DoctorRoutes from './routes/doctorroutes';
import UserRoutes from './routes/userroute';
import { SocketProvider } from './component/chats/socket/socketcontext';
import './tailwind.css';
import Paymentroutes from './routes/paymentroutes';
import './utils/authDebug'; // Import debug utility

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            <Header />
            <main className="pt-24">
              <Routes>
                <Route path="/" element={<Navigate to="/user/home" />} />
                <Route path='/user/*' element={<UserRoutes />} />
                <Route path='/patient/*' element={<PatientRoutes />} />
                <Route path='/doctor/*' element={<DoctorRoutes />} />
                <Route path='/payment-appointment' element={<Paymentroutes />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
