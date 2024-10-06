const dotenv = require('dotenv'); // Import dotenv to load environment variables
const http = require('http'); // Import http to create the server
const app = require('./app'); // Import the Express app
const { initializeSocket } = require('./socket'); // Import socket initialization
const connect_Database = require('./config/database'); // Import the database connection
const express = require('express'); // Import Express
const path = require('path'); // Import path for handling file paths
// Load environment variables
dotenv.config({ path: 'backend/config/config.env' });

// Connect to the database
connect_Database();


// Create the HTTP server
const server = http.createServer(app);

// Initialize socket with the created server
initializeSocket(server);
const rootDir = path.join(__dirname, "../"); // Assuming frontend is one level above backend

app.use(express.static(path.join(rootDir, "frontend", "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(rootDir, "frontend", "build", "index.html"));
});
// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
