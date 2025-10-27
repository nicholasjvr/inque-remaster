'use client';

import { useEffect } from 'react';

type FullscreenWrapperProps = {
  isFullscreen: boolean;
  onToggle: () => void;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  sectionId: string;
  className?: string;
};

export default function FullscreenWrapper({ 
  isFullscreen, 
  onToggle, 
  onClose, 
  title, 
  children, 
  sectionId, 
  className = '' 
}: FullscreenWrapperProps) {
  
  // Handle ESC key to close fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullscreen, onClose]);

  // Handle click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const wrapperContent = (
    <div className={`hub-section-wrapper ${className}`} data-section={sectionId}>
      <button 
        className="fullscreen-toggle-btn"
        onClick={onToggle}
        title={isFullscreen ? 'Exit Fullscreen' : 'Open in Fullscreen'}
        aria-label={isFullscreen ? 'Exit Fullscreen' : 'Open in Fullscreen'}
      >
        {isFullscreen ? '⛶' : '⛶'}
      </button>
      <div className={`hub-section-content ${isFullscreen ? 'fullscreen' : ''}`}>
        {children}
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div 
        className="fullscreen-modal-overlay" 
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${sectionId}-title`}
      >
        <div className="fullscreen-modal-container">
          <div className="fullscreen-modal-header">
            <h2 id={`${sectionId}-title`} className="fullscreen-modal-title">{title}</h2>
            <button 
              className="fullscreen-close-btn" 
              onClick={onClose}
              title="Close Fullscreen"
              aria-label="Close Fullscreen"
            >
              ×
            </button>
          </div>
          <div className="fullscreen-modal-content">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return wrapperContent;
}
