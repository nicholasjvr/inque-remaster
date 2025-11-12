'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileHub from '@/app/components/ProfileHub';
import SignUpPrompt from '@/app/components/SignUpPrompt';
import { Widget, useAllWidgets, useBundleSocial, toggleFollow, useVoting } from '@/hooks/useFirestore';
import BundleIframe from '@/app/components/BundleIframe';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🌟' },
  { id: 'web', label: 'Web Apps', icon: '🌐' },
  { id: 'mobile', label: 'Mobile', icon: '📱' },
  { id: 'design', label: 'Design', icon: '🎨' },
  { id: 'game', label: 'Games', icon: '🎮' },
  { id: 'ai', label: 'AI/ML', icon: '🤖' },
  { id: 'tool', label: 'Tools', icon: '🛠️' },
  { id: 'creative', label: 'Creative', icon: '✨' },
];

export default function ExplorePage() {
  const { user } = useAuth();
  const { widgets, loading, error } = useAllWidgets({ limitCount: 100 });
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'name' | 'random'>('recent');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [query, setQuery] = useState<string>('');
  const [fullscreenWidget, setFullscreenWidget] = useState<Widget | null>(null);

  // Get all unique categories from widgets
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    widgets.forEach((w) => {
      const tags = Array.isArray(w.tags)
        ? w.tags
        : `${w.tags || ''}`.split(',').map((t) => t.trim()).filter(Boolean);
      tags.forEach((tag) => cats.add(tag.toLowerCase()));
    });
    return Array.from(cats);
  }, [widgets]);

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
        return arr.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
    }
  }, [widgets, sortBy]);

  // Group widgets by category
  const widgetsByCategory = useMemo(() => {
    const grouped: Record<string, Widget[]> = {};
    const q = query.trim().toLowerCase();

    sorted.forEach((w) => {
      const tags = Array.isArray(w.tags)
        ? w.tags
        : `${w.tags || ''}`.split(',').map((t) => t.trim()).filter(Boolean);

      const hay = `${w.title || ''} ${w.description || ''} ${tags.join(' ')} ${w.id || ''}`.toLowerCase();
      const queryOk = !q || hay.includes(q);

      if (!queryOk) return;

      // Add to "all" category
      if (!grouped['all']) grouped['all'] = [];
      grouped['all'].push(w);

      // Add to specific categories
      tags.forEach((tag) => {
        const cat = tag.toLowerCase();
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(w);
      });
    });

    return grouped;
  }, [sorted, query]);

  // Featured/Popular widgets (top 6 by likes)
  const featuredWidgets = useMemo(() => {
    return sorted
      .sort((a, b) => ((b as any).likes || 0) - ((a as any).likes || 0))
      .slice(0, 6);
  }, [sorted]);

  const openFullscreen = (w: Widget) => setFullscreenWidget(w);
  const closeFullscreen = () => setFullscreenWidget(null);

  return (
    <div className="min-h-screen w-full bg-[#04060d] text-white">
      {/* Seamless Header */}
      <header className="explore-header-seamless">
        <div className="header-gradient-overlay"></div>
        <div className="header-content-seamless">
          <div className="header-left">
            <div className="header-title-seamless">
              <span className="title-icon">🔍</span>
              <h1>Explore</h1>
            </div>
            <nav className="header-nav">
              <a href="/" className="nav-link">Home</a>
              <a href="/showcase" className="nav-link">Showcase</a>
              <a href="/users" className="nav-link">Creators</a>
            </nav>
          </div>
          <div className="header-right">
            <div className="search-bar-compact header-search-hidden">
              <input
                type="text"
                className="search-input-compact"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="search-icon-compact">🔍</span>
            </div>
            <div className="header-profile-compact">
              <ProfileHub variant="billboard" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="explore-main-seamless">
        {/* Featured Hero Section */}
        {featuredWidgets.length > 0 && !loading && (
          <section className="featured-section">
            <div className="featured-header">
              <h2 className="section-title">🔥 Trending Now</h2>
              <p className="section-subtitle">Most popular projects this week</p>
            </div>
            <div className="featured-grid">
              {featuredWidgets.slice(0, 6).map((widget) => (
                <FeaturedCard key={widget.id} widget={widget} onOpenFullscreen={openFullscreen} currentUserId={user?.uid} />
              ))}
            </div>
          </section>
        )}

        {/* Category Pills */}
        <section className="category-pills-section">
          <div className="category-pills-container">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="pill-icon">{cat.icon}</span>
                <span className="pill-label">{cat.label}</span>
                {widgetsByCategory[cat.id] && (
                  <span className="pill-count">({widgetsByCategory[cat.id].length})</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Category Rows (Netflix-style) */}
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

        {!loading && !error && (
          <>
            {/* Show selected category or all categories */}
            {selectedCategory === 'all' ? (
              // Show all categories as rows
              Object.entries(widgetsByCategory)
                .filter(([cat]) => cat !== 'all' && widgetsByCategory[cat].length > 0)
                .map(([categoryId, categoryWidgets]) => {
                  const categoryInfo = CATEGORIES.find(c => c.id === categoryId) ||
                    { id: categoryId, label: categoryId.charAt(0).toUpperCase() + categoryId.slice(1), icon: '📦' };
                  return (
                    <CategoryRow
                      key={categoryId}
                      category={categoryInfo}
                      widgets={categoryWidgets}
                      onOpenFullscreen={openFullscreen}
                      currentUserId={user?.uid}
                    />
                  );
                })
            ) : (
              // Show selected category
              widgetsByCategory[selectedCategory] && widgetsByCategory[selectedCategory].length > 0 ? (
                <CategoryRow
                  category={CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0]}
                  widgets={widgetsByCategory[selectedCategory]}
                  onOpenFullscreen={openFullscreen}
                  currentUserId={user?.uid}
                />
              ) : (
                <div className="empty-state">
                  {!user ? (
                    <SignUpPrompt
                      title="Sign in to Explore Projects"
                      description="Discover amazing projects from creators around the world"
                      showBenefits={true}
                    />
                  ) : (
                    <>
                      <div className="empty-icon">🔍</div>
                      <h3>No projects found</h3>
                      <p>Try selecting a different category or check back later for new projects.</p>
                    </>
                  )}
                </div>
              )
            )}

            {/* All Projects Grid View (fallback) */}
            {selectedCategory === 'all' && Object.keys(widgetsByCategory).length === 0 && (
              <div className="empty-state">
                {!user ? (
                  <SignUpPrompt
                    title="Join inQ to Share Your Projects"
                    description="Create and share your interactive widgets with the community"
                    showBenefits={true}
                  />
                ) : (
                  <>
                    <div className="empty-icon">🔍</div>
                    <h3>No projects found</h3>
                    <p>Try adjusting your search or check back later for new projects.</p>
                  </>
                )}
              </div>
            )}
          </>
        )}
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

function CategoryRow({
  category,
  widgets,
  onOpenFullscreen,
  currentUserId
}: {
  category: { id: string; label: string; icon: string };
  widgets: Widget[];
  onOpenFullscreen: (w: Widget) => void;
  currentUserId?: string;
}) {
  return (
    <section className="category-row">
      <div className="category-row-header">
        <h3 className="category-row-title">
          <span className="category-icon">{category.icon}</span>
          {category.label}
        </h3>
        <span className="category-count">{widgets.length} projects</span>
      </div>
      <div className="category-row-content">
        <div className="category-row-scroll">
          {widgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              onOpenFullscreen={onOpenFullscreen}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({
  widget,
  onOpenFullscreen,
  currentUserId
}: {
  widget: Widget;
  onOpenFullscreen: (w: Widget) => void;
  currentUserId?: string;
}) {
  const social = useBundleSocial(widget?.id, currentUserId, 'widget');

  return (
    <div className="featured-card">
      <div className="featured-card-preview">
        <BundleIframe bundle={widget} height={240} />
        <div className="preview-overlay">
          <button className="fullscreen-demo-btn" onClick={() => onOpenFullscreen(widget)}>
            ▶ Play Demo
          </button>
        </div>
      </div>
      <div className="featured-card-info">
        <h4 className="featured-card-title">{widget.title || 'Untitled Project'}</h4>
        <div className="featured-card-meta">
          <span className="featured-card-user">by {widget.userId?.slice(0, 8) || 'Unknown'}</span>
          <span className="featured-card-likes">❤️ {social.likes || 0}</span>
        </div>
      </div>
    </div>
  );
}

function WidgetCard({
  widget,
  onOpenFullscreen,
  currentUserId
}: {
  widget: Widget;
  onOpenFullscreen: (w: Widget) => void;
  currentUserId?: string;
}) {
  const social = useBundleSocial(widget?.id, currentUserId, 'widget');

  return (
    <div className="category-widget-card">
      <div className="category-widget-preview">
        <BundleIframe bundle={widget} height={180} />
        <div className="preview-overlay">
          <button className="fullscreen-demo-btn-compact" onClick={() => onOpenFullscreen(widget)}>
            ▶
          </button>
        </div>
      </div>
      <div className="category-widget-info">
        <h4 className="category-widget-title">{widget.title || 'Untitled'}</h4>
        <div className="category-widget-meta">
          <span className="category-widget-user">{widget.userId?.slice(0, 6) || 'Unknown'}</span>
          <span className="category-widget-likes">❤️ {social.likes || 0}</span>
        </div>
      </div>
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
