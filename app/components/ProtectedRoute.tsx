'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import AuthModal from './AuthModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  fallback, 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show the protected content
  if (user) {
    return <>{children}</>;
  }

  // If auth is not required, show children anyway
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Show sign-in prompt for unauthenticated users
  return (
    <>
      {fallback || (
        <div className="sign-in-prompt">
          <div className="sign-in-prompt-content">
            <div className="sign-in-icon">🔐</div>
            <h2 className="sign-in-title">Sign In Required</h2>
            <p className="sign-in-description">
              You need to be signed in to access this feature. Create an account or sign in to continue.
            </p>
            <div className="sign-in-actions">
              <button 
                className="sign-in-btn primary"
                onClick={() => setShowAuthModal(true)}
              >
                <span className="btn-icon">🚀</span>
                Sign In / Sign Up
              </button>
              <button 
                className="sign-in-btn secondary"
                onClick={() => window.history.back()}
              >
                <span className="btn-icon">←</span>
                Go Back
              </button>
            </div>
            <div className="sign-in-benefits">
              <h3>What you'll get:</h3>
              <ul>
                <li>🎨 Create and manage widgets</li>
                <li>📊 Track your progress</li>
                <li>👥 Connect with other creators</li>
                <li>💾 Save your work in the cloud</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </>
  );
}
