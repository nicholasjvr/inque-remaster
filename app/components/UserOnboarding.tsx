'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
}

type OnboardingStep = 'welcome' | 'profile' | 'interests' | 'goals' | 'complete';

const INTEREST_OPTIONS = [
  { id: 'web-dev', label: 'Web Development', icon: '💻' },
  { id: 'design', label: 'UI/UX Design', icon: '🎨' },
  { id: 'animation', label: 'Animation', icon: '✨' },
  { id: 'games', label: 'Game Development', icon: '🎮' },
  { id: 'data-viz', label: 'Data Visualization', icon: '📊' },
  { id: '3d', label: '3D Graphics', icon: '🧊' },
  { id: 'creative', label: 'Creative Coding', icon: '🌈' },
  { id: 'tools', label: 'Developer Tools', icon: '🛠️' },
];

const GOAL_OPTIONS = [
  { id: 'showcase', label: 'Showcase my work', icon: '🏆' },
  { id: 'learn', label: 'Learn from others', icon: '📚' },
  { id: 'collaborate', label: 'Find collaborators', icon: '🤝' },
  { id: 'build-portfolio', label: 'Build my portfolio', icon: '💼' },
  { id: 'get-feedback', label: 'Get feedback', icon: '💬' },
  { id: 'networking', label: 'Network with creators', icon: '🌐' },
];

