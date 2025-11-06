'use client';

import { useState, useEffect } from 'react';
import { Widget } from '@/hooks/useFirestore';
import { useStorage } from '@/hooks/useStorage';
import { useWidgets } from '@/hooks/useFirestore';
import FileManager from './FileManager';
import EntryPointSelector from './EntryPointSelector';
import ThumbnailManager from './ThumbnailManager';
import BundleIframe from './BundleIframe';

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
  const { buildBundleFileMap } = useStorage();
  const { updateWidget } = useWidgets(widget.userId);

  useEffect(() => {
    buildFileTree();
    setTitle(widget.title);
    setDescription(widget.description);
  }, [widget]);

  useEffect(() => {
    if (selectedFile && selectedFile.downloadURL && selectedFile.name.match(/\.(css|js|json|txt|md)$/i)) {
      loadFileContent(selectedFile.downloadURL);
    } else {
      setFileContent('');
    }
  }, [selectedFile]);

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

  const handleTitleSave = async () => {
    if (title !== widget.title) {
      await updateWidget(widget.id, { title });
    }
    setEditingTitle(false);
  };

  const handleDescriptionSave = async () => {
    if (description !== widget.description) {
      await updateWidget(widget.id, { description });
    }
    setEditingDescription(false);
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

  const renderFileTree = (nodes: FileNode[], level: number = 0): JSX.Element[] => {
    return nodes.map((node) => {
      const isExpanded = expandedPaths.has(node.path);
      const isSelected = selectedFile?.path === node.path;
      const isFolder = node.type === 'folder';

      return (
        <div key={node.path}>
          <div
            className={`file-tree-item ${isSelected ? 'selected' : ''}`}
            style={{ paddingLeft: `${level * 20 + 10}px` }}
            onClick={() => {
              if (isFolder) {
                toggleExpand(node.path);
              } else {
                setSelectedFile(node);
              }
            }}
          >
            <span className="file-tree-icon">
              {isFolder ? (isExpanded ? '📂' : '📁') : getFileIcon(node.name)}
            </span>
            <span className="file-tree-name">{node.name}</span>
            {node.size && (
              <span className="file-tree-size">{formatFileSize(node.size)}</span>
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
          <div className="file-tree-container">
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
                  {selectedFile.downloadURL && (
                    <a
                      href={selectedFile.downloadURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="preview-action-btn"
                    >
                      <span>🔗</span>
                      Open URL
                    </a>
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
                ) : selectedFile.name.match(/\.(css|js|json|txt|md)$/i) ? (
                  <div className="code-preview">
                    {loadingContent ? (
                      <div className="loading-content">Loading...</div>
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
    </div>
  );
}

