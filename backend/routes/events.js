// backend/routes/events.js
const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEventsByProfile,
  updateEvent,
  getEventLogs,
  createViewLog
} = require('../controllers/eventController');

// @route   POST /api/events
// @desc    Create a new event
router.post('/', createEvent);

// @route   GET /api/events/profile/:profileId
// @desc    Get events for a specific profile
router.get('/profile/:profileId', getEventsByProfile);

// @route   PUT /api/events/:id
// @desc    Update an event
router.put('/:id', updateEvent);

// @route   GET /api/events/:id/logs
// @desc    Get logs for an event
router.get('/:id/logs', getEventLogs);

// In routes/events.js, add this if you want view logs
router.post('/view-log', createViewLog);

module.exports = router;