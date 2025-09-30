'use client';

import { useState } from 'react';
import WidgetCarousel from './WidgetCarousel';
import UploadWorkspace from './UploadWorkspace';
import { useAuth } from '@/contexts/AuthContext';
import { useWidgets, Widget } from '@/hooks/useFirestore';
import ProfileHub from './ProfileHub';
import AuthButton from './AuthButton';

export default function WidgetStudio() {
  const { user, loading: authLoading } = useAuth();
  const { widgets, loading: widgetsLoading } = useWidgets(user?.uid);
  const [currentSlot, setCurrentSlot] = useState(1);

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="widget-studio">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Widget Studio...</p>
        </div>
      </div>
    );
  }

  const handleSlotFocus = (slot: number) => {
    setCurrentSlot(slot);
    // Scroll to upload workspace
    const uploadWorkspace = document.querySelector('.upload-workspace');
    if (uploadWorkspace) {
      uploadWorkspace.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRefresh = () => {
    // Widgets will automatically refresh via Firestore real-time updates
    console.log('Widgets refreshed via real-time updates');
  };

  return (
    <div className="widget-studio">
      {/* Header */}
      <header className="studio-header">
        <div className="header-content">
          <div className="header-left">
            <a href="/" className="back-btn">
              <span>←</span>
              <span>Back to Home</span>
            </a>
            <h1 className="page-title">🎨 Widget Studio</h1>
          </div>
          <div className="header-right">
            {user ? <ProfileHub /> : <AuthButton />}
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="studio-welcome">
        <div className="welcome-content">
          <h2>Welcome to Your Widget Studio</h2>
          <p>
            Create, preview, and manage your interactive widgets. Each slot
            can hold a complete project with multiple files.
          </p>
          <div className="studio-stats">
            <div className="stat-item">
              <span className="stat-number">{widgets.length}</span>
              <span className="stat-label">Total Widgets</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{widgets.filter(w => w.slot).length}</span>
              <span className="stat-label">Active Slots</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{widgets.reduce((acc, w) => acc + w.files.length, 0)}</span>
              <span className="stat-label">Total Files</span>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Carousel */}
      <WidgetCarousel 
        widgets={widgets}
        onSlotFocus={handleSlotFocus}
        isLoading={widgetsLoading}
      />

      {/* Upload Workspace */}
      <UploadWorkspace 
        currentSlot={currentSlot}
        onSlotChange={setCurrentSlot}
      />

      {/* Studio Actions */}
      <div className="studio-actions">
        <button className="save-all-btn" onClick={() => alert('Save all functionality coming soon!')}>
          <span>💾</span>
          Save All Changes
        </button>
        <button className="refresh-btn" onClick={handleRefresh}>
          <span>🔄</span>
          Refresh Studio
        </button>
      </div>
    </div>
  );
}
