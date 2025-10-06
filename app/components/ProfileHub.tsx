'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { PublicUser, UserProfile, RepRackItem } from '@/hooks/useFirestore';
import { useUserProfile, useWidgets } from '@/hooks/useFirestore';
import RepRackManager from './RepRackManager';

import '../profile-hub.css';

type HubState = 'minimized' | 'expanded' | 'chatbot' | 'dm';
type HubTheme = 'neo' | 'minimal' | 'cyber';

type NavigationItem = {
  id: string;
  label: string;
  icon: string;
  href: string;
};

type ChatMessage = {
  sender: 'ai' | 'me';
  avatar: string;
  text: string;
};

const NAV_ITEMS: NavigationItem[] = [
  { id: 'projects', label: 'Projects', icon: '📊', href: '/projects' },
  { id: 'studio', label: 'Widget Studio', icon: '🎨', href: '/studio' },
  { id: 'explore', label: 'Explore', icon: '🔍', href: '/explore' },
  { id: 'community', label: 'Community', icon: '👥', href: '/community' },
];

const QUICK_ACTIONS: NavigationItem[] = [
  { id: 'new-widget', label: 'New Widget', icon: '➕', href: '/studio/new' },
  { id: 'share', label: 'Share', icon: '🔗', href: '/share' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', href: '/notifications' },
  { id: 'settings', label: 'Settings', icon: '⚙️', href: '/settings' },
];

const DEFAULT_MESSAGE: ChatMessage = {
  sender: 'ai',
  avatar: '🤖',
  text: "Hi there! I'm your ProfileHub assistant. I can help you navigate, customize, or share your space.",
};

const THEME_MAP: Record<HubTheme, string> = {
  neo: 'default',
  minimal: 'minimal',
  cyber: 'cyber',
};

const storageKey = 'profile-hub-preferences';

type StoredPreferences = {
  theme: HubTheme;
  scale: number;
};

const loadPreferences = (): StoredPreferences => {
  if (typeof window === 'undefined') return { theme: 'neo', scale: 1 };
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return { theme: 'neo', scale: 1 };
    const parsed = JSON.parse(raw) as StoredPreferences;
    return {
      theme: parsed.theme ?? 'neo',
      scale: Number.isFinite(parsed.scale) ? parsed.scale : 1,
    };
  } catch {
    return { theme: 'neo', scale: 1 };
  }
};

const persistPreferences = (prefs: StoredPreferences) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
};

type ProfileHubProps = {
  mode?: 'public' | 'edit';
  profileUser?: PublicUser | null;
  initialState?: 'minimized' | 'expanded' | 'chatbot' | 'dm';
  variant?: string; // compatibility with existing usage
  onStateChange?: (state: HubState) => void;
};

