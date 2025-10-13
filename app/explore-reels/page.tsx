'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWidgetBundles, WidgetBundle, useBundleSocial, toggleFollow } from '@/hooks/useFirestore';
import BundleIframe from '@/app/components/BundleIframe';

export default function ExploreReelsPage() {
  const { user } = useAuth();
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
  const social = useBundleSocial(current?.id, user?.uid);

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
            <div className="explore-widget-actions" style={{ padding: '12px 16px 20px', gap: 8, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
              <button className="explore-demo-btn" onClick={() => go(-1)}>⬆ Prev</button>
              <button className="explore-follow-btn" onClick={() => user && toggleFollow(user.uid, current.userId || '')}>＋ Follow</button>
              <button className="explore-like-btn" onClick={() => social.toggleLike(current)}>
                ❤️ {social.likedByMe ? 'Unlike' : 'Like'} {social.likes ? `(${social.likes})` : ''}
              </button>
              <button className="explore-demo-btn" onClick={() => go(1)}>Next ⬇</button>
            </div>
            {current.description && (
              <div style={{ padding: '0 16px 16px' }}>
                <div className="project-description">
                  <h4 style={{ margin: '0 0 8px 0', color: '#66faff', fontSize: '14px', fontWeight: '600' }}>Project Description</h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px', lineHeight: '1.5' }}>{current.description}</p>
                </div>
              </div>
            )}
            <div style={{ padding: '0 16px 16px' }}>
              <form onSubmit={async (e) => { e.preventDefault(); const form = e.target as HTMLFormElement; const input = form.elements.namedItem('c') as HTMLInputElement; const v = input.value; if (v.trim() && user) { await social.addComment(current, v.trim(), user.uid); input.value = ''; } }} style={{ display: 'flex', gap: 8 }}>
                <input name="c" className="search-input" placeholder="Add a comment…" style={{ flex: 1 }} />
                <button className="explore-follow-btn" type="submit">Comment</button>
              </form>
              <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                {social.comments.map((c) => (
                  <div key={c.id} style={{ fontSize: 13, color: '#cbd5e1' }}>
                    <span style={{ opacity: 0.7 }}>{c.userId.slice(0,6)}:</span> {c.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

