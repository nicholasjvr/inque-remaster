'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await signIn(formData.email, formData.password);
        onClose();
      } else if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        await signUp(formData.email, formData.password);
        onClose();
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      onClose();
    } catch (error: any) {
      setError(error.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const modalContent = (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2 className="auth-modal-title">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h2>
          <button className="auth-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="auth-modal-content">
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {mode === 'forgot' ? (
            <div className="forgot-password">
              <p>Enter your email address and we'll send you a password reset link.</p>
              <form onSubmit={handleSubmit}>
                <div className="auth-input-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <button 
                className="auth-link-btn" 
                onClick={() => setMode('login')}
              >
                Back to Login
              </button>
            </div>
          ) : (
            <>
              {/* Social Login Buttons */}
              <div className="auth-social-buttons">
                <button 
                  className="auth-social-btn google-btn" 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <span className="social-icon">🔍</span>
                  Continue with Google
                </button>
              </div>

              <div className="auth-divider">
                <span>or</span>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="auth-form">
                {mode === 'signup' && (
                  <div className="auth-input-group">
                    <input
                      type="text"
                      name="displayName"
                      placeholder="Display name (optional)"
                      value={formData.displayName}
                      onChange={handleInputChange}
                    />
                  </div>
                )}

                <div className="auth-input-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="auth-input-group">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                  />
                </div>

                {mode === 'signup' && (
                  <div className="auth-input-group">
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading 
                    ? 'Please wait...' 
                    : mode === 'login' 
                      ? 'Sign In' 
                      : 'Create Account'
                  }
                </button>
              </form>

              {/* Form Links */}
              <div className="auth-links">
                {mode === 'login' ? (
                  <>
                    <button 
                      className="auth-link-btn" 
                      onClick={() => setMode('forgot')}
                    >
                      Forgot password?
                    </button>
                    <button 
                      className="auth-link-btn" 
                      onClick={() => setMode('signup')}
                    >
                      Don't have an account? Sign up
                    </button>
                  </>
                ) : (
                  <button 
                    className="auth-link-btn" 
                    onClick={() => setMode('login')}
                  >
                    Already have an account? Sign in
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
