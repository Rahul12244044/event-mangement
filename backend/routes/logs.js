// backend/routes/logs.js
const express = require('express');
const router = express.Router();
const {
  getEventLogs,
  getProfileLogs,
  createLogEntry
} = require('../controllers/logController');

// @route   GET /api/logs/event/:eventId
// @desc    Get logs for a specific event
router.get('/event/:eventId', getEventLogs);

// @route   GET /api/logs/profile/:profileId
// @desc    Get logs for a specific profile
router.get('/profile/:profileId', getProfileLogs);

// @route   POST /api/logs
// @desc    Create a new log entry
router.post('/', createLogEntry);

module.exports = router;