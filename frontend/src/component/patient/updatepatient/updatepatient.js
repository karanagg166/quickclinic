import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, TextField, Typography, Container, Paper } from '@mui/material';
import axios from 'axios';
import './updatepatient.css'; // Ensure to include the CSS file
import { useParams } from 'react-router-dom';

const PatientForm = () => {
  const { id } = useParams();
  const [medicalHistory, setMedicalHistory] = useState('');
  const [allergies, setAllergies] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`/api/v1/${id}/patient/create_patient`, {
        medicalHistory,
        allergies,
        currentMedications,
      });
      console.log('Patient information submitted:', response.data);
      // Reset form fields or handle success response
    } catch (error) {
      console.error('Error submitting patient information:', error);
    }
  };

  return (
    <Container className="patient-form-container" maxWidth="sm">
      <Paper className="patient-form-paper" elevation={3}>
        <motion.div
          className="patient-form-header"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Typography variant="h4" component="h1" className="patient-form-title">
            Enter Patient Information
          </Typography>
        </motion.div>
        <form onSubmit={handleSubmit} className="patient-form">
          <TextField
            label="Medical History"
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            margin="normal"
            value={medicalHistory}
            onChange={(e) => setMedicalHistory(e.target.value)}
            className="patient-form-field"
          />
          <TextField
            label="Allergies"
            variant="outlined"
            fullWidth
            multiline
            rows={2}
            margin="normal"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            className="patient-form-field"
          />
          <TextField
            label="Current Medications"
            variant="outlined"
            fullWidth
            multiline
            rows={2}
            margin="normal"
            value={currentMedications}
            onChange={(e) => setCurrentMedications(e.target.value)}
            className="patient-form-field"
          />
          <motion.div
            className="patient-form-button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Button type="submit" variant="contained" color="primary">
              Submit
            </Button>
          </motion.div>
        </form>
      </Paper>
    </Container>
  );
};

export default PatientForm;
