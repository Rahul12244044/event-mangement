import React, { useState, useEffect, useMemo } from 'react';
import { useEvent } from '../context/EventContext';
import CreateEventForm from '../components/CreateEventForm';
import ProfileManager from '../components/ProfileManager';
import EventList from '../components/EventList';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const Dashboard = () => {
  const {
    profiles,
    selectedProfile,
    setSelectedProfile,
    events,
    fetchProfiles,
    fetchEvents
  } = useEvent();

  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [selectedProfilesForEvent, setSelectedProfilesForEvent] = useState([]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    if (selectedProfile && selectedProfile._id) {
      setSelectedProfilesForEvent([selectedProfile._id]);
      fetchEvents(selectedProfile._id, selectedProfile.timezone);
      setSelectedTimezone(selectedProfile.timezone);
    }
  }, [selectedProfile, fetchEvents]);

  // Memoized timezone list
  const timezones = useMemo(() => [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Kolkata',
    'Asia/Tokyo',
    'Australia/Sydney'
  ], []);

  const handleTimezoneChange = async (timezone) => {
    setSelectedTimezone(timezone);
    if (selectedProfile) {
      await fetchEvents(selectedProfile._id, timezone);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Event Management
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Create Event
            </h2>
            <CreateEventForm
              profiles={profiles}
              selectedProfiles={selectedProfilesForEvent}
              onProfileSelect={setSelectedProfilesForEvent}
              timezone={selectedTimezone}
              onTimezoneChange={handleTimezoneChange}
              timezones={timezones}
            />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Profiles
            </h2>
            <ProfileManager />
          </div>
        </div>

        {/* Right Column */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <EventList
            events={events}
            selectedTimezone={selectedTimezone}
            onTimezoneChange={handleTimezoneChange}
            timezones={timezones}
            selectedProfile={selectedProfile}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;