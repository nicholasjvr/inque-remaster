'use client';

import { useEffect, useRef } from 'react';
import { Widget } from '@/hooks/useFirestore';

interface WidgetCardProps {
  slot: number;
  widget?: Widget;
  onFocus: () => void;
}

export default function WidgetCard({ slot, widget, onFocus }: WidgetCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (widget && iframeRef.current) {
      loadWidgetIntoIframe(widget, iframeRef.current);
    }
  }, [widget]);

  const loadWidgetIntoIframe = async (widget: Widget, iframeEl: HTMLIFrameElement) => {
    try {
      const files = widget.files || [];
      if (files.length === 0) {
        showError(iframeEl, "No files found in widget");
        return;
      }

      const fileMap: Record<string, string> = {};
      files.forEach((f) => {
        if (f?.fileName && f?.downloadURL) {
          fileMap[f.fileName] = f.downloadURL;
        }
      });

      const htmlFileName =
        Object.keys(fileMap).find((n) => /index\.html?$/i.test(n)) ||
        Object.keys(fileMap).find((n) => /\.html?$/i.test(n));

      if (!htmlFileName) {
        showError(iframeEl, "No HTML file found in widget");
        return;
      }

      // Check if the download URL is valid
      if (!fileMap[htmlFileName]) {
        showError(iframeEl, "Invalid file URL");
        return;
      }

      const res = await fetch(fileMap[htmlFileName]);
      
      if (!res.ok) {
        showError(iframeEl, `Failed to fetch HTML file: ${res.status} ${res.statusText}`);
        return;
      }

      const originalHtml = await res.text();

      const resolveMappedUrl = (path: string) => {
        if (!path) return null;
        const cleaned = path.replace(/^\.\//, "").replace(/^\//, "");
        return fileMap[cleaned] || fileMap[cleaned.split("/").pop() || ''] || null;
      };

      const processedHtml = originalHtml.replace(
        /(href|src)=["']([^"']+)["']/gi,
        (match, attr, value) => {
          const mapped = resolveMappedUrl(value);
          return mapped ? `${attr}="${mapped}"` : match;
        }
      );

      const blob = new Blob([processedHtml], { type: "text/html" });
      iframeEl.src = URL.createObjectURL(blob);
    } catch (error) {
      console.error("Failed to load widget into iframe", error);
      showError(iframeEl, `Error loading widget: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const showError = (iframeEl: HTMLIFrameElement, message: string) => {
    iframeEl.srcdoc = `
      <div style="padding:20px;text-align:center;color:#ff4444;background:rgba(255,68,68,0.1);border-radius:8px;font-family:Arial,sans-serif;">
        <h3>⚠️ Preview Unavailable</h3>
        <p>${message}</p>
        <small>Check console for more details</small>
      </div>
    `;
  };

  const handleInteract = () => {
    if (iframeRef.current) {
      iframeRef.current.focus();
      iframeRef.current.style.borderColor = '#ffff00';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.style.borderColor = '#00f0ff';
        }
      }, 2000);
    }
  };

  const handleEdit = () => {
    onFocus();
  };

  const handleUpload = () => {
    onFocus();
  };

  return (
    <div 
      className={`slot-card ${widget ? 'filled' : 'empty'}`}
      onClick={onFocus}
    >
      {widget ? (
        <>
          <div className="slot-preview">
            <iframe
              ref={iframeRef}
              className="widget-iframe"
              title={`Widget Preview - ${widget.title}`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-presentation"
            />
            <div className="slot-overlay">
              <span className="slot-badge">SLOT {slot}</span>
            </div>
          </div>
          <div className="slot-info">
            <h4>{widget.title}</h4>
            <p>{widget.description}</p>
            <div className="slot-actions">
              <button 
                className="slot-btn interact-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleInteract();
                }}
              >
                🎮 Interact
              </button>
              <button 
                className="slot-btn edit-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
              >
                ✏️ Edit
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="slot-preview empty">
            <div className="empty-icon">+</div>
            <div className="empty-text">Empty Slot {slot}</div>
          </div>
          <div className="slot-info">
            <h4>Slot {slot} Available</h4>
            <p>Upload a widget to fill this slot</p>
            <div className="slot-actions">
              <button 
                className="slot-btn upload-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
              >
                📦 Upload Widget
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
