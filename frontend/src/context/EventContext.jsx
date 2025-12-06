// frontend/src/context/EventContext.jsx
import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';

const EventContext = createContext();

export const useEvent = () => useContext(EventContext);

export const EventProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Use import.meta.env for Vite instead of process.env
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Memoized fetch functions
  const fetchProfiles = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/profiles`);
      setProfiles(response.data.data || response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }
  }, [API_BASE_URL]);

  const fetchEvents = useCallback(async (profileId, timezone) => {
    if (!profileId) return [];
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/events/profile/${profileId}`,
        { params: { timezone } }
      );
      const eventsData = response.data.data || response.data;
      setEvents(eventsData);
      return eventsData;
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const createProfile = async (name, timezone) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/profiles`, {
        name,
        timezone
      });
      const newProfile = response.data.data || response.data;
      setProfiles(prev => [...prev, newProfile]);
      return newProfile;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to create profile';
    }
  };

  const createEvent = async (eventData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/events`, eventData);
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to create event';
    }
  };

  // FIXED: Added profileId parameter to updateEvent function
  const updateEvent = async (eventId, updates, profileId = null) => {
    try {
      // If profileId is not provided, use selectedProfile
      const updatingProfileId = profileId || selectedProfile?._id;
      
      if (!updatingProfileId) {
        throw new Error('No profile selected for logging update');
      }
      
      const response = await axios.put(
        `${API_BASE_URL}/events/${eventId}`,
        {
          ...updates,
          profileId: updatingProfileId  // ADD THIS: Pass profileId to backend
        }
      );
      
      // Update the event in local state
      setEvents(prev => prev.map(event => 
        event._id === eventId ? response.data.data || response.data : event
      ));
      
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update event';
    }
  };

  const getEventLogs = async (eventId, timezone) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/events/${eventId}/logs`,
        { params: { timezone } }
      );
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch logs';
    }
  };

  // NEW: Function to log event views
  const logEventView = async (eventId, timezone) => {
    if (!selectedProfile?._id) return;
    
    try {
      await axios.post(`${API_BASE_URL}/events/view-log`, {
        eventId,
        profileId: selectedProfile._id,
        viewedInTimezone: timezone
      });
    } catch (error) {
      console.error('Failed to log view:', error);
      // Don't throw error for view logs - it's not critical
    }
  };

  const value = {
    profiles,
    selectedProfile,
    setSelectedProfile,
    events,
    loading,
    fetchProfiles,
    fetchEvents,
    createProfile,
    createEvent,
    updateEvent,
    getEventLogs,
    logEventView  // Add this if you want to track views
  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};