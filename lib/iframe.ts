'use client';

import { storage } from '@/lib/firebase';
import { getDownloadURL, listAll, ref, StorageReference } from 'firebase/storage';

export type FileMapping = Record<string, string>;

const ERROR_HTML = (message: string) => `
  <div style="padding:20px;text-align:center;color:#ff4444;background:rgba(255,68,68,0.1);border-radius:8px;font-family:Arial,sans-serif;">
    <h3>⚠️ Preview Unavailable</h3>
    <p>${message}</p>
    <small>Check console for more details</small>
  </div>
`;

export function showIframeError(iframeEl: HTMLIFrameElement, message: string) {
  iframeEl.srcdoc = ERROR_HTML(message);
}

function normalizePath(path: string): string {
  return path
    .replace(/^\.\//, '')
    .replace(/^\//, '')
    .replace(/\\/g, '/')
    .replace(/\?.*$/, '');
}

function pickEntryFile(mapping: FileMapping): string | null {
  const lowerCaseKeys = Object.keys(mapping).reduce<Record<string, string>>((acc, key) => {
    acc[key.toLowerCase()] = mapping[key];
    return acc;
  }, {});

  // Prefer index.html
  const indexHtml = Object.keys(lowerCaseKeys).find((k) => /(^|\/)index\.html?$/.test(k));
  if (indexHtml) return indexHtml;

  // Fallback to any html
  const anyHtml = Object.keys(lowerCaseKeys).find((k) => /\.html?$/.test(k));
  if (anyHtml) return anyHtml;

  return null;
}

function rewriteHtmlWithMapping(html: string, mapping: FileMapping): string {
  const resolveMappedUrl = (value: string): string | null => {
    if (!value) return null;
    const cleaned = normalizePath(value);
    return mapping[cleaned] || mapping[cleaned.split('/').pop() || ''] || null;
  };

  return html.replace(/(href|src)=["']([^"']+)["']/gi, (match, attr, value) => {
    const mapped = resolveMappedUrl(value);
    return mapped ? `${attr}="${mapped}"` : match;
  });
}

export async function loadMappedHtmlIntoIframe(
  mapping: FileMapping,
  iframeEl: HTMLIFrameElement,
  opts?: { preferredEntry?: string }
): Promise<void> {
  try {
    const files = Object.keys(mapping);
    if (files.length === 0) {
      showIframeError(iframeEl, 'No files available to preview');
      return;
    }

    let entry = opts?.preferredEntry ? normalizePath(opts.preferredEntry) : null;
    if (!entry) {
      entry = pickEntryFile(mapping);
    }

    if (!entry) {
      showIframeError(
        iframeEl,
        'No entry point found. Please include index.html or specify entry in manifest.json'
      );
      return;
    }

    const entryUrl = mapping[entry];
    if (!entryUrl) {
      showIframeError(iframeEl, 'Invalid entry file URL');
      return;
    }

    const res = await fetch(entryUrl);
    if (!res.ok) {
      showIframeError(iframeEl, `Failed to fetch entry HTML: ${res.status} ${res.statusText}`);
      return;
    }

    const originalHtml = await res.text();
    const processedHtml = rewriteHtmlWithMapping(originalHtml, mapping);
    const blob = new Blob([processedHtml], { type: 'text/html' });
    iframeEl.src = URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to load mapping into iframe', error);
    showIframeError(
      iframeEl,
      `Error loading preview: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function loadWidgetFilesIntoIframe(
  files: Array<{ fileName: string; downloadURL: string }>,
  iframeEl: HTMLIFrameElement
): Promise<void> {
  const mapping: FileMapping = {};
  for (const f of files) {
    if (f?.fileName && f?.downloadURL) {
      mapping[normalizePath(f.fileName)] = f.downloadURL;
    }
  }
  return loadMappedHtmlIntoIframe(mapping, iframeEl);
}

async function listAllRecursive(baseRef: StorageReference): Promise<StorageReference[]> {
  const out: StorageReference[] = [];
  const walk = async (dirRef: StorageReference): Promise<void> => {
    const result = await listAll(dirRef);
    out.push(...result.items);
    for (const prefix of result.prefixes) {
      await walk(prefix);
    }
  };
  await walk(baseRef);
  return out;
}

export async function loadBundleIntoIframe(
  bundleId: string,
  iframeEl: HTMLIFrameElement,
  options?: { basePaths?: string[] }
): Promise<void> {
  try {
    const basePaths = options?.basePaths || ['widgetBundles', 'bundles'];
    let foundItems: StorageReference[] = [];
    let basePathUsed: string | null = null;

    for (const basePath of basePaths) {
      try {
        const dirRef = ref(storage, `${basePath}/${bundleId}`);
        const items = await listAllRecursive(dirRef);
        if (items.length > 0) {
          foundItems = items;
          basePathUsed = basePath;
          break;
        }
      } catch (e) {
        // Try next basePath
        continue;
      }
    }

    if (!basePathUsed || foundItems.length === 0) {
      showIframeError(iframeEl, 'No files found for this bundle in Storage');
      return;
    }

    const mapping: FileMapping = {};
    for (const item of foundItems) {
      const url = await getDownloadURL(item);
      const fullPath = item.fullPath; // e.g., widgetBundles/bundle_123/sub/dir/file.js
      const relative = fullPath.replace(new RegExp(`^${basePathUsed}/${bundleId}/`), '');
      mapping[normalizePath(relative)] = url;
    }

    await loadMappedHtmlIntoIframe(mapping, iframeEl);
  } catch (error) {
    console.error('Failed to load bundle into iframe', error);
    showIframeError(
      iframeEl,
      `Error loading bundle: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
