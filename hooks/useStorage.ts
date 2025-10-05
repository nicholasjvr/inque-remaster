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

  return {
    uploading,
    uploadProgress,
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    listFiles,
    listAllFilesRecursive,
    buildBundleFileMap,
    findHtmlEntry,
    getFileURL,
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
