import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DisplayScreen from './components/DisplayScreen';
import { db } from './utils/db';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRoute, setCurrentRoute] = useState('');
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  useEffect(() => {
    // Determine route from URL pathname, search query, or hash to support local/offline files
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    
    if (
      path.endsWith('/display') || 
      path.includes('/display.html') || 
      search.includes('display') || 
      hash.includes('display')
    ) {
      setCurrentRoute('display');
    } else {
      setCurrentRoute('admin');
    }

    // Check for existing session in localStorage
    const savedUser = localStorage.getItem('go_station_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem('go_station_user');
      }
    }
    setIsDbLoaded(true);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('go_station_user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    if (currentUser) {
      await db.addLog(currentUser.username, currentUser.role, 'LOGOUT', 'USER', 'تسجيل خروج من المنصة');
    }
    setCurrentUser(null);
    localStorage.removeItem('go_station_user');
  };

  if (!isDbLoaded) {
    return (
      <div className="app-loading">
        <div className="loader-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    );
  }

  // Route: Digital Signage Display Screen
  if (currentRoute === 'display') {
    return <DisplayScreen isPreview={false} />;
  }

  // Route: Admin Dashboard
  return (
    <div className="app-admin-container">
      {currentUser ? (
        <Dashboard currentUser={currentUser} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}
