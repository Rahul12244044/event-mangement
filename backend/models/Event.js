// backend/models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Event',
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  profiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  }],
  timezone: {
    type: String,
    required: true
  },
  startDateTime: {
    type: Date,
    required: true
  },
  endDateTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startDateTime;
      },
      message: 'End date must be after start date'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  }
}, {
  timestamps: true
});


eventSchema.index({ profiles: 1 });
eventSchema.index({ startDateTime: 1 });
eventSchema.index({ endDateTime: 1 });
eventSchema.index({ timezone: 1 });

module.exports = mongoose.model('Event', eventSchema);