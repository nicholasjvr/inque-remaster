'use client';

import { useState } from 'react';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  UploadResult,
  StorageReference
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}

export function useStorage() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  const uploadFile = async (
    file: File, 
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> => {
    if (!storage) {
      throw new Error('Firebase Storage is not initialized. Check NEXT_PUBLIC_FIREBASE_* env vars and lib/firebase.ts');
    }
    try {
      setUploading(true);
      setUploadProgress(null);

      const storageRef = ref(storage, path);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUploading(false);
      setUploadProgress(null);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploading(false);
      setUploadProgress(null);
      throw error;
    }
  };

  // Convenience wrapper to upload into the public/ prefix so files are readable by guests
  const uploadToPublic = async (file: File, relativePath: string, onProgress?: (progress: UploadProgress) => void) => {
    const base = `public/${relativePath.replace(/^\/+/, '')}`;
    return uploadFile(file, base, onProgress);
  };

  const uploadMultipleFiles = async (
    files: File[],
    basePath: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Array<{ fileName: string; downloadURL: string; size: number; type: string }>> => {
    try {
      setUploading(true);
      setUploadProgress(null);

      const uploadPromises = files.map(async (file) => {
        const fileName = file.name;
        const filePath = `${basePath}/${fileName}`;
        
        const downloadURL = await uploadFile(file, filePath, onProgress);
        
        return {
          fileName,
          downloadURL,
          size: file.size,
          type: file.type,
        };
      });

      const results = await Promise.all(uploadPromises);
      
      setUploading(false);
      setUploadProgress(null);
      
      return results;
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      setUploading(false);
      setUploadProgress(null);
      throw error;
    }
  };

  const deleteFile = async (path: string): Promise<void> => {
    try {
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };

  const listFiles = async (path: string): Promise<StorageReference[]> => {
    try {
      const listRef = ref(storage, path);
      const result = await listAll(listRef);
      return result.items;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  };

  // Recursively list all files under a path. Useful for bundle directories
  const listAllFilesRecursive = async (basePath: string): Promise<StorageReference[]> => {
    const items: StorageReference[] = [];
    const walk = async (path: string) => {
      const listRef = ref(storage, path);
      const result = await listAll(listRef);
      items.push(...result.items);
      // Recurse into prefixes (subfolders)
      await Promise.all(result.prefixes.map((p) => walk(p.fullPath)));
    };
    await walk(basePath);
    return items;
  };

  // Build a file map for a bundle folder: fileName -> downloadURL
  const buildBundleFileMap = async (bundleBasePath: string): Promise<Record<string, string>> => {
    try {
      console.log(`[buildBundleFileMap] Building file map for path: ${bundleBasePath}`);
      const allRefs = await listAllFilesRecursive(bundleBasePath);
      console.log(`[buildBundleFileMap] Found ${allRefs.length} files`);
      
      const entries = await Promise.all(
        allRefs.map(async (r) => {
          try {
            const url = await getDownloadURL(r);
            // Normalize key to be relative to base
            const key = r.fullPath.replace(new RegExp(`^${bundleBasePath.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}/?`), '');
            return [key, url] as const;
          } catch (error) {
            console.error(`[buildBundleFileMap] Failed to get URL for ${r.fullPath}:`, error);
            throw error;
          }
        })
      );
      
      // Prefer flat keys ("index.html") alongside nested ("public/index.html")
      const map: Record<string, string> = {};
      for (const [key, url] of entries) {
        map[key] = url;
        const flat = key.split('/').pop();
        if (flat) map[flat] = url;
        // Also add normalized version without leading ./
        const normalized = key.replace(/^\.\//, '').replace(/^\//, '');
        if (normalized !== key) map[normalized] = url;
      }
      
      console.log(`[buildBundleFileMap] Built file map with ${Object.keys(map).length} entries`);
      return map;
    } catch (error) {
      console.error(`[buildBundleFileMap] Error building file map for ${bundleBasePath}:`, error);
      throw error;
    }
  };

  // Find an entry HTML file from the file map
  const findHtmlEntry = (fileMap: Record<string, string>): string | null => {
    const keys = Object.keys(fileMap);
    if (keys.length === 0) return null;
    
    // Normalize all keys for better matching
    const normalizedMap: Record<string, string> = {};
    keys.forEach(key => {
      const normalized = key.replace(/^\.\//, '').replace(/^\//, '').toLowerCase();
      normalizedMap[normalized] = key; // Map normalized -> original key
    });
    
    // Common candidates ordered by priority (check normalized versions)
    const candidates = [
      'index.html',
      'index.htm',
      'public/index.html',
      'public/index.htm',
      'dist/index.html',
      'dist/index.htm',
      'build/index.html',
      'build/index.htm',
      'src/index.html',
      'src/index.htm',
    ];
    
    // Try exact matches first
    for (const candidate of candidates) {
      if (normalizedMap[candidate]) {
        return normalizedMap[candidate]; // Return original key
      }
    }
    
    // Fallback: find any file matching index.html pattern
    const indexMatch = keys.find((k) => {
      const normalized = k.replace(/^\.\//, '').replace(/^\//, '').toLowerCase();
      return /(^|\/)(index|main|app)\.html?$/i.test(normalized);
    });
    if (indexMatch) return indexMatch;
    
    // Last resort: find any HTML file
    const htmlMatch = keys.find((k) => {
      const normalized = k.replace(/^\.\//, '').replace(/^\//, '').toLowerCase();
      return normalized.endsWith('.html') || normalized.endsWith('.htm');
    });
    return htmlMatch || null;
  };

  const getFileURL = async (path: string): Promise<string> => {
    try {
      const fileRef = ref(storage, path);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Error getting file URL:', error);
      throw error;
    }
  };

  // Validate and refresh file URLs if they're expired
  // Note: We can't actually validate URLs with CORS restrictions, so this function
  // will regenerate URLs from storage if basePath is provided, otherwise return original map
  const validateAndRefreshFileUrls = async (
    fileMap: Record<string, string>,
    basePath?: string
  ): Promise<Record<string, string>> => {
    // If no basePath, can't refresh - return original map
    if (!basePath) {
      return fileMap;
    }

    // Only refresh URLs if we have storage path - don't try to validate with fetch
    // as CORS restrictions prevent us from checking response status
    const refreshedMap: Record<string, string> = {};
    
    // Regenerate URLs from storage for fresh tokens (but don't validate first)
    const refreshPromises = Object.entries(fileMap).map(async ([key, url]) => {
      try {
        const filePath = `${basePath}/${key}`;
        const newUrl = await getFileURL(filePath);
        refreshedMap[key] = newUrl;
        console.log(`[validateAndRefreshFileUrls] Refreshed URL for ${key}`);
      } catch (refreshError) {
        console.warn(`[validateAndRefreshFileUrls] Could not refresh URL for ${key}, keeping original:`, refreshError);
        // Keep original URL as fallback
        refreshedMap[key] = url;
      }
    });
    
    await Promise.all(refreshPromises);
    return refreshedMap;
  };

  // Resolve widget entry point - unified function for both Widget and WidgetBundle
  const resolveWidgetEntry = async (
    bundle: { files?: Array<{ fileName: string; downloadURL: string }>; storagePath?: string; uploadId?: string; id?: string; entry?: string },
    fileMap?: Record<string, string>
  ): Promise<{ entry: string; downloadURL: string } | null> => {
    try {
      console.log('[resolveWidgetEntry] Resolving entry for bundle:', bundle.id || 'unknown');
      
      let map: Record<string, string> = {};
      
      // Build file map if not provided
      if (!fileMap) {
        if ('files' in bundle && Array.isArray(bundle.files) && bundle.files.length > 0) {
          // Widget type - build from files array
          console.log('[resolveWidgetEntry] Building fileMap from files array');
          bundle.files.forEach((f) => {
            if (f?.fileName && f?.downloadURL) {
              map[f.fileName] = f.downloadURL;
              const basename = f.fileName.split('/').pop();
              if (basename) map[basename] = f.downloadURL;
              // Also add normalized version
              const normalized = f.fileName.replace(/^\.\//, '').replace(/^\//, '');
              if (normalized !== f.fileName) map[normalized] = f.downloadURL;
            }
          });
          
          // If widget has storagePath, prefer building from storage for fresh URLs
          if (bundle.storagePath) {
            try {
              console.log('[resolveWidgetEntry] Widget has storagePath, building from storage');
              const storageMap = await buildBundleFileMap(bundle.storagePath);
              // Merge storage map (preferred) with files array map
              map = { ...map, ...storageMap };
            } catch (error) {
              console.warn('[resolveWidgetEntry] Failed to build from storagePath, using files array:', error);
            }
          }
        } else {
          // WidgetBundle type - build from storage path
          const basePath = bundle.storagePath || 
            (bundle.uploadId ? `uploads/${bundle.uploadId}` : bundle.id ? `uploads/${bundle.id}` : null);
          
          if (!basePath) {
            console.error('[resolveWidgetEntry] No storage path available');
            return null;
          }
          
          console.log('[resolveWidgetEntry] Building fileMap from storage path:', basePath);
          map = await buildBundleFileMap(basePath);
        }
      } else {
        map = fileMap;
      }
      
      // Check explicit entry field first
      const explicitEntry = bundle.entry;
      if (explicitEntry) {
        const normalized = explicitEntry.replace(/^\.\//, '').replace(/^\//, '');
        if (map[normalized]) {
          console.log('[resolveWidgetEntry] Using explicit entry:', normalized);
          return { entry: normalized, downloadURL: map[normalized] };
        }
        // Try original entry path
        if (map[explicitEntry]) {
          console.log('[resolveWidgetEntry] Using explicit entry (original):', explicitEntry);
          return { entry: explicitEntry, downloadURL: map[explicitEntry] };
        }
        console.warn('[resolveWidgetEntry] Explicit entry not found in fileMap:', explicitEntry);
      }
      
      // Fallback: read manifest.json for custom entry
      if (map['manifest.json']) {
        try {
          console.log('[resolveWidgetEntry] Checking manifest.json');
          const res = await fetch(map['manifest.json'], {
            mode: 'cors',
            cache: 'no-cache',
          });
          if (res.ok) {
            const manifest = await res.json();
            const candidate: string | undefined = manifest.entry || manifest.index || manifest.main;
            if (candidate) {
              const norm = candidate.replace(/^\.\//, '').replace(/^\//, '');
              if (map[norm]) {
                console.log('[resolveWidgetEntry] Using manifest entry:', norm);
                return { entry: norm, downloadURL: map[norm] };
              }
            }
          }
        } catch (err) {
          console.warn('[resolveWidgetEntry] Failed to fetch manifest.json:', err);
        }
      }
      
      // Use findHtmlEntry utility
      const foundEntry = findHtmlEntry(map);
      if (foundEntry && map[foundEntry]) {
        console.log('[resolveWidgetEntry] Using found HTML entry:', foundEntry);
        return { entry: foundEntry, downloadURL: map[foundEntry] };
      }
      
      console.warn('[resolveWidgetEntry] No entry point found. Available files:', Object.keys(map));
      return null;
    } catch (error) {
      console.error('[resolveWidgetEntry] Error resolving entry:', error);
      return null;
    }
  };

  // Rename a file by copying to new path and deleting old one
  const renameFile = async (oldPath: string, newPath: string): Promise<string> => {
    if (!storage) {
      throw new Error('Firebase Storage is not initialized');
    }
    try {
      // Download the file
      const oldRef = ref(storage, oldPath);
      const downloadURL = await getDownloadURL(oldRef);
      const response = await fetch(downloadURL);
      const blob = await response.blob();
      
      // Upload to new path
      const newRef = ref(storage, newPath);
      await uploadBytes(newRef, blob);
      
      // Delete old file
      await deleteObject(oldRef);
      
      // Return new download URL
      return await getDownloadURL(newRef);
    } catch (error) {
      console.error('Error renaming file:', error);
      throw error;
    }
  };

  // Move a file (same as rename but with different semantics)
  const moveFile = async (sourcePath: string, destPath: string): Promise<string> => {
    return renameFile(sourcePath, destPath);
  };

  // Add a file to a widget's storage path
  const addFileToWidget = async (
    widgetStoragePath: string,
    file: File,
    relativePath?: string
  ): Promise<{ fileName: string; downloadURL: string; size: number; type: string }> => {
    const fileName = relativePath || file.name;
    const filePath = `${widgetStoragePath}/${fileName}`;
    const downloadURL = await uploadFile(file, filePath);
    
    return {
      fileName,
      downloadURL,
      size: file.size,
      type: file.type,
    };
  };

  // Remove a file from storage
  const removeFileFromWidget = async (filePath: string): Promise<void> => {
    return deleteFile(filePath);
  };

  // Generate thumbnail from iframe (client-side screenshot)
  const generateThumbnail = async (
    iframe: HTMLIFrameElement,
    width: number = 400,
    height: number = 300
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Use html2canvas or similar library for screenshot
        // For now, we'll use a canvas-based approach
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        // Try to capture iframe content
        // Note: This may fail due to CORS restrictions
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        // Alternative: use html2canvas library if available
        if (typeof window !== 'undefined' && (window as any).html2canvas) {
          (window as any).html2canvas(iframe.contentDocument?.body || iframe, {
            width,
            height,
            useCORS: true,
          }).then((canvas: HTMLCanvasElement) => {
            canvas.toBlob((blob) => {
              if (blob) {
                const file = new File([blob], 'thumbnail.png', { type: 'image/png' });
                // Upload thumbnail and return URL
                // This would need to be called with a storage path
                resolve(URL.createObjectURL(blob));
              } else {
                reject(new Error('Failed to create thumbnail blob'));
              }
            }, 'image/png');
          }).catch(reject);
        } else {
          // Fallback: return a placeholder or error
          reject(new Error('html2canvas library not available. Please upload a thumbnail manually.'));
        }
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        reject(error);
      }
    });
  };

  return {
    uploading,
    uploadProgress,
    uploadFile,
    uploadToPublic,
    uploadMultipleFiles,
    deleteFile,
    listFiles,
    listAllFilesRecursive,
    buildBundleFileMap,
    findHtmlEntry,
    getFileURL,
    renameFile,
    moveFile,
    addFileToWidget,
    removeFileFromWidget,
    generateThumbnail,
    validateAndRefreshFileUrls,
    resolveWidgetEntry,
  };
}

// File validation utilities
export const validateWidgetFiles = (files: File[]): { valid: boolean; errors: string[] } => {
  const allowedTypes = [
    'text/html',
    'text/css',
    'application/javascript',
    'application/json',
    'text/javascript',
    'application/x-javascript',
    'text/plain',
    'text/markdown',
    'application/zip',
    'application/x-zip-compressed',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
    'image/webp',
    'audio/mpeg',
    'audio/mp3',
    'audio/wave',
    'audio/wav',
    'audio/x-wav',
    'audio/aac',
    'audio/x-aac',
    'audio/ogg',
    'audio/webm',
    'audio/flac',
    'audio/mp4',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/ogg',
    'application/pdf',
    'application/postscript',
    'application/vnd.adobe.photoshop',
    'application/vnd.adobe.illustrator',
  ];

  const allowedExtensions = [
    '.html',
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.json',
    '.webp',
    '.txt',
    '.md',
    '.zip',
    '.mp3',
    '.wav',
    '.flac',
    '.aac',
    '.m4a',
    '.oga',
    '.ogg',
    '.mp4',
    '.mov',
    '.webm',
    '.avi',
    '.mkv',
    '.pdf',
    '.psd',
    '.ai',
    '.eps',
  ];

  const blockedExtensions = [
    '.exe',
    '.bat',
    '.cmd',
    '.sh',
    '.bash',
    '.msi',
    '.apk',
    '.com',
    '.scr',
    '.dll',
    '.vbs',
    '.ps1',
    '.php',
    '.py',
    '.pl',
    '.rb',
    '.jar',
  ];

  const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
  const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.m4a', '.oga', '.ogg'];

  const maxGeneralSize = 20 * 1024 * 1024; // 20MB for docs/images/code
  const maxAudioSize = 80 * 1024 * 1024; // 80MB for audio assets
  const maxVideoSize = 200 * 1024 * 1024; // 200MB for video assets
  const maxZipSize = 50 * 1024 * 1024; // 50MB for ZIP files
  const errors: string[] = [];

  for (const file of files) {
    if (!file.name.includes('.')) {
      errors.push(`File ${file.name} is missing an extension. Add an appropriate extension before uploading.`);
      continue;
    }

    const lowerName = file.name.toLowerCase();
    const extension = lowerName.slice(lowerName.lastIndexOf('.'));

    if (blockedExtensions.some((ext) => lowerName.endsWith(ext))) {
      errors.push(`File ${file.name} uses a blocked extension (${extension}).`);
      continue;
    }

    const nameSegments = lowerName.split('.');
    if (nameSegments.length > 2) {
      const suspiciousSegment = nameSegments
        .slice(1, -1)
        .some((segment) => blockedExtensions.includes(`.${segment}`));
      if (suspiciousSegment) {
        errors.push(`File ${file.name} contains a blocked secondary extension.`);
        continue;
      }
    }
    
    if (!allowedExtensions.includes(extension)) {
      errors.push(`File ${file.name} has an unsupported extension: ${extension}`);
    }
    
    if (file.type && !allowedTypes.includes(file.type)) {
      errors.push(`File ${file.name} has an unsupported type: ${file.type}`);
    }
    
    // Different size limits for ZIP vs regular files
    let maxSize = maxGeneralSize;
    if (extension === '.zip') {
      maxSize = maxZipSize;
    } else if (videoExtensions.includes(extension)) {
      maxSize = maxVideoSize;
    } else if (audioExtensions.includes(extension)) {
      maxSize = maxAudioSize;
    }

    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
      errors.push(`File ${file.name} is too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max ${maxSizeMB}MB)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// ZIP file extraction utility
export const extractZipFile = async (file: File): Promise<File[]> => {
  try {
    // Check if JSZip is available
    if (typeof window === 'undefined') {
      throw new Error('ZIP extraction is only available in the browser');
    }
    
    // Dynamic import of JSZip for client-side only
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);
    
    const extractedFiles: File[] = [];
    
    for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
      if (!zipEntry.dir) {
        const blob = await zipEntry.async('blob');
        const extractedFile = new File([blob], relativePath, { type: blob.type });
        extractedFiles.push(extractedFile);
      }
    }
    
    return extractedFiles;
  } catch (error) {
    console.error('Error extracting ZIP file:', error);
    throw new Error('Failed to extract ZIP file. Please ensure it\'s a valid ZIP archive.');
  }
};
