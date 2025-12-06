// backend/routes/profiles.js
const express = require('express');
const router = express.Router();
const {
  createProfile,
  getAllProfiles,
  updateProfileTimezone
} = require('../controllers/profileController');

// @route   POST /api/profiles
// @desc    Create a new profile
router.post('/', createProfile);

// @route   GET /api/profiles
// @desc    Get all profiles
router.get('/', getAllProfiles);

// @route   PUT /api/profiles/:id/timezone
// @desc    Update profile timezone
router.put('/:id/timezone', updateProfileTimezone);

module.exports = router;