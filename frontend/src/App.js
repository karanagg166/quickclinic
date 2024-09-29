// App.js
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './component/layout/header/navbar/navbar';
import Footer from './component/layout/footer/footer';
import { AuthProvider } from './component/auth/AuthContext';
import PatientRoutes from './routes/pateintroutes';
import DoctorRoutes from './routes/doctorroutes';
import UserRoutes from './routes/userroute';
import { SocketProvider } from './component/chats/socket/socketcontext';
import './tailwind.css'; 
import Paymentroutes from './routes/paymentroutes';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Navigate to="/user/home" />} />
              <Route path='/user/*' element={<UserRoutes />} />
              <Route path='/patient/*' element={<PatientRoutes />} />
              <Route path='/doctor/*' element={<DoctorRoutes />} /> 
              <Route path='/payment-appointment' element={<Paymentroutes />} /> 
            </Routes>
            <Footer />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
