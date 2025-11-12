'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useThreads, Thread, usePublicUserById } from '@/hooks/useFirestore';
import ProtectedRoute from '../components/ProtectedRoute';
import CreateThreadModal from '../components/CreateThreadModal';
import ThreadDetailView from '../components/ThreadDetailView';
import ProfileHub from '../components/ProfileHub';
import '../knowledge.css';

export default function KnowledgePage() {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<'createdAt' | 'lastPostAt' | 'postsCount'>('lastPostAt');
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { threads, loading, error } = useThreads({ limitCount: 50, orderByField: sortBy });

  const handleThreadClick = (thread: Thread) => {
    setSelectedThread(thread);
  };

  const handleBackToList = () => {
    setSelectedThread(null);
  };

  // Filter threads by search query
  const filteredThreads = threads.filter(thread => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      thread.title.toLowerCase().includes(query) ||
      thread.content.toLowerCase().includes(query) ||
      thread.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  if (selectedThread) {
    return (
      <div className="min-h-screen w-full bg-[#04060d] text-white">
        <ThreadDetailView thread={selectedThread} onBack={handleBackToList} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#04060d] text-white">
      {/* Seamless Header */}
      <header className="knowledge-header-seamless">
        <div className="header-gradient-overlay"></div>
        <div className="header-content-seamless">
          <div className="header-left">
            <div className="header-title-seamless">
              <span className="title-icon">📚</span>
              <h1>Knowledge Board</h1>
            </div>
            <nav className="header-nav">
              <a href="/" className="nav-link">Home</a>
              <a href="/explore" className="nav-link">Explore</a>
              <a href="/showcase" className="nav-link">Showcase</a>
              <a href="/projects" className="nav-link">Projects</a>
            </nav>
          </div>
          <div className="header-right">
            <div className="search-bar-compact header-search-hidden">
              <input
                type="text"
                className="search-input-compact"
                placeholder="Search threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="search-icon-compact">🔍</span>
            </div>
            <ProtectedRoute requireAuth={false}>
              {user && (
                <button
                  className="knowledge-create-btn-header"
                  onClick={() => setShowCreateModal(true)}
                >
                  <span>+</span>
                  <span>New Thread</span>
                </button>
              )}
            </ProtectedRoute>
            <div className="header-profile-compact">
              <ProfileHub variant="billboard" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="knowledge-main">

        {/* Controls */}
        <div className="knowledge-controls">
          <div className="knowledge-sort">
            <label>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="knowledge-sort-select"
            >
              <option value="lastPostAt">Latest Activity</option>
              <option value="createdAt">Newest First</option>
              <option value="postsCount">Most Replies</option>
            </select>
          </div>
        </div>

        {/* Threads List */}
        <div className="knowledge-content">
          {loading && (
            <div className="knowledge-loading">
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
              <p>Loading threads...</p>
            </div>
          )}

          {error && (
            <div className="knowledge-error">
              <h3>Error loading threads</h3>
              <p>{String(error)}</p>
            </div>
          )}

          {!loading && !error && threads.length === 0 && (
            <div className="knowledge-empty">
              <div className="knowledge-empty-icon">💬</div>
              <h3>No threads yet</h3>
              <p>Be the first to start a discussion!</p>
              {user && (
                <button
                  className="knowledge-create-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create First Thread
                </button>
              )}
            </div>
          )}

          {!loading && !error && threads.length > 0 && (
            <>
              {filteredThreads.length === 0 ? (
                <div className="knowledge-empty">
                  <div className="knowledge-empty-icon">🔍</div>
                  <h3>No threads match your search</h3>
                  <p>Try adjusting your search query</p>
                </div>
              ) : (
                <div className="knowledge-threads">
                  {filteredThreads.map((thread) => (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      onClick={() => handleThreadClick(thread)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Create Thread Modal */}
      {showCreateModal && (
        <CreateThreadModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Import fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Orbitron:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
}

function ThreadCard({ thread, onClick }: { thread: Thread; onClick: () => void }) {
  const { user: author } = usePublicUserById(thread.authorId);

  const formatDate = (timestamp: any) => {
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
    <div className="knowledge-thread-card" onClick={onClick}>
      <div className="thread-card-header">
        <div className="thread-card-title-section">
          <h3 className="thread-card-title">{thread.title}</h3>
          {thread.tags && thread.tags.length > 0 && (
            <div className="thread-card-tags">
              {thread.tags.map((tag, idx) => (
                <span key={idx} className="thread-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="thread-card-type">
          {thread.type === 'game' ? '🎮' : '💬'}
        </div>
      </div>

      <div className="thread-card-content">
        <p className="thread-card-preview">
          {thread.content.length > 200
            ? `${thread.content.substring(0, 200)}...`
            : thread.content}
        </p>
      </div>

      <div className="thread-card-footer">
        <div className="thread-card-author">
          <span className="thread-author-avatar">
            {author?.photoURL ? (
              <img src={author.photoURL} alt={author.displayName || 'User'} />
            ) : (
              <span>👤</span>
            )}
          </span>
          <span className="thread-author-name">
            {author?.displayName || author?.handle || thread.authorId.slice(0, 8)}
          </span>
        </div>
        <div className="thread-card-stats">
          <span className="thread-stat">
            <span className="stat-icon">💬</span>
            {thread.postsCount || 0}
          </span>
          <span className="thread-stat">
            <span className="stat-icon">👁️</span>
            {thread.views || 0}
          </span>
          <span className="thread-stat">
            <span className="stat-icon">🕒</span>
            {formatDate(thread.lastPostAt || thread.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

