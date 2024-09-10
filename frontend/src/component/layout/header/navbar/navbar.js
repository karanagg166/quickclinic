import React, { useState, useEffect } from 'react';
import { Button, Offcanvas, ListGroup } from 'react-bootstrap';
import { House, InfoCircle, BoxArrowInRight, BoxArrowLeft, ChatDots, Calendar } from 'react-bootstrap-icons'; // Import Calendar icon
import './navbar.css';
import { useNavigate } from 'react-router-dom';

const SideNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [authState, setAuthState] = useState(false);
  const [role, setRole] = useState(null); // State to hold user role
  const navigate = useNavigate();
  const [id, setId] = useState('');

  // Ensure useEffect updates authState and role based on localStorage
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
    navigate('/user/login'); // Navigate to login page
  };

  const logout = () => {
    localStorage.removeItem('authState');
    setAuthState(false); // Update state
    setRole(null); // Clear role
    navigate('/user/home'); // Navigate to home page after logout
  };

  const handleUpdate = () => {
    if (role === 'patient') {
      navigate(`/patient/${id}/update_patient`); // Navigate to patient data update page
    } else if (role === 'doctor') {
      navigate(`/doctor/${id}/update_doctor`); // Navigate to doctor data update page
    }
  };

  const navigateToChats = () => {
    navigate(`/user/${id}/chats`); // Navigate to chat page
  };

  const navigateToSchedule = () => {
    if (role === 'doctor') {
      navigate(`/doctor/${id}/update_schedule`); // Navigate to schedule management page
    }
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
            <ListGroup.Item action href="#about" className="list-item">
              <InfoCircle className="me-2" /> About
            </ListGroup.Item>

            {/* Conditionally render the update button based on the role */}
            {authState && (
              <ListGroup.Item action onClick={handleUpdate} className="list-item">
                {role === 'patient' ? 'Update Patient Data' : 'Update Doctor Data'}
              </ListGroup.Item>
            )}

            {/* Conditionally render the Chats option if the user is logged in */}
            {authState && (
              <ListGroup.Item action onClick={navigateToChats} className="list-item">
                <ChatDots className="me-2" /> Chats
              </ListGroup.Item>
            )}

            {/* Conditionally render the Schedule button based on the role */}
            {authState && role === 'doctor' && (
              <ListGroup.Item action onClick={navigateToSchedule} className="list-item">
                <Calendar className="me-2" /> Schedule
              </ListGroup.Item>
            )}
          </ListGroup>

          <Button
            variant={authState ? "danger" : "success"}
            onClick={authState ? logout : login}
            className="auth-button mt-3"
          >
            {authState ? <BoxArrowLeft className="me-2" /> : <BoxArrowInRight className="me-2" />}
            {authState ? 'Logout' : 'Login'}
          </Button>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default SideNavbar;
