'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicUsers } from '@/hooks/useFirestore';

export default function UsersPage() {
  const { user } = useAuth();
  const { users, loading } = usePublicUsers({ limitCount: 100 });
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...users];
    if (q) list = list.filter(u => `${u.displayName || ''} ${u.bio || ''}`.toLowerCase().includes(q));
    switch (sortBy) {
      case 'recent':
        return list.sort((a, b) => (b.lastActiveAt?.toDate?.().getTime?.() ?? 0) - (a.lastActiveAt?.toDate?.().getTime?.() ?? 0));
      case 'projects':
        return list.sort((a, b) => (b.projectsCount ?? 0) - (a.projectsCount ?? 0));
      case 'random':
        return list.sort(() => Math.random() - 0.5);
      default:
        return list.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    }
  }, [users, sortBy, query, filterBy]);

  return (
    <div className="min-h-screen w-full bg-[#04060d] text-white">
      {/* Header */}
      <header className="users-header">
        <div className="header-content">
          <div className="header-title">
            <span className="title-icon">👥</span>
            <h1>Creators</h1>
          </div>
          <div className="header-actions">
            <a href="/" className="action-btn">
              <span>🏠</span>
              <span className="btn-text">Home</span>
            </a>
            <a href="/explore" className="action-btn">
              <span>🔍</span>
              <span className="btn-text">Explore</span>
            </a>
            <a href="/showcase" className="action-btn">
              <span>🏆</span>
              <span className="btn-text">Showcase</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="users-main">
        {/* Controls Section */}
        <div className="users-controls">
          <div className="search-container">
            <input
              type="text"
              id="userSearch"
              className="search-input"
              placeholder="Search creators, skills, or interests..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="filter-container">
            <div className="filter-group">
              <label htmlFor="filterSelect">Filter By</label>
              <select id="filterSelect" className="filter-select" value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
                <option value="all">All Creators</option>
                <option value="online">Online Now</option>
                <option value="recent">Recently Active</option>
                <option value="creators">Active Creators</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="sortSelect">Sort By</label>
              <select id="sortSelect" className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="name">Name A-Z</option>
                <option value="recent">Recently Active</option>
                <option value="projects">Most Projects</option>
                <option value="random">Random</option>
              </select>
            </div>
            <button id="refreshBtn" className="action-btn" onClick={() => window.location.reload()}>
              <span>🔄</span>
              <span className="btn-text">Refresh</span>
            </button>
            <button id="clearFiltersBtn" className="action-btn" onClick={() => { setQuery(''); setFilterBy('all'); setSortBy('name'); }}>
              <span>🗑️</span>
              <span className="btn-text">Clear</span>
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="users-stats-bar">
          <div className="stat-item">
            <div className="stat-number" id="total-users">0</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-item">
            <div className="stat-number" id="online-users">0</div>
            <div className="stat-label">Online Now</div>
          </div>
          <div className="stat-item">
            <div className="stat-number" id="active-today">0</div>
            <div className="stat-label">Active Today</div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="users-grid-container">
          <div id="users-container" className="users-grid">
            {loading && (
              <div className="users-loading">
                <div className="loading-spinner"></div>
                <div className="loading-text">Loading creators…</div>
                <div className="loading-subtitle">Fetching profiles from Firestore</div>
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No creators found</h3>
                <p>Try adjusting your search filters or check back later for new creators.</p>
                <button className="empty-action-btn" onClick={() => window.location.reload()}>
                  Refresh Page
                </button>
              </div>
            )}
            {!loading && filtered.map((u) => (
              <div key={u.id} className="user-card">
                <div className="user-card-header">
                  <div className="user-card-pic" style={{ backgroundImage: `url(${u.photoURL || '/api/placeholder/80/80'})` }}></div>
                  <div className="online-indicator"></div>
                </div>
                <div className="user-card-content">
                  <h3 className="user-card-name">{u.displayName || 'Creator'}</h3>
                  <p className="user-card-bio">{u.bio || 'No bio yet.'}</p>
                  <div className="user-card-stats">
                    <div className="stat">
                      <span className="stat-icon">📊</span>
                      <span className="stat-value">{u.projectsCount ?? 0}</span>
                      <span className="stat-label">Projects</span>
                    </div>
                    <div className="stat">
                      <span className="stat-icon">🕐</span>
                      <span className="stat-value">{u.lastActiveAt ? 'Active' : '—'}</span>
                      <span className="stat-label">Active</span>
                    </div>
                  </div>
                  <div className="user-card-skills">
                    <span className="skill-badge">Creator</span>
                  </div>
                </div>
                <div className="user-card-actions">
                  <button className="chat-btn">
                    <span className="btn-icon">💬</span>
                    <span className="btn-text">Chat</span>
                  </button>
                  <a href={`/?user=${u.id}`} className="view-profile-btn">
                    <span className="btn-icon">👤</span>
                    <span className="btn-text">Profile</span>
                  </a>
                  <button className="follow-btn">
                    <span className="btn-icon">➕</span>
                    <span className="btn-text">Follow</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div id="loadMoreContainer" className="load-more-container" style={{ display: filtered.length >= 100 ? 'flex' : 'none' }}>
            <button id="loadMoreBtn" className="load-more-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <span className="btn-icon">📄</span>
              <span className="btn-text">Load More</span>
            </button>
          </div>

          {/* Empty State */}
          <div id="emptyState" className="empty-state" style={{ display: 'none' }}>
            <div className="empty-icon">👥</div>
            <h3>No creators found</h3>
            <p>Try adjusting your search filters or check back later for new creators.</p>
            <button className="empty-action-btn" onClick={() => window.location.reload()}>
              Refresh Page
            </button>
          </div>
        </div>
      </main>


      {/* Chat Modal */}
      <div id="chatModal" className="chat-modal" style={{ display: 'none' }}>
        <div className="modal-content">
          <div className="modal-header">
            <h2 id="chat-with-user">Chat with User</h2>
            <button id="closeChat" className="close-button">&times;</button>
          </div>
          <div className="modal-body">
            <div id="chat-messages" className="chat-messages">
              {/* Messages will be dynamically inserted here */}
            </div>
          </div>
          <div className="modal-footer">
            <input
              type="text"
              id="chat-message-input"
              placeholder="Type your message..."
              maxLength={500}
            />
            <button id="chat-send-btn" className="chat-send-btn">Send</button>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      <div id="errorModal" className="error-modal" style={{ display: 'none' }}>
        <div className="error-modal-content">
          <div className="error-icon">⚠️</div>
          <h3 id="errorTitle">Error</h3>
          <p id="errorMessage">An error occurred. Please try again.</p>
          <div className="error-actions">
            <button id="errorRetryBtn" className="error-btn primary">Retry</button>
            <button id="errorCloseBtn" className="error-btn secondary">Close</button>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <div id="toastContainer" className="toast-container"></div>

      {/* Import users styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Orbitron:wght@400;500;600;700;800;900&display=swap');
      `}</style>
      <link rel="stylesheet" href="/users.css" />
    </div>
  );
}
