// backend/models/Profile.js
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  timezone: {
    type: String,
    default: 'America/New_York'
  }
}, {
  timestamps: true
});



module.exports = mongoose.model('Profile', profileSchema);