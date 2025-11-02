'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStorage, validateWidgetFiles, extractZipFile } from '@/hooks/useStorage';
import { useWidgets } from '@/hooks/useFirestore';
import WidgetOnboarding from './WidgetOnboarding';

interface UploadWorkspaceProps {
  currentSlot: number;
  onSlotChange: (slot: number) => void;
}

export default function UploadWorkspace({ currentSlot, onSlotChange }: UploadWorkspaceProps) {
  const { user } = useAuth();
  const { addWidget } = useWidgets(user?.uid);
  const { uploadMultipleFiles, uploadFile, uploading } = useStorage();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingToSlot, setUploadingToSlot] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isExtractingZip, setIsExtractingZip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      
      // Check if any files are ZIP files
      const zipFiles = fileArray.filter(file => file.name.toLowerCase().endsWith('.zip'));
      const regularFiles = fileArray.filter(file => !file.name.toLowerCase().endsWith('.zip'));
      
      if (zipFiles.length > 0) {
        setIsExtractingZip(true);
        try {
          const extractedFiles: File[] = [];
          
          for (const zipFile of zipFiles) {
            const extracted = await extractZipFile(zipFile);
            extractedFiles.push(...extracted);
          }
          
          setSelectedFiles([...regularFiles, ...extractedFiles]);
        } catch (error) {
          console.error('Error extracting ZIP files:', error);
          alert(`Error extracting ZIP files: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setSelectedFiles(regularFiles);
        } finally {
          setIsExtractingZip(false);
        }
      } else {
        setSelectedFiles(fileArray);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
      html: '🌐',
      css: '🎨',
      js: '⚡',
      json: '📋',
      png: '🖼️',
      jpg: '🖼️',
      jpeg: '🖼️',
      gif: '🖼️',
      svg: '🖼️',
      webp: '🖼️',
      txt: '📄',
      md: '📝',
    };
    return icons[ext || ''] || '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async (slot: number) => {
    if (!user || selectedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    // Validate files
    const validation = validateWidgetFiles(selectedFiles);
    if (!validation.valid) {
      alert(`Invalid files:\n${validation.errors.join('\n')}`);
      return;
    }

    try {
      setUploadingToSlot(slot);
      
      // Get form data
      const titleInput = document.getElementById(`title${slot}`) as HTMLInputElement;
      const descriptionInput = document.getElementById(`description${slot}`) as HTMLTextAreaElement;
      const tagsInput = document.getElementById(`tags${slot}`) as HTMLInputElement;
      
      const title = titleInput?.value || `Widget ${slot}`;
      const description = descriptionInput?.value || 'No description provided';
      const tags = tagsInput?.value ? tagsInput.value.split(',').map(t => t.trim()) : [];

              // Upload files to Firebase Storage
              const basePath = `uploads/upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              const uploadedFiles = await uploadMultipleFiles(selectedFiles, basePath);

      // Determine entry file from selected files
      const names = selectedFiles.map(f => f.name);
      const htmls = names.filter(n => /\.html?$/i.test(n));
      const byIndex = htmls.find(n => /(^|\/)index\.html?$/i.test(n));
      let entry = byIndex || htmls[0] || '';
      if (!entry || (htmls.length > 1 && !byIndex)) {
        const choice = window.prompt('Select the entry HTML file (relative path)', entry || (htmls[0] || ''));
        if (choice) entry = choice.trim();
      }

      // Upload a small manifest.json so client fallback can find the entry too
      try {
        const manifest = new File([JSON.stringify({ entry })], 'manifest.json', { type: 'application/json' });
        await uploadFile(manifest, `${basePath}/manifest.json`);
      } catch (e) {
        console.warn('manifest.json upload failed or skipped', e);
      }

      // Create widget document in Firestore
      await addWidget({
        title,
        description,
        slot,
        files: uploadedFiles,
        tags,
        userId: user.uid,
        uploadId: basePath.split('/')[1], // Extract upload ID from path
        storagePath: basePath,
        entry,
      });

      // Clear form
      setSelectedFiles([]);
      if (titleInput) titleInput.value = '';
      if (descriptionInput) descriptionInput.value = '';
      if (tagsInput) tagsInput.value = '';

      alert(`Widget uploaded successfully to slot ${slot}!`);
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingToSlot(null);
    }
  };

  const handlePreview = () => {
    // TODO: Implement preview logic
    alert('Preview functionality coming soon!');
  };

  return (
    <div className="upload-workspace">
      {showOnboarding && (
        <WidgetOnboarding 
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
      
      <div className="workspace-header">
        <h3>Upload Your Widget</h3>
        <p>Select a slot and upload your project files.</p>
        <button 
          className="onboarding-trigger-btn"
          onClick={() => setShowOnboarding(true)}
        >
          <span>📚</span>
          Show Tutorial
        </button>
      </div>
      
      <div className="widget-slots-grid">
        {/* Slot 1 */}
        <div className={`widget-slot ${currentSlot === 1 ? 'active' : ''}`} data-slot="1">
          <div className="slot-header">
            <h3>Slot 1</h3>
            <span className="slot-status">Available</span>
          </div>

          <div className="slot-content">
            <div 
              className={`file-upload-area ${isDragging ? 'dragover' : ''} ${selectedFiles.length > 0 ? 'has-files' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="file-input"
                multiple
                accept=".html,.js,.css,.png,.jpg,.jpeg,.gif,.svg,.json,.webp,.txt,.md,.zip"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
              <div className="upload-placeholder">
                <span className="upload-icon">📦</span>
                <p>Drop your project files here or click to upload</p>
                <span className="upload-hint">
                  Upload HTML, CSS, JS, and asset files for your widget
                </span>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="selected-files">
                <h4>Selected Files</h4>
                <div className="files-list">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        <span className="file-icon">{getFileIcon(file.name)}</span>
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{formatFileSize(file.size)}</span>
                      </div>
                      <button 
                        className="remove-file" 
                        onClick={() => removeFile(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  className="clear-files-btn" 
                  onClick={() => setSelectedFiles([])}
                >
                  Clear All Files
                </button>
              </div>
            )}

            <div className="widget-info">
              <div className="info-group">
                <label htmlFor="title1">Widget Title</label>
                <input
                  type="text"
                  className="widget-title"
                  id="title1"
                  placeholder="Enter widget title"
                />
              </div>
              <div className="info-group">
                <label htmlFor="description1">Description</label>
                <textarea
                  className="widget-description"
                  id="description1"
                  placeholder="Describe your widget"
                  rows={3}
                />
              </div>
              <div className="info-group">
                <label htmlFor="tags1">Tags (optional)</label>
                <input
                  type="text"
                  className="widget-tags"
                  id="tags1"
                  placeholder="e.g., game, utility, showcase"
                />
              </div>
            </div>

            <div className="slot-actions">
              <button className="preview-btn" onClick={handlePreview}>
                <span>👁️</span>
                Preview
              </button>
              <button 
                className="upload-btn" 
                onClick={() => handleUpload(1)}
                disabled={uploading || uploadingToSlot === 1}
              >
                <span>{uploading && uploadingToSlot === 1 ? '⏳' : '🚀'}</span>
                {uploading && uploadingToSlot === 1 ? 'Uploading...' : 'Upload to Slot 1'}
              </button>
            </div>
          </div>
        </div>

        {/* Slot 2 */}
        <div className={`widget-slot ${currentSlot === 2 ? 'active' : ''}`} data-slot="2">
          <div className="slot-header">
            <h3>Slot 2</h3>
            <span className="slot-status">Available</span>
          </div>

          <div className="slot-content">
            <div className="file-upload-area">
              <div className="upload-placeholder">
                <span className="upload-icon">📦</span>
                <p>Drop your project files here or click to upload</p>
                <span className="upload-hint">
                  Upload HTML, CSS, JS, and asset files for your widget
                </span>
              </div>
            </div>

            <div className="widget-info">
              <div className="info-group">
                <label htmlFor="title2">Widget Title</label>
                <input
                  type="text"
                  className="widget-title"
                  id="title2"
                  placeholder="Enter widget title"
                />
              </div>
              <div className="info-group">
                <label htmlFor="description2">Description</label>
                <textarea
                  className="widget-description"
                  id="description2"
                  placeholder="Describe your widget"
                  rows={3}
                />
              </div>
              <div className="info-group">
                <label htmlFor="tags2">Tags (optional)</label>
                <input
                  type="text"
                  className="widget-tags"
                  id="tags2"
                  placeholder="e.g., game, utility, showcase"
                />
              </div>
            </div>

            <div className="slot-actions">
              <button className="preview-btn" onClick={handlePreview}>
                <span>👁️</span>
                Preview
              </button>
              <button 
                className="upload-btn" 
                onClick={() => handleUpload(2)}
                disabled={uploading || uploadingToSlot === 2}
              >
                <span>{uploading && uploadingToSlot === 2 ? '⏳' : '🚀'}</span>
                {uploading && uploadingToSlot === 2 ? 'Uploading...' : 'Upload to Slot 2'}
              </button>
            </div>
          </div>
        </div>

        {/* Slot 3 */}
        <div className={`widget-slot ${currentSlot === 3 ? 'active' : ''}`} data-slot="3">
          <div className="slot-header">
            <h3>Slot 3</h3>
            <span className="slot-status">Available</span>
          </div>

          <div className="slot-content">
            <div className="file-upload-area">
              <div className="upload-placeholder">
                <span className="upload-icon">📦</span>
                <p>Drop your project files here or click to upload</p>
                <span className="upload-hint">
                  Upload HTML, CSS, JS, and asset files for your widget
                </span>
              </div>
            </div>

            <div className="widget-info">
              <div className="info-group">
                <label htmlFor="title3">Widget Title</label>
                <input
                  type="text"
                  className="widget-title"
                  id="title3"
                  placeholder="Enter widget title"
                />
              </div>
              <div className="info-group">
                <label htmlFor="description3">Description</label>
                <textarea
                  className="widget-description"
                  id="description3"
                  placeholder="Describe your widget"
                  rows={3}
                />
              </div>
              <div className="info-group">
                <label htmlFor="tags3">Tags (optional)</label>
                <input
                  type="text"
                  className="widget-tags"
                  id="tags3"
                  placeholder="e.g., game, utility, showcase"
                />
              </div>
            </div>

            <div className="slot-actions">
              <button className="preview-btn" onClick={handlePreview}>
                <span>👁️</span>
                Preview
              </button>
              <button 
                className="upload-btn" 
                onClick={() => handleUpload(3)}
                disabled={uploading || uploadingToSlot === 3}
              >
                <span>{uploading && uploadingToSlot === 3 ? '⏳' : '🚀'}</span>
                {uploading && uploadingToSlot === 3 ? 'Uploading...' : 'Upload to Slot 3'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
