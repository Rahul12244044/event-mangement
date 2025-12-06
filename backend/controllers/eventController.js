// backend/controllers/eventController.js
const Event = require('../models/Event');
const EventLog = require('../models/EventLog');
const dayjs = require('dayjs');
require('dayjs/plugin/utc');
require('dayjs/plugin/timezone');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// Create new event
const createEvent = async (req, res, next) => {
  try {
    const { profiles, timezone: tz, startDateTime, endDateTime, createdBy, title, description } = req.body;
    
    // Validate dates
    const start = dayjs(startDateTime);
    const end = dayjs(endDateTime);
    
    if (end.isBefore(start)) {
      return res.status(400).json({
        success: false,
        error: 'End date must be after start date'
      });
    }
    
    if (end.isBefore(dayjs())) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create events in the past'
      });
    }
    
    const event = await Event.create({
      title: title || 'Event',
      description,
      profiles,
      timezone: tz,
      startDateTime: start.toDate(),
      endDateTime: end.toDate(),
      createdBy
    });
    
const logPromises = profiles.map(profileId => 
  EventLog.create({
    eventId: event._id,
    profileId,
    action: 'CREATE',
    changes: {
      newValues: {
        title: event.title,
        description: event.description,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
        timezone: event.timezone,
        profiles: event.profiles
      }
    },
    timestamp: new Date()
  })
);
    await Promise.all(logPromises);
    
    // Populate profiles data
    await event.populate('profiles', 'name timezone');
    
    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// Get events for a specific profile
const getEventsByProfile = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const { timezone: tz } = req.query;
    
    const events = await Event.find({ profiles: profileId })
      .populate('profiles', 'name timezone')
      .sort({ startDateTime: 1 });
    
    // Convert times to requested timezone
    const convertedEvents = events.map(event => {
      const eventObj = event.toObject();
      
      if (tz) {
        eventObj.startDateTimeLocal = dayjs(event.startDateTime)
          .tz(tz)
          .format('YYYY-MM-DD HH:mm:ss');
        eventObj.endDateTimeLocal = dayjs(event.endDateTime)
          .tz(tz)
          .format('YYYY-MM-DD HH:mm:ss');
        eventObj.createdAtLocal = dayjs(event.createdAt)
          .tz(tz)
          .format('YYYY-MM-DD HH:mm:ss');
        eventObj.updatedAtLocal = dayjs(event.updatedAt)
          .tz(tz)
          .format('YYYY-MM-DD HH:mm:ss');
      }
      
      return eventObj;
    });
    
    res.json({
      success: true,
      count: events.length,
      data: convertedEvents
    });
  } catch (error) {
    next(error);
  }
};

// Update event
const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { profileId } = req.body; 
    
    console.log('Updating event:', id, 'by profile:', profileId); 
    
    const event = await Event.findById(id).populate('profiles', 'name timezone');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    
    const previousValues = {
      title: event.title,
      description: event.description,
      startDateTime: event.startDateTime,
      endDateTime: event.endDateTime,
      timezone: event.timezone,
      profiles: event.profiles.map(p => p._id.toString())
    };
    
    console.log('Previous values:', previousValues);
    
   
    const allowedUpdates = ['title', 'description', 'startDateTime', 'endDateTime', 'timezone', 'profiles'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        event[field] = updates[field];
      }
    });
    
    await event.save();
    
    console.log('Event saved, creating log...'); 
    
    


if (profileId) {
  try {
    const log = await EventLog.create({
      eventId: event._id,
      profileId,
      action: 'UPDATE',
      changes: {
        previousValues: previousValues, 
        newValues: {                    
          title: event.title,
          description: event.description,
          startDateTime: event.startDateTime,
          endDateTime: event.endDateTime,
          timezone: event.timezone,
          profiles: event.profiles.map(p => p._id.toString())
        }
      },
      timestamp: new Date()
    });
    
    console.log('Log created with values:', {
      previousValues: log.changes.previousValues,
      newValues: log.changes.newValues
    });
    
  } catch (logError) {
    console.error('Error creating log:', logError);
  }
} else {
      console.warn('No profileId provided for logging update');
    }
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error in updateEvent:', error);
    next(error);
  }
};

