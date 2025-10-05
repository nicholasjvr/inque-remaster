'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileHub from '@/app/components/ProfileHub';
import { WidgetBundle, useWidgetBundles } from '@/hooks/useFirestore';
import BundleIframe from '@/app/components/BundleIframe';


export default function ExplorePage() {
  const { user } = useAuth();
  const { bundles, loading } = useWidgetBundles({ orderByCreated: true, limitCount: 50 });
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'name' | 'random'>('recent');
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState<string>('');
  const [fullscreenBundle, setFullscreenBundle] = useState<WidgetBundle | null>(null);

  const sorted = useMemo(() => {
    const arr = [...bundles];
    switch (sortBy) {
      case 'name':
        return arr.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'popular':
        return arr; // TODO: sort by engagement when available
      case 'random':
        return arr.sort(() => Math.random() - 0.5);
      default:
        return arr; // already recent
    }
  }, [bundles, sortBy]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((b) => {
      const tags = Array.isArray((b as any).tags)
        ? ((b as any).tags as string[])
        : `${(b as any).tags || ''}`.split(',').map((t) => t.trim());
      const categoryOk = category === 'all' || tags.includes(category);
      const hay = `${b.title || ''} ${(b as any).description || ''} ${tags.join(' ')} ${b.id || ''}`.toLowerCase();
      const queryOk = !q || hay.includes(q);
      return categoryOk && queryOk;
    });
  }, [sorted, category, query]);

  const openFullscreen = (b: WidgetBundle) => setFullscreenBundle(b);
  const closeFullscreen = () => setFullscreenBundle(null);

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
            {!loading && filtered.length === 0 && (
              <div id="emptyState" className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No projects found</h3>
                <p>Try adjusting your search filters or check back later for new projects.</p>
                <button className="empty-action-btn" onClick={() => window.location.reload()}>
                  Refresh Page
                </button>
              </div>
            )}
            {!loading && filtered.map((bundle) => (
              <div key={bundle.id} className="explore-widget-card">
                <div className="explore-widget-header">
                  <h3 className="explore-widget-title">{bundle.title || 'Untitled Project'}</h3>
                  <div className="explore-widget-user">by {bundle.id?.slice(0, 6) || 'Unknown'}</div>
                </div>
                <div className="explore-widget-preview">
                  <BundleIframe bundle={bundle} height={200} />
                  <div className="preview-overlay">
                    <button className="fullscreen-demo-btn" onClick={() => openFullscreen(bundle)}>
                      ▶ Demo Fullscreen
                    </button>
                  </div>
                </div>
                <div className="explore-widget-actions">
                  <a href={`/?user=${bundle.id}`} className="explore-profile-link">👤 Profile</a>
                  <button className="explore-follow-btn">+ Follow</button>
                  <button className="explore-message-btn">💬 Message</button>
                </div>
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
      {fullscreenBundle && (
        <div className="widget-fullscreen-modal active" role="dialog" aria-modal="true">
          <div className="fullscreen-content">
            <div className="fullscreen-header">
              <h3 className="fullscreen-title">{fullscreenBundle.title || 'Live Demo'}</h3>
              <button className="fullscreen-close" onClick={closeFullscreen}>×</button>
            </div>
            <div className="fullscreen-body">
              <BundleIframe bundle={fullscreenBundle} height={'100%'} />
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
