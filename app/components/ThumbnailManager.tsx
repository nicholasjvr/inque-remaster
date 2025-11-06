'use client';

import { useState, useRef } from 'react';
import { Widget } from '@/hooks/useFirestore';
import { useWidgets } from '@/hooks/useFirestore';
import { useStorage } from '@/hooks/useStorage';
import BundleIframe from './BundleIframe';

interface ThumbnailManagerProps {
  widget: Widget;
}

export default function ThumbnailManager({ widget }: ThumbnailManagerProps) {
  const [showManager, setShowManager] = useState(false);
  const [mode, setMode] = useState<'generate' | 'upload' | 'select'>('generate');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(widget.thumbnailUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateWidget } = useWidgets(widget.userId);
  const { uploadFile } = useStorage();

  const handleGenerateThumbnail = async () => {
    try {
      setUploading(true);
      // Note: generateThumbnail requires html2canvas library
      // For now, we'll show a message to upload manually
      alert('Thumbnail generation requires html2canvas library. Please use the upload option instead.');
      setUploading(false);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      alert(`Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploading(false);
    }
  };

  const handleUploadThumbnail = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      setUploading(true);
      const basePath = widget.storagePath || `uploads/${widget.uploadId || widget.id}`;
      const thumbnailPath = `${basePath}/thumbnail_${Date.now()}.${file.name.split('.').pop()}`;
      const downloadURL = await uploadFile(file, thumbnailPath);
      
      await updateWidget(widget.id, { thumbnailUrl: downloadURL });
      setPreviewUrl(downloadURL);
      setShowManager(false);
      setUploading(false);
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      alert(`Failed to upload thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setUploading(false);
    }
  };

  const handleSelectAsset = async (assetUrl: string) => {
    try {
      await updateWidget(widget.id, { thumbnailUrl: assetUrl });
      setPreviewUrl(assetUrl);
      setShowManager(false);
    } catch (error) {
      console.error('Error setting thumbnail:', error);
      alert(`Failed to set thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const imageAssets = widget.files?.filter((f) => 
    /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f.fileName)
  ) || [];

  return (
    <div className="thumbnail-manager">
      <button
        className="thumbnail-manager-btn"
        onClick={() => setShowManager(!showManager)}
      >
        <span>🖼️</span>
        {previewUrl ? 'Change Thumbnail' : 'Set Thumbnail'}
      </button>

      {showManager && (
        <div className="thumbnail-manager-modal">
          <div className="thumbnail-modal-content">
            <div className="modal-header">
              <h3>Manage Thumbnail</h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowManager(false)}
              >
                ✕
              </button>
            </div>

            <div className="thumbnail-preview-section">
              {previewUrl ? (
                <img src={previewUrl} alt="Thumbnail preview" className="thumbnail-preview" />
              ) : (
                <div className="thumbnail-preview-placeholder">
                  <span>🖼️</span>
                  <p>No thumbnail set</p>
                </div>
              )}
            </div>

            <div className="thumbnail-mode-tabs">
              <button
                className={`mode-tab ${mode === 'generate' ? 'active' : ''}`}
                onClick={() => setMode('generate')}
              >
                Auto-Generate
              </button>
              <button
                className={`mode-tab ${mode === 'upload' ? 'active' : ''}`}
                onClick={() => setMode('upload')}
              >
                Upload
              </button>
              <button
                className={`mode-tab ${mode === 'select' ? 'active' : ''}`}
                onClick={() => setMode('select')}
              >
                Select Asset
              </button>
            </div>

            <div className="thumbnail-mode-content">
              {mode === 'generate' && (
                <div className="generate-mode">
                  <p>Generate a thumbnail from the widget preview</p>
                  <div className="preview-container" style={{ height: '200px', marginBottom: '1rem' }}>
                    <BundleIframe bundle={widget} height={200} />
                  </div>
                  <button
                    className="generate-thumbnail-btn"
                    onClick={handleGenerateThumbnail}
                    disabled={uploading}
                  >
                    {uploading ? 'Generating...' : 'Generate Thumbnail'}
                  </button>
                  <p className="mode-hint">
                    Note: Requires html2canvas library. Use upload option for manual thumbnails.
                  </p>
                </div>
              )}

              {mode === 'upload' && (
                <div className="upload-mode">
                  <p>Upload a custom thumbnail image</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadThumbnail(e.target.files)}
                    style={{ display: 'none' }}
                  />
                  <button
                    className="upload-thumbnail-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Choose Image'}
                  </button>
                  <p className="mode-hint">
                    Recommended: 400x300px or larger, PNG or JPG format
                  </p>
                </div>
              )}

              {mode === 'select' && (
                <div className="select-mode">
                  <p>Select an existing image from your project files</p>
                  {imageAssets.length > 0 ? (
                    <div className="asset-grid">
                      {imageAssets.map((asset) => (
                        <div
                          key={asset.fileName}
                          className={`asset-item ${previewUrl === asset.downloadURL ? 'selected' : ''}`}
                          onClick={() => handleSelectAsset(asset.downloadURL)}
                        >
                          <img src={asset.downloadURL} alt={asset.fileName} />
                          <span className="asset-name">{asset.fileName.split('/').pop()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-assets">No image assets found in this project</p>
                  )}
                </div>
              )}
            </div>

            {previewUrl && (
              <div className="thumbnail-actions">
                <button
                  className="remove-thumbnail-btn"
                  onClick={async () => {
                    try {
                      await updateWidget(widget.id, { thumbnailUrl: undefined });
                      setPreviewUrl(null);
                    } catch (error) {
                      console.error('Error removing thumbnail:', error);
                    }
                  }}
                >
                  Remove Thumbnail
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

