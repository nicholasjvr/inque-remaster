'use client';

import { useAuth } from '@/contexts/AuthContext';
import Showcase from '@/app/components/Showcase';
import ProfileHub from '@/app/components/ProfileHub';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import '../widget-studio.css';

export default function ShowcasePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full bg-[#04060d] text-white">
        {/* Seamless Header */}
        <header className="explore-header-seamless">
          <div className="header-gradient-overlay"></div>
          <div className="header-content-seamless">
            <div className="header-left">
              <div className="header-title-seamless">
                <span className="title-icon">🏆</span>
                <h1>Showcase</h1>
              </div>
              <nav className="header-nav">
                <a href="/" className="nav-link">Home</a>
                <a href="/explore" className="nav-link">Explore</a>
                <a href="/users" className="nav-link">Creators</a>
              </nav>
            </div>
            <div className="header-right">
              <div className="search-bar-compact header-search-hidden">
                <input
                  type="text"
                  className="search-input-compact"
                  placeholder="Search..."
                  value=""
                  readOnly
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
          <Showcase />
        </main>

        {/* Import explore styles */}
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Orbitron:wght@400;500;600;700;800;900&display=swap');
        `}</style>
        <link rel="stylesheet" href="/explore.css" />
      </div>
    </ProtectedRoute>
  );
}
