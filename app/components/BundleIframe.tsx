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
  const { buildBundleFileMap, findHtmlEntry } = useStorage();

  useEffect(() => {
    if (!bundle || !iframeRef.current) return;
    const iframe = iframeRef.current;

    const load = async () => {
      try {
        let fileMap: Record<string, string> = {};

        // Check if this is a Widget with files array or a WidgetBundle with storagePath
        if ('files' in bundle && Array.isArray(bundle.files)) {
          // Widget type - build file map from files array
          bundle.files.forEach((f) => {
            if (f?.fileName && f?.downloadURL) {
              fileMap[f.fileName] = f.downloadURL;
              // Also map just the filename without path
              const basename = f.fileName.split('/').pop();
              if (basename) fileMap[basename] = f.downloadURL;
            }
          });
        } else {
          // WidgetBundle type - build file map from storage path
          const basePath = (bundle as WidgetBundle).storagePath ||
            (bundle.uploadId ? `uploads/${bundle.uploadId}` : `uploads/${bundle.id}`);
          fileMap = await buildBundleFileMap(basePath);
        }

        // Prefer explicit entry on the document if provided
        const explicitEntry = (bundle as any)?.entry as string | undefined;
        let entry: string | null = null;
        if (explicitEntry) {
          const norm = explicitEntry.replace(/^\.\//, '').replace(/^\//, '');
          entry = fileMap[norm] ? norm : null;
        }
        if (!entry) {
          entry = findHtmlEntry(fileMap);
        }

        // Fallback: read manifest.json for custom entry
        if (!entry && fileMap['manifest.json']) {
          try {
            const res = await fetch(fileMap['manifest.json']);
            if (res.ok) {
              const manifest = await res.json();
              const candidate: string | undefined = manifest.entry || manifest.index || manifest.main;
              const norm = candidate ? candidate.replace(/^\.\//, '').replace(/^\//, '') : '';
              if (norm && fileMap[norm]) entry = norm;
            }
          } catch (err) {
            console.warn('Failed to fetch manifest.json:', err);
            // Continue without manifest - will show error below if no entry found
          }
        }

        if (!entry) {
          console.warn('Bundle files available:', Object.keys(fileMap));
          showError(iframe, 'No entry point found. Include index.html or set entry in manifest.json');
          return;
        }

        const res = await fetch(fileMap[entry]);
        if (!res.ok) {
          showError(iframe, `Failed to fetch HTML file: ${res.status} ${res.statusText}`);
          return;
        }

        const originalHtml = await res.text();

        const resolveMappedUrl = (path: string) => {
          if (!path) return null;
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
      } catch (err) {
        console.error('Bundle iframe load error:', err);
        const errorMessage = err instanceof Error
          ? (err.message.includes('Failed to fetch')
            ? 'Network error: Unable to load bundle files. Check if files exist in storage and URLs are valid.'
            : err.message)
          : 'Unknown error while loading bundle';
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