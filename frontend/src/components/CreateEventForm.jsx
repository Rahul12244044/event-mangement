import React, { useState, useMemo } from 'react';
import { useEvent } from '../context/EventContext';
import dayjs from 'dayjs';

const CreateEventForm = ({
  profiles,
  selectedProfiles,
  onProfileSelect,
  timezone,
  onTimezoneChange,
  timezones
}) => {
  const { createEvent, selectedProfile } = useEvent();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '09:00'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const profileOptions = useMemo(() => {
    return profiles.map(profile => ({
      value: profile._id,
      label: profile.name,
      timezone: profile.timezone
    }));
  }, [profiles]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileToggle = (profileId) => {
    const newSelected = selectedProfiles.includes(profileId)
      ? selectedProfiles.filter(id => id !== profileId)
      : [...selectedProfiles, profileId];
    onProfileSelect(newSelected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (selectedProfiles.length === 0) {
      setError('Please select at least one profile');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Please select start and end dates');
      return;
    }

    const startDateTime = dayjs.tz(`${formData.startDate} ${formData.startTime}`, timezone);
    const endDateTime = dayjs.tz(`${formData.endDate} ${formData.endTime}`, timezone);

    if (endDateTime.isBefore(startDateTime)) {
      setError('End date must be after start date');
      return;
    }

    if (endDateTime.isBefore(dayjs())) {
      setError('Cannot create events in the past');
      return;
    }

    setIsSubmitting(true);
    try {
      await createEvent({
        title: formData.title || 'Event',
        description: formData.description,
        profiles: selectedProfiles,
        timezone,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        createdBy: selectedProfile?._id
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        startDate: '',
        startTime: '09:00',
        endDate: '',
        endTime: '09:00'
      });
      
      alert('Event created successfully!');
    } catch (err) {
      setError(err.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Event Title
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Event title"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={100}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Event description"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows="2"
          maxLength={500}
        />
      </div>

      {/* Profile Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Profiles
        </label>
        <div className="border border-gray-300 rounded p-3 max-h-40 overflow-y-auto">
          {profileOptions.length === 0 ? (
            <p className="text-gray-500 text-sm">No profiles available</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {profileOptions.map(option => (
                <label key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedProfiles.includes(option.value)}
                    onChange={() => handleProfileToggle(option.value)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {selectedProfiles.length} profile(s) selected
        </p>
      </div>

      {/* Timezone Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Timezone
        </label>
        <select
          value={timezone}
          onChange={(e) => onTimezoneChange(e.target.value)}
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
            value={formData.startDate}
            onChange={handleInputChange}
            min={dayjs().format('YYYY-MM-DD')}
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
            value={formData.startTime}
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
            value={formData.endDate}
            onChange={handleInputChange}
            min={formData.startDate || dayjs().format('YYYY-MM-DD')}
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
            value={formData.endTime}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || selectedProfiles.length === 0}
        className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Creating...' : '+ Create Event'}
      </button>
    </form>
  );
};

export default CreateEventForm;