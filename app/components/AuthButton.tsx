'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import AuthModal from './AuthModal';

export default function AuthButton() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (user) {
    return null; // User is logged in, don't show auth button
  }

  return (
    <>
      <div className="auth-button-container">
        <button
          className="auth-button"
          onClick={() => setShowAuthModal(true)}
        >
          <span className="auth-icon">🔐</span>
          <span className="auth-text">Sign In</span>
        </button>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </>
  );
}
