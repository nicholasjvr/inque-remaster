'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Widget } from '@/hooks/useFirestore';
import { useStorage } from '@/hooks/useStorage';
import { useWidgets } from '@/hooks/useFirestore';
import { validateWidgetFiles } from '@/hooks/useStorage';
import { showToast } from '@/app/utils/toast';

interface FileManagerProps {
  widget: Widget;
  onFilesUpdated: () => void;
  onWidgetUpdated?: (updatedWidget: Widget) => void;
}

export default function FileManager({ widget, onFilesUpdated, onWidgetUpdated }: FileManagerProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [renamingFile, setRenamingFile] = useState<{ fileName: string; path: string } | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadMultipleFiles, addFileToWidget, removeFileFromWidget, renameFile } = useStorage();
  const { updateWidget } = useWidgets(widget.userId);

  const startRename = useCallback((fileName: string, path: string) => {
    setRenamingFile({ fileName, path });
    setNewFileName(fileName.split('/').pop() || fileName);
    setShowRename(true);
  }, []);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validation = validateWidgetFiles(fileArray);

    if (!validation.valid) {
      alert(`Invalid files:\n${validation.errors.join('\n')}`);
      return;
    }

    try {
      const basePath = widget.storagePath || `uploads/${widget.uploadId || widget.id}`;
      const uploadPromises = fileArray.map(file => addFileToWidget(basePath, file));
      const uploadedFiles = await Promise.all(uploadPromises);

      // Update widget files array in Firestore
      const updatedFiles = [...(widget.files || []), ...uploadedFiles];
      const updatedWidget = { ...widget, files: updatedFiles };
      await updateWidget(widget.id, { files: updatedFiles });

      if (onWidgetUpdated) {
        onWidgetUpdated(updatedWidget);
      }
      onFilesUpdated();
      setShowUpload(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      showToast(`Successfully uploaded ${fileArray.length} file(s)`, 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  }, [widget, addFileToWidget, updateWidget, onWidgetUpdated, onFilesUpdated]);

  // Listen for rename events from ProjectFileExplorer
  useEffect(() => {
    const handleRenameEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        startRename(customEvent.detail.fileName, customEvent.detail.path);
      }
    };

    const handleFileDropEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.files) {
        handleFileSelect(customEvent.detail.files);
      }
    };

    window.addEventListener('file-rename', handleRenameEvent);
    window.addEventListener('file-drop', handleFileDropEvent);
    return () => {
      window.removeEventListener('file-rename', handleRenameEvent);
      window.removeEventListener('file-drop', handleFileDropEvent);
    };
  }, [handleFileSelect, startRename]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFileSelect(files);
    }
  };

  const handleRename = async () => {
    if (!renamingFile || !newFileName.trim()) return;

    try {
      const basePath = widget.storagePath || `uploads/${widget.uploadId || widget.id}`;
      const oldPath = `${basePath}/${renamingFile.fileName}`;
      const newPath = `${basePath}/${newFileName.trim()}`;

      const newDownloadURL = await renameFile(oldPath, newPath);

      // Update widget files array
      const updatedFiles = widget.files?.map((f) =>
        f.fileName === renamingFile.fileName
          ? { ...f, fileName: newFileName.trim(), downloadURL: newDownloadURL }
          : f
      ) || [];

      await updateWidget(widget.id, { files: updatedFiles });

      setShowRename(false);
      setRenamingFile(null);
      setNewFileName('');
      onFilesUpdated();
      showToast('File renamed successfully', 'success');
    } catch (error) {
      console.error('Error renaming file:', error);
      showToast(`Failed to rename file: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      const basePath = widget.storagePath || `uploads/${widget.uploadId || widget.id}`;
      const filePath = `${basePath}/${fileName}`;

      await removeFileFromWidget(filePath);

      // Update widget files array
      const updatedFiles = widget.files?.filter((f) => f.fileName !== fileName) || [];
      await updateWidget(widget.id, { files: updatedFiles });

      setDeletingFile(null);
      onFilesUpdated();
      showToast('File deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting file:', error);
      showToast(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  return (
    <div className="file-manager">
      <div className="file-manager-actions">
        <button
          className="file-manager-btn upload-btn"
          onClick={() => {
            setShowUpload(!showUpload);
            if (!showUpload && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
        >
          <span>📤</span>
          Upload File
        </button>
      </div>

      {showUpload && (
        <div 
          className={`file-upload-modal ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-modal-content">
            <h3>Upload File</h3>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".html,.htm,.js,.css,.png,.jpg,.jpeg,.gif,.svg,.json,.webp,.txt,.md,.pdf,.mp3,.wav,.flac,.aac,.m4a,.oga,.ogg,.mp4,.mov,.webm,.avi,.mkv,.psd,.ai,.eps,.zip"
              onChange={(e) => handleFileSelect(e.target.files)}
              style={{ display: 'none' }}
            />
            <div className="upload-drop-zone">
              <p>{isDragging ? 'Drop files here' : 'Drop files here or click to select'}</p>
              <button onClick={() => fileInputRef.current?.click()}>
                Choose Files
              </button>
            </div>
            <button className="close-modal-btn" onClick={() => setShowUpload(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showRename && renamingFile && (
        <div className="file-rename-modal">
          <div className="rename-modal-content">
            <h3>Rename File</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') {
                  setShowRename(false);
                  setRenamingFile(null);
                }
              }}
              autoFocus
              className="rename-input"
            />
            <div className="rename-actions">
              <button onClick={handleRename} className="confirm-btn">
                Rename
              </button>
              <button
                onClick={() => {
                  setShowRename(false);
                  setRenamingFile(null);
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File context menu would go here */}
      <div className="file-context-menu" style={{ display: 'none' }}>
        <button onClick={() => renamingFile && startRename(renamingFile.fileName, renamingFile.path)}>
          ✏️ Rename
        </button>
        <button onClick={() => deletingFile && handleDelete(deletingFile)}>
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}