// Get event logs - IMPROVED VERSION
const getEventLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { timezone: tz } = req.query;
    
    console.log('🔍 GET EVENT LOGS ====================');
    console.log('Event ID:', id);
    console.log('Requested timezone:', tz);
    
    // Check if event exists
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }
    
    const logs = await EventLog.find({ eventId: id })
      .populate('profileId', 'name timezone')
      .sort({ timestamp: -1 });
    
    console.log('Found logs in DB:', logs.length);
    
    // Convert timestamps to requested timezone and format for display
    const formattedLogs = logs.map(log => {
      // Use toObject to convert Mongoose document to plain object
      const logObj = log.toObject();
      
      // DEBUG: Show what's in the original log
      console.log('📄 Processing log:', {
        _id: log._id,
        action: log.action,
        hasChanges: !!log.changes,
        changes: log.changes,
        changesType: typeof log.changes,
        isMap: log.changes?.previousValues instanceof Map
      });
      
      // Format timestamp
      let timestampFormatted;
      try {
        if (tz) {
          timestampFormatted = dayjs(log.timestamp).tz(tz).format('MMM DD, YYYY hh:mm A');
        } else {
          timestampFormatted = dayjs(log.timestamp).format('MMM DD, YYYY hh:mm A');
        }
      } catch (err) {
        timestampFormatted = dayjs(log.timestamp).format('MMM DD, YYYY hh:mm A');
      }
      
      logObj.timestampFormatted = timestampFormatted;
      
      // Convert Map objects to plain objects if needed
      if (log.changes) {
        // Convert the entire changes object properly
        const changesObj = {};
        
        if (log.changes.previousValues) {
          // Check if it's a Map and convert to plain object
          if (log.changes.previousValues instanceof Map) {
            changesObj.previousValues = Object.fromEntries(log.changes.previousValues);
            console.log('Converted previousValues from Map to object:', changesObj.previousValues);
          } else {
            changesObj.previousValues = log.changes.previousValues;
          }
        }
        
        if (log.changes.newValues) {
          // Check if it's a Map and convert to plain object
          if (log.changes.newValues instanceof Map) {
            changesObj.newValues = Object.fromEntries(log.changes.newValues);
            console.log('Converted newValues from Map to object:', changesObj.newValues);
          } else {
            changesObj.newValues = log.changes.newValues;
          }
        }
        
        logObj.changes = changesObj;
        
        // ALSO add formattedChanges for better display
        if (changesObj.previousValues || changesObj.newValues) {
          logObj.formattedChanges = {};
          
          if (changesObj.previousValues) {
            logObj.formattedChanges.previousValues = formatChangeValues(changesObj.previousValues, tz);
          }
          
          if (changesObj.newValues) {
            logObj.formattedChanges.newValues = formatChangeValues(changesObj.newValues, tz);
          }
        }
      }
      
      // DEBUG: Show what we're returning
      console.log('Returning log object with:', {
        hasChanges: !!logObj.changes,
        previousValuesType: typeof logObj.changes?.previousValues,
        newValuesType: typeof logObj.changes?.newValues,
        previousValuesKeys: logObj.changes?.previousValues ? Object.keys(logObj.changes.previousValues) : [],
        newValuesKeys: logObj.changes?.newValues ? Object.keys(logObj.changes.newValues) : []
      });
      
      return logObj;
    });
    
    console.log('Returning', formattedLogs.length, 'logs');
    console.log('====================================');
    
    res.json({
      success: true,
      count: logs.length,
      data: formattedLogs
    });
  } catch (error) {
    console.error('❌ Error in getEventLogs:', error);
    next(error);
  }
};
const formatChangeValues = (values, timezone) => {
  const formatted = {};
  
  console.log('🔧 Formatting change values:', {
    values,
    timezone,
    isObject: typeof values === 'object',
    keys: Object.keys(values || {})
  });
  
  for (const [key, value] of Object.entries(values || {})) {
    // Format dates
    if (key.includes('DateTime') || key.includes('At')) {
      try {
        if (timezone && dayjs(value).isValid()) {
          formatted[key] = dayjs(value).tz(timezone).format('MMM DD, YYYY hh:mm A');
        } else if (dayjs(value).isValid()) {
          formatted[key] = dayjs(value).format('MMM DD, YYYY hh:mm A');
        } else {
          formatted[key] = value;
        }
      } catch (err) {
        formatted[key] = value;
      }
    } 
    // Format profiles array
    else if (key === 'profiles' && Array.isArray(value)) {
      formatted[key] = `${value.length} profile(s)`;
    }
    // Format timezone
    else if (key === 'timezone') {
      formatted[key] = value.replace('_', ' ');
    }
    // Keep other values as is
    else {
      formatted[key] = value;
    }
  }
  
  console.log('Formatted result:', formatted);
  return formatted;
};
// Add a view log function if needed
const createViewLog = async (req, res, next) => {
  try {
    const { eventId, profileId, viewedInTimezone } = req.body;
    
    if (!eventId || !profileId) {
      return res.status(400).json({
        success: false,
        error: 'eventId and profileId are required'
      });
    }
    
    const log = await EventLog.create({
      eventId,
      profileId,
      action: 'VIEW',
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

module.exports = {
  createEvent,
  getEventsByProfile,
  updateEvent,
  getEventLogs,
  createViewLog  
};