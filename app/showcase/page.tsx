'use client';

import { useAuth } from '@/contexts/AuthContext';
import Showcase from '@/app/components/Showcase';

export default function ShowcasePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full bg-[#04060d] text-white">
      {/* Header */}
      <header className="showcase-header">
        <div className="header-content">
          <div className="header-title">
            <span className="title-icon">🏆</span>
            <h1>Project Showcase</h1>
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
            <a href="/users" className="action-btn">
              <span>👥</span>
              <span className="btn-text">Creators</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="showcase-main">
        <Showcase />
      </main>


      {/* Import showcase styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Orbitron:wght@400;500;600;700;800;900&display=swap');
      `}</style>
      <link rel="stylesheet" href="/showcase.css" />
    </div>
  );
}
