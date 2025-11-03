import React, { useState } from 'react';
import { Container, TextField, Button, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { api } from '../../../utils/api';
import { useParams } from 'react-router-dom';

const EarningsPage: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [sum, setSum] = useState<number | null>(null);  // State for storing sum
  const [message, setMessage] = useState<string>('');  // State for storing message
  const { id } = useParams<{ id: string }>();

  const handleSubmit = async () => {
    // Convert dates to ISO string format
    const formattedStartDate = startDate ? startDate.toISOString() : null;
    const formattedEndDate = endDate ? endDate.toISOString() : null;

    try {
      const response = await axios.get(api.getUrl(`${id}/doctor/earnings`), {
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
    } catch (error: any) {
      // Handle errors
      setMessage(`Error fetching data: ${error.response ? error.response.data.message : error.message}`);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container className="earnings-container max-w-4xl mx-auto py-12 lg:ml-80 pt-28">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="page-title text-3xl font-bold text-gray-800 text-center mb-8">Doctor Earnings</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="date-picker-container">
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slots={{
                  textField: (params) => (
                    <TextField 
                      {...params} 
                      className="date-picker w-full"
                      aria-label="Start Date"
                      inputProps={{
                        ...params.inputProps,
                        'aria-label': 'Start Date'
                      }}
                    />
                  )
                }}
              />
            </div>

            <div className="date-picker-container">
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slots={{
                  textField: (params) => (
                    <TextField 
                      {...params} 
                      className="date-picker w-full"
                      aria-label="End Date"
                      inputProps={{
                        ...params.inputProps,
                        'aria-label': 'End Date'
                      }}
                    />
                  )
                }}
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <Button 
              className="submit-button bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105" 
              onClick={handleSubmit}
            >
              Get Earnings
            </Button>
          </div>

          {/* Display the result */}
          {sum !== null && (
            <div className="result-container bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <Typography variant="h6" className="result-text text-center text-2xl font-bold text-green-800">
                Earnings Sum: ₹{sum.toFixed(2)}
              </Typography>
            </div>
          )}
          {message && (
            <div className={`message-container p-4 rounded-lg ${
              message.includes('Error') ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
            }`}>
              <Typography variant="body1" className={`message-text text-center ${
                message.includes('Error') ? 'text-red-700' : 'text-blue-700'
              }`}>
                {message}
              </Typography>
            </div>
          )}
        </div>
      </Container>
    </LocalizationProvider>
  );
};

export default EarningsPage;
