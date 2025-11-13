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

// Track loading state per bundle to prevent duplicate loads
const loadingBundles = new Map<string, boolean>();

export default function BundleIframe({ bundle, className, title, height = 200, sandbox = 'allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-presentation' }: BundleIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { resolveWidgetEntry, buildBundleFileMap, getFileURL } = useStorage();

  useEffect(() => {
    if (!bundle || !iframeRef.current) return;
    const iframe = iframeRef.current;
    const bundleId = bundle.id || 'unknown';

    // Prevent duplicate loads
    if (loadingBundles.get(bundleId)) {
      console.log(`[BundleIframe] Bundle ${bundleId} is already loading, skipping duplicate load`);
      return;
    }

    const load = async (retryCount = 0) => {
      const MAX_RETRIES = 2;

      // Mark as loading only on first attempt
      if (retryCount === 0) {
        loadingBundles.set(bundleId, true);
      }

      try {
        console.log(`[BundleIframe] Loading bundle ${bundleId} (attempt ${retryCount + 1})`);

        // On retry, force rebuild from storage if available to get fresh URLs
        let entryResult;
        if (retryCount > 0) {
          const basePath = (bundle as any).storagePath ||
            ((bundle as any).uploadId ? `uploads/${(bundle as any).uploadId}` :
              bundle.id ? `uploads/${bundle.id}` : null);
          if (basePath) {
            console.log(`[BundleIframe] Retry: Rebuilding from storage for fresh URLs`);
            const freshFileMap = await buildBundleFileMap(basePath);
            entryResult = await resolveWidgetEntry(bundle, freshFileMap);
          } else {
            entryResult = await resolveWidgetEntry(bundle);
          }
        } else {
          // First attempt - use normal resolution
          entryResult = await resolveWidgetEntry(bundle);
        }

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

        // Use the downloadURL directly - if it fails, retry logic will regenerate it
        let entryUrl = downloadURL;

        console.log(`[BundleIframe] Fetching entry file: ${entry} from URL: ${entryUrl}`);

        // Fetch HTML with retry logic
        const basePath = (bundle as any).storagePath ||
          ((bundle as any).uploadId ? `uploads/${(bundle as any).uploadId}` :
            bundle.id ? `uploads/${bundle.id}` : null);

        let res: Response;
        try {
          res = await fetch(entryUrl, {
            mode: 'cors',
            cache: 'no-cache',
          });
        } catch (fetchError) {
          // If fetch fails and we have basePath, retry with fresh URLs
          if (basePath && retryCount < MAX_RETRIES) {
            console.log(`[BundleIframe] Fetch failed, retrying with fresh URLs (attempt ${retryCount + 1})`);
            // Retry will rebuild from storage
            setTimeout(() => {
              load(retryCount + 1);
            }, 500 * (retryCount + 1)); // Short delay before retry
            return;
          }
          throw fetchError;
        }

        if (!res.ok) {
          // If 404/403 and we have basePath, retry with fresh URLs
          if ((res.status === 404 || res.status === 403) && basePath && retryCount < MAX_RETRIES) {
            console.log(`[BundleIframe] Got ${res.status}, retrying with fresh URLs (attempt ${retryCount + 1})`);
            // Retry will rebuild from storage
            setTimeout(() => {
              load(retryCount + 1);
            }, 500 * (retryCount + 1)); // Short delay before retry
            return;
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
        console.log(`[BundleIframe] Successfully loaded bundle ${bundleId}`);
        loadingBundles.delete(bundleId);
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
          const errMsg = err.message.toLowerCase();
          if (errMsg.includes('failed to fetch') || errMsg.includes('networkerror')) {
            // Check if this might be a CORS issue
            if (retryCount >= MAX_RETRIES) {
              errorMessage = `Network error: Unable to load bundle files after ${MAX_RETRIES + 1} attempts. This may be a CORS configuration issue with Firebase Storage. Check Firebase Console > Storage > Settings > CORS configuration. Available files: ${availableFiles}`;
            } else {
              errorMessage = `Network error: Unable to load bundle files. Retrying... Available files: ${availableFiles}`;
            }
            console.error('[BundleIframe] Fetch failed. This may be a CORS issue or network connectivity problem.');
          } else if (errMsg.includes('cors')) {
            errorMessage = 'CORS error: Unable to fetch files. Check Firebase Storage CORS configuration in Firebase Console.';
          } else {
            errorMessage = err.message;
          }
        }

        // Only show error if we've exhausted retries
        if (retryCount >= MAX_RETRIES) {
          showError(iframe, errorMessage);
          loadingBundles.delete(bundleId);
        }
      }
    };

    load();

    // Cleanup on unmount
    return () => {
      loadingBundles.delete(bundleId);
    };
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