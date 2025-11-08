'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileHub from '@/app/components/ProfileHub';
import { Widget, useAllWidgets, useBundleSocial, toggleFollow, useVoting } from '@/hooks/useFirestore';
import BundleIframe from '@/app/components/BundleIframe';


export default function ExplorePage() {
  const { user } = useAuth();
  const { widgets, loading, error } = useAllWidgets({ limitCount: 100 });
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'name' | 'random'>('recent');
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState<string>('');
  const [fullscreenWidget, setFullscreenWidget] = useState<Widget | null>(null);

  const sorted = useMemo(() => {
    const arr = [...widgets];
    switch (sortBy) {
      case 'name':
        return arr.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'popular':
        return arr.sort((a, b) => ((b as any).likes || 0) - ((a as any).likes || 0));
      case 'random':
        return arr.sort(() => Math.random() - 0.5);
      default:
        return arr;
    }
  }, [widgets, sortBy]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((w) => {
      const tags = Array.isArray(w.tags)
        ? w.tags
        : `${w.tags || ''}`.split(',').map((t) => t.trim());
      const categoryOk = category === 'all' || tags.includes(category);
      const hay = `${w.title || ''} ${w.description || ''} ${tags.join(' ')} ${w.id || ''}`.toLowerCase();
      const queryOk = !q || hay.includes(q);
      return categoryOk && queryOk;
    });
  }, [sorted, category, query]);

  const openFullscreen = (w: Widget) => setFullscreenWidget(w);
  const closeFullscreen = () => setFullscreenWidget(null);

  return (
    <div className="min-h-screen w-full bg-[#04060d] text-white">
      {/* Header */}
      <header className="explore-header">
        <div className="header-content">
          <div className="header-title">
            <span className="title-icon">🔍</span>
            <h1>Explore Projects</h1>
          </div>
          <div className="header-actions">
            <a href="/" className="action-btn">
              <span>🏠</span>
              <span className="btn-text">Home</span>
            </a>
            <a href="/showcase" className="action-btn">
              <span>🏆</span>
              <span className="btn-text">Showcase</span>
            </a>
            <a href="/users" className="action-btn">
              <span>👥</span>
              <span className="btn-text">Creators</span>
            </a>
          </div>
        </div>
        <div className="header-profile-hub">
          <ProfileHub variant="billboard" />
        </div>
      </header>

      {/* Main Content */}
      <main className="explore-main">
        {/* Voting Banner CTA */}
        <div className="voting-banner">
          <div className="voting-banner-content">
            <div className="voting-banner-icon">⭐</div>
            <div className="voting-banner-text">
              <h2 className="voting-banner-title">Vote for the Best Demo</h2>
              <p className="voting-banner-description">Help decide which projects deserve the spotlight! Your vote matters.</p>
            </div>
            <a href="/showcase" className="voting-banner-btn">
              <span>🏆</span>
              <span>View Showcase</span>
            </a>
          </div>
        </div>

        {/* Controls Section */}
        <div className="explore-controls">
          <div className="search-container">
            <input
              type="text"
              id="widgetSearch"
              className="search-input"
              placeholder="Search projects, creators, or tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="filter-container">
            <div className="filter-group">
              <label htmlFor="sortSelect">Sort By</label>
              <select id="sortSelect" className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="name">Name A-Z</option>
                <option value="random">Random</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="categorySelect">Category</label>
              <select id="categorySelect" className="filter-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">All Categories</option>
                <option value="web">Web Apps</option>
                <option value="mobile">Mobile Apps</option>
                <option value="design">Design</option>
                <option value="game">Games</option>
                <option value="ai">AI/ML</option>
              </select>
            </div>
            <button id="refreshBtn" className="action-btn" onClick={() => window.location.reload()}>
              <span>🔄</span>
              <span className="btn-text">Refresh</span>
            </button>
            <button id="clearFiltersBtn" className="action-btn" onClick={() => { setQuery(''); setCategory('all'); setSortBy('recent'); }}>
              <span>🗑️</span>
              <span className="btn-text">Clear</span>
            </button>
          </div>
        </div>

        {/* Widget Grid */}
        <div className="explore-grid-container">
          <div id="exploreWidgetList" className="explore-widget-grid">
            {loading && (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <div className="loading-text">Loading projects…</div>
                <div className="loading-subtitle">Fetching live bundles from Firestore</div>
              </div>
            )}
            {error && (
              <div className="error-state" style={{ padding: 20, background: 'rgba(255,0,0,0.06)', borderRadius: 8 }}>
                <h3 style={{ color: '#ffdddd' }}>Unable to load projects</h3>
                <p style={{ color: '#ffdede' }}>{String(error)}</p>
                <p style={{ color: '#e6e6e6' }}>Tip: check Firebase config (NEXT_PUBLIC_FIREBASE_*) and Firestore/Storage rules in the Firebase Console.</p>
                <button className="empty-action-btn" onClick={() => window.location.reload()}>
                  Retry
                </button>
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div id="emptyState" className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No projects found</h3>
                <p>Try adjusting your search filters or check back later for new projects.</p>
                <button className="empty-action-btn" onClick={() => window.location.reload()}>
                  Refresh Page
                </button>
              </div>
            )}
            {!loading && filtered.map((widget) => (
              <div key={widget.id} className="explore-widget-card">
                <div className="explore-widget-header">
                  <h3 className="explore-widget-title">{widget.title || 'Untitled Project'}</h3>
                  <div className="explore-widget-user">by {widget.userId?.slice(0, 6) || 'Unknown'}</div>
                </div>
                <div className="explore-widget-preview">
                  <BundleIframe bundle={widget} height={200} />
                  <div className="preview-overlay">
                    <button className="fullscreen-demo-btn" onClick={() => openFullscreen(widget)}>
                      ▶ Demo Fullscreen
                    </button>
                  </div>
                </div>
                <SocialRow widget={widget} currentUserId={user?.uid} />
                <VotingRow widget={widget} currentUserId={user?.uid} />
              </div>
            ))}
          </div>

          {/* Load More */}
          <div id="loadMoreContainer" className="load-more-container" style={{ display: filtered.length >= 50 ? 'flex' : 'none' }}>
            <button id="loadMoreBtn" className="load-more-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <span className="btn-icon">📄</span>
              <span className="btn-text">Load More</span>
            </button>
          </div>

          {/* Empty State */}
          <div id="emptyState" className="empty-state" style={{ display: 'none' }}>
            <div className="empty-icon">🔍</div>
            <h3>No projects found</h3>
            <p>Try adjusting your search filters or check back later for new projects.</p>
            <button className="empty-action-btn" onClick={() => window.location.reload()}>
              Refresh Page
            </button>
          </div>
        </div>
      </main>


      {/* Fullscreen Modal */}
      {fullscreenWidget && (
        <div className="widget-fullscreen-modal active" role="dialog" aria-modal="true">
          <div className="fullscreen-content">
            <div className="fullscreen-header">
              <h3 className="fullscreen-title">{fullscreenWidget.title || 'Live Demo'}</h3>
              <button className="fullscreen-close" onClick={closeFullscreen}>×</button>
            </div>
            <div className="fullscreen-body">
              <BundleIframe bundle={fullscreenWidget} height={'100%'} />
            </div>
          </div>
        </div>
      )}

      {/* Import explore styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Orbitron:wght@400;500;600;700;800;900&display=swap');
      `}</style>
      <link rel="stylesheet" href="/explore.css" />
    </div>
  );
}

function SocialRow({ widget, currentUserId }: { widget: Widget; currentUserId?: string }) {
  const social = useBundleSocial(widget?.id, currentUserId, 'widget');
  return (
    <div className="explore-widget-actions" style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', gap: 8 }}>
      <a href={`/?user=${widget.userId}`} className="explore-profile-link">👤 Profile</a>
      <button className="explore-follow-btn" onClick={() => currentUserId && toggleFollow(currentUserId, widget.userId || '')}>+ Follow</button>
      <button className="explore-like-btn" onClick={() => social.toggleLike(widget)}>
        ❤️ {social.likedByMe ? 'Unlike' : 'Like'} {social.likes ? `(${social.likes})` : ''}
      </button>
    </div>
  );
}

function VotingRow({ widget, currentUserId }: { widget: Widget; currentUserId?: string }) {
  const voting = useVoting(widget?.id, currentUserId, 'widget');
  const { user } = useAuth();

  const handleVote = () => {
    if (!user) {
      // Could show sign-in prompt here
      return;
    }
    voting.toggleVote(widget);
  };

  return (
    <div className="explore-voting-row">
      <button
        className={`explore-vote-btn ${voting.votedByMe ? 'voted' : ''}`}
        onClick={handleVote}
        disabled={!user}
        title={!user ? 'Sign in to vote' : voting.votedByMe ? 'Remove your vote' : 'Vote for this demo'}
      >
        <span className="vote-icon">⭐</span>
        <span className="vote-text">{voting.votedByMe ? 'Voted' : 'Vote'}</span>
        {voting.votes > 0 && <span className="vote-count">({voting.votes})</span>}
      </button>
    </div>
  );
}
