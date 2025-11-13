'use client';

import { useEffect, useRef } from 'react';
import { Widget } from '@/hooks/useFirestore';
import { useStorage } from '@/hooks/useStorage';

interface WidgetCardProps {
  slot: number;
  widget?: Widget;
  onFocus: () => void;
}

export default function WidgetCard({ slot, widget, onFocus }: WidgetCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { resolveWidgetEntry, buildBundleFileMap, validateAndRefreshFileUrls } = useStorage();

  useEffect(() => {
    if (widget && iframeRef.current) {
      loadWidgetIntoIframe(widget, iframeRef.current);
    }
  }, [widget]);

  const loadWidgetIntoIframe = async (widget: Widget, iframeEl: HTMLIFrameElement, retryCount = 0) => {
    const MAX_RETRIES = 2;
    
    try {
      console.log(`[WidgetCard] Loading widget ${widget.id} into iframe (attempt ${retryCount + 1})`);
      
      const files = widget.files || [];
      if (files.length === 0) {
        showError(iframeEl, "No files found in widget");
        return;
      }

      // Build file map - prefer storagePath if available for fresh URLs
      let fileMap: Record<string, string> = {};
      
      if (widget.storagePath) {
        try {
          console.log(`[WidgetCard] Building fileMap from storagePath: ${widget.storagePath}`);
          fileMap = await buildBundleFileMap(widget.storagePath);
        } catch (error) {
          console.warn(`[WidgetCard] Failed to build from storagePath, falling back to files array:`, error);
          // Fallback to files array
          files.forEach((f) => {
            if (f?.fileName && f?.downloadURL) {
              fileMap[f.fileName] = f.downloadURL;
              const basename = f.fileName.split('/').pop();
              if (basename) fileMap[basename] = f.downloadURL;
            }
          });
        }
      } else {
        // Build from files array
        files.forEach((f) => {
          if (f?.fileName && f?.downloadURL) {
            fileMap[f.fileName] = f.downloadURL;
            const basename = f.fileName.split('/').pop();
            if (basename) fileMap[basename] = f.downloadURL;
            // Also add normalized version
            const normalized = f.fileName.replace(/^\.\//, '').replace(/^\//, '');
            if (normalized !== f.fileName) fileMap[normalized] = f.downloadURL;
          }
        });
      }

      // Use unified entry resolution
      const entryResult = await resolveWidgetEntry(widget, fileMap);
      
      if (!entryResult) {
        console.error(`[WidgetCard] No entry point found for widget ${widget.id}`);
        showError(iframeEl, "No entry point found. Include index.html or set entry in widget settings.");
        return;
      }

      const { entry, downloadURL } = entryResult;
      console.log(`[WidgetCard] Resolved entry: ${entry}`);

      // Validate and refresh URL if needed
      let entryUrl = downloadURL;
      if (widget.storagePath) {
        try {
          const refreshedMap = await validateAndRefreshFileUrls({ [entry]: downloadURL }, widget.storagePath);
          entryUrl = refreshedMap[entry] || downloadURL;
        } catch (error) {
          console.warn(`[WidgetCard] Failed to validate/refresh URL, using original:`, error);
        }
      }

      // Fetch HTML with retry logic
      let res: Response;
      try {
        res = await fetch(entryUrl, {
          mode: 'cors',
          cache: 'no-cache',
        });
      } catch (fetchError) {
        // If fetch fails and we have storagePath, try regenerating URL
        if (widget.storagePath && retryCount < MAX_RETRIES) {
          console.log(`[WidgetCard] Fetch failed, retrying with fresh URL (attempt ${retryCount + 1})`);
          return loadWidgetIntoIframe(widget, iframeEl, retryCount + 1);
        }
        throw fetchError;
      }
      
      if (!res.ok) {
        // If 404/403 and we have storagePath, try regenerating URL
        if ((res.status === 404 || res.status === 403) && widget.storagePath && retryCount < MAX_RETRIES) {
          console.log(`[WidgetCard] Got ${res.status}, retrying with fresh URL (attempt ${retryCount + 1})`);
          return loadWidgetIntoIframe(widget, iframeEl, retryCount + 1);
        }
        showError(iframeEl, `Failed to fetch HTML file: ${res.status} ${res.statusText}`);
        return;
      }

      const originalHtml = await res.text();

      const resolveMappedUrl = (path: string) => {
        if (!path) return null;
        // Ignore absolute URLs and data URIs
        if (/^(?:https?:)?\/\//i.test(path) || /^data:/i.test(path)) return null;
        
        const cleaned = path.replace(/^\.\//, "").replace(/^\//, "");
        return fileMap[cleaned] || fileMap[cleaned.split("/").pop() || ''] || null;
      };

      const processedHtml = originalHtml.replace(
        /(href|src)=["']([^"']+)["']/gi,
        (match, attr, value) => {
          // Ignore absolute http(s) or data URIs
          if (/^(?:https?:)?\/\//i.test(value) || /^data:/i.test(value)) return match;
          const mapped = resolveMappedUrl(value);
          return mapped ? `${attr}="${mapped}"` : match;
        }
      );

      const blob = new Blob([processedHtml], { type: "text/html" });
      iframeEl.src = URL.createObjectURL(blob);
      console.log(`[WidgetCard] Successfully loaded widget ${widget.id}`);
    } catch (error) {
      console.error(`[WidgetCard] Failed to load widget ${widget.id} into iframe:`, error);
      
      // Retry on network errors
      if (retryCount < MAX_RETRIES && error instanceof Error && 
          (error.message.includes('Failed to fetch') || error.message.includes('Network'))) {
        console.log(`[WidgetCard] Retrying due to network error (attempt ${retryCount + 1})`);
        setTimeout(() => {
          loadWidgetIntoIframe(widget, iframeEl, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      let errorMessage = 'Unknown error while loading widget';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error: Unable to load widget files. Check if files exist in storage and URLs are valid.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'CORS error: Unable to fetch files. Check Firebase Storage CORS configuration.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showError(iframeEl, errorMessage);
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
