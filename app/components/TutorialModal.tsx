'use client';

import { useState, useEffect } from 'react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to INQU Studio',
    content: 'Navigate through our creative platform using the floating orb. Rotate it to explore different sections.',
    icon: '🌟'
  },
  {
    title: 'Explore the Orb',
    content: 'Click and drag the orb or swipe on mobile to rotate it. Each icon represents a different section of the platform.',
    icon: '⚡'
  },
  {
    title: 'Your Profile Hub',
    content: 'Access your profile card at the bottom to customize your avatar, background, and showcase your work.',
    icon: '👤'
  },
  {
    title: 'Create & Share',
    content: 'Build interactive widgets, showcase your projects, and connect with other creators in the community.',
    icon: '🚀'
  },
  {
    title: 'Get Started',
    content: 'Sign in to unlock all features. Start creating, sharing, and collaborating with fellow creatives!',
    icon: '✨'
  }
];

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsClosing(false);
      // Prevent body scroll when modal is open
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

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrevious();
  };

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <div 
      className={`tutorial-modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className="tutorial-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        <div className="tutorial-modal-header">
          <div className="tutorial-progress-bar">
            <div 
              className="tutorial-progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <button 
            className="tutorial-close-btn" 
            onClick={handleClose}
            aria-label="Close tutorial"
          >
            ×
          </button>
        </div>

        <div className="tutorial-modal-content">
          <div className="tutorial-step-icon">{step.icon}</div>
          <h2 id="tutorial-title" className="tutorial-step-title">{step.title}</h2>
          <p className="tutorial-step-content">{step.content}</p>
          
          <div className="tutorial-step-indicators">
            {TUTORIAL_STEPS.map((_, index) => (
              <div
                key={index}
                className={`tutorial-step-dot ${index === currentStep ? 'active' : ''}`}
                onClick={() => setCurrentStep(index)}
              />
            ))}
          </div>
        </div>

        <div className="tutorial-modal-footer">
          {currentStep > 0 && (
            <button 
              className="tutorial-btn tutorial-btn-secondary" 
              onClick={handlePrevious}
            >
              ← Previous
            </button>
          )}
          <button 
            className="tutorial-btn tutorial-btn-primary" 
            onClick={handleNext}
          >
            {currentStep === TUTORIAL_STEPS.length - 1 ? 'Get Started' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
