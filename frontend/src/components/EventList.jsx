import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const EventList = ({ events, selectedTimezone, onTimezoneChange, timezones, selectedProfile }) => {
  const navigate = useNavigate();

  // Memoized event formatting
  const formattedEvents = useMemo(() => {
    return events.map(event => ({
      ...event,
      formattedStart: dayjs(event.startDateTimeLocal || event.startDateTime)
        .tz(selectedTimezone)
        .format('MMM DD, YYYY hh:mm A'),
      formattedEnd: dayjs(event.endDateTimeLocal || event.endDateTime)
        .tz(selectedTimezone)
        .format('MMM DD, YYYY hh:mm A'),
      formattedCreated: dayjs(event.createdAtLocal || event.createdAt)
        .tz(selectedTimezone)
        .format('MMM DD, YYYY hh:mm A'),
      profileNames: event.profiles?.map(p => p.name).join(', ') || 'Unknown'
    }));
  }, [events, selectedTimezone]);

  const handleEditEvent = (eventId) => {
    if (selectedProfile) {
      navigate(`/events/${selectedProfile._id}?event=${eventId}`);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-700">
          Events
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Timezone:</span>
          <select
            value={selectedTimezone}
            onChange={(e) => onTimezoneChange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {timezones.map(tz => (
              <option key={tz} value={tz}>
                {tz.split('/').pop().replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {formattedEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500">No events found</p>
          <p className="text-sm text-gray-400 mt-1">Create your first event to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {formattedEvents.map(event => (
            <div
              key={event._id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{event.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-gray-600">{event.profileNames}</span>
                    {event.profiles?.length > 1 && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {event.profiles.length} users
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleEditEvent(event._id)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                <div>
                  <div className="font-medium mb-1">Start</div>
                  <div>{event.formattedStart}</div>
                </div>
                <div>
                  <div className="font-medium mb-1">End</div>
                  <div>{event.formattedEnd}</div>
                </div>
              </div>

              {event.description && (
                <div className="text-sm text-gray-500 mb-3">
                  {event.description}
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 pt-3">
                <div>
                  Created: {event.formattedCreated}
                </div>
                <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {event.timezone.split('/').pop().replace('_', ' ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;