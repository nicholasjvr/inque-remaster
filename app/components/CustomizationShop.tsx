'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useFirestore';
import type { UserProfile } from '@/hooks/useFirestore';
import BackgroundGallery from './BackgroundGallery';
import { showToast } from '@/app/utils/toast';
import './CustomizationShop.css';

type CustomizationSection = 'avatar' | 'background';

type AvatarFrame = {
  id: string;
  name: string;
  style: string;
  color: string;
  preview: string; // CSS class or style description
};

type AvatarAnimation = {
  id: string;
  name: string;
  type: 'pulse' | 'glow' | 'float' | 'bounce' | 'none';
  speed: number;
  preview: string; // Description of the animation
};

type ProfileBackground = {
  id: string;
  name: string;
  type: 'gif' | 'image';
  url: string;
  thumbnail: string;
  preview: string; // Description
};

// Mock data for customization options
const AVATAR_FRAMES: AvatarFrame[] = [
  { id: 'none', name: 'None', style: 'none', color: '#000000', preview: 'No frame' },
  { id: 'neon-border', name: 'Neon Border', style: 'border-2 border-cyan-400 shadow-lg shadow-cyan-400/50', color: '#00f0ff', preview: 'Cyan neon glow' },
  { id: 'gold-frame', name: 'Gold Frame', style: 'border-4 border-yellow-400 bg-gradient-to-br from-yellow-300 to-yellow-600', color: '#ffd700', preview: 'Elegant gold border' },
  { id: 'cyber-grid', name: 'Cyber Grid', style: 'border-2 border-green-400 bg-black/50 relative grid-bg', color: '#00ff00', preview: 'Digital grid pattern' },
  { id: 'rainbow-outline', name: 'Rainbow Outline', style: 'border-3 border-rainbow animate-pulse', color: '#ff0080', preview: 'Colorful animated border' },
  { id: 'glass-morphism', name: 'Glass Morphism', style: 'backdrop-blur-md bg-white/10 border border-white/20 rounded-full', color: '#ffffff', preview: 'Frosted glass effect' },
];

const AVATAR_ANIMATIONS: AvatarAnimation[] = [
  { id: 'none', name: 'None', type: 'none', speed: 1, preview: 'No animation' },
  { id: 'pulse', name: 'Pulse', type: 'pulse', speed: 1, preview: 'Gentle pulsing effect' },
  { id: 'glow', name: 'Glow', type: 'glow', speed: 1, preview: 'Soft glowing animation' },
  { id: 'float', name: 'Float', type: 'float', speed: 1, preview: 'Floating up and down' },
  { id: 'bounce', name: 'Bounce', type: 'bounce', speed: 1, preview: 'Bouncing motion' },
];


type CustomizationShopProps = {
  profile: UserProfile | null;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
  onReset: () => void;
};

