// backend/controllers/logController.js
const EventLog = require('../models/EventLog');
const Event = require('../models/Event');
const Profile = require('../models/Profile');
const dayjs = require('dayjs');

// Get logs for a specific event
const getEventLogs = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { timezone } = req.query;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    const logs = await EventLog.find({ eventId })
      .populate('profileId', 'name timezone')
      .sort({ timestamp: -1 });
    
    // Format logs with timezone conversion
    const formattedLogs = logs.map(log => {
      const logObj = log.toObject();
      
      // Convert timestamp to requested timezone
      if (timezone) {
        try {
          logObj.timestampFormatted = dayjs(log.timestamp)
            .tz(timezone)
            .format('MMM DD, YYYY hh:mm A');
        } catch (err) {
          logObj.timestampFormatted = dayjs(log.timestamp).format('MMM DD, YYYY hh:mm A');
        }
      } else {
        logObj.timestampFormatted = dayjs(log.timestamp).format('MMM DD, YYYY hh:mm A');
      }
      
      // Format changes for better display
      if (log.changes && log.changes.previousValues) {
        logObj.formattedChanges = formatChanges(log.changes);
      }
      
      return logObj;
    });
    
    res.json({
      success: true,
      count: logs.length,
      data: formattedLogs
    });
  } catch (error) {
    next(error);
  }
};

// Get logs for a specific profile
const getProfileLogs = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const { timezone, limit = 50 } = req.query;
    
    // Check if profile exists
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    const logs = await EventLog.find({ profileId })
      .populate({
        path: 'eventId',
        select: 'title startDateTime endDateTime'
      })
      .populate('profileId', 'name')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    // Format logs with timezone conversion
    const formattedLogs = logs.map(log => {
      const logObj = log.toObject();
      
      if (timezone) {
        try {
          logObj.timestampFormatted = dayjs(log.timestamp)
            .tz(timezone)
            .format('MMM DD, YYYY hh:mm A');
        } catch (err) {
          logObj.timestampFormatted = dayjs(log.timestamp).format('MMM DD, YYYY hh:mm A');
        }
      } else {
        logObj.timestampFormatted = dayjs(log.timestamp).format('MMM DD, YYYY hh:mm A');
      }
      
      return logObj;
    });
    
    res.json({
      success: true,
      count: logs.length,
      data: formattedLogs
    });
  } catch (error) {
    next(error);
  }
};

// Create a new log entry
const createLogEntry = async (req, res, next) => {
  try {
    const { eventId, profileId, action, changes, viewedInTimezone } = req.body;
    
    // Validate required fields
    if (!eventId || !profileId || !action) {
      return res.status(400).json({
        success: false,
        error: 'eventId, profileId, and action are required'
      });
    }
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    // Check if profile exists
    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    const log = await EventLog.create({
      eventId,
      profileId,
      action,
      changes,
      viewedInTimezone,
      timestamp: new Date()
    });
    
    res.status(201).json({
      success: true,
      data: log
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to format changes for display
const formatChanges = (changes) => {
  const formatted = {};
  
  // Format previous values
  if (changes.previousValues) {
    formatted.previousValues = {};
    for (const [key, value] of Object.entries(changes.previousValues)) {
      if (key === 'startDateTime' || key === 'endDateTime' || key === 'createdAt' || key === 'updatedAt') {
        formatted.previousValues[key] = dayjs(value).format('MMM DD, YYYY hh:mm A');
      } else if (key === 'profiles' && Array.isArray(value)) {
        formatted.previousValues[key] = value.length + ' profile(s)';
      } else {
        formatted.previousValues[key] = value;
      }
    }
  }
  
  // Format new values
  if (changes.newValues) {
    formatted.newValues = {};
    for (const [key, value] of Object.entries(changes.newValues)) {
      if (key === 'startDateTime' || key === 'endDateTime' || key === 'createdAt' || key === 'updatedAt') {
        formatted.newValues[key] = dayjs(value).format('MMM DD, YYYY hh:mm A');
      } else if (key === 'profiles' && Array.isArray(value)) {
        formatted.newValues[key] = value.length + ' profile(s)';
      } else {
        formatted.newValues[key] = value;
      }
    }
  }
  
  return formatted;
};

module.exports = {
  getEventLogs,
  getProfileLogs,
  createLogEntry
};