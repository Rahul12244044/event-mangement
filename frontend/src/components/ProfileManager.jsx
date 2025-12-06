import React, { useState, useCallback } from 'react';
import { useEvent } from '../context/EventContext';
import dayjs from 'dayjs';

const ProfileManager = () => {
  const { profiles, createProfile, selectedProfile, setSelectedProfile } = useEvent();
  const [newProfileName, setNewProfileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProfile = useCallback(async (e) => {
    e.preventDefault();
    const name = newProfileName.trim();
    
    if (!name) {
      alert('Please enter a profile name');
      return;
    }

    if (name.length < 2 || name.length > 50) {
      alert('Profile name must be between 2 and 50 characters');
      return;
    }

    setIsCreating(true);
    try {
      const newProfile = await createProfile(name);
      setNewProfileName('');
      setSelectedProfile(newProfile);
    } catch (error) {
      alert(error);
    } finally {
      setIsCreating(false);
    }
  }, [newProfileName, createProfile, setSelectedProfile]);

  return (
    <div className="space-y-4">
      {/* Create Profile Form */}
      <form onSubmit={handleCreateProfile} className="flex space-x-2">
        <input
          type="text"
          value={newProfileName}
          onChange={(e) => setNewProfileName(e.target.value)}
          placeholder="Enter profile name"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          minLength={2}
          maxLength={50}
          required
        />
        <button
          type="submit"
          disabled={isCreating || !newProfileName.trim()}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {isCreating ? 'Adding...' : 'Add'}
        </button>
      </form>

      {/* Profiles List */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Available Profiles ({profiles.length})
        </h3>
        <div className="border border-gray-300 rounded divide-y max-h-60 overflow-y-auto">
          {profiles.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No profiles found</p>
          ) : (
            profiles.map(profile => (
              <div
                key={profile._id}
                className={`p-3 flex justify-between items-center cursor-pointer transition-colors ${
                  selectedProfile?._id === profile._id
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedProfile(profile)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedProfile?._id === profile._id ? 'bg-blue-500' : 'bg-gray-300'
                  }`}></div>
                  <div>
                    <div className="font-medium text-gray-800">{profile.name}</div>
                    <div className="text-xs text-gray-500">
                      {profile.timezone.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {dayjs(profile.createdAt).format('MMM DD')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileManager;