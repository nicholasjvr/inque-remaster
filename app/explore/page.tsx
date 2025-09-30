'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function ExplorePage() {
  const { user } = useAuth();

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
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="filter-container">
            <div className="filter-group">
              <label htmlFor="sortSelect">Sort By</label>
              <select id="sortSelect" className="filter-select">
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="name">Name A-Z</option>
                <option value="random">Random</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="categorySelect">Category</label>
              <select id="categorySelect" className="filter-select">
                <option value="all">All Categories</option>
                <option value="web">Web Apps</option>
                <option value="mobile">Mobile Apps</option>
                <option value="design">Design</option>
                <option value="game">Games</option>
                <option value="ai">AI/ML</option>
              </select>
            </div>
            <button id="refreshBtn" className="action-btn">
              <span>🔄</span>
              <span className="btn-text">Refresh</span>
            </button>
            <button id="clearFiltersBtn" className="action-btn">
              <span>🗑️</span>
              <span className="btn-text">Clear</span>
            </button>
          </div>
        </div>

        {/* Widget Grid */}
        <div className="explore-grid-container">
          <div id="exploreWidgetList" className="explore-widget-grid">
            {/* Widget cards will be dynamically inserted here */}
            <div className="explore-widget-card">
              <div className="explore-widget-header">
                <h3 className="explore-widget-title">Sample Project</h3>
                <div className="explore-widget-user">by Sample User</div>
              </div>
              <div className="explore-widget-preview">
                <div className="no-preview">📦 No Preview Available</div>
              </div>
              <div className="explore-widget-actions">
                <a href="/?user=sample" className="explore-profile-link">👤 Profile</a>
                <button className="explore-follow-btn">+ Follow</button>
                <button className="explore-message-btn">💬 Message</button>
              </div>
            </div>
          </div>

          {/* Load More */}
          <div id="loadMoreContainer" className="load-more-container" style={{ display: 'none' }}>
            <button id="loadMoreBtn" className="load-more-btn">
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


      {/* Toast Container */}
      <div id="toastContainer" className="toast-container"></div>

      {/* Import explore styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Orbitron:wght@400;500;600;700;800;900&display=swap');
      `}</style>
      <link rel="stylesheet" href="/explore.css" />
    </div>
  );
}
