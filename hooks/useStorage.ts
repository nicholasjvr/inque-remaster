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
    const allRefs = await listAllFilesRecursive(bundleBasePath);
    const entries = await Promise.all(
      allRefs.map(async (r) => {
        const url = await getDownloadURL(r);
        // Normalize key to be relative to base
        const key = r.fullPath.replace(new RegExp(`^${bundleBasePath.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}/?`), '');
        return [key, url] as const;
      })
    );
    // Prefer flat keys ("index.html") alongside nested ("public/index.html")
    const map: Record<string, string> = {};
    for (const [key, url] of entries) {
      map[key] = url;
      const flat = key.split('/').pop();
      if (flat) map[flat] = url;
    }
    return map;
  };

  // Find an entry HTML file from the file map
  const findHtmlEntry = (fileMap: Record<string, string>): string | null => {
    const keys = Object.keys(fileMap);
    // Common candidates ordered by priority
    const candidates = [
      'index.html',
      'Index.html',
      'public/index.html',
      'dist/index.html',
      'build/index.html',
      keys.find((k) => /index\.html?$/i.test(k)),
      keys.find((k) => /\.html?$/i.test(k)),
    ].filter(Boolean) as string[];
    return candidates.length ? candidates[0] : null;
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
  };
}

// File validation utilities
export const validateWidgetFiles = (files: File[]): { valid: boolean; errors: string[] } => {
  const allowedTypes = [
    'text/html',
    'text/css',
    'application/javascript',
    'application/json',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
    'text/javascript',
    'application/x-javascript',
    'image/webp',
    'text/plain',
    'text/markdown',
    'application/zip',
    'application/x-zip-compressed',
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
  ];

  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const maxZipSize = 50 * 1024 * 1024; // 50MB for ZIP files
  const errors: string[] = [];

  for (const file of files) {
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
      errors.push(`File ${file.name} has an unsupported extension: ${extension}`);
    }
    
    if (file.type && !allowedTypes.includes(file.type)) {
      errors.push(`File ${file.name} has an unsupported type: ${file.type}`);
    }
    
    // Different size limits for ZIP vs regular files
    const maxSize = extension === '.zip' ? maxZipSize : maxFileSize;
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
