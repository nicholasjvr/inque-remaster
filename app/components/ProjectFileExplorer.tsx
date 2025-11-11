'use client';

import { useState, useEffect, useRef } from 'react';
import { Widget } from '@/hooks/useFirestore';
import { useStorage } from '@/hooks/useStorage';
import { useWidgets } from '@/hooks/useFirestore';
import FileManager from './FileManager';
import EntryPointSelector from './EntryPointSelector';
import ThumbnailManager from './ThumbnailManager';
import BundleIframe from './BundleIframe';
import { showToast } from '@/app/utils/toast';

interface ProjectFileExplorerProps {
  widget: Widget;
  onClose: () => void;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  downloadURL?: string;
  children?: FileNode[];
}

export default function ProjectFileExplorer({ widget, onClose }: ProjectFileExplorerProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [title, setTitle] = useState(widget.title);
  const [description, setDescription] = useState(widget.description);
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [editingFile, setEditingFile] = useState(false);
  const [editedContent, setEditedContent] = useState<string>('');
  const [savingFile, setSavingFile] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileNode } | null>(null);
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);
  const [showDeleteProject, setShowDeleteProject] = useState(false);
  const [deleteProjectName, setDeleteProjectName] = useState('');
  const [deletingProject, setDeletingProject] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const fileTreeContainerRef = useRef<HTMLDivElement>(null);
  const { buildBundleFileMap, uploadFile, removeFileFromWidget } = useStorage();
  const { updateWidget, deleteWidget } = useWidgets(widget.userId);

  useEffect(() => {
    buildFileTree();
    setTitle(widget.title);
    setDescription(widget.description);
  }, [widget]);

  useEffect(() => {
    if (selectedFile && selectedFile.downloadURL && selectedFile.name.match(/\.(css|js|json|txt|md|html)$/i)) {
      loadFileContent(selectedFile.downloadURL);
    } else {
      setFileContent('');
    }
    setEditingFile(false);
  }, [selectedFile]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenu(null);
        setEditingFile(false);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu]);

  const loadFileContent = async (url: string) => {
    try {
      setLoadingContent(true);
      const response = await fetch(url);
      const text = await response.text();
      setFileContent(text);
    } catch (error) {
      console.error('Error loading file content:', error);
      setFileContent('Error loading file content');
    } finally {
      setLoadingContent(false);
    }
  };


  const handleDescriptionSave = async () => {
    if (description !== widget.description) {
      try {
        await updateWidget(widget.id, { description });
        showToast('Description updated successfully', 'success');
      } catch (error) {
        showToast('Failed to update description', 'error');
      }
    }
    setEditingDescription(false);
  };

  const handleTitleSave = async () => {
    if (title !== widget.title) {
      try {
        await updateWidget(widget.id, { title });
        showToast('Title updated successfully', 'success');
      } catch (error) {
        showToast('Failed to update title', 'error');
      }
    }
    setEditingTitle(false);
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const handleRenameFile = (file: FileNode) => {
    setContextMenu(null);
    // Find the file in widget.files to get the full fileName
    const widgetFile = widget.files?.find(f => f.fileName.includes(file.name));
    if (widgetFile) {
      // Trigger rename through FileManager
      const event = new CustomEvent('file-rename', { detail: { fileName: widgetFile.fileName, path: file.path } });
      window.dispatchEvent(event);
    }
  };

  const handleDeleteFile = async (file: FileNode) => {
    setContextMenu(null);
    const widgetFile = widget.files?.find(f => f.fileName.includes(file.name));
    if (!widgetFile) return;

    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;

    try {
      const basePath = widget.storagePath || `uploads/${widget.uploadId || widget.id}`;
      const filePath = `${basePath}/${widgetFile.fileName}`;
      
      await removeFileFromWidget(filePath);
      
      const updatedFiles = widget.files?.filter((f) => f.fileName !== widgetFile.fileName) || [];
      await updateWidget(widget.id, { files: updatedFiles });
      
      if (selectedFile?.path === file.path) {
        setSelectedFile(null);
      }
      
      buildFileTree();
      showToast('File deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting file:', error);
      showToast('Failed to delete file', 'error');
    }
  };

  const handleDownloadFile = (file: FileNode) => {
    setContextMenu(null);
    if (file.downloadURL) {
      const link = document.createElement('a');
      link.href = file.downloadURL;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('File download started', 'success');
    }
  };

  const handleStartEdit = () => {
    if (selectedFile && isEditableFile(selectedFile.name)) {
      setEditedContent(fileContent);
      setEditingFile(true);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile || !selectedFile.downloadURL) return;

    try {
      setSavingFile(true);
      const widgetFile = widget.files?.find(f => f.fileName.includes(selectedFile.name));
      if (!widgetFile) {
        throw new Error('File not found in widget');
      }

      const basePath = widget.storagePath || `uploads/${widget.uploadId || widget.id}`;
      const filePath = `${basePath}/${widgetFile.fileName}`;
      
      // Create a blob from the edited content
      const blob = new Blob([editedContent], { type: 'text/plain' });
      const file = new File([blob], selectedFile.name, { type: blob.type });
      
      // Upload the new content (this will overwrite the existing file)
      const newDownloadURL = await uploadFile(file, filePath);
      
      // Update widget files array
      const updatedFiles = widget.files?.map((f) =>
        f.fileName === widgetFile.fileName
          ? { ...f, downloadURL: newDownloadURL }
          : f
      ) || [];
      
      await updateWidget(widget.id, { files: updatedFiles });
      
      setFileContent(editedContent);
      setEditingFile(false);
      showToast('File saved successfully', 'success');
    } catch (error) {
      console.error('Error saving file:', error);
      showToast('Failed to save file', 'error');
    } finally {
      setSavingFile(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingFile(false);
    setEditedContent('');
  };

  const handleDeleteProject = async () => {
    if (deleteProjectName !== widget.title) {
      showToast('Project name does not match', 'error');
      return;
    }

    try {
      setDeletingProject(true);
      
      // Delete all files in storage
      const basePath = widget.storagePath || `uploads/${widget.uploadId || widget.id}`;
      if (widget.files && widget.files.length > 0) {
        const deletePromises = widget.files.map(file => {
          const filePath = `${basePath}/${file.fileName}`;
          return removeFileFromWidget(filePath).catch(err => {
            console.error(`Error deleting file ${file.fileName}:`, err);
          });
        });
        await Promise.all(deletePromises);
      }
      
      // Delete widget document
      await deleteWidget(widget.id);
      
      showToast('Project deleted successfully', 'success');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error deleting project:', error);
      showToast('Failed to delete project', 'error');
      setDeletingProject(false);
    }
  };

  const isEditableFile = (fileName: string): boolean => {
    return /\.(js|css|html|htm|json|txt|md)$/i.test(fileName);
  };

  const buildFileTree = async () => {
    try {
      const basePath = widget.storagePath || `uploads/${widget.uploadId || widget.id}`;
      const fileMap = await buildBundleFileMap(basePath);

      const tree: FileNode[] = [];
      const pathMap = new Map<string, FileNode>();

      // Build tree structure from file paths
      widget.files?.forEach((file) => {
        const parts = file.fileName.split('/');
        let currentPath = '';
        let parentNode: FileNode | null = null;

        parts.forEach((part, index) => {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          const isFile = index === parts.length - 1;

          if (!pathMap.has(currentPath)) {
            const node: FileNode = {
              name: part,
              path: currentPath,
              type: isFile ? 'file' : 'folder',
              size: isFile ? file.size : undefined,
              downloadURL: isFile ? file.downloadURL : undefined,
              children: isFile ? undefined : [],
            };

            pathMap.set(currentPath, node);

            if (parentNode) {
              if (!parentNode.children) parentNode.children = [];
              parentNode.children.push(node);
            } else {
              tree.push(node);
            }
          }

          parentNode = pathMap.get(currentPath)!;
        });
      });

      setFileTree(tree);
    } catch (error) {
      console.error('Error building file tree:', error);
    }
  };

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const renderFileTree = (nodes: FileNode[], level: number = 0): React.ReactElement[] => {
    return nodes.map((node) => {
      const isExpanded = expandedPaths.has(node.path);
      const isSelected = selectedFile?.path === node.path;
      const isFolder = node.type === 'folder';
      const isHovered = hoveredFile === node.path;

      return (
        <div key={node.path}>
          <div
            className={`file-tree-item ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
            style={{ paddingLeft: `${level * 20 + 10}px` }}
            onClick={() => {
              if (isFolder) {
                toggleExpand(node.path);
              } else {
                setSelectedFile(node);
              }
            }}
            onContextMenu={(e) => {
              if (!isFolder) {
                handleContextMenu(e, node);
              }
            }}
            onMouseEnter={() => setHoveredFile(node.path)}
            onMouseLeave={() => setHoveredFile(null)}
            onKeyDown={(e) => {
              if (e.key === 'Delete' && !isFolder && isSelected) {
                handleDeleteFile(node);
              } else if (e.key === 'F2' && !isFolder && isSelected) {
                handleRenameFile(node);
              }
            }}
            tabIndex={0}
          >
            <span className="file-tree-icon">
              {isFolder ? (isExpanded ? '📂' : '📁') : getFileIcon(node.name)}
            </span>
            <span className="file-tree-name">{node.name}</span>
            {node.size && (
              <span className="file-tree-size">{formatFileSize(node.size)}</span>
            )}
            {!isFolder && isHovered && (
              <div className="file-tree-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="file-action-btn rename-btn"
                  onClick={() => handleRenameFile(node)}
                  title="Rename (F2)"
                >
                  ✏️
                </button>
                <button
                  className="file-action-btn delete-btn"
                  onClick={() => handleDeleteFile(node)}
                  title="Delete (Del)"
                >
                  🗑️
                </button>
                {node.downloadURL && (
                  <button
                    className="file-action-btn download-btn"
                    onClick={() => handleDownloadFile(node)}
                    title="Download"
                  >
                    ⬇️
                  </button>
                )}
              </div>
            )}
          </div>
          {isFolder && isExpanded && node.children && (
            <div className="file-tree-children">
              {renderFileTree(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const getFileIcon = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
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
    return icons[ext || ''] || '📄';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="project-file-explorer">
      {/* Top Bar */}
      <div className="explorer-top-bar">
        <div className="project-info">
          {editingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
              }}
              className="project-title-input"
              autoFocus
            />
          ) : (
            <h2 onClick={() => setEditingTitle(true)} className="project-title-editable">
              {title}
            </h2>
          )}
          {editingDescription ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionSave}
              className="project-description-input"
              autoFocus
            />
          ) : (
            <p onClick={() => setEditingDescription(true)} className="project-description-editable">
              {description || 'Click to add description'}
            </p>
          )}
        </div>
        <div className="explorer-actions">
          <EntryPointSelector widget={widget} />
          <ThumbnailManager widget={widget} />
          <button 
            className="delete-project-btn" 
            onClick={() => setShowDeleteProject(true)}
            title="Delete Project"
          >
            <span>🗑️</span>
            Delete Project
          </button>
          <button className="close-explorer-btn" onClick={onClose}>
            <span>✕</span>
            Close
          </button>
        </div>
      </div>

      {/* Split Pane */}
      <div className="explorer-split-pane">
        {/* Left Panel - File Tree */}
        <div className="explorer-left-panel">
          <div className="panel-header">
            <h3>📁 Files</h3>
            <FileManager widget={widget} onFilesUpdated={buildFileTree} />
          </div>
          <div className="file-tree-container" ref={fileTreeContainerRef}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const files = e.dataTransfer.files;
              if (files && files.length > 0) {
                const event = new CustomEvent('file-drop', { detail: { files } });
                window.dispatchEvent(event);
              }
            }}
          >
            {fileTree.length > 0 ? (
              renderFileTree(fileTree)
            ) : (
              <div className="file-tree-empty">
                <p>No files found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - File Preview/Details */}
        <div className="explorer-right-panel">
          {selectedFile ? (
            <div className="file-preview-container">
              <div className="file-preview-header">
                <h3>{selectedFile.name}</h3>
                <div className="file-preview-actions">
                  {isEditableFile(selectedFile.name) && !editingFile && (
                    <button
                      className="preview-action-btn edit-btn"
                      onClick={handleStartEdit}
                    >
                      <span>✏️</span>
                      Edit
                    </button>
                  )}
                  {editingFile && (
                    <>
                      <button
                        className="preview-action-btn save-btn"
                        onClick={handleSaveFile}
                        disabled={savingFile}
                      >
                        <span>{savingFile ? '⏳' : '💾'}</span>
                        {savingFile ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        className="preview-action-btn cancel-btn"
                        onClick={handleCancelEdit}
                        disabled={savingFile}
                      >
                        <span>✕</span>
                        Cancel
                      </button>
                    </>
                  )}
                  {selectedFile.downloadURL && (
                    <a
                      href={selectedFile.downloadURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="preview-action-btn"
                      onClick={() => showToast('Opening file in new tab', 'info')}
                    >
                      <span>🔗</span>
                      Open URL
                    </a>
                  )}
                  {selectedFile.downloadURL && (
                    <button
                      className="preview-action-btn download-btn"
                      onClick={() => handleDownloadFile(selectedFile)}
                    >
                      <span>⬇️</span>
                      Download
                    </button>
                  )}
                </div>
              </div>
              <div className="file-preview-content">
                {selectedFile.name.match(/\.(html|htm)$/i) ? (
                  <div className="html-preview">
                    <iframe
                      src={selectedFile.downloadURL}
                      className="preview-iframe"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                ) : selectedFile.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i) ? (
                  <div className="image-preview">
                    <img src={selectedFile.downloadURL} alt={selectedFile.name} />
                  </div>
                ) : selectedFile.name.match(/\.(css|js|json|txt|md|html)$/i) ? (
                  <div className="code-preview">
                    {loadingContent ? (
                      <div className="loading-content">Loading...</div>
                    ) : editingFile ? (
                      <textarea
                        className="file-edit-textarea"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        spellCheck={false}
                      />
                    ) : (
                      <pre>
                        <code>{fileContent}</code>
                      </pre>
                    )}
                  </div>
                ) : (
                  <div className="file-info-preview">
                    <p>Preview not available for this file type</p>
                    {selectedFile.downloadURL && (
                      <a
                        href={selectedFile.downloadURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="download-btn"
                      >
                        Download File
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="file-preview-empty">
              <div className="preview-placeholder">
                <span className="placeholder-icon">📄</span>
                <h3>Select a file to preview</h3>
                <p>Click on any file in the file tree to view its contents</p>
              </div>
              <div className="widget-preview-section">
                <h3>Widget Preview</h3>
                <BundleIframe bundle={widget} height={400} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="file-context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 3000,
          }}
        >
          <button onClick={() => handleRenameFile(contextMenu.file)}>
            <span>✏️</span> Rename
          </button>
          {contextMenu.file.downloadURL && (
            <button onClick={() => handleDownloadFile(contextMenu.file)}>
              <span>⬇️</span> Download
            </button>
          )}
          <button onClick={() => handleDeleteFile(contextMenu.file)} className="delete-action">
            <span>🗑️</span> Delete
          </button>
        </div>
      )}

      {/* Delete Project Modal */}
      {showDeleteProject && (
        <div className="delete-project-modal">
          <div className="delete-modal-content">
            <h3>Delete Project</h3>
            <p>This action cannot be undone. All files and data will be permanently deleted.</p>
            <p>Type the project name <strong>{widget.title}</strong> to confirm:</p>
            <input
              type="text"
              value={deleteProjectName}
              onChange={(e) => setDeleteProjectName(e.target.value)}
              placeholder={widget.title}
              className="delete-project-input"
              autoFocus
            />
            <div className="delete-modal-actions">
              <button
                onClick={handleDeleteProject}
                disabled={deleteProjectName !== widget.title || deletingProject}
                className="confirm-delete-btn"
              >
                {deletingProject ? 'Deleting...' : 'Delete Project'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteProject(false);
                  setDeleteProjectName('');
                }}
                disabled={deletingProject}
                className="cancel-delete-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

