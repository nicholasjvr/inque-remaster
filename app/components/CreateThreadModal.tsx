'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useThreads } from '@/hooks/useFirestore';

interface CreateThreadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateThreadModal({ onClose, onSuccess }: CreateThreadModalProps) {
  const { user } = useAuth();
  const { createThread } = useThreads();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [type, setType] = useState<'discussion' | 'game'>('discussion');
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be signed in to create a thread');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);

      await createThread({
        authorId: user.uid,
        title: title.trim(),
        content: content.trim(),
        type,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        projectId: projectId.trim() || undefined,
      });

      // Reset form
      setTitle('');
      setContent('');
      setTags('');
      setProjectId('');
      setType('discussion');
      
      onSuccess();
    } catch (err: any) {
      console.error('Error creating thread:', err);
      setError(err?.message || 'Failed to create thread');
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="create-thread-modal-overlay" onClick={handleOverlayClick}>
      <div className="create-thread-modal">
        <div className="create-thread-modal-header">
          <h2>Create New Thread</h2>
          <button className="create-thread-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-thread-form">
          {error && (
            <div className="create-thread-error">
              {error}
            </div>
          )}

          <div className="create-thread-field">
            <label htmlFor="thread-type">Type</label>
            <select
              id="thread-type"
              value={type}
              onChange={(e) => setType(e.target.value as 'discussion' | 'game')}
              className="create-thread-select"
            >
              <option value="discussion">💬 Discussion</option>
              <option value="game">🎮 Game</option>
            </select>
          </div>

          <div className="create-thread-field">
            <label htmlFor="thread-title">Title *</label>
            <input
              id="thread-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter thread title..."
              className="create-thread-input"
              required
              maxLength={200}
            />
          </div>

          <div className="create-thread-field">
            <label htmlFor="thread-content">Content *</label>
            <textarea
              id="thread-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, ask questions, or describe your project..."
              className="create-thread-textarea"
              rows={8}
              required
            />
          </div>

          <div className="create-thread-field">
            <label htmlFor="thread-tags">Tags (comma-separated)</label>
            <input
              id="thread-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="web-dev, react, game, etc."
              className="create-thread-input"
            />
          </div>

          <div className="create-thread-field">
            <label htmlFor="thread-project">Project ID (optional)</label>
            <input
              id="thread-project"
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Link to a project/widget ID"
              className="create-thread-input"
            />
          </div>

          <div className="create-thread-actions">
            <button
              type="button"
              className="create-thread-cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-thread-submit-btn"
              disabled={loading || !title.trim() || !content.trim()}
            >
              {loading ? 'Creating...' : 'Create Thread'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

