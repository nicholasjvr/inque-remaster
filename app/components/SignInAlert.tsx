'use client';

import { useState } from 'react';
import AuthModal from './AuthModal';

interface SignInAlertProps {
  feature: string;
  description?: string;
  onClose?: () => void;
  show?: boolean;
}

export default function SignInAlert({ 
  feature, 
  description = "This feature requires you to be signed in.",
  onClose,
  show = true 
}: SignInAlertProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!show) return null;

  return (
    <>
      <div className="sign-in-alert">
        <div className="alert-content">
          <div className="alert-icon">🔐</div>
          <div className="alert-text">
            <h3 className="alert-title">Sign In Required</h3>
            <p className="alert-description">
              {description}
            </p>
          </div>
          <div className="alert-actions">
            <button 
              className="alert-btn primary"
              onClick={() => setShowAuthModal(true)}
            >
              Sign In
            </button>
            {onClose && (
              <button 
                className="alert-btn secondary"
                onClick={onClose}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </>
  );
}