export default function CustomizationShop({ profile, onSave, onReset }: CustomizationShopProps) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<CustomizationSection>('avatar');
  const [selectedFrame, setSelectedFrame] = useState<string>(profile?.avatarFrame?.id || 'none');
  const [selectedAnimation, setSelectedAnimation] = useState<string>(profile?.avatarAnimation?.id || 'none');
  const [animationSpeed, setAnimationSpeed] = useState<number>(profile?.avatarAnimation?.speed || 1);
  const [selectedBackground, setSelectedBackground] = useState<string>(profile?.profileBackground?.url ? 'custom' : 'none');
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string>(profile?.profileBackground?.url || '');
  const [isSaving, setIsSaving] = useState(false);

  // Get current selections with fallbacks
  const currentFrame = useMemo(() =>
    AVATAR_FRAMES.find(f => f.id === selectedFrame) || AVATAR_FRAMES[0],
    [selectedFrame]
  );

  const currentAnimation = useMemo(() =>
    AVATAR_ANIMATIONS.find(a => a.id === selectedAnimation) || AVATAR_ANIMATIONS[0],
    [selectedAnimation]
  );


  const handleSave = async () => {
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      const updates: Partial<UserProfile> = {};

      // Save avatar frame
      if (selectedFrame && selectedFrame !== 'none') {
        const frame = AVATAR_FRAMES.find(f => f.id === selectedFrame);
        if (frame) {
          updates.avatarFrame = {
            id: frame.id,
            style: frame.style,
            color: frame.color,
          };
        }
      } else {
        updates.avatarFrame = undefined;
      }

      // Save avatar animation
      if (selectedAnimation && selectedAnimation !== 'none') {
        const animation = AVATAR_ANIMATIONS.find(a => a.id === selectedAnimation);
        if (animation) {
          updates.avatarAnimation = {
            id: animation.id,
            type: animation.type,
            speed: animationSpeed,
          };
        }
      } else {
        updates.avatarAnimation = undefined;
      }

      // Save profile background
      if (selectedBackground === 'custom' && customBackgroundUrl) {
        updates.profileBackground = {
          type: 'gif',
          url: customBackgroundUrl,
          animationSpeed: 1,
        };
      } else if (selectedBackground && selectedBackground !== 'none') {
        updates.profileBackground = {
          type: selectedBackground === 'custom' ? 'gif' : 'image',
          url: selectedBackground === 'custom' ? customBackgroundUrl : `/backgrounds/${selectedBackground}-thumb.jpg`,
          animationSpeed: 1,
        };
      } else {
        updates.profileBackground = undefined;
      }

      await onSave(updates);
      showToast('Customization saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving customization:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save customization';
      showToast(errorMessage, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedFrame('none');
    setSelectedAnimation('none');
    setAnimationSpeed(1);
    setSelectedBackground('none');
    setCustomBackgroundUrl('');
    onReset();
  };

  return (
    <div className="customization-shop" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
      <div className="shop-header">
        <h3 className="shop-title">🎨 Customize Your Profile</h3>
        <p className="shop-subtitle">Make your profile uniquely yours</p>
      </div>

      {/* Section Selector */}
      <div className="section-selector">
        <button
          className={`section-btn ${activeSection === 'avatar' ? 'active' : ''}`}
          onClick={() => setActiveSection('avatar')}
        >
          <span className="section-icon">👤</span>
          <span className="section-label">Avatar Style</span>
        </button>
        <button
          className={`section-btn ${activeSection === 'background' ? 'active' : ''}`}
          onClick={() => setActiveSection('background')}
        >
          <span className="section-icon">🖼️</span>
          <span className="section-label">Background</span>
        </button>
      </div>

      {/* Content Sections */}
      <div className="shop-content" style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
        {activeSection === 'avatar' && (
          <div className="avatar-customization" style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
            {/* Avatar Preview */}
            <div className="avatar-preview-section" style={{ width: '100%', maxWidth: '100%' }}>
              <h4 className="section-subtitle">Preview</h4>
              <div className="avatar-preview-container" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                <div
                  className={`avatar-preview ${currentFrame.style} ${currentAnimation.type}`}
                  style={{
                    '--animation-speed': animationSpeed,
                    borderColor: currentFrame.color
                  } as React.CSSProperties}
                >
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Avatar preview" className="preview-avatar-img" />
                  ) : (
                    <span className="preview-avatar-text">
                      {user?.displayName?.charAt(0)?.toUpperCase() || '👤'}
                    </span>
                  )}
                </div>
                <div className="preview-info">
                  <span className="preview-frame">{currentFrame.name}</span>
                  <span className="preview-animation">{currentAnimation.name}</span>
                </div>
              </div>
            </div>

            {/* Frame Selection */}
            <div className="customization-group" style={{ width: '100%' }}>
              <label className="group-label">Choose Frame</label>
              <div className="frames-grid" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                {AVATAR_FRAMES.map((frame) => (
                  <button
                    key={frame.id}
                    className={`frame-btn ${selectedFrame === frame.id ? 'selected' : ''}`}
                    onClick={() => setSelectedFrame(frame.id)}
                    title={frame.preview}
                  >
                    <div className={`frame-preview ${frame.style}`}>
                      <span className="frame-icon">👤</span>
                    </div>
                    <span className="frame-name">{frame.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Animation Selection */}
            <div className="customization-group" style={{ width: '100%' }}>
              <label className="group-label">Animation Effect</label>
              <div className="animations-grid" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                {AVATAR_ANIMATIONS.map((animation) => (
                  <button
                    key={animation.id}
                    className={`animation-btn ${selectedAnimation === animation.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedAnimation(animation.id);
                      setAnimationSpeed(animation.speed);
                    }}
                  >
                    <div className={`animation-preview ${animation.type}`} style={{'--animation-speed': animationSpeed} as React.CSSProperties}>
                      <span className="animation-icon">✨</span>
                    </div>
                    <span className="animation-name">{animation.name}</span>
                  </button>
                ))}
              </div>

              {/* Speed Control - Only show when animation is selected */}
              {selectedAnimation !== 'none' && (
                <div className="speed-control">
                  <label className="speed-label">Animation Speed: {animationSpeed}x</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={animationSpeed}
                    onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                    className="speed-slider"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'background' && (
          <div className="background-customization" style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
            <BackgroundGallery
              selectedBackground={selectedBackground}
              customBackgroundUrl={customBackgroundUrl}
              onBackgroundSelect={(backgroundId, url) => {
                setSelectedBackground(backgroundId);
                if (url) {
                  setCustomBackgroundUrl(url);
                } else {
                  setCustomBackgroundUrl('');
                }
              }}
              profile={profile}
              size="medium"
              showUpload={true}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="shop-actions">
        <button
          className="shop-btn reset-btn"
          onClick={handleReset}
          disabled={isSaving}
        >
          Reset All
        </button>
        <button
          className="shop-btn save-btn"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
