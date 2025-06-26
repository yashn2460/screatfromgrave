require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const path = require('path');
const { createSuperAdminIfNeeded } = require('./utils/superAdminSetup');
const { initializeCronJobs } = require('./utils/cronJobs');
const fs = require('fs');

const app = express();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for uploaded death certificates
app.use('/uploads', express.static('uploads'));

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

// Create upload directories if they don't exist
const createUploadDirectories = () => {
  const uploadDir = path.join(__dirname, 'uploads');
  const deathCertificatesDir = path.join(uploadDir, 'death-certificates');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Created uploads directory');
  }
  
  // Create death-certificates directory if it doesn't exist
  if (!fs.existsSync(deathCertificatesDir)) {
    fs.mkdirSync(deathCertificatesDir, { recursive: true });
    console.log('✅ Created uploads/death-certificates directory');
  }
};

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Create super admin if no admin exists
    console.log('Checking for existing admins...');
    await createSuperAdminIfNeeded();
    
    // Initialize cron jobs after database connection
    initializeCronJobs();
    
    // Create upload directories after database connection
    createUploadDirectories();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const adminManagementRoutes = require('./routes/adminManagementRoutes');
const videoMessageRoutes = require('./routes/videoMessageRoutes');
const recipientRoutes = require('./routes/recipientRoutes');
const trustedContactRoutes = require('./routes/trustedContactRoutes');
const trusteeRoutes = require('./routes/trusteeRoutes');
const deathVerificationRoutes = require('./routes/deathVerificationRoutes');
const contactRoutes = require('./routes/contactRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin', adminManagementRoutes);
app.use('/api/video-messages', videoMessageRoutes);
app.use('/api/recipients', recipientRoutes);
app.use('/api/trusted-contacts', trustedContactRoutes);
app.use('/api/trustees', trusteeRoutes);
app.use('/api/death-verification', deathVerificationRoutes);
app.use('/api/contact', contactRoutes);

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