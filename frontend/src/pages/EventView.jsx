import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const EventView = () => {
  const { profileId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get('event');
  
  const {
    profiles,
    selectedProfile,
    events,
    fetchEvents,
    updateEvent,
    getEventLogs
  } = useEvent();

  const [currentEvent, setCurrentEvent] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    timezone: 'America/New_York',
    profiles: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch event data
  useEffect(() => {
    const loadEventData = async () => {
      if (!eventId || !profileId) return;
      
      setLoading(true);
      try {
        // Find the event from existing events or fetch it
        let event = events.find(e => e._id === eventId);
        
        if (!event) {
          // If event not in context, fetch events for this profile
          await fetchEvents(profileId, selectedProfile?.timezone);
          event = events.find(e => e._id === eventId);
        }
        
        if (event) {
          setCurrentEvent(event);
          
          // Populate edit form
          const start = dayjs(event.startDateTimeLocal || event.startDateTime);
          const end = dayjs(event.endDateTimeLocal || event.endDateTime);
          
          setEditForm({
            title: event.title || '',
            description: event.description || '',
            startDate: start.format('YYYY-MM-DD'),
            startTime: start.format('HH:mm'),
            endDate: end.format('YYYY-MM-DD'),
            endTime: end.format('HH:mm'),
            timezone: event.timezone || 'America/New_York',
            profiles: event.profiles?.map(p => p._id) || []
          });
          
          // Load logs
          const eventLogs = await getEventLogs(eventId, selectedProfile?.timezone);
          setLogs(eventLogs);
        }
      } catch (err) {
        console.error('Error loading event data:', err);
        setError('Failed to load event data');
      } finally {
        setLoading(false);
      }
    };
    
    loadEventData();
  }, [eventId, profileId, events, fetchEvents, getEventLogs, selectedProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileToggle = (profileId) => {
    setEditForm(prev => {
      const newProfiles = prev.profiles.includes(profileId)
        ? prev.profiles.filter(id => id !== profileId)
        : [...prev.profiles, profileId];
      return { ...prev, profiles: newProfiles };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (editForm.profiles.length === 0) {
      setError('Please select at least one profile');
      return;
    }

    const startDateTime = dayjs.tz(`${editForm.startDate} ${editForm.startTime}`, editForm.timezone);
    const endDateTime = dayjs.tz(`${editForm.endDate} ${editForm.endTime}`, editForm.timezone);

    if (endDateTime.isBefore(startDateTime)) {
      setError('End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      const updates = {
        title: editForm.title,
        description: editForm.description,
        profiles: editForm.profiles,
        timezone: editForm.timezone,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        profileId: selectedProfile?._id
      };

      await updateEvent(eventId, updates);
      
      // Refresh event data
      await fetchEvents(profileId, selectedProfile?.timezone);
      
      setSuccess('Event updated successfully!');
      setIsEditing(false);
      
      // Reload logs
      const eventLogs = await getEventLogs(eventId, selectedProfile?.timezone);
      setLogs(eventLogs);
      
    } catch (err) {
      setError(err.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = useCallback((dateString, tz) => {
    return dayjs(dateString).tz(tz).format('MMM DD, YYYY hh:mm A');
  }, []);

  // Helper function to format log values for display
  const formatLogValue = useCallback((value, key) => {
    if (value === null || value === undefined) return 'N/A';
    
    // Format dates
    if (key.includes('DateTime') || key.includes('At')) {
      try {
        return dayjs(value).format('MMM DD, YYYY hh:mm A');
      } catch (err) {
        return String(value);
      }
    }
    
    // Format profiles array
    if (key === 'profiles' && Array.isArray(value)) {
      return `${value.length} profile(s)`;
    }
    
    // Format timezone
    if (key === 'timezone') {
      return value.replace('_', ' ');
    }
    
    // Default string conversion
    return String(value);
  }, []);

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Kolkata',
    'Asia/Tokyo',
    'Australia/Sydney'
  ];

  if (loading && !currentEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event data...</p>
        </div>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Event Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 transition-colors"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Event Details</h1>
            <p className="text-gray-600 mt-2">
              View and manage event information
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Event Details */}
          <div className="space-y-6">
            {/* Event Information Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold text-gray-700">
                  {isEditing ? 'Edit Event' : 'Event Information'}
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Edit Event
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={editForm.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                    />
                  </div>

                  {/* Profiles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Profiles
                    </label>
                    <div className="border border-gray-300 rounded p-3 max-h-40 overflow-y-auto">
                      {profiles.map(profile => (
                        <label key={profile._id} className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={editForm.profiles.includes(profile._id)}
                            onChange={() => handleProfileToggle(profile._id)}
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-sm">{profile.name}</span>
                          <span className="text-xs text-gray-500">
                            ({profile.timezone.replace('_', ' ')})
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {editForm.profiles.length} profile(s) selected
                    </p>
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <select
                      name="timezone"
                      value={editForm.timezone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {timezones.map(tz => (
                        <option key={tz} value={tz}>
                          {tz.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={editForm.startDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        name="startTime"
                        value={editForm.startTime}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* End Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={editForm.endDate}
                        onChange={handleInputChange}
                        min={editForm.startDate}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        name="endTime"
                        value={editForm.endTime}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Updating...' : 'Update Event'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setError('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* Event Details */}
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">Event Title</h3>
                    <p className="text-gray-800">{currentEvent.title || 'Untitled Event'}</p>
                  </div>

                  {currentEvent.description && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-1">Description</h3>
                      <p className="text-gray-800">{currentEvent.description}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Assigned Profiles</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentEvent.profiles?.map(profile => (
                        <span
                          key={profile._id}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {profile.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-700 mb-1">Start Time</h3>
                      <p className="text-gray-800">
                        {formatDateTime(
                          currentEvent.startDateTimeLocal || currentEvent.startDateTime,
                          selectedProfile?.timezone || 'America/New_York'
                        )}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700 mb-1">End Time</h3>
                      <p className="text-gray-800">
                        {formatDateTime(
                          currentEvent.endDateTimeLocal || currentEvent.endDateTime,
                          selectedProfile?.timezone || 'America/New_York'
                        )}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">Timezone</h3>
                    <p className="text-gray-800">
                      {currentEvent.timezone.replace('_', ' ')}
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Created:</span>{' '}
                        {formatDateTime(
                          currentEvent.createdAtLocal || currentEvent.createdAt,
                          selectedProfile?.timezone || 'America/New_York'
                        )}
                      </div>
                      <div>
                        <span className="font-medium">Last Updated:</span>{' '}
                        {formatDateTime(
                          currentEvent.updatedAtLocal || currentEvent.updatedAt,
                          selectedProfile?.timezone || 'America/New_York'
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Event Logs */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-6">
                Event Update Logs
              </h2>

             {logs.map((log, index) => {
  // DEBUG: Log the full log object
  console.log('=== LOG OBJECT ===', log);
  console.log('Action:', log.action);
  console.log('Raw changes:', log.changes);
  console.log('Formatted changes:', log.formattedChanges);
  
  // Check if we have changes in either format
  const hasRawChanges = log.changes && 
                       (log.changes.previousValues || log.changes.newValues);
  const hasFormattedChanges = log.formattedChanges && 
                             (log.formattedChanges.previousValues || log.formattedChanges.newValues);
  const hasChanges = hasRawChanges || hasFormattedChanges;
  
  return (
    <div
      key={log._id || index}
      className={`p-4 rounded-lg border ${index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
            log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {log.action}
          </span>
          <span className="text-sm text-gray-600">
            by {log.profileId?.name || 'Unknown'}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {log.timestampFormatted || dayjs(log.timestamp).format('MMM DD, YYYY HH:mm')}
        </span>
      </div>

      {log.action === 'UPDATE' && hasChanges && (() => {
        // Try to get changes from both possible structures
        const changes = log.changes || log.formattedChanges || {};
        const previousValues = changes.previousValues || {};
        const newValues = changes.newValues || {};
        
        console.log('Rendering changes:', {
          changesSource: log.changes ? 'raw' : 'formatted',
          previousValues,
          newValues
        });
        
        // Get all changed keys
        const allKeys = new Set([
          ...Object.keys(previousValues),
          ...Object.keys(newValues)
        ]);
        
        const changedKeys = Array.from(allKeys).filter(key => {
          const oldVal = previousValues[key];
          const newVal = newValues[key];
          return newVal !== undefined && String(oldVal) !== String(newVal);
        });
        
        if (changedKeys.length === 0) {
          return (
            <div className="mt-3 text-sm text-gray-600">
              Event was updated
            </div>
          );
        }
        
        return (
          <div className="mt-3 space-y-2 text-sm">
            <h4 className="font-medium text-gray-700">Changes:</h4>
            <div className="bg-gray-50 rounded p-3">
              {changedKeys.map(key => {
                const oldValue = previousValues[key];
                const newValue = newValues[key];
                
                return (
                  <div key={key} className="mb-3 last:mb-0">
                    <div className="font-medium text-gray-700 capitalize mb-1">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-red-600 line-through text-sm">
                        {oldValue !== undefined ? String(oldValue) : '(empty)'}
                      </div>
                      <div className="text-green-600 text-sm">
                        → {newValue !== undefined ? String(newValue) : '(empty)'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {log.action === 'CREATE' && (
        <div className="mt-2 text-sm text-gray-600">
          Event was created with initial values
        </div>
      )}
    </div>
  );
})}
            </div>

            {/* Timezone Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-medium text-gray-700 mb-3">Timezone Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>All times are displayed in your selected timezone:</p>
                <p className="font-medium text-blue-600">
                  {selectedProfile?.timezone?.replace('_', ' ') || 'America/New_York'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Note: Changing profiles will update the timezone display
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventView;