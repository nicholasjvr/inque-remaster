'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useWidgetBundles, WidgetBundle } from '@/hooks/useFirestore';
import BundleIframe from '@/app/components/BundleIframe';

export default function ExploreReelsPage() {
  const { bundles, loading } = useWidgetBundles({ orderByCreated: true, limitCount: 200 });
  const [index, setIndex] = useState(0);
  const list = useMemo(() => (bundles.length ? bundles : []), [bundles]);

  const go = (delta: number) => {
    setIndex((i) => {
      const n = list.length;
      if (n === 0) return 0;
      return (i + delta + n) % n;
    });
  };

  // Keyboard navigation like TikTok/IG reels
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') go(1);
      if (e.key === 'ArrowUp' || e.key === 'PageUp') go(-1);
      if (e.key === ' ') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [list.length]);

  const current = list[index];

  return (
    <div className="min-h-screen w-full bg-[#04060d] text-white flex items-center justify-center">
      <link rel="stylesheet" href="/explore.css" />
      {loading || !current ? (
        <div className="loading-state" style={{ width: '100%', maxWidth: 900 }}>
          <div className="loading-spinner"></div>
            <div className="loading-text">Loading demos…</div>
            <div className="loading-subtitle">Use Up/Down keys to navigate</div>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 900 }}>
          <div className="explore-widget-card" style={{ padding: 0 }}>
            <div className="explore-widget-header" style={{ padding: '16px' }}>
              <h3 className="explore-widget-title">{current.title || 'Untitled Project'}</h3>
              <div className="explore-widget-user">by {current.id?.slice(0, 6) || 'Unknown'}</div>
            </div>
            <div className="explore-widget-preview" style={{ height: '70vh' }}>
              <BundleIframe bundle={current} height={'100%'} />
            </div>
            <div className="explore-widget-actions" style={{ padding: '12px 16px 20px' }}>
              <button className="explore-demo-btn" onClick={() => go(-1)}>⬆ Prev</button>
              <a className="explore-profile-link" href={`/?user=${current.id}`}>👤 Profile</a>
              <button className="explore-demo-btn" onClick={() => go(1)}>Next ⬇</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

