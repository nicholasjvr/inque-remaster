'use client';

import { useState } from 'react';

interface WidgetOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function WidgetOnboarding({ onComplete, onSkip }: WidgetOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const steps = [
    {
      title: "Welcome to Widget Studio! 🎨",
      content: (
        <div className="onboarding-step">
          <div className="step-icon">🎨</div>
          <h3>Create Interactive Widgets</h3>
          <p>Upload your HTML, CSS, and JavaScript files to create interactive widgets that others can view and interact with.</p>
          <div className="step-features">
            <div className="feature-item">
              <span className="feature-icon">📁</span>
              <span>Upload multiple files</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎮</span>
              <span>Interactive previews</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">☁️</span>
              <span>Cloud storage</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "File Organization 📂",
      content: (
        <div className="onboarding-step">
          <div className="step-icon">📂</div>
          <h3>How to Organize Your Files</h3>
          <p>You can upload your widget files in two ways:</p>
          
          <div className="file-options">
            <div className="option-card">
              <div className="option-header">
                <span className="option-icon">📁</span>
                <h4>Individual Files</h4>
                <span className="option-badge recommended">Recommended</span>
              </div>
              <p>Upload each file separately (HTML, CSS, JS, images)</p>
              <ul>
                <li>✅ Better file management</li>
                <li>✅ Individual file previews</li>
                <li>✅ Easier debugging</li>
                <li>✅ Version control friendly</li>
              </ul>
            </div>
            
            <div className="option-card">
              <div className="option-header">
                <span className="option-icon">📦</span>
                <h4>ZIP Archive</h4>
                <span className="option-badge alternative">Alternative</span>
              </div>
              <p>Package all files into a single ZIP file</p>
              <ul>
                <li>✅ Single upload</li>
                <li>✅ Preserves folder structure</li>
                <li>⚠️ Harder to manage individual files</li>
                <li>⚠️ Larger upload size</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "File Requirements 📋",
      content: (
        <div className="onboarding-step">
          <div className="step-icon">📋</div>
          <h3>Supported File Types</h3>
          <p>Your widget can include these file types:</p>
          
          <div className="file-types">
            <div className="file-type-group">
              <h4>Core Files</h4>
              <div className="file-type-list">
                <span className="file-type">HTML</span>
                <span className="file-type">CSS</span>
                <span className="file-type">JavaScript</span>
                <span className="file-type">JSON</span>
              </div>
            </div>
            
            <div className="file-type-group">
              <h4>Assets</h4>
              <div className="file-type-list">
                <span className="file-type">PNG</span>
                <span className="file-type">JPG</span>
                <span className="file-type">GIF</span>
                <span className="file-type">SVG</span>
                <span className="file-type">WebP</span>
              </div>
            </div>
            
            <div className="file-type-group">
              <h4>Other</h4>
              <div className="file-type-list">
                <span className="file-type">TXT</span>
                <span className="file-type">MD</span>
              </div>
            </div>
          </div>
          
          <div className="requirements">
            <h4>Requirements:</h4>
            <ul>
              <li>📏 Maximum file size: 10MB per file</li>
              <li>📁 Maximum total size: 50MB per widget</li>
              <li>🏠 Include an <code>index.html</code> or main HTML file</li>
              <li>🔒 No server-side code (client-side only)</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Best Practices 💡",
      content: (
        <div className="onboarding-step">
          <div className="step-icon">💡</div>
          <h3>Widget Development Tips</h3>
          
          <div className="best-practices">
            <div className="practice-item">
              <div className="practice-icon">🏠</div>
              <div className="practice-content">
                <h4>Start with index.html</h4>
                <p>Create a main HTML file that serves as the entry point for your widget.</p>
              </div>
            </div>
            
            <div className="practice-item">
              <div className="practice-icon">📱</div>
              <div className="practice-content">
                <h4>Responsive Design</h4>
                <p>Make your widget work on different screen sizes using CSS media queries.</p>
              </div>
            </div>
            
            <div className="practice-item">
              <div className="practice-icon">⚡</div>
              <div className="practice-content">
                <h4>Optimize Performance</h4>
                <p>Keep file sizes small and use efficient code for better loading times.</p>
              </div>
            </div>
            
            <div className="practice-item">
              <div className="practice-icon">🔒</div>
              <div className="practice-content">
                <h4>Security First</h4>
                <p>Avoid external API calls and keep everything self-contained.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Ready to Create! 🚀",
      content: (
        <div className="onboarding-step">
          <div className="step-icon">🚀</div>
          <h3>You're All Set!</h3>
          <p>Now you know everything you need to create amazing widgets. Let's get started!</p>
          
          <div className="next-steps">
            <h4>Next Steps:</h4>
            <ol>
              <li>Click on an empty slot below</li>
              <li>Upload your widget files</li>
              <li>Add a title and description</li>
              <li>Preview and publish your widget</li>
            </ol>
          </div>
          
          <div className="onboarding-actions">
            <button className="onboarding-btn primary" onClick={onComplete}>
              <span>🎨</span>
              Start Creating Widgets
            </button>
            <button className="onboarding-btn secondary" onClick={onSkip}>
              <span>⏭️</span>
              Skip Tutorial
            </button>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!showOnboarding) return null;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-header">
          <h2>{steps[currentStep].title}</h2>
          <button className="onboarding-close" onClick={onSkip}>
            ×
          </button>
        </div>
        
        <div className="onboarding-content">
          {steps[currentStep].content}
        </div>
        
        <div className="onboarding-footer">
          <div className="onboarding-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
            <span className="progress-text">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          
          <div className="onboarding-navigation">
            <button 
              className="onboarding-btn secondary" 
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              ← Previous
            </button>
            
            <button className="onboarding-btn primary" onClick={nextStep}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
