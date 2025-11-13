'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Widget } from '@/hooks/useFirestore';
import { useStorage } from '@/hooks/useStorage';
import { useWidgets } from '@/hooks/useFirestore';
import FileManager from './FileManager';
import EntryPointSelector from './EntryPointSelector';
import ThumbnailManager from './ThumbnailManager';
import BundleIframe from './BundleIframe';
import WidgetCarousel from './WidgetCarousel';
import UploadWorkspace from './UploadWorkspace';
import RepRackSlotManager from './RepRackSlotManager';
import { showToast } from '@/app/utils/toast';

interface FullscreenWorkspaceProps {
    widget: Widget;
    widgets: Widget[];
    onClose: () => void;
    onWidgetUpdated?: (updatedWidget: Widget) => void;
}

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    size?: number;
    downloadURL?: string;
    children?: FileNode[];
}

export default function FullscreenWorkspace({ widget, widgets, onClose, onWidgetUpdated }: FullscreenWorkspaceProps) {
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [fileMap, setFileMap] = useState<Record<string, string>>({});
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
    const [currentSlot, setCurrentSlot] = useState(widget.slot || 1);
    const [isInitializing, setIsInitializing] = useState(true);
    const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('workspace-left-panel-width');
            return saved ? parseInt(saved) : 300;
        }
        return 300;
    });
    const [rightPanelWidth, setRightPanelWidth] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('workspace-right-panel-width');
            return saved ? parseInt(saved) : 400;
        }
        return 400;
    });
    const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
    const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
    const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
    const resizeRef = useRef<{ startX: number; startLeftWidth: number; startRightWidth: number } | null>(null);
    const { buildBundleFileMap, uploadFile, removeFileFromWidget, getFileURL } = useStorage();
    const { updateWidget, deleteWidget } = useWidgets(widget.userId);

    const buildFileTree = useCallback(async () => {
        try {
            console.log(`[FullscreenWorkspace] Building file tree for widget ${widget.id}`);
            const basePath = widget.storagePath || `uploads/${widget.uploadId || widget.id}`;

            let map: Record<string, string> = {};
            try {
                map = await buildBundleFileMap(basePath);
                console.log(`[FullscreenWorkspace] Built file map from storage with ${Object.keys(map).length} entries`);
            } catch (error) {
                console.warn(`[FullscreenWorkspace] Failed to build from storage, using widget.files:`, error);
                widget.files?.forEach((file) => {
                    if (file.fileName && file.downloadURL) {
                        map[file.fileName] = file.downloadURL;
                        const normalized = file.fileName.replace(/^\.\//, '').replace(/^\//, '');
                        if (normalized !== file.fileName) map[normalized] = file.downloadURL;
                    }
                });
            }

            setFileMap(map);

            const tree: FileNode[] = [];
            const pathMap = new Map<string, FileNode>();

            widget.files?.forEach((file) => {
                const parts = file.fileName.split('/');
                let currentPath = '';
                let parentNode: FileNode | null = null;

                parts.forEach((part, index) => {
                    currentPath = currentPath ? `${currentPath}/${part}` : part;
                    const isFile = index === parts.length - 1;

                    if (!pathMap.has(currentPath)) {
                        const downloadURL = isFile
                            ? (map[currentPath] || map[file.fileName] || map[file.fileName.replace(/^\.\//, '').replace(/^\//, '')] || file.downloadURL)
                            : undefined;

                        const node: FileNode = {
                            name: part,
                            path: currentPath,
                            type: isFile ? 'file' : 'folder',
                            size: isFile ? file.size : undefined,
                            downloadURL: downloadURL,
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
            console.log(`[FullscreenWorkspace] Built file tree with ${tree.length} root nodes`);
        } catch (error) {
            console.error(`[FullscreenWorkspace] Error building file tree:`, error);
            showToast('Failed to load file tree. Some files may be missing or URLs expired.', 'error');
        }
    }, [widget, buildBundleFileMap]);

    useEffect(() => {
        setIsInitializing(true);
        const initialize = async () => {
            await buildFileTree();
            setIsInitializing(false);
        };
        initialize();
        setTitle(widget.title);
        setDescription(widget.description);
    }, [widget, buildFileTree]);

    useEffect(() => {
        if (leftPanelWidth) {
            localStorage.setItem('workspace-left-panel-width', leftPanelWidth.toString());
        }
    }, [leftPanelWidth]);

    useEffect(() => {
        if (rightPanelWidth) {
            localStorage.setItem('workspace-right-panel-width', rightPanelWidth.toString());
        }
    }, [rightPanelWidth]);

    const loadFileContent = useCallback(async (url: string, filePath?: string, retryCount = 0) => {
        const MAX_RETRIES = 2;

        try {
            setLoadingContent(true);
            console.log(`[FullscreenWorkspace] Loading file content from ${url} (attempt ${retryCount + 1})`);

            if (!url || !url.startsWith('http')) {
                throw new Error('Invalid file URL');
            }

            let response: Response;
            try {
                response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/plain, text/html, text/css, application/javascript, application/json, */*',
                    },
                    mode: 'cors',
                });
            } catch (fetchError) {
                if (retryCount < MAX_RETRIES && widget.storagePath && filePath) {
                    console.log(`[FullscreenWorkspace] Fetch failed, trying to regenerate URL`);
                    try {
                        const basePath = widget.storagePath || `uploads/${widget.uploadId || widget.id}`;
                        const fullPath = `${basePath}/${filePath}`;
                        const newUrl = await getFileURL(fullPath);
                        console.log(`[FullscreenWorkspace] Regenerated URL, retrying`);
                        return loadFileContent(newUrl, filePath, retryCount + 1);
                    } catch (regenerateError) {
                        console.error(`[FullscreenWorkspace] Failed to regenerate URL:`, regenerateError);
                    }
                }
                throw fetchError;
            }

            if (!response.ok) {
                if ((response.status === 404 || response.status === 403) &&
                    retryCount < MAX_RETRIES && widget.storagePath && filePath) {
                    console.log(`[FullscreenWorkspace] Got ${response.status}, trying to regenerate URL`);
                    try {
                        const basePath = widget.storagePath || `uploads/${widget.uploadId || widget.id}`;
                        const fullPath = `${basePath}/${filePath}`;
                        const newUrl = await getFileURL(fullPath);
                        console.log(`[FullscreenWorkspace] Regenerated URL, retrying`);
                        return loadFileContent(newUrl, filePath, retryCount + 1);
                    } catch (regenerateError) {
                        console.error(`[FullscreenWorkspace] Failed to regenerate URL:`, regenerateError);
                    }
                }
                throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
            }

            const text = await response.text();
            setFileContent(text);
            console.log(`[FullscreenWorkspace] Successfully loaded file content`);
        } catch (error) {
            console.error(`[FullscreenWorkspace] Error loading file content:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setFileContent(`Error loading file content: ${errorMessage}\n\nURL: ${url}\n\nIf this file exists, it may have been moved or the URL expired. Try refreshing the file tree.`);
            showToast(`Failed to load file: ${errorMessage}`, 'error');
        } finally {
            setLoadingContent(false);
        }
    }, [widget, getFileURL]);

    useEffect(() => {
        if (selectedFile && selectedFile.name.match(/\.(css|js|json|txt|md|html|htm)$/i)) {
            const url = selectedFile.downloadURL || fileMap[selectedFile.path] || fileMap[selectedFile.name];
            if (url) {
                loadFileContent(url, selectedFile.path);
            } else {
                setFileContent('');
            }
        } else {
            setFileContent('');
        }
        setEditingFile(false);
    }, [selectedFile, fileMap, loadFileContent]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !resizeRef.current) return;

            const deltaX = e.clientX - resizeRef.current.startX;

            if (isResizing === 'left') {
                const newWidth = Math.max(200, Math.min(600, resizeRef.current.startLeftWidth + deltaX));
                setLeftPanelWidth(newWidth);
            } else if (isResizing === 'right') {
                const newWidth = Math.max(300, Math.min(800, resizeRef.current.startRightWidth - deltaX));
                setRightPanelWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(null);
            resizeRef.current = null;
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizing]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

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

            const blob = new Blob([editedContent], { type: 'text/plain' });
            const file = new File([blob], selectedFile.name, { type: blob.type });

            const newDownloadURL = await uploadFile(file, filePath);

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

    const isEditableFile = (fileName: string): boolean => {
        return /\.(js|css|html|htm|json|txt|md)$/i.test(fileName);
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

    const handleResizeStart = (side: 'left' | 'right', e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(side);
        resizeRef.current = {
            startX: e.clientX,
            startLeftWidth: leftPanelWidth,
            startRightWidth: rightPanelWidth,
        };
    };

    const renderFileTree = (nodes: FileNode[], level: number = 0): React.ReactElement[] => {
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
                        tabIndex={0}
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

    const centerPanelWidth = `calc(100% - ${leftPanelCollapsed ? 0 : leftPanelWidth}px - ${rightPanelCollapsed ? 0 : rightPanelWidth}px - 4px)`;

    if (isInitializing) {
        return (
            <div className="fullscreen-workspace">
                <div className="workspace-loading-overlay">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading workspace...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fullscreen-workspace">
            {/* Top Bar */}
            <div className="workspace-top-bar">
                <div className="workspace-project-info">
                    {editingTitle ? (
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleTitleSave();
                            }}
                            className="workspace-title-input"
                            autoFocus
                        />
                    ) : (
                        <h2 onClick={() => setEditingTitle(true)} className="workspace-title-editable">
                            {title}
                        </h2>
                    )}
                    {editingDescription ? (
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleDescriptionSave}
                            className="workspace-description-input"
                            autoFocus
                        />
                    ) : (
                        <p onClick={() => setEditingDescription(true)} className="workspace-description-editable">
                            {description || 'Click to add description'}
                        </p>
                    )}
                </div>
                <div className="workspace-actions">
                    <EntryPointSelector widget={widget} />
                    <ThumbnailManager widget={widget} />
                    <button className="workspace-close-btn" onClick={onClose}>
                        <span>✕</span>
                        Close
                    </button>
                </div>
            </div>

            {/* Three Panel Layout */}
            <div className="workspace-panels">
                {/* Left Panel - File Tree */}
                {!leftPanelCollapsed && (
                    <>
                        <div className="workspace-left-panel" style={{ width: `${leftPanelWidth}px` }}>
                            <div className="panel-header">
                                <h3>📁 Files</h3>
                                <div className="panel-header-actions">
                                    <FileManager widget={widget} onFilesUpdated={buildFileTree} />
                                    <button
                                        className="panel-collapse-btn"
                                        onClick={() => setLeftPanelCollapsed(true)}
                                        title="Collapse"
                                    >
                                        ◀
                                    </button>
                                </div>
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
                        <div
                            className="resize-handle resize-handle-left"
                            onMouseDown={(e) => handleResizeStart('left', e)}
                        />
                    </>
                )}

                {leftPanelCollapsed && (
                    <button
                        className="panel-expand-btn panel-expand-left"
                        onClick={() => setLeftPanelCollapsed(false)}
                        title="Expand File Tree"
                    >
                        ▶
                    </button>
                )}

                {/* Center Panel - Editor/Preview */}
                <div className="workspace-center-panel" style={{ width: centerPanelWidth }}>
                    {selectedFile ? (
                        <div className="file-preview-container">
                            <div className="file-preview-header">
                                <h3>{selectedFile.name}</h3>
                                <div className="file-preview-actions">
                                    {isEditableFile(selectedFile.name) && !editingFile && (
                                        <button className="preview-action-btn edit-btn" onClick={handleStartEdit}>
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
                                        ) : editingFile ? (
                                            <textarea
                                                className="file-edit-textarea"
                                                value={editedContent}
                                                onChange={(e) => setEditedContent(e.target.value)}
                                                spellCheck={false}
                                            />
                                        ) : (
                                            <pre><code>{fileContent}</code></pre>
                                        )}
                                    </div>
                                ) : (
                                    <div className="file-info-preview">
                                        <p>Preview not available for this file type</p>
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
                        </div>
                    )}
                </div>

                {/* Right Panel - Widget Preview + Stats + Reprack + Upload */}
                {!rightPanelCollapsed && (
                    <>
                        <div
                            className="resize-handle resize-handle-right"
                            onMouseDown={(e) => handleResizeStart('right', e)}
                        />
                        <div className="workspace-right-panel" style={{ width: `${rightPanelWidth}px` }}>
                            <div className="panel-header">
                                <h3>Widget Preview</h3>
                                <button
                                    className="panel-collapse-btn"
                                    onClick={() => setRightPanelCollapsed(true)}
                                    title="Collapse"
                                >
                                    ▶
                                </button>
                            </div>
                            <div className="right-panel-content">
                                <div className="widget-preview-section">
                                    <BundleIframe bundle={widget} height={400} />
                                </div>

                                <div className="widget-stats-section">
                                    <h4>Stats</h4>
                                    <div className="stats-grid">
                                        <div className="stat-item">
                                            <span className="stat-label">Files</span>
                                            <span className="stat-value">{widget.files?.length || 0}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Slot</span>
                                            <span className="stat-value">{widget.slot || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <RepRackSlotManager widget={widget} widgets={widgets} />

                                <div className="widget-carousel-section">
                                    <WidgetCarousel
                                        widgets={widgets}
                                        onSlotFocus={(slot) => setCurrentSlot(slot)}
                                        isLoading={false}
                                    />
                                </div>

                                <div className="upload-workspace-section">
                                    <UploadWorkspace
                                        currentSlot={currentSlot}
                                        onSlotChange={setCurrentSlot}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {rightPanelCollapsed && (
                    <button
                        className="panel-expand-btn panel-expand-right"
                        onClick={() => setRightPanelCollapsed(false)}
                        title="Expand Widget Panel"
                    >
                        ◀
                    </button>
                )}
            </div>
        </div>
    );
}

