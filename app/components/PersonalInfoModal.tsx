'use client';

import { useEffect, useState } from 'react';

interface PersonalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactClick?: () => void;
}

export default function PersonalInfoModal({ isOpen, onClose, onContactClick }: PersonalInfoModalProps) {
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
            About Nicholas Jansen van Rensburg
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
            <div className="personal-info-icon">👋</div>
            <h3 className="personal-info-section-title">Welcome to Inqu</h3>
            <p className="personal-info-text">
              Hi! I'm Nicholas Jansen van Rensburg, the creator behind Inqu. This platform
              is my passion project—a space where creativity meets technology. Whether you're
              curious about my work, want to collaborate, or just want to connect, I'd love
              to hear from you.
            </p>
          </div>

          <div className="personal-info-section">
            <div className="personal-info-icon">🎨</div>
            <h3 className="personal-info-section-title">What I Do</h3>
            <ul className="personal-info-list">
              <li>Building innovative web experiences</li>
              <li>Creating interactive platforms like Inqu</li>
              <li>Designing modern UI/UX interfaces</li>
              <li>Developing with React & Next.js</li>
              <li>Working with Firebase & Supabase</li>
              <li>Crafting responsive, user-friendly designs</li>
            </ul>
          </div>

          <div className="personal-info-section">
            <div className="personal-info-icon">💬</div>
            <h3 className="personal-info-section-title">Let's Connect</h3>
            <p className="personal-info-text">
              Interested in learning more about Inqu or my work? Have questions, ideas, or
              just want to say hello? I'm always open to conversations and new connections.
              Feel free to reach out!
            </p>
            <div className="personal-info-contact">
              <p className="personal-info-contact-text">
                Want to know more? Drop me a message through the contact form or connect
                through your preferred method.
              </p>
            </div>
          </div>
        </div>

        <div className="personal-info-modal-footer">
          <button
            className="personal-info-btn personal-info-btn-contact"
            onClick={() => {
              if (onContactClick) {
                onContactClick();
              }
            }}
          >
            Get in Touch →
          </button>
          <button
            className="personal-info-btn personal-info-btn-secondary"
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
