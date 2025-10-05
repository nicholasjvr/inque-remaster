"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import ProfileHub from '@/app/components/ProfileHub';
import { useExploreProjects, ExploreProject, SortOption } from '@/hooks/useExplore';
import { loadBundleIntoIframe, loadWidgetFilesIntoIframe, showIframeError } from '@/lib/iframe';

export default function ExplorePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recent');
  const [layout, setLayout] = useState<'grid' | 'pinterest'>('grid');
  const { projects, loading } = useExploreProjects({ sort });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((p) =>
      [p.title, p.description, ...(p.tags || [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [projects, search]);

  return (
    <div className="min-h-screen w-full bg-[#04060d] text-white">
      <header className="explore-header">
        <div className="header-content">
          <div className="header-title">
            <span className="title-icon">🔍</span>
            <h1>Explore Projects</h1>
          </div>
          <div className="header-actions">
            <a href="/" className="action-btn"><span>🏠</span><span className="btn-text">Home</span></a>
            <a href="/showcase" className="action-btn"><span>🏆</span><span className="btn-text">Showcase</span></a>
            <a href="/users" className="action-btn"><span>👥</span><span className="btn-text">Creators</span></a>
          </div>
        </div>
        <div className="header-profile-hub">
          <ProfileHub variant="billboard" />
        </div>
      </header>

      <main className="explore-main">
        <div className="explore-controls">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search projects, creators, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="filter-container">
            <div className="filter-group">
              <label>Sort By</label>
              <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value as SortOption)}>
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="name">Name A-Z</option>
                <option value="random">Random</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Layout</label>
              <select className="filter-select" value={layout} onChange={(e) => setLayout(e.target.value as any)}>
                <option value="grid">Grid</option>
                <option value="pinterest">Pinterest</option>
              </select>
            </div>
            <a href="/explore/reels" className="action-btn" title="Open Reels">
              <span>🎬</span>
              <span className="btn-text">Reels</span>
            </a>
          </div>
        </div>

        <div className="explore-grid-container">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <div className="loading-text">Loading projects...</div>
              <div className="loading-subtitle">Pulling live data from Firestore</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No projects found</h3>
              <p>Try different keywords or check back later.</p>
            </div>
          ) : (
            <div id="exploreWidgetList" className="explore-widget-grid" style={layout === 'pinterest' ? { gridAutoRows: '1px' } : undefined}>
              {filtered.map((p) => (
                <ExploreCard key={`${p.kind}-${p.id}`} project={p} />
              ))}
            </div>
          )}
        </div>
      </main>

      <div id="toastContainer" className="toast-container"></div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Orbitron:wght@400;500;600;700;800;900&display=swap');
      `}</style>
      <link rel="stylesheet" href="/explore.css" />
    </div>
  );
}

function ExploreCard({ project }: { project: ExploreProject }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    if (project.kind === 'widget') {
      const files = project.files || [];
      if (files.length === 0) return showIframeError(iframe, 'No files available');
      loadWidgetFilesIntoIframe(files, iframe);
    } else {
      loadBundleIntoIframe(project.id, iframe);
    }
  }, [project.kind, project.id, project.files]);

  return (
    <div className="explore-widget-card">
      <div className="explore-widget-header">
        <h3 className="explore-widget-title">{project.title}</h3>
        <div className="explore-widget-user">by {project.ownerUid?.slice(0, 6) || 'Unknown'}</div>
      </div>
      <div className="explore-widget-preview">
        <iframe
          ref={iframeRef}
          className="fullscreen-iframe"
          sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-presentation"
          title={`preview-${project.id}`}
        />
        <div className="preview-overlay">
          <a className="fullscreen-demo-btn" href={`/explore/reels?focus=${project.kind}:${project.id}`}>
            Full Demo
          </a>
        </div>
      </div>
      <div className="explore-widget-actions">
        <a href={`/users?u=${project.ownerUid}`} className="explore-profile-link">👤 Profile</a>
        <a href={`/explore/reels?focus=${project.kind}:${project.id}`} className="explore-demo-btn">🎮 Demo</a>
        <button className="explore-follow-btn">+ Follow</button>
        <button className="explore-message-btn">💬 Message</button>
      </div>
    </div>
  );
}
