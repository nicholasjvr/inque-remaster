'use client';

import { useState, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useFirestore';
import type { UserProfile } from '@/hooks/useFirestore';

type BackgroundType = 'gif' | 'image';

type BackgroundPreset = {
  id: string;
  name: string;
  type: BackgroundType;
  url: string;
  thumbnail: string;
  preview: string;
  category: 'cyber' | 'nature' | 'abstract' | 'space' | 'minimal';
};

type BackgroundGalleryProps = {
  selectedBackground?: string;
  customBackgroundUrl?: string;
  onBackgroundSelect?: (backgroundId: string, url?: string) => void;
  profile?: UserProfile | null;
  size?: 'small' | 'medium' | 'large';
  showUpload?: boolean;
};

// Preset background options
const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'none',
    name: 'None',
    type: 'image',
    url: '',
    thumbnail: '',
    preview: 'No background',
    category: 'minimal'
  },
  {
    id: 'cyber-grid-bg',
    name: 'Cyber Grid',
    type: 'gif',
    url: '/cyber-grid.gif',
    thumbnail: '/cyber-grid-thumb.jpg',
    preview: 'Animated cyber grid pattern',
    category: 'cyber'
  },
  {
    id: 'space-nebula',
    name: 'Space Nebula',
    type: 'gif',
    url: '/space-nebula.gif',
    thumbnail: '/space-nebula-thumb.jpg',
    preview: 'Cosmic nebula animation',
    category: 'space'
  },
  {
    id: 'matrix-rain',
    name: 'Matrix Rain',
    type: 'gif',
    url: '/matrix-rain.gif',
    thumbnail: '/matrix-rain-thumb.jpg',
    preview: 'Digital matrix rain effect',
    category: 'cyber'
  },
  {
    id: 'gradient-waves',
    name: 'Gradient Waves',
    type: 'gif',
    url: '/gradient-waves.gif',
    thumbnail: '/gradient-waves-thumb.jpg',
    preview: 'Flowing gradient waves',
    category: 'abstract'
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    type: 'gif',
    url: '/ocean-waves.gif',
    thumbnail: '/ocean-waves-thumb.jpg',
    preview: 'Peaceful ocean waves',
    category: 'nature'
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    type: 'gif',
    url: '/aurora-borealis.gif',
    thumbnail: '/aurora-borealis-thumb.jpg',
    preview: 'Northern lights animation',
    category: 'nature'
  },
  {
    id: 'geometric-pattern',
    name: 'Geometric Pattern',
    type: 'gif',
    url: '/geometric-pattern.gif',
    thumbnail: '/geometric-pattern-thumb.jpg',
    preview: 'Dynamic geometric shapes',
    category: 'abstract'
  },
  {
    id: 'particle-field',
    name: 'Particle Field',
    type: 'gif',
    url: '/particle-field.gif',
    thumbnail: '/particle-field-thumb.jpg',
    preview: 'Floating particle animation',
    category: 'abstract'
  },
  {
    id: 'circuit-board',
    name: 'Circuit Board',
    type: 'gif',
    url: '/circuit-board.gif',
    thumbnail: '/circuit-board-thumb.jpg',
    preview: 'Animated circuit patterns',
    category: 'cyber'
  }
];

