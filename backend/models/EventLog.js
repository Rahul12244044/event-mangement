const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'VIEW'],
    required: true
  },
  changes: {
    previousValues: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    newValues: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },
  viewedInTimezone: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('EventLog', eventLogSchema);