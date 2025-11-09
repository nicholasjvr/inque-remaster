'use client';

import { useAuth } from '@/contexts/AuthContext';
import AuthButton from './AuthButton';

interface SignUpPromptProps {
  title?: string;
  description?: string;
  showBenefits?: boolean;
  compact?: boolean;
}

export default function SignUpPrompt({ 
  title = "Join inQ to Get Started",
  description = "Sign up to create projects, customize your profile, and connect with creators",
  showBenefits = true,
  compact = false
}: SignUpPromptProps) {
  const { user } = useAuth();

  // Don't show if user is already logged in
  if (user) return null;

  return (
    <div className={`sign-up-prompt ${compact ? 'sign-up-prompt--compact' : ''}`}>
      <div className="sign-up-prompt-content">
        <div className="sign-up-icon">✨</div>
        <h3 className="sign-up-title">{title}</h3>
        <p className="sign-up-description">{description}</p>
        
        {showBenefits && (
          <div className="sign-up-benefits">
            <div className="benefit-item">
              <span className="benefit-icon">🎨</span>
              <span>Create & showcase projects</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">👥</span>
              <span>Connect with creators</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">⚡</span>
              <span>Customize your profile</span>
            </div>
          </div>
        )}

        <div className="sign-up-actions">
          <AuthButton />
        </div>
      </div>
    </div>
  );
}