export default function BackgroundGallery({
  selectedBackground = 'none',
  customBackgroundUrl = '',
  onBackgroundSelect,
  profile,
  size = 'medium',
  showUpload = true
}: BackgroundGalleryProps) {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [customUrl, setCustomUrl] = useState<string>(customBackgroundUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Size classes for responsive design
  const sizeClasses = {
    small: 'w-16 h-12',
    medium: 'w-24 h-16',
    large: 'w-32 h-20'
  };

  const buttonSizeClasses = {
    small: 'w-12 h-8 text-xs',
    medium: 'w-16 h-10 text-sm',
    large: 'w-20 h-12 text-base'
  };

  // Filter backgrounds by category
  const filteredBackgrounds = useMemo(() => {
    if (activeCategory === 'all') return BACKGROUND_PRESETS;
    return BACKGROUND_PRESETS.filter(bg => bg.category === activeCategory);
  }, [activeCategory]);

  // Categories for filtering
  const categories = [
    { id: 'all', label: 'All', icon: '🌟' },
    { id: 'cyber', label: 'Cyber', icon: '💻' },
    { id: 'nature', label: 'Nature', icon: '🌿' },
    { id: 'abstract', label: 'Abstract', icon: '🎨' },
    { id: 'space', label: 'Space', icon: '🌌' },
    { id: 'minimal', label: 'Minimal', icon: '⚪' }
  ];

  // Handle preset background selection
  const handlePresetSelect = (background: BackgroundPreset) => {
    onBackgroundSelect?.(background.id, background.url);
  };

  // Handle custom URL input
  const handleCustomUrlChange = (url: string) => {
    setCustomUrl(url);
    if (url.trim()) {
      onBackgroundSelect?.('custom', url);
    }
  };

  // Handle file upload (placeholder for actual implementation)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'image/gif') {
      alert('Please select an image or GIF file');
      return;
    }

    setIsUploading(true);
    try {
      // TODO: Implement actual file upload to Firebase Storage
      // For now, create a local URL for preview
      const localUrl = URL.createObjectURL(file);

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCustomUrl(localUrl);
      onBackgroundSelect?.('custom', localUrl);

      console.log('Background uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Get current background for preview
  const getCurrentBackground = () => {
    if (customUrl) {
      return {
        id: 'custom',
        name: 'Custom',
        type: 'gif' as BackgroundType,
        url: customUrl,
        thumbnail: customUrl,
        preview: 'Your custom background'
      };
    }

    return BACKGROUND_PRESETS.find(bg => bg.id === selectedBackground) || BACKGROUND_PRESETS[0];
  };

  const currentBackground = getCurrentBackground();

  return (
    <div className="background-gallery">
      <div className="gallery-header">
        <h3 className="gallery-title">Background Gallery</h3>
        <p className="gallery-subtitle">Choose or upload a background for your profile</p>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-label">{category.label}</span>
          </button>
        ))}
      </div>

      {/* Current Selection Preview */}
      <div className="current-background-preview">
        <div className="preview-label">Current Selection:</div>
        <div className="preview-background">
          {currentBackground.thumbnail ? (
            <img
              src={currentBackground.thumbnail}
              alt={currentBackground.name}
              className={`background-thumb ${sizeClasses[size]}`}
            />
          ) : (
            <div className={`background-thumb-placeholder ${sizeClasses[size]}`}>
              <span>{currentBackground.name}</span>
            </div>
          )}
          <div className="background-info">
            <span className="background-name">{currentBackground.name}</span>
            <span className="background-preview-text">{currentBackground.preview}</span>
          </div>
        </div>
      </div>

      {/* Background Grid */}
      <div className="backgrounds-grid">
        {filteredBackgrounds.map((background) => (
          <div
            key={background.id}
            className={`background-option ${selectedBackground === background.id ? 'selected' : ''}`}
            onClick={() => handlePresetSelect(background)}
          >
            <div className="background-preview">
              {background.thumbnail ? (
                <img
                  src={background.thumbnail}
                  alt={background.name}
                  className={`background-thumb ${sizeClasses[size]}`}
                />
              ) : (
                <div className={`background-thumb-placeholder ${sizeClasses[size]}`}>
                  <span>{background.name}</span>
                </div>
              )}
            </div>
            <div className="background-details">
              <h4 className="background-option-name">{background.name}</h4>
              <p className="background-option-preview">{background.preview}</p>
              <div className="background-type">
                <span className={`type-badge ${background.type}`}>
                  {background.type.toUpperCase()}
                </span>
              </div>
            </div>
            {selectedBackground === background.id && (
              <div className="selected-indicator">✓</div>
            )}
          </div>
        ))}
      </div>

      {/* Custom Upload Section */}
      {showUpload && (
        <div className="custom-upload-section">
          <h4 className="upload-title">Upload Custom Background</h4>
          <div className="upload-controls">
            <input
              type="url"
              placeholder="Enter image or GIF URL..."
              value={customUrl}
              onChange={(e) => handleCustomUrlChange(e.target.value)}
              className="custom-url-input"
            />
            <div className="file-upload">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,image/gif"
                onChange={handleFileUpload}
                className="file-input"
                id="background-upload"
              />
              <label htmlFor="background-upload" className="file-upload-btn">
                {isUploading ? 'Uploading...' : 'Choose File'}
              </label>
            </div>
          </div>

          {customUrl && (
            <div className="custom-background-preview">
              <img
                src={customUrl}
                alt="Custom background preview"
                className={`custom-background-thumb ${sizeClasses[size]}`}
              />
              <button
                className="remove-custom-btn"
                onClick={() => {
                  setCustomUrl('');
                  onBackgroundSelect?.('none');
                }}
              >
                Remove
              </button>
            </div>
          )}

          <div className="upload-info">
            <p className="upload-limits">
              Supported formats: JPG, PNG, GIF • Max size: 5MB
            </p>
            <p className="upload-note">
              For best results, use high-quality images or animated GIFs
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
