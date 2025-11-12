'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Thread, useThread, useThreadPosts, Post, usePublicUserById } from '@/hooks/useFirestore';

interface ThreadDetailViewProps {
  thread: Thread;
  onBack: () => void;
}

export default function ThreadDetailView({ thread: initialThread, onBack }: ThreadDetailViewProps) {
  const { user } = useAuth();
  const { thread, loading: threadLoading, incrementViews } = useThread(initialThread.id);
  const { posts, loading: postsLoading, addPost } = useThreadPosts(initialThread.id);
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<Post | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const hasIncrementedViews = useRef(false);

  // Increment views when thread is loaded (only once)
  useEffect(() => {
    // Only increment if thread is loaded and we haven't incremented yet
    if (!threadLoading && thread && !hasIncrementedViews.current) {
      hasIncrementedViews.current = true;
      incrementViews();
    }
  }, [thread, threadLoading, incrementViews]);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !replyContent.trim()) return;

    setSubmitting(true);
    try {
      await addPost({
        threadId: initialThread.id,
        authorId: user.uid,
        content: replyContent.trim(),
        parentPostId: replyingTo?.id,
      });
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error adding post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const displayThread = thread || initialThread;
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="thread-detail-view">
      <div className="thread-detail-container">
        {/* Header */}
        <div className="thread-detail-header">
          <button className="thread-detail-back-btn" onClick={onBack}>
            ← Back to Threads
          </button>
        </div>

        {/* Thread Content */}
        {threadLoading ? (
          <div className="thread-detail-loading">
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
            <p>Loading thread...</p>
          </div>
        ) : (
          <div className="thread-detail-content">
            <div className="thread-detail-main">
              <div className="thread-detail-title-section">
                <div className="thread-detail-type-badge">
                  {displayThread.type === 'game' ? '🎮 Game' : '💬 Discussion'}
                </div>
                <h1 className="thread-detail-title">{displayThread.title}</h1>
                {displayThread.tags && displayThread.tags.length > 0 && (
                  <div className="thread-detail-tags">
                    {displayThread.tags.map((tag, idx) => (
                      <span key={idx} className="thread-detail-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <ThreadAuthor authorId={displayThread.authorId} createdAt={displayThread.createdAt} />

              <div className="thread-detail-body">
                <p className="thread-detail-text">{displayThread.content}</p>
              </div>

              <div className="thread-detail-stats">
                <span className="thread-detail-stat">
                  <span className="stat-icon">💬</span>
                  {displayThread.postsCount || 0} {displayThread.postsCount === 1 ? 'reply' : 'replies'}
                </span>
                <span className="thread-detail-stat">
                  <span className="stat-icon">👁️</span>
                  {displayThread.views || 0} views
                </span>
                <span className="thread-detail-stat">
                  <span className="stat-icon">🕒</span>
                  {formatRelativeTime(displayThread.createdAt)}
                </span>
              </div>
            </div>

            {/* Posts Section */}
            <div className="thread-detail-posts">
              <h2 className="thread-detail-posts-title">
                Replies ({displayThread.postsCount || 0})
              </h2>

              {postsLoading ? (
                <div className="thread-detail-loading">
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                  </div>
                  <p>Loading replies...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="thread-detail-empty-posts">
                  <p>No replies yet. Be the first to reply!</p>
                </div>
              ) : (
                <div className="thread-detail-posts-list">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onReply={() => setReplyingTo(post)}
                      isReplying={replyingTo?.id === post.id}
                    />
                  ))}
                </div>
              )}

              {/* Reply Form */}
              {user ? (
                <div className="thread-detail-reply-form">
                  {replyingTo && (
                    <div className="thread-detail-replying-to">
                      <span>Replying to: {replyingTo.content.substring(0, 50)}...</span>
                      <button onClick={() => setReplyingTo(null)}>×</button>
                    </div>
                  )}
                  <form onSubmit={handleSubmitReply}>
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={replyingTo ? 'Write your reply...' : 'Write a reply...'}
                      className="thread-detail-reply-textarea"
                      rows={4}
                      required
                    />
                    <div className="thread-detail-reply-actions">
                      <button
                        type="submit"
                        className="thread-detail-reply-submit"
                        disabled={submitting || !replyContent.trim()}
                      >
                        {submitting ? 'Posting...' : 'Post Reply'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="thread-detail-sign-in-prompt">
                  <p>Sign in to reply to this thread</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadAuthor({ authorId, createdAt }: { authorId: string; createdAt: any }) {
  const { user: author } = usePublicUserById(authorId);
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="thread-detail-author">
      <div className="thread-detail-author-avatar">
        {author?.photoURL ? (
          <img src={author.photoURL} alt={author.displayName || 'User'} />
        ) : (
          <span>👤</span>
        )}
      </div>
      <div className="thread-detail-author-info">
        <span className="thread-detail-author-name">
          {author?.displayName || author?.handle || authorId.slice(0, 8)}
        </span>
        <span className="thread-detail-author-date">{formatDate(createdAt)}</span>
      </div>
    </div>
  );
}

function PostCard({
  post,
  onReply,
  isReplying,
}: {
  post: Post;
  onReply: () => void;
  isReplying: boolean;
}) {
  const { user: currentUser } = useAuth();
  const { user: author } = usePublicUserById(post.authorId);

  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`thread-post-card ${isReplying ? 'replying' : ''}`}>
      <div className="thread-post-header">
        <div className="thread-post-author">
          <div className="thread-post-avatar">
            {author?.photoURL ? (
              <img src={author.photoURL} alt={author.displayName || 'User'} />
            ) : (
              <span>👤</span>
            )}
          </div>
          <div className="thread-post-author-info">
            <span className="thread-post-author-name">
              {author?.displayName || author?.handle || post.authorId.slice(0, 8)}
            </span>
            <span className="thread-post-date">{formatRelativeTime(post.createdAt)}</span>
          </div>
        </div>
        {currentUser && (
          <button className="thread-post-reply-btn" onClick={onReply}>
            Reply
          </button>
        )}
      </div>
      <div className="thread-post-content">
        <p>{post.content}</p>
      </div>
    </div>
  );
}

