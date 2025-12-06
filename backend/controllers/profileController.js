// backend/controllers/profileController.js
const Profile = require('../models/Profile');

// Create new profile
const createProfile = async (req, res, next) => {
  try {
    const { name, timezone = 'America/New_York' } = req.body;
    
    // Check if profile already exists
    const existingProfile = await Profile.findOne({ name });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        error: 'Profile with this name already exists'
      });
    }
    
    const profile = await Profile.create({ name, timezone });
    
    res.status(201).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// Get all profiles
const getAllProfiles = async (req, res, next) => {
  try {
    const profiles = await Profile.find().sort({ name: 1 });
    
    res.json({
      success: true,
      count: profiles.length,
      data: profiles
    });
  } catch (error) {
    next(error);
  }
};

// Update profile timezone
const updateProfileTimezone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { timezone } = req.body;
    
    const profile = await Profile.findByIdAndUpdate(
      id,
      { timezone },
      { new: true, runValidators: true }
    );
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProfile,
  getAllProfiles,
  updateProfileTimezone
};