const ProfileHub = ({ mode = 'edit', profileUser, initialState = 'minimized', variant, onStateChange }: ProfileHubProps) => {
  const { user, logout } = useAuth();
  const [state, setState] = useState<HubState>(initialState);
  const [isClosing, setIsClosing] = useState(false);
  const [theme, setTheme] = useState<HubTheme>(() => loadPreferences().theme);
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_MESSAGE]);
  const [messageDraft, setMessageDraft] = useState('');
  const isExpanded = state === 'expanded';
  const isChatbot = state === 'chatbot';
  const isDM = state === 'dm';
  const isModalOpen = isExpanded || isChatbot || isDM;
  const isPublicView = mode === 'public';

  // Load profile for target user (owner or public user)
  const targetUserId = profileUser?.id || user?.uid || null;
  const { profile, saveProfile } = useUserProfile(targetUserId || undefined);
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null);
  const [showRepRackManager, setShowRepRackManager] = useState(false);

  useEffect(() => {
    setLocalProfile(profile || { repRack: [], theme: { mode: 'neo' } });
  }, [profile]);

  const handleLogout = async () => {
    try {
      await logout();
      setState('minimized');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setState('minimized');
      setIsClosing(false);
    }, 600); // Match animation duration
  };

  // Rep Rack functionality
  const handleUploadProject = () => {
    // TODO: Implement project upload modal
    console.log('Upload new project');
  };

  const handleSelectFromExisting = () => {
    setShowRepRackManager(true);
  };

  const handleRepRackAction = (action: string, slotIndex: number) => {
    console.log(`Rep Rack action: ${action} on slot ${slotIndex}`);
    // TODO: Implement like, share, view, remove actions
  };

  const handleRepRackSelect = (project: { id: string; title: string; imageUrl: string }) => {
    setLocalProfile((prev) => {
      const next: UserProfile = { ...(prev || {}), repRack: [...(prev?.repRack || [])] };
      next.repRack = next.repRack || [];
      // place/replace in first empty slot
      let placed = false;
      for (let i = 0; i < 3; i++) {
        if (!next.repRack[i]) {
          next.repRack[i] = { type: 'project', refId: project.id, title: project.title, imageUrl: project.imageUrl } as RepRackItem;
          placed = true;
          break;
        }
      }
      if (!placed) {
        next.repRack[0] = { type: 'project', refId: project.id, title: project.title, imageUrl: project.imageUrl } as RepRackItem;
      }
      return next;
    });
    setShowRepRackManager(false);
  };

  const saveRepRack = async () => {
    if (!user?.uid || isPublicView) return;
    try {
      await saveProfile(user.uid, { repRack: localProfile?.repRack?.slice(0, 3) });
    } catch (e) {
      console.error('Save rep rack failed', e);
    }
  };

  useEffect(() => {
    persistPreferences({ theme, scale: 1 });
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--hub-scale', '1');
    return () => {
      document.documentElement.style.removeProperty('--hub-scale');
    };
  }, []);

  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  useEffect(() => {
    const overlay = document.querySelector('.profile-hub-overlay');
    // Do not use overlay in billboard variant (embedded in hero)
    if (!overlay || variant === 'billboard') return;
    const shouldShow = isModalOpen;
    overlay.classList.toggle('active', shouldShow);

    // When expanding, focus and scroll the hub into view
    if (state === 'expanded') {
      const hubEl = document.querySelector('.profile-hub') as HTMLElement | null;
      if (hubEl) {
        hubEl.setAttribute('tabindex', '-1');
        hubEl.focus({ preventScroll: true });
        hubEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    }
  }, [state]);

  useEffect(() => {
    let handler: ((e: KeyboardEvent) => void) | null = null;
    handler = (event) => {
      if (event.key === 'Escape' && isExpanded) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      if (handler) window.removeEventListener('keydown', handler);
    };
  }, [isExpanded]);

  const handleSendMessage = () => {
    const trimmed = messageDraft.trim();
    if (!trimmed) return;
    setMessages((prev): ChatMessage[] => [
      ...prev,
      { sender: 'me', avatar: '👤', text: trimmed },
      {
        sender: 'ai',
        avatar: '🤖',
        text: 'Thanks for your message! In a future update this will connect to the live assistant.',
      },
    ]);
    setMessageDraft('');
  };

  const themeClass = useMemo(() => THEME_MAP[theme], [theme]);
  const socialLinks = useMemo(
    () => [
      { id: 'twitter', label: 'X', href: 'https://x.com/inqsocial' },
      { id: 'discord', label: '💬', href: 'https://discord.gg/inqsocial' },
      { id: 'behance', label: 'Bē', href: 'https://www.behance.net/inqsocial' },
    ],
    []
  );

  return (
    <div
      className="profile-hub-wrapper"
      data-variant={variant}
      aria-live="polite"
      style={variant === 'billboard' ? {
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        pointerEvents: 'auto',
        zIndex: 10,
        // Reset any inherited text styles
        fontSize: 'inherit',
        lineHeight: 'inherit',
        textAlign: 'inherit',
        color: 'inherit',
        fontFamily: 'inherit'
      } : undefined}
    >
      <div className={`profile-hub-shell${isModalOpen ? ' profile-hub-shell--expanded' : ''}`}>
        <div
          className="profile-hub"
          data-state={state}
          data-theme={themeClass}
          data-customizing={isExpanded ? 'true' : 'false'}
          data-closing={isClosing ? 'true' : 'false'}
        >
          <div className="hub-core">
            <div className="hub-user-section">
              <div className="hub-avatar" aria-hidden="true">
                {(profileUser?.photoURL || user?.photoURL) ? (
                  <img 
                    src={(profileUser?.photoURL || user?.photoURL) as string} 
                    alt="User Avatar" 
                    className="hub-user-photo"
                  />
                ) : (
                  <span role="img" aria-label="User avatar">
                    {(profileUser?.displayName?.charAt(0).toUpperCase()) || user?.email?.charAt(0).toUpperCase() || '👤'}
                  </span>
                )}
              </div>
              <div className="hub-user-info">
                <span className="hub-user-name">
                  {profileUser?.displayName || user?.displayName || user?.email?.split('@')[0] || 'User'}
                </span>
                <span className="hub-user-status">{isPublicView ? 'Welcome to my hub' : 'Customize your profile hub'}</span>
                <span className="hub-user-level">LVL • ?</span>
              </div>
            </div>
            <div className="quick-nav-buttons"></div>

<div className="hub-controls">
  {!isPublicView && (
    <button
      type="button"
      className="hub-button"
      title="Toggle chat"
      onClick={() => setState(prev => (prev === 'chatbot' ? 'minimized' : 'chatbot'))}
    >
      🤖
    </button>
  )}
  {!isPublicView && (
    <button
      type="button"
      className="hub-button"
      title="Direct Messages"
      onClick={() => setState(prev => (prev === 'dm' ? 'minimized' : 'dm'))}
    >
      💬
    </button>
  )}
  <button
    type="button"
    className="hub-toggle"
    title={isExpanded ? 'Collapse hub' : 'Expand hub'}
    onClick={() => setState(prev => (prev === 'expanded' ? 'minimized' : 'expanded'))}
  >
    <span>⫷</span>
  </button>
</div>
          </div>
          {isExpanded && !isPublicView && (
            <div className="hub-expanded-content">
              <div className="hub-expanded-nav">
                <div className="expanded-nav-title">Quick Navigation</div>
                <div className="expanded-nav-buttons">
                  <a
                    href="/explore"
                    className="expanded-nav-btn"
                    title="Explore Projects"
                  >
                    <span className="nav-icon">🔍</span>
                    <span className="nav-label">Explore</span>
                    <span className="nav-desc">Discover projects</span>
                  </a>
                  <a
                    href="/explore-reels"
                    className="expanded-nav-btn"
                    title="Explore Reels"
                  >
                    <span className="nav-icon">🎞️</span>
                    <span className="nav-label">Reels</span>
                    <span className="nav-desc">Swipe demo videos</span>
                  </a>
                  <a
                    href="/users"
                    className="expanded-nav-btn"
                    title="Browse Creators"
                  >
                    <span className="nav-icon">👥</span>
                    <span className="nav-label">Creators</span>
                    <span className="nav-desc">Find creators</span>
                  </a>
                  <a
                    href="/showcase"
                    className="expanded-nav-btn"
                    title="View Showcase"
                  >
                    <span className="nav-icon">🏆</span>
                    <span className="nav-label">Showcase</span>
                    <span className="nav-desc">Top projects</span>
                  </a>
                </div>
              </div>

              <section className="hub-section" aria-labelledby="hub-stats-title">
                <h3 id="hub-stats-title">Stats</h3>
                <div className="hub-stats">
                  <div className="hub-stat-card">
                    <div className="hub-stat-value">{localProfile?.repRack?.length || 0}</div>
                    <div className="hub-stat-label">Featured Projects</div>
                    <div className="hub-stat-desc">Projects in showcase</div>
                  </div>
                  <div className="hub-stat-card">
                    <div className="hub-stat-value">{profileUser?.stats?.followersCount || profileUser?.followersCount || 0}</div>
                    <div className="hub-stat-label">Followers</div>
                    <div className="hub-stat-desc">Community supporters</div>
                  </div>
                  <div className="hub-stat-card">
                    <div className="hub-stat-value">{profileUser?.stats?.totalViews || profileUser?.totalViews || 0}</div>
                    <div className="hub-stat-label">Profile Views</div>
                    <div className="hub-stat-desc">Times profile visited</div>
                  </div>
                  <div className="hub-stat-card">
                    <div className="hub-stat-value">{profileUser?.stats?.badgesCount || profileUser?.badgesCount || 0}</div>
                    <div className="hub-stat-label">Badges</div>
                    <div className="hub-stat-desc">Achievements earned</div>
                  </div>
                  <div className="hub-stat-card">
                    <div className="hub-stat-value">{profileUser?.joinDate ? new Date(profileUser.joinDate.toDate ? profileUser.joinDate.toDate() : profileUser.joinDate).getFullYear() : new Date().getFullYear()}</div>
                    <div className="hub-stat-label">Member Since</div>
                    <div className="hub-stat-desc">Year joined platform</div>
                  </div>
                  <div className="hub-stat-card">
                    <div className="hub-stat-value">{profileUser?.stats?.totalLikes || profileUser?.totalLikes || 0}</div>
                    <div className="hub-stat-label">Total Likes</div>
                    <div className="hub-stat-desc">Likes received</div>
                  </div>
                </div>
              </section>

              <section className="hub-section" aria-labelledby="hub-achievements-title">
                <h3 id="hub-achievements-title">Achievements & Badges</h3>
                <div className="achievements-grid">
                  <div className={`achievement-badge ${(profileUser?.stats?.projectsCount || profileUser?.projectsCount || 0) > 0 ? 'earned' : 'locked'}`}>
                    <div className="badge-icon">🏆</div>
                    <div className="badge-name">First Project</div>
                    <div className="badge-desc">Created your first project</div>
                  </div>
                  <div className={`achievement-badge ${(profileUser?.stats?.followersCount || profileUser?.followersCount || 0) >= 10 ? 'earned' : 'locked'}`}>
                    <div className="badge-icon">👥</div>
                    <div className="badge-name">Popular Creator</div>
                    <div className="badge-desc">Gained 10+ followers</div>
                  </div>
                  <div className={`achievement-badge ${(profileUser?.stats?.totalViews || profileUser?.totalViews || 0) >= 100 ? 'earned' : 'locked'}`}>
                    <div className="badge-icon">👁️</div>
                    <div className="badge-name">Trending</div>
                    <div className="badge-desc">100+ profile views</div>
                  </div>
                  <div className={`achievement-badge ${(profileUser?.stats?.totalLikes || profileUser?.totalLikes || 0) >= 50 ? 'earned' : 'locked'}`}>
                    <div className="badge-icon">❤️</div>
                    <div className="badge-name">Community Favorite</div>
                    <div className="badge-desc">50+ likes received</div>
                  </div>
                  <div className={`achievement-badge ${localProfile?.repRack && localProfile.repRack.length >= 3 ? 'earned' : 'locked'}`}>
                    <div className="badge-icon">⭐</div>
                    <div className="badge-name">Complete Showcase</div>
                    <div className="badge-desc">Filled all rep rack slots</div>
                  </div>
                  <div className={`achievement-badge ${profileUser?.isVerified ? 'earned' : 'locked'}`}>
                    <div className="badge-icon">✓</div>
                    <div className="badge-name">Verified Creator</div>
                    <div className="badge-desc">Verified account status</div>
                  </div>
                </div>
              </section>

              <section className="hub-section hub-section--rep-rack" aria-labelledby="hub-rep-rack-title">
                <h3 id="hub-rep-rack-title">Rep Rack</h3>
                <p className="hub-section-description">Showcase up to three favourite projects to gain followers and engagement</p>
                <div className="rep-rack-grid rep-rack-grid--favorites">
                  {Array.from({ length: 3 }, (_, index) => {
                    const item = localProfile?.repRack?.[index];
                    return (
                    <div key={index} className="rep-rack-slot" data-slot-index={index}>
                      <div className="rep-rack-slot-content">
                        {!item ? (
                          <div className="rep-rack-slot-placeholder">
                            <span className="rep-rack-slot-icon">+</span>
                            <span className="rep-rack-slot-text">Add Project</span>
                          </div>
                        ) : (
                          <div className="rep-rack-slot-project">
                            <div className="rep-rack-project-preview">
                              {item.imageUrl ? (
                                <img className="rep-rack-project-image" src={item.imageUrl} alt={item.title || 'Project'} />
                              ) : (
                                <div className="rep-rack-project-image-placeholder">📷</div>
                              )}
                            </div>
                            <div className="rep-rack-project-info">
                              <h4 className="rep-rack-project-title">{item.title || 'Project'}</h4>
                              <div className="rep-rack-project-stats">
                                <span className="rep-rack-stat likes">0 ❤️</span>
                                <span className="rep-rack-stat shares">0 🔗</span>
                                <span className="rep-rack-stat views">0 👁️</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="rep-rack-slot-overlay">
                        <div className="rep-rack-slot-actions">
                          <button 
                            className="rep-rack-action-btn" 
                            title="Like" 
                            data-action="like"
                            onClick={() => handleRepRackAction('like', index)}
                          >
                            <span>❤️</span>
                          </button>
                          <button 
                            className="rep-rack-action-btn" 
                            title="Share" 
                            data-action="share"
                            onClick={() => handleRepRackAction('share', index)}
                          >
                            <span>🔗</span>
                          </button>
                          <button 
                            className="rep-rack-action-btn" 
                            title="View" 
                            data-action="view"
                            onClick={() => handleRepRackAction('view', index)}
                          >
                            <span>👁️</span>
                          </button>
                          <button 
                            className="rep-rack-action-btn" 
                            title="Remove" 
                            data-action="remove"
                            onClick={() => handleRepRackAction('remove', index)}
                          >
                            <span>🗑️</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
                {!isPublicView && (
                  <div className="rep-rack-actions">
                    <button className="rep-rack-upload-btn" onClick={handleUploadProject}>
                      <span>📤</span>
                      Upload New Project
                    </button>
                    <button className="rep-rack-select-btn" onClick={handleSelectFromExisting}>
                      <span>📋</span>
                      Select from Existing
                    </button>
                    <button className="rep-rack-select-btn" onClick={saveRepRack}>
                      <span>💾</span>
                      Save Rep Rack
                    </button>
                  </div>
                )}
              </section>

              <section className="hub-section" aria-labelledby="hub-activity-title">
                <h3 id="hub-activity-title">Recent Activity</h3>
                <div className="activity-timeline">
                  <div className="activity-item">
                    <div className="activity-icon">📝</div>
                    <div className="activity-content">
                      <div className="activity-text">Created a new project</div>
                      <div className="activity-time">2 hours ago</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">❤️</div>
                    <div className="activity-content">
                      <div className="activity-text">Received a like on "Awesome Widget"</div>
                      <div className="activity-time">5 hours ago</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">👥</div>
                    <div className="activity-content">
                      <div className="activity-text">Gained a new follower</div>
                      <div className="activity-time">1 day ago</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">🏆</div>
                    <div className="activity-content">
                      <div className="activity-text">Earned "Popular Creator" badge</div>
                      <div className="activity-time">3 days ago</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">⭐</div>
                    <div className="activity-content">
                      <div className="activity-text">Added project to showcase</div>
                      <div className="activity-time">1 week ago</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="hub-section" aria-labelledby="hub-projects-title">
                <h3 id="hub-projects-title">Recent Projects</h3>
                <div className="projects-showcase">
                  <div className="project-card">
                    <div className="project-image">
                      <div className="project-placeholder">🎨</div>
                    </div>
                    <div className="project-info">
                      <h4 className="project-title">Interactive Portfolio Widget</h4>
                      <p className="project-desc">A dynamic portfolio showcase with smooth animations</p>
                      <div className="project-stats">
                        <span className="project-stat">❤️ 24</span>
                        <span className="project-stat">👁️ 156</span>
                        <span className="project-stat">⭐ 8</span>
                      </div>
                    </div>
                  </div>
                  <div className="project-card">
                    <div className="project-image">
                      <div className="project-placeholder">📊</div>
                    </div>
                    <div className="project-info">
                      <h4 className="project-title">Data Visualization Tool</h4>
                      <p className="project-desc">Beautiful charts and graphs for data analysis</p>
                      <div className="project-stats">
                        <span className="project-stat">❤️ 18</span>
                        <span className="project-stat">👁️ 89</span>
                        <span className="project-stat">⭐ 5</span>
                      </div>
                    </div>
                  </div>
                  <div className="project-card">
                    <div className="project-image">
                      <div className="project-placeholder">🎮</div>
                    </div>
                    <div className="project-info">
                      <h4 className="project-title">Game Development Kit</h4>
                      <p className="project-desc">Tools and assets for indie game developers</p>
                      <div className="project-stats">
                        <span className="project-stat">❤️ 32</span>
                        <span className="project-stat">👁️ 203</span>
                        <span className="project-stat">⭐ 12</span>
                      </div>
                    </div>
                  </div>
                </div>
                {!isPublicView && (
                  <div className="projects-actions">
                    <button className="projects-btn">
                      <span>➕</span>
                      Create New Project
                    </button>
                    <button className="projects-btn">
                      <span>📂</span>
                      Manage Projects
                    </button>
                  </div>
                )}
              </section>

              {!isPublicView && (
              <section className="hub-section" aria-labelledby="hub-custom-title">
                <h3 id="hub-custom-title">Customize Hub</h3>
                <div className="customization-grid">
                  <div>
                    <span className="range-field">Theme</span>
                    <div className="theme-options" role="radiogroup" aria-label="Profile hub theme">
                      {(['neo', 'minimal', 'cyber'] as HubTheme[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={`theme-button${t === theme ? ' active' : ''}`}
                          onClick={() => setTheme(t)}
                          role="radio"
                          aria-checked={t === theme}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <h3 id="hub-social-title">Inque Socials</h3>
                  <div className="customization-actions">
                    <div className="social-links" aria-label="Connect with inQ Social">
                      {socialLinks.map((item) => (
                        <a
                          key={item.id}
                          className="social-pill"
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          title={item.label}
                        >
                          {item.label}
                        </a>
                      ))}
                    </div>
                    <div className="user-actions">
                      <button 
                        className="logout-button"
                        onClick={handleLogout}
                        title="Sign out"
                      >
                        <span>🚪</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </section>
              )}
            </div>
          )}
          {!isPublicView && isChatbot && (
            <div className="hub-chatbot" role="dialog" aria-label="Profile hub messenger">
              <header className="hub-chat-header">
                <span>AI Assistant</span>
                <button type="button" className="hub-button" onClick={() => setState('minimized')}>
                  ×
                </button>
              </header>
              <div className="hub-chat-body">
                <div className="hub-chat-messages">
                  {messages.map((message, index) => (
                    <div key={`${message.sender}-${index}`} className="hub-chat-message">
                      <span className="avatar" aria-hidden="true">
                        {message.avatar}
                      </span>
                      <div className="bubble">{message.text}</div>
                    </div>
                  ))}
                </div>
                <div className="hub-chat-input">
                  <input
                    type="text"
                    value={messageDraft}
                    placeholder="Ask me anything..."
                    onChange={(event) => setMessageDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button type="button" onClick={handleSendMessage}>
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
          {!isPublicView && isDM && (
            <div className="hub-chatbot hub-dm" role="dialog" aria-label="Direct messages">
              <header className="hub-chat-header">
                <span>Direct Messages</span>
                <button type="button" className="hub-button" onClick={() => setState('minimized')}>
                  ×
                </button>
              </header>
              <div className="hub-chat-body">
                <div className="hub-chat-messages">
                  <div className="hub-chat-message">
                    <span className="avatar" aria-hidden="true">👤</span>
                    <div className="bubble">This is your inbox. Coming soon.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {isExpanded && (
          <aside className="hub-modules" aria-label="Profile shortcuts">
            <section className="hub-module" aria-labelledby="hub-nav-title-floating">
              <h3 id="hub-nav-title-floating">Navigate</h3>
              <div className="hub-nav-grid">
                {NAV_ITEMS.map((item) => (
                  <a key={item.id} className="hub-nav-item" href={item.href} rel="noreferrer">
                    <span className="hub-nav-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </a>
                ))}
              </div>
            </section>

            <section className="hub-module" aria-labelledby="hub-actions-title-floating">
              <h3 id="hub-actions-title-floating">Quick Actions</h3>
              <div className="hub-actions">
                {QUICK_ACTIONS.map((action) => (
                  <a key={action.id} className="hub-action-button" href={action.href} rel="noreferrer">
                    <span aria-hidden="true">{action.icon}</span>
                    <span>{action.label}</span>
                  </a>
                ))}
              </div>
            </section>
          </aside>
        )}
      </div>
      {/* Only show overlay when expanded/chatbot AND not billboard */}
      {variant !== 'billboard' ? (
        <div className="profile-hub-overlay" onClick={handleCloseModal} />
      ) : null}
      {!isPublicView && showRepRackManager && (
        <RepRackManager onProjectSelect={(p) => handleRepRackSelect({ id: p.id, title: p.title, imageUrl: p.imageUrl })} onClose={() => setShowRepRackManager(false)} />
      )}
    </div>
  );
};

export default ProfileHub;


