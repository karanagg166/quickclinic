import React, { useState, useEffect } from 'react';
import { Button, Offcanvas, ListGroup } from 'react-bootstrap';
import { House, InfoCircle, BoxArrowInRight, BoxArrowLeft, ChatDots, Calendar } from 'react-bootstrap-icons';
import './navbar.css';
import { useNavigate } from 'react-router-dom';
import { FaHistory } from 'react-icons/fa';
import { MdCancel } from "react-icons/md";
import { RxUpdate } from "react-icons/rx";
import ConfirmationModal from '../../../common/ConfirmationModal';

const SideNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [authState, setAuthState] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(null)
  const [role, setRole] = useState(null);
  const navigate = useNavigate(); 
  const [id, setId] = useState('');

  useEffect(() => {
    const auth = localStorage.getItem('authState');
    if (auth) {
      const parsedAuth = JSON.parse(auth);
      setAuthState(true);
      setRole(parsedAuth.user.role);
      setId(parsedAuth.user._id);
    } else {
      setAuthState(false);
    }
  }, []);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const login = () => {
    navigate('/user/login');
    setIsOpen(false);
  };

  const logout = () => {
    setIsOpen(false);

    setConfirmationModal({
      text1: "Are you sure?",
      text2: "You will be logged out of your account.",
      btn1Text: "Logout",
      btn2Text: "Cancel",
      btn1Handler: ()=> LOGOUT(),  
      btn2Handler: ()=> setConfirmationModal(null), 
  })
  };

  const LOGOUT=()=>{
    localStorage.removeItem('authState');
    setConfirmationModal(null); 
    setAuthState(false);
    setRole(null);
    navigate('/user/home');
    setIsOpen(false);
  }

  const handleUpdate = () => {
    if (role === 'patient') {
      navigate(`/patient/${id}/update_patient`);
    } else if (role === 'doctor') {
      navigate(`/doctor/${id}/update_doctor`);
    }
    setIsOpen(false); 
  };

  const navigateToChats = () => {
    navigate(`/user/${id}/chats`);
    setIsOpen(false);
  };

  const navigateToSchedule = () => {
    if (role === 'doctor') {
      navigate(`/doctor/${id}/update_schedule`);
    }
    setIsOpen(false);
  };

  const navigateToAppointment = () => {
    if (role === 'patient') {
      navigate(`/patient/dashboard/${id}/appointment`);
    }
    setIsOpen(false);
  };

  const navigateToHistory = () => {
    if (role === 'patient') {
      navigate(`/patient/dashboard/${id}/history`);
    }
    setIsOpen(false);
  };

  const navigateToCancel = () => {
    if (role === 'patient') {
      navigate(`/patient/dashboard/${id}/cancel/postpone`);
    }
    setIsOpen(false);
  };

  const navigateToAbout = () => {
    navigate('/user/about'); // Navigate to the about page
    setIsOpen(false);
  };

  return (
    <>
      <Button variant="primary" onClick={toggleDrawer} className="menu-button">
        <House size={30} />
      </Button>

      <Offcanvas show={isOpen} onHide={toggleDrawer} placement="start" className="sidebar">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="text-light">Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column">
          <ListGroup variant="flush" className="flex-grow-1">
            <ListGroup.Item action href="/user/home" className="list-item">
              <House className="me-2" /> Home
            </ListGroup.Item>
            <ListGroup.Item action onClick={navigateToAbout} className="list-item">
              <InfoCircle className="me-2" /> About
            </ListGroup.Item>

            {authState && (
              <ListGroup.Item action onClick={handleUpdate} className="list-item">
                
                <RxUpdate /> {role === 'patient' ? 'Update Patient Data' : 'Update Doctor Data'}
              </ListGroup.Item>
            )}

            {authState && (
              <ListGroup.Item action onClick={navigateToChats} className="list-item">
                <ChatDots className="me-2" /> Chats
              </ListGroup.Item>
            )}

            {authState && role === 'doctor' && (
              <ListGroup.Item action onClick={navigateToSchedule} className="list-item">
                <Calendar className="me-2" /> Schedule
              </ListGroup.Item>
            )}

            {authState && role === 'patient' && (
              <ListGroup.Item action onClick={navigateToAppointment} className="list-item">
                <Calendar className="me-2" /> Book An Appointment 
              </ListGroup.Item>
            )}

          {authState && role === 'patient' && (
              <ListGroup.Item action onClick={navigateToCancel} className="list-item">
                <MdCancel className="me-2" /> Cancel An Appointment 
              </ListGroup.Item>
            )} 

          {authState && role === 'patient' && (
              <ListGroup.Item action onClick={navigateToHistory} className="list-item">
                < FaHistory  className="me-2" /> History
              </ListGroup.Item>
            )}

          </ListGroup>

          <Button
            variant={authState ? 'danger' : 'success'}
            onClick={authState ? logout : login}
            className="auth-button mt-3"
          >
            {authState ? <BoxArrowLeft className="me-2" /> : <BoxArrowInRight className="me-2" />}
            {authState ? 'Logout' : 'Login'}
          </Button>
        </Offcanvas.Body>
      </Offcanvas>
      {confirmationModal && <ConfirmationModal modalData={confirmationModal}/>}
    </>
  );
};

export default SideNavbar;
