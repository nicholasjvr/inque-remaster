'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserProfile } from '@/hooks/useFirestore';

type AvatarFrame = {
  id: string;
  name: string;
  style: string;
  color: string;
  preview: string;
  cssClass: string;
};

type AvatarFramesProps = {
  selectedFrame?: string;
  onFrameSelect?: (frameId: string) => void;
  profile?: UserProfile | null;
  size?: 'small' | 'medium' | 'large';
  showSelector?: boolean;
};

// Preset avatar frames with detailed styling
const AVATAR_FRAMES: AvatarFrame[] = [
  {
    id: 'none',
    name: 'None',
    style: 'none',
    color: '#000000',
    preview: 'Clean, no frame',
    cssClass: ''
  },
  {
    id: 'neon-border',
    name: 'Neon Border',
    style: 'neon-border',
    color: '#00f0ff',
    preview: 'Electric cyan glow',
    cssClass: 'border-2 border-cyan-400 shadow-lg shadow-cyan-400/50 rounded-full'
  },
  {
    id: 'gold-frame',
    name: 'Gold Frame',
    style: 'gold-frame',
    color: '#ffd700',
    preview: 'Elegant gold border',
    cssClass: 'border-4 border-yellow-400 bg-gradient-to-br from-yellow-300/20 to-yellow-600/20 rounded-full shadow-lg'
  },
  {
    id: 'cyber-grid',
    name: 'Cyber Grid',
    style: 'cyber-grid',
    color: '#00ff00',
    preview: 'Digital grid pattern',
    cssClass: 'border-2 border-green-400 bg-black/50 relative rounded-full cyber-grid-bg'
  },
  {
    id: 'rainbow-outline',
    name: 'Rainbow Outline',
    style: 'rainbow-outline',
    color: '#ff0080',
    preview: 'Colorful animated border',
    cssClass: 'border-3 border-rainbow animate-pulse rounded-full shadow-lg'
  },
  {
    id: 'glass-morphism',
    name: 'Glass Morphism',
    style: 'glass-morphism',
    color: '#ffffff',
    preview: 'Frosted glass effect',
    cssClass: 'backdrop-blur-md bg-white/10 border border-white/20 rounded-full shadow-lg'
  },
  {
    id: 'cosmic-ring',
    name: 'Cosmic Ring',
    style: 'cosmic-ring',
    color: '#9d4edd',
    preview: 'Purple cosmic energy',
    cssClass: 'border-2 border-purple-500 shadow-lg shadow-purple-500/50 rounded-full cosmic-ring'
  },
  {
    id: 'fire-border',
    name: 'Fire Border',
    style: 'fire-border',
    color: '#ff4500',
    preview: 'Flaming orange border',
    cssClass: 'border-3 border-orange-500 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full animate-pulse shadow-lg'
  }
];

export default function AvatarFrames({
  selectedFrame = 'none',
  onFrameSelect,
  profile,
  size = 'medium',
  showSelector = true
}: AvatarFramesProps) {
  const { user } = useAuth();

  // Size classes for responsive design
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const buttonSizeClasses = {
    small: 'w-12 h-12 text-xs',
    medium: 'w-16 h-16 text-sm',
    large: 'w-20 h-20 text-base'
  };

  // Get the currently selected frame data
  const currentFrame = useMemo(() =>
    AVATAR_FRAMES.find(f => f.id === selectedFrame) || AVATAR_FRAMES[0],
    [selectedFrame]
  );

  // Render avatar with frame overlay
  const renderAvatarWithFrame = (frame: AvatarFrame, interactive = false) => {
    // Get animation class based on selected animation
    const getAnimationClass = () => {
      if (!profile?.avatarAnimation) return 'avatar-animation-none';

      const animationType = profile.avatarAnimation.type;
      const speed = profile.avatarAnimation.speed || 1;

      switch (animationType) {
        case 'pulse': return 'avatar-animation-pulse';
        case 'glow': return 'avatar-animation-glow';
        case 'float': return 'avatar-animation-float';
        case 'bounce': return 'avatar-animation-bounce';
        default: return 'avatar-animation-none';
      }
    };

    return (
      <div className={`relative inline-block ${interactive ? 'cursor-pointer' : ''}`}>
        {/* Frame background/base */}
        <div
          className={`relative ${sizeClasses[size]} ${frame.cssClass} ${getAnimationClass()}`}
          style={{'--animation-speed': profile?.avatarAnimation?.speed || 1} as React.CSSProperties}
        >
          {/* Avatar content */}
          <div className={`w-full h-full rounded-full overflow-hidden ${frame.id !== 'none' ? 'bg-gray-800' : ''}`}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-white text-2xl font-bold">
                {user?.displayName?.charAt(0)?.toUpperCase() || '👤'}
              </div>
            )}
          </div>

          {/* Special effects for certain frames */}
          {frame.id === 'cyber-grid' && (
            <div className="absolute inset-0 rounded-full opacity-30">
              <div className="w-full h-full bg-gradient-to-br from-transparent via-green-400/20 to-transparent animate-pulse"></div>
            </div>
          )}

          {frame.id === 'cosmic-ring' && (
            <div className="absolute inset-0 rounded-full">
              <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-spin opacity-75" style={{ animationDuration: '3s' }}></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (showSelector) {
    return (
      <div className="avatar-frames">
        <div className="frames-header">
          <h3 className="frames-title">Avatar Frames</h3>
          <p className="frames-subtitle">Choose a frame style for your avatar</p>
        </div>

        {/* Current selection preview */}
        <div className="current-frame-preview">
          <div className="preview-label">Current Selection:</div>
          <div className="preview-frame">
            {renderAvatarWithFrame(currentFrame)}
            <div className="frame-info">
              <span className="frame-name">{currentFrame.name}</span>
              <span className="frame-preview">{currentFrame.preview}</span>
            </div>
          </div>
        </div>

        {/* Frame selection grid */}
        <div className="frames-grid">
          {AVATAR_FRAMES.map((frame) => (
            <div
              key={frame.id}
              className={`frame-option ${selectedFrame === frame.id ? 'selected' : ''}`}
              onClick={() => onFrameSelect?.(frame.id)}
            >
              <div className="frame-button">
                {renderAvatarWithFrame(frame, true)}
              </div>
              <div className="frame-details">
                <h4 className="frame-option-name">{frame.name}</h4>
                <p className="frame-option-preview">{frame.preview}</p>
              </div>
              {selectedFrame === frame.id && (
                <div className="selected-indicator">✓</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Just render the avatar with frame (for standalone use)
  return renderAvatarWithFrame(currentFrame);
}
