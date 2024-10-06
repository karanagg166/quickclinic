import React, { useState } from 'react';
import { Container, TextField, Button, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import './earnings.css';  // Make sure to create this CSS file
import axios from 'axios';
import { useParams } from 'react-router-dom';

const EarningsPage = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sum, setSum] = useState(null);  // State for storing sum
  const [message, setMessage] = useState('');  // State for storing message
  const { id } = useParams();

  const handleSubmit = async () => {
    // Convert dates to ISO string format
    const formattedStartDate = startDate ? startDate.toISOString() : null;
    const formattedEndDate = endDate ? endDate.toISOString() : null;
  
    try {
      const response = await axios.get(`/api/v1/${id}/doctor/earnings`, {
        params: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      });
  
      // Extract data from response
      const { sum, message } = response.data;
  
      // Update state with the result
      setSum(sum);
      setMessage(message);
    } catch (error) {
      // Handle errors
      setMessage(`Error fetching data: ${error.response ? error.response.data.message : error.message}`);
    }
  };
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container className="earnings-container">
        <h1 className="page-title">Doctor Earnings</h1>

        <div className="date-picker-container">
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            slots={{
              textField: (params) => <TextField {...params} className="date-picker" />
            }}
          />
        </div>

        <div className="date-picker-container">
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(newValue) => setEndDate(newValue)}
            slots={{
              textField: (params) => <TextField {...params} className="date-picker" />
            }}
          />
        </div>

        <Button className="submit-button" onClick={handleSubmit}>Get Earnings</Button>

        {/* Display the result */}
        {sum !== null && (
          <div className="result-container">
            <Typography variant="h6" className="result-text">
              Earnings Sum: ₹{sum.toFixed(2)}
            </Typography>
          </div>
        )}
        {message && (
          <Typography variant="body1" className="message-text">
            {message}
          </Typography>
        )}
      </Container>
    </LocalizationProvider>
  );
};

export default EarningsPage;
