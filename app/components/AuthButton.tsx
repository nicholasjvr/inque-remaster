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
      <button 
        className="auth-button"
        onClick={() => setShowAuthModal(true)}
      >
        <span className="auth-icon">🔐</span>
        Sign In
      </button>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </>
  );
}
