require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const path = require('path');

const app = express();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Middleware
app.use(cors());
app.use(express.json());

// Basic route for testing
app.get('/', (req, res) => {
  console.log('Root route accessed');
  res.json({ message: 'Welcome to Afternote API' });
});

// Test route
app.get('/test', (req, res) => {
  console.log('Test route accessed');
  res.json({ message: 'Test route working' });
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpecs));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/afternote';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Routes
const authRoutes = require('./routes/authRoutes');
const videoMessageRoutes = require('./routes/videoMessageRoutes');
const recipientRoutes = require('./routes/recipientRoutes');
const trustedContactRoutes = require('./routes/trustedContactRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/video-messages', videoMessageRoutes);
app.use('/api/recipients', recipientRoutes);
app.use('/api/trusted-contacts', trustedContactRoutes);

// Start server
const PORT = process.env.PORT || 5000;

// Add error handling for the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`Test route available at http://localhost:${PORT}/test`);
  console.log(`Root route available at http://localhost:${PORT}/`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port.`);
  } else {
    console.error('Server error:', error);
  }
}); 