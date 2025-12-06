// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');


dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB - Simplified connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/event-management')
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Import and use routes
const profileRoutes = require('./routes/profiles');
const eventRoutes = require('./routes/events');
const logRoutes = require('./routes/logs');


app.use('/api/profiles', profileRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/logs', logRoutes); // Add this

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});