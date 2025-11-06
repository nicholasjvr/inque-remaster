'use client';

import { useState } from 'react';
import { Widget } from '@/hooks/useFirestore';
import { useWidgets } from '@/hooks/useFirestore';

interface EntryPointSelectorProps {
  widget: Widget;
}

export default function EntryPointSelector({ widget }: EntryPointSelectorProps) {
  const [showSelector, setShowSelector] = useState(false);
  const { updateWidget } = useWidgets(widget.userId);

  const htmlFiles = widget.files?.filter((f) => /\.html?$/i.test(f.fileName)) || [];
  const currentEntry = widget.entry || htmlFiles.find((f) => /index\.html?$/i.test(f.fileName))?.fileName || htmlFiles[0]?.fileName;

  const handleSelectEntry = async (fileName: string) => {
    try {
      await updateWidget(widget.id, { entry: fileName });
      setShowSelector(false);
    } catch (error) {
      console.error('Error updating entry point:', error);
      alert(`Failed to update entry point: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (htmlFiles.length === 0) {
    return (
      <div className="entry-point-selector">
        <button className="entry-selector-btn disabled" disabled>
          <span>⚠️</span>
          No HTML Files
        </button>
      </div>
    );
  }

  return (
    <div className="entry-point-selector">
      <button
        className="entry-selector-btn"
        onClick={() => setShowSelector(!showSelector)}
      >
        <span>🎯</span>
        Entry: {currentEntry?.split('/').pop() || 'Not Set'}
      </button>

      {showSelector && (
        <div className="entry-selector-dropdown">
          <div className="dropdown-header">
            <h4>Select Entry Point</h4>
            <button
              className="close-dropdown-btn"
              onClick={() => setShowSelector(false)}
            >
              ✕
            </button>
          </div>
          <div className="dropdown-content">
            {htmlFiles.map((file) => {
              const isSelected = file.fileName === currentEntry;
              return (
                <div
                  key={file.fileName}
                  className={`entry-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectEntry(file.fileName)}
                >
                  <span className="entry-icon">🌐</span>
                  <span className="entry-name">{file.fileName}</span>
                  {isSelected && <span className="entry-check">✓</span>}
                </div>
              );
            })}
          </div>
          <div className="dropdown-footer">
            <p className="entry-hint">
              The entry point is the HTML file that will be loaded when the widget is previewed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

