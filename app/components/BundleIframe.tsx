'use client';

import { useEffect, useRef } from 'react';
import { WidgetBundle, Widget } from '@/hooks/useFirestore';
import { useStorage } from '@/hooks/useStorage';

type BundleIframeProps = {
  bundle: WidgetBundle | Widget;
  className?: string;
  title?: string;
  height?: number | string;
  sandbox?: string;
};

export default function BundleIframe({ bundle, className, title, height = 200, sandbox = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-presentation' }: BundleIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { resolveWidgetEntry, buildBundleFileMap, validateAndRefreshFileUrls } = useStorage();

  useEffect(() => {
    if (!bundle || !iframeRef.current) return;
    const iframe = iframeRef.current;

    const load = async (retryCount = 0) => {
      const MAX_RETRIES = 2;
      
      try {
        console.log(`[BundleIframe] Loading bundle ${bundle.id || 'unknown'} (attempt ${retryCount + 1})`);
        
        // Use unified entry resolution
        const entryResult = await resolveWidgetEntry(bundle);
        
        if (!entryResult) {
          console.error(`[BundleIframe] No entry point found for bundle ${bundle.id || 'unknown'}`);
          showError(iframe, 'No entry point found. Include index.html or set entry in manifest.json');
          return;
        }

        const { entry, downloadURL } = entryResult;
        console.log(`[BundleIframe] Resolved entry: ${entry}`);

        // Build file map for asset resolution
        let fileMap: Record<string, string> = {};
        
        if ('files' in bundle && Array.isArray(bundle.files)) {
          // Widget type - prefer storagePath if available
          if (bundle.storagePath) {
            try {
              console.log(`[BundleIframe] Building fileMap from storagePath: ${bundle.storagePath}`);
              fileMap = await buildBundleFileMap(bundle.storagePath);
            } catch (error) {
              console.warn(`[BundleIframe] Failed to build from storagePath, using files array:`, error);
              bundle.files.forEach((f) => {
                if (f?.fileName && f?.downloadURL) {
                  fileMap[f.fileName] = f.downloadURL;
                  const basename = f.fileName.split('/').pop();
                  if (basename) fileMap[basename] = f.downloadURL;
                }
              });
            }
          } else {
            // Build from files array
            bundle.files.forEach((f) => {
              if (f?.fileName && f?.downloadURL) {
                fileMap[f.fileName] = f.downloadURL;
                const basename = f.fileName.split('/').pop();
                if (basename) fileMap[basename] = f.downloadURL;
                const normalized = f.fileName.replace(/^\.\//, '').replace(/^\//, '');
                if (normalized !== f.fileName) fileMap[normalized] = f.downloadURL;
              }
            });
          }
        } else {
          // WidgetBundle type - build from storage path
          const basePath = (bundle as WidgetBundle).storagePath ||
            (bundle.uploadId ? `uploads/${bundle.uploadId}` : `uploads/${bundle.id}`);
          fileMap = await buildBundleFileMap(basePath);
        }

        // Validate and refresh entry URL if needed
        let entryUrl = downloadURL;
        const basePath = (bundle as any).storagePath || 
          ((bundle as any).uploadId ? `uploads/${(bundle as any).uploadId}` : 
           bundle.id ? `uploads/${bundle.id}` : null);
        
        if (basePath) {
          try {
            const refreshedMap = await validateAndRefreshFileUrls({ [entry]: downloadURL }, basePath);
            entryUrl = refreshedMap[entry] || downloadURL;
          } catch (error) {
            console.warn(`[BundleIframe] Failed to validate/refresh URL, using original:`, error);
          }
        }

        console.log(`[BundleIframe] Fetching entry file: ${entry} from URL: ${entryUrl}`);

        // Fetch HTML with retry logic
        let res: Response;
        try {
          res = await fetch(entryUrl, {
            mode: 'cors',
            cache: 'no-cache',
          });
        } catch (fetchError) {
          // If fetch fails and we have basePath, try regenerating URL
          if (basePath && retryCount < MAX_RETRIES) {
            console.log(`[BundleIframe] Fetch failed, retrying with fresh URL (attempt ${retryCount + 1})`);
            return load(retryCount + 1);
          }
          throw fetchError;
        }
        
        if (!res.ok) {
          // If 404/403 and we have basePath, try regenerating URL
          if ((res.status === 404 || res.status === 403) && basePath && retryCount < MAX_RETRIES) {
            console.log(`[BundleIframe] Got ${res.status}, retrying with fresh URL (attempt ${retryCount + 1})`);
            return load(retryCount + 1);
          }
          showError(iframe, `Failed to fetch HTML file: ${res.status} ${res.statusText}`);
          return;
        }

        const originalHtml = await res.text();

        const resolveMappedUrl = (path: string) => {
          if (!path) return null;
          // Ignore absolute URLs and data URIs
          if (/^(?:https?:)?\/\//i.test(path) || /^data:/i.test(path)) return null;
          
          const cleaned = path.replace(/^\.\//, '').replace(/^\//, '');
          return fileMap[cleaned] || fileMap[cleaned.split('/').pop() || ''] || null;
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

        const blob = new Blob([processedHtml], { type: 'text/html' });
        iframe.src = URL.createObjectURL(blob);
        console.log(`[BundleIframe] Successfully loaded bundle ${bundle.id || 'unknown'}`);
      } catch (err) {
        console.error(`[BundleIframe] Bundle iframe load error for ${bundle.id || 'unknown'}:`, err);
        
        // Retry on network errors
        if (retryCount < MAX_RETRIES && err instanceof Error && 
            (err.message.includes('Failed to fetch') || err.message.includes('Network'))) {
          console.log(`[BundleIframe] Retrying due to network error (attempt ${retryCount + 1})`);
          setTimeout(() => {
            load(retryCount + 1);
          }, 1000 * (retryCount + 1)); // Exponential backoff
          return;
        }
        
        let errorMessage = 'Unknown error while loading bundle';
        const availableFiles = 'files' in bundle && Array.isArray(bundle.files) 
          ? bundle.files.map(f => f.fileName).join(', ')
          : 'Unknown';

        if (err instanceof Error) {
          if (err.message.includes('Failed to fetch')) {
            errorMessage = `Network error: Unable to load bundle files. Check if files exist in storage and URLs are valid. Available files: ${availableFiles}`;
            console.error('[BundleIframe] Fetch failed. This may be a CORS issue or network connectivity problem.');
          } else if (err.message.includes('CORS')) {
            errorMessage = 'CORS error: Unable to fetch files. Check Firebase Storage CORS configuration.';
          } else {
            errorMessage = err.message;
          }
        }

        showError(iframe, errorMessage);
      }
    };

    load();
  }, [bundle?.id, bundle?.uploadId, 'storagePath' in bundle ? bundle.storagePath : null, 'files' in bundle ? bundle.files?.length : 0]);

  return (
    <iframe
      ref={iframeRef}
      className={className}
      title={title || `Widget Bundle Preview - ${bundle?.title || bundle?.id}`}
      style={{ width: '100%', height }}
      sandbox={sandbox}
    />
  );
}

function showError(iframe: HTMLIFrameElement, message: string) {
  iframe.srcdoc = `
    <div style="padding:20px;text-align:center;color:#ff4444;background:rgba(255,68,68,0.1);border-radius:8px;font-family:Arial,sans-serif;">
      <h3>⚠️ Preview Unavailable</h3>
      <p>${message}</p>
      <small>Check console for more details</small>
    </div>
  `;
}