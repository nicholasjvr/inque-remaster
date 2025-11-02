'use client';

import { useEffect, useState } from 'react';

interface PersonalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PersonalInfoModal({ isOpen, onClose }: PersonalInfoModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }

    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`personal-info-modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className="personal-info-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="personal-info-title"
      >
        <div className="personal-info-modal-header">
          <h2 id="personal-info-title" className="personal-info-title">
            Custom Web App Development
          </h2>
          <button 
            className="personal-info-close-btn" 
            onClick={handleClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="personal-info-modal-content">
          <div className="personal-info-section">
            <div className="personal-info-icon">💻</div>
            <h3 className="personal-info-section-title">Services</h3>
            <p className="personal-info-text">
              I specialize in creating custom web applications tailored to your business needs. 
              From interactive dashboards to modern user interfaces, I bring your vision to life 
              with cutting-edge technology and thoughtful design.
            </p>
          </div>

          <div className="personal-info-section">
            <div className="personal-info-icon">🎨</div>
            <h3 className="personal-info-section-title">Expertise</h3>
            <ul className="personal-info-list">
              <li>React & Next.js Development</li>
              <li>Custom UI/UX Design</li>
              <li>Interactive Web Experiences</li>
              <li>Real-time Applications</li>
              <li>Firebase & Supabase Integration</li>
              <li>Responsive Design</li>
            </ul>
          </div>

          <div className="personal-info-section">
            <div className="personal-info-icon">🚀</div>
            <h3 className="personal-info-section-title">Let's Collaborate</h3>
            <p className="personal-info-text">
              Looking for a custom web application? I'd love to discuss your project and help 
              bring your ideas to life. Let's create something amazing together.
            </p>
            <div className="personal-info-contact">
              <p className="personal-info-contact-text">
                Ready to start your project? Reach out through the platform or connect via your preferred method.
              </p>
            </div>
          </div>
        </div>

        <div className="personal-info-modal-footer">
          <button 
            className="personal-info-btn" 
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
