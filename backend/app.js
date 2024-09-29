const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const Errormiddleware = require('./middleware/error');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express(); // Create Express app

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// CORS setup

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// Parse cookies
app.use(cookieParser());

// Cross-Origin-Opener-Policy to prevent issues with security
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

// Use session middleware
app.use(
  session({
    secret: '2ub2bf9242hcbnubcwcwshbccianci', // Use a secret key
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    },
  })
);

// Define your routes
const user = require('./routes/user.routes');
const patient = require('./routes/patient.routes');
const doctor = require('./routes/doctor.routes');
const message = require('./routes/message.routes'); // Add message route
const notification=require('./routes/notification.routes');
const payment=require('./routes/payment.routes'); 
app.use('/api/v1', patient);
app.use('/api/v1', user);
app.use('/api/v1', doctor);
app.use('/api/v1', message);
app.use('/api/v1',notification); // Use message route
app.use('/api/v1',payment);

// Error handling middleware
app.use(Errormiddleware);

module.exports = app;
