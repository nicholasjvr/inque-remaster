'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useExploreProjects, ExploreProject, shuffleProjects } from '@/hooks/useExplore';
import { loadBundleIntoIframe, loadWidgetFilesIntoIframe, showIframeError } from '@/lib/iframe';

export default function ExploreReelsPage() {
  const params = useSearchParams();
  const focus = params.get('focus'); // e.g. 'bundle:docId' or 'widget:docId' or 'owner:uid'
  const { projects, loading } = useExploreProjects();

  const seedList = useMemo(() => {
    if (!projects.length) return [] as ExploreProject[];
    if (!focus) return shuffleProjects(projects).slice(0, 50);
    const [type, id] = focus.split(':');
    if (type === 'owner') {
      const list = projects.filter((p) => p.ownerUid === id);
      return shuffleProjects(list).slice(0, 50);
    }
    const first = projects.find((p) => `${p.kind}` === type && p.id === id);
    const others = projects.filter((p) => p !== first);
    return first ? [first, ...shuffleProjects(others).slice(0, 49)] : shuffleProjects(projects).slice(0, 50);
  }, [projects, focus]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#04060d] text-white grid place-items-center">
        <div className="loading-state">
          <div className="loading-spinner" />
          <div className="loading-text">Loading Reels…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#04060d] text-white">
      <header className="explore-header" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="header-content">
          <div className="header-title">
            <span className="title-icon">🎬</span>
            <h1>Reels</h1>
          </div>
          <div className="header-actions">
            <a href="/explore" className="action-btn"><span>🔍</span><span className="btn-text">Explore</span></a>
            <a href="/users" className="action-btn"><span>👥</span><span className="btn-text">Creators</span></a>
          </div>
        </div>
      </header>

      <main style={{ height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
        <VerticalReel items={seedList} />
      </main>
      <link rel="stylesheet" href="/explore.css" />
    </div>
  );
}

function VerticalReel({ items }: { items: ExploreProject[] }) {
  const [index, setIndex] = useState(0);
  const current = items[index];
  const next = () => setIndex((i) => (i + 1) % items.length);
  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') next();
      if (e.key === 'ArrowUp') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      {current && <ReelItem key={`${current.kind}-${current.id}`} project={current} />}
      <div style={{ position: 'absolute', right: 16, bottom: 16, display: 'flex', gap: 8 }}>
        <button className="load-more-btn" onClick={prev}>↑ Prev</button>
        <button className="load-more-btn" onClick={next}>Next ↓</button>
      </div>
    </div>
  );
}

function ReelItem({ project }: { project: ExploreProject }) {
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
    <div className="widget-fullscreen-modal active" style={{ inset: 0, padding: 16, background: 'transparent' }}>
      <div className="fullscreen-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="fullscreen-header">
          <div className="fullscreen-title">{project.title}</div>
          <a className="fullscreen-close" href="/explore">×</a>
        </div>
        <div className="fullscreen-body">
          <iframe
            ref={iframeRef}
            className="fullscreen-iframe"
            sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-presentation"
            title={`reel-${project.id}`}
          />
        </div>
      </div>
    </div>
  );
}
