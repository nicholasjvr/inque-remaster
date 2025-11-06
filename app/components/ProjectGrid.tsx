'use client';

import { useState } from 'react';
import { Widget } from '@/hooks/useFirestore';
import BundleIframe from './BundleIframe';

interface ProjectGridProps {
  widgets: Widget[];
  loading: boolean;
  onSelectWidget: (widget: Widget) => void;
}

export default function ProjectGrid({ widgets, loading, onSelectWidget }: ProjectGridProps) {
  const [hoveredWidget, setHoveredWidget] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="projects-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your projects...</p>
        </div>
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="projects-empty">
        <div className="empty-icon">📁</div>
        <h2>No Projects Yet</h2>
        <p>Start creating by uploading your first widget in the Widget Studio.</p>
        <a href="/studio" className="create-project-btn">
          <span>🎨</span>
          Go to Widget Studio
        </a>
      </div>
    );
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Unknown';
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
      html: '🌐',
      css: '🎨',
      js: '⚡',
      json: '📋',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️',
      gif: '🖼️',
      svg: '🖼️',
      webp: '🖼️',
    };
    return icons[ext || ''] || '📄';
  };

  return (
    <div className="projects-grid-container">
      <div className="projects-header-info">
        <h2>Your Projects ({widgets.length})</h2>
        <p>Click on any project to manage files, set entry point, and configure settings</p>
      </div>

      <div className="projects-grid">
        {widgets.map((widget) => (
          <div
            key={widget.id}
            className={`project-card ${hoveredWidget === widget.id ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredWidget(widget.id)}
            onMouseLeave={() => setHoveredWidget(null)}
            onClick={() => onSelectWidget(widget)}
          >
            <div className="project-card-preview">
              {widget.thumbnailUrl ? (
                <img 
                  src={widget.thumbnailUrl} 
                  alt={widget.title}
                  className="project-thumbnail"
                />
              ) : (
                <div className="project-preview-iframe">
                  <BundleIframe 
                    bundle={widget}
                    height={200}
                    className="preview-iframe"
                  />
                </div>
              )}
              <div className="project-card-overlay">
                <span className="project-slot-badge">Slot {widget.slot}</span>
              </div>
            </div>

            <div className="project-card-content">
              <h3 className="project-title">{widget.title}</h3>
              <p className="project-description">{widget.description}</p>
              
              <div className="project-meta">
                <div className="project-files-count">
                  <span className="meta-icon">📄</span>
                  <span>{widget.files?.length || 0} files</span>
                </div>
                <div className="project-updated">
                  <span className="meta-icon">🕒</span>
                  <span>{formatDate(widget.updatedAt)}</span>
                </div>
              </div>

              {widget.tags && widget.tags.length > 0 && (
                <div className="project-tags">
                  {widget.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="project-tag">{tag}</span>
                  ))}
                  {widget.tags.length > 3 && (
                    <span className="project-tag-more">+{widget.tags.length - 3}</span>
                  )}
                </div>
              )}

              <div className="project-card-actions">
                <button 
                  className="project-action-btn edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectWidget(widget);
                  }}
                >
                  <span>✏️</span>
                  Manage
                </button>
                <button 
                  className="project-action-btn preview-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Open preview in new tab or modal
                    const entry = widget.entry || widget.files?.find(f => /\.html?$/i.test(f.fileName))?.fileName;
                    if (entry) {
                      const file = widget.files?.find(f => f.fileName === entry);
                      if (file) window.open(file.downloadURL, '_blank');
                    }
                  }}
                >
                  <span>👁️</span>
                  Preview
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

