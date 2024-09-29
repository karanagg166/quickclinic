import React, { useState } from 'react';
import { Container, Card, Row, Col, Button, Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './doctorlist.css'; // Custom CSS for animations and styling
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { format, isSameDay, parseISO } from 'date-fns'; 
import toast from "react-hot-toast";
import { FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';  

const DoctorCard = ({ doctor }) => {
  const [doctorSchedule, setDoctorSchedule] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const data2 = localStorage.getItem('authState');
  const parsedData = JSON.parse(data2); 
  const id = parsedData.user._id;
  const navigate = useNavigate();

  const handleBookClick = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/v1/${id}/patient/appointment_bookings`, {
        params: { doc_id: doctor._id },
      });

      if (Array.isArray(response.data.availableSlots)) {
        setDoctorSchedule(response.data.availableSlots);
        setShowCalendar(!showCalendar); 
      } else {
        setDoctorSchedule([]);
      }
    } catch (error) {
      setDoctorSchedule([]);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    const formattedDate = format(date, 'yyyy-MM-dd');
    const selectedSchedule = doctorSchedule.find((schedule) => schedule.date === formattedDate);
    setAvailableTimes(selectedSchedule ? selectedSchedule.slots : []);
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
  };

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select a date and time before booking');
      return;
    }

    // Show the payment modal before proceeding
    setShowPaymentModal(true);
  };


  const handlePaymentChoice = async (mode) => { 
    setShowPaymentModal(false); 

    if (mode === 'online') {
      navigate('/payment-appointment')
    } else {
      // If offline payment, proceed with appointment booking
      try {
        const response = await axios.post(`http://localhost:5000/api/v1/${id}/patient/newappointment`, {
          date: selectedDate,
          time: selectedTime,
          paid: false, // Since it's offline, the payment status is false
          doc_id: doctor._id,
        });

        if (response.data.success) {
          alert(`Appointment booked on ${format(selectedDate, 'yyyy-MM-dd')} at ${selectedTime}`);
          setShowCalendar(false);
        } else {
          alert("Failed to book appointment. Please try again.");
        }
      } catch (error) {
        alert("An error occurred while booking the appointment. Please try again.");
      }
    }
  };

  const filterDates = (date) => {
    if (!Array.isArray(doctorSchedule)) return false;
    return doctorSchedule.some((schedule) => isSameDay(date, parseISO(schedule.date)));
  };

  return (
    <Container className="doctor-list-page">
      <Row className="justify-content-center">
        <Col md={4} lg={3} className="mb-4">
          <Card className="doctor-card">
            <Card.Body>
              <Card.Title>{doctor.user.name}</Card.Title>
              <Card.Text>
                <strong>Specialty:</strong> {doctor.specialization}
              </Card.Text>
              <Card.Text>
                <strong>Fees:</strong> {doctor.fees}
              </Card.Text>
              <Card.Text>
                <strong>Experience:</strong> {doctor.experience} years
              </Card.Text>
              <Card.Text>
                <strong>Email:</strong> {doctor.user.email}
              </Card.Text>
              <Card.Text>
                <strong>Phone no:</strong> {doctor.user.phoneNumber}
              </Card.Text>
              <Button variant="primary" className="animated-button" onClick={handleBookClick}>
                <FaCalendarAlt /> Select Date
              </Button>

              {showCalendar && (
                <div className="calendar-container">
                  <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    dateFormat="yyyy/MM/dd"
                    className="form-control"
                    filterDate={filterDates}
                    placeholderText="Select a date"
                  />
                  {availableTimes.length > 0 && (
                    <div className="mt-3">
                      <label>Select Time: </label>
                      <select className="form-control" value={selectedTime} onChange={handleTimeChange}>
                        <option value="">Select a time</option>
                        {availableTimes.map((time, index) => (
                          <option key={index} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <Button
                    variant="primary"
                    onClick={handleBookAppointment}
                    disabled={!selectedDate || !selectedTime}
                    className="mt-3"
                  >
                    Book Appointment
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Select Payment Mode</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Button variant="success" onClick={() => handlePaymentChoice('online')} className="me-2">
            Pay Online
          </Button>
          <Button variant="secondary" onClick={() => handlePaymentChoice('offline')}>
            Pay Offline
          </Button>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default DoctorCard;
