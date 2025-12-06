import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { EventProvider } from './context/EventContext';
import Dashboard from './pages/Dashboard';
import EventView from './pages/EventView';

function App() {
  return (
    <EventProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/events/:profileId" element={<EventView />} />
          </Routes>
        </div>
      </Router>
    </EventProvider>
  );
}

export default App;