export default function UserOnboarding({ isOpen, onComplete }: UserOnboardingProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    bio: '',
    handle: '',
  });
  
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Create user profile document with initial data structure
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName: profileData.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || null,
        bio: profileData.bio || '',
        handle: profileData.handle || user.uid.slice(0, 8),
        email: user.email,
        
        // Onboarding data
        interests: selectedInterests,
        goals: selectedGoals,
        
        // Stats structure
        stats: {
          projectsCount: 0,
          widgetsCount: 0,
          followersCount: 0,
          followingCount: 0,
          totalViews: 0,
          totalLikes: 0,
          badgesCount: 0,
          achievementsUnlocked: [],
        },
        
        // Profile structure
        profile: {
          theme: {
            mode: 'neo',
            accent: '#00f0ff',
            bg: '#04060d',
          },
          repRack: [],
          sections: [],
          links: [],
        },
        
        // Metadata
        onboardingCompleted: true,
        joinDate: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Public visibility
        isPublic: true,
        isVerified: false,
      }, { merge: true });
      
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    const steps: OnboardingStep[] = ['welcome', 'profile', 'interests', 'goals', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: OnboardingStep[] = ['welcome', 'profile', 'interests', 'goals', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="onboarding-step">
            <div className="step-icon animate-bounce">🎉</div>
            <h2>Welcome to inQ!</h2>
            <p className="step-description">
              We're excited to have you here! Let's personalize your experience in just a few quick steps.
            </p>
            <div className="welcome-features">
              <div className="feature-item">
                <span className="feature-icon">🎨</span>
                <div>
                  <h4>Create & Share</h4>
                  <p>Build amazing widgets and projects</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">👥</span>
                <div>
                  <h4>Connect</h4>
                  <p>Network with creators worldwide</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📈</span>
                <div>
                  <h4>Grow</h4>
                  <p>Track your progress and achievements</p>
                </div>
              </div>
            </div>
            <button className="onboarding-btn primary" onClick={nextStep}>
              Let's Get Started 🚀
            </button>
          </div>
        );

      case 'profile':
        return (
          <div className="onboarding-step">
            <div className="step-icon">👤</div>
            <h2>Tell us about yourself</h2>
            <p className="step-description">
              Help others get to know you better
            </p>
            <form className="onboarding-form">
              <div className="form-group">
                <label htmlFor="displayName">Display Name *</label>
                <input
                  id="displayName"
                  type="text"
                  placeholder="Enter your display name"
                  value={profileData.displayName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="handle">Username/Handle</label>
                <input
                  id="handle"
                  type="text"
                  placeholder="@yourhandle"
                  value={profileData.handle}
                  onChange={(e) => setProfileData(prev => ({ ...prev, handle: e.target.value }))}
                  maxLength={20}
                />
                <small>Optional - we'll generate one if you skip this</small>
              </div>
              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  placeholder="Tell us about yourself... What do you create?"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  maxLength={200}
                />
                <small>{profileData.bio.length}/200 characters</small>
              </div>
            </form>
            <div className="onboarding-actions">
              <button className="onboarding-btn secondary" onClick={prevStep}>
                Back
              </button>
              <button 
                className="onboarding-btn primary" 
                onClick={nextStep}
                disabled={!profileData.displayName.trim()}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 'interests':
        return (
          <div className="onboarding-step">
            <div className="step-icon">🌟</div>
            <h2>What are you interested in?</h2>
            <p className="step-description">
              Select topics that interest you (choose at least 1)
            </p>
            <div className="selection-grid">
              {INTEREST_OPTIONS.map(interest => (
                <button
                  key={interest.id}
                  className={`selection-card ${selectedInterests.includes(interest.id) ? 'selected' : ''}`}
                  onClick={() => toggleInterest(interest.id)}
                >
                  <span className="selection-icon">{interest.icon}</span>
                  <span className="selection-label">{interest.label}</span>
                  {selectedInterests.includes(interest.id) && (
                    <span className="selection-check">✓</span>
                  )}
                </button>
              ))}
            </div>
            <div className="onboarding-actions">
              <button className="onboarding-btn secondary" onClick={prevStep}>
                Back
              </button>
              <button 
                className="onboarding-btn primary" 
                onClick={nextStep}
                disabled={selectedInterests.length === 0}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 'goals':
        return (
          <div className="onboarding-step">
            <div className="step-icon">🎯</div>
            <h2>What are your goals?</h2>
            <p className="step-description">
              Help us tailor your experience (choose at least 1)
            </p>
            <div className="selection-grid">
              {GOAL_OPTIONS.map(goal => (
                <button
                  key={goal.id}
                  className={`selection-card ${selectedGoals.includes(goal.id) ? 'selected' : ''}`}
                  onClick={() => toggleGoal(goal.id)}
                >
                  <span className="selection-icon">{goal.icon}</span>
                  <span className="selection-label">{goal.label}</span>
                  {selectedGoals.includes(goal.id) && (
                    <span className="selection-check">✓</span>
                  )}
                </button>
              ))}
            </div>
            <div className="onboarding-actions">
              <button className="onboarding-btn secondary" onClick={prevStep}>
                Back
              </button>
              <button 
                className="onboarding-btn primary" 
                onClick={nextStep}
                disabled={selectedGoals.length === 0}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="onboarding-step">
            <div className="step-icon animate-pulse">✨</div>
            <h2>You're all set!</h2>
            <p className="step-description">
              Your profile is ready. Let's start creating amazing things together!
            </p>
            <div className="onboarding-summary">
              <div className="summary-item">
                <strong>Display Name:</strong> {profileData.displayName}
              </div>
              {profileData.bio && (
                <div className="summary-item">
                  <strong>Bio:</strong> {profileData.bio}
                </div>
              )}
              <div className="summary-item">
                <strong>Interests:</strong> {selectedInterests.length} selected
              </div>
              <div className="summary-item">
                <strong>Goals:</strong> {selectedGoals.length} selected
              </div>
            </div>
            <div className="complete-benefits">
              <h4>What's next?</h4>
              <ul>
                <li>🎨 Create your first widget in Widget Studio</li>
                <li>👥 Explore projects from other creators</li>
                <li>📊 Build your rep rack with featured projects</li>
                <li>🏆 Earn badges and achievements</li>
              </ul>
            </div>
            <div className="onboarding-actions">
              <button className="onboarding-btn secondary" onClick={prevStep}>
                Back
              </button>
              <button 
                className="onboarding-btn primary large" 
                onClick={handleComplete}
                disabled={loading}
              >
                {loading ? '⏳ Setting up...' : '🚀 Launch My Profile'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const steps: OnboardingStep[] = ['welcome', 'profile', 'interests', 'goals', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="user-onboarding-overlay">
      <div className="user-onboarding-modal">
        <div className="onboarding-progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="onboarding-step-indicator">
          Step {currentStepIndex + 1} of {steps.length}
        </div>
        <div className="onboarding-content">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

