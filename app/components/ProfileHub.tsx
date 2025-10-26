'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { PublicUser, UserProfile, RepRackItem } from '@/hooks/useFirestore';
import { useUserProfile, useWidgets } from '@/hooks/useFirestore';
import RepRackManager from './RepRackManager';
import CustomizationShop from './CustomizationShop';

// Interest and goal option mappings for display
const INTEREST_OPTIONS = [
  { id: 'web-dev', label: 'Web Development', icon: '💻', color: '#00f0ff' },
  { id: 'design', label: 'UI/UX Design', icon: '🎨', color: '#ff6b6b' },
  { id: 'animation', label: 'Animation', icon: '✨', color: '#ffd93d' },
  { id: 'games', label: 'Game Development', icon: '🎮', color: '#6bcf7f' },
  { id: 'data-viz', label: 'Data Visualization', icon: '📊', color: '#4ecdc4' },
  { id: '3d', label: '3D Graphics', icon: '🧊', color: '#a8e6cf' },
  { id: 'creative', label: 'Creative Coding', icon: '🌈', color: '#ff8b94' },
  { id: 'tools', label: 'Developer Tools', icon: '🛠️', color: '#b19cd9' },
];

const GOAL_OPTIONS = [
  { id: 'showcase', label: 'Showcase my work', icon: '🏆', color: '#ffd93d' },
  { id: 'learn', label: 'Learn from others', icon: '📚', color: '#4ecdc4' },
  { id: 'collaborate', label: 'Find collaborators', icon: '🤝', color: '#6bcf7f' },
  { id: 'build-portfolio', label: 'Build my portfolio', icon: '💼', color: '#ff8b94' },
  { id: 'get-feedback', label: 'Get feedback', icon: '💬', color: '#00f0ff' },
  { id: 'networking', label: 'Network with creators', icon: '🌐', color: '#b19cd9' },
];

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

// Collapsible section component - moved outside ProfileHub to prevent re-creation
const CollapsibleSection = ({ id, title, defaultOpen, children }: { id: string; title: string; defaultOpen?: boolean; children: React.ReactNode }) => {
  // Initialize with a stable state - no client-side updates that cause glitching
  const [open, setOpen] = useState<boolean>(() => {
    // Always use the provided defaultOpen value, or default to false
    return defaultOpen ?? false;
  });

  // Handle click with proper event handling
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(prev => !prev);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(prev => !prev);
    }
  };

  return (
    <div className="hub-collapsible" data-open={open}>
      <div 
        className="hub-collapsible__summary" 
        aria-controls={id} 
        aria-expanded={open}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <span className="hub-collapsible__caret" aria-hidden="true">▸</span>
        <span className="hub-collapsible__title">{title}</span>
      </div>
      {open && (
        <div id={id} className="hub-collapsible__content">
          {children}
        </div>
      )}
    </div>
  );
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
  const [showShareMenu, setShowShareMenu] = useState(false);

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

  // Social interaction handlers
  const handleFollow = async () => {
    if (!user?.uid || isPublicView) return;
    // TODO: Implement follow functionality
    console.log(`Following user ${profileUser?.id}`);
  };

  const handleMessage = async () => {
    if (!user?.uid || isPublicView) return;
    // TODO: Implement messaging functionality
    console.log(`Messaging user ${profileUser?.id}`);
  };

  const handleShare = async () => {
    if (!profileUser?.id) return;

    const shareUrl = `${window.location.origin}/u/${profileUser.id}`;
    const shareText = `Check out ${profileUser.displayName || 'this creator'}'s profile on inQ! ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profileUser.displayName || 'Creator'}'s Profile - inQ`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        fallbackShare(shareUrl, shareText);
      }
    } else {
      fallbackShare(shareUrl, shareText);
    }
  };

  const fallbackShare = (url: string, text: string) => {
    navigator.clipboard.writeText(`${text} ${url}`);
    // TODO: Show toast notification
    console.log('Profile link copied to clipboard!');
  };

  const handleShareToTwitter = () => {
    if (!profileUser?.id) return;
    const url = `${window.location.origin}/u/${profileUser.id}`;
    const text = `Check out ${profileUser.displayName || 'this creator'}'s profile on inQ!`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleShareToLinkedIn = () => {
    if (!profileUser?.id) return;
    const url = `${window.location.origin}/u/${profileUser.id}`;
    const title = `${profileUser.displayName || 'Creator'}'s Profile - inQ`;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  };

  const handleLikeProject = async (projectId: string) => {
    if (!user?.uid || isPublicView) return;
    // TODO: Implement project like functionality
    console.log(`Liking project ${projectId}`);
  };

  const handleViewProject = async (projectId: string) => {
    // TODO: Implement project view tracking
    console.log(`Viewing project ${projectId}`);
  };

  // Helper function to get interest/goal display data
  const getInterestData = (interestId: string) => {
    return INTEREST_OPTIONS.find(opt => opt.id === interestId) || { label: interestId, icon: '⭐', color: '#666' };
  };

  const getGoalData = (goalId: string) => {
    return GOAL_OPTIONS.find(opt => opt.id === goalId) || { label: goalId, icon: '🎯', color: '#666' };
  };


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
          style={{
            maxHeight: isExpanded ? (mode === 'edit' ? 'calc(100vh - 2rem)' : '80vh') : undefined,
            overflow: isExpanded && mode !== 'edit' ? 'hidden' : undefined,
            display: 'flex',
            flexDirection: 'column',
            height: mode === 'edit' && isExpanded ? '100%' : undefined,
            // expose a dynamic accent for widgets/banners that follow avatar frame color
            ['--accent-color' as any]: (localProfile?.avatarFrame?.color || '#00f0ff')
          } as React.CSSProperties}
        >
          <div className="hub-core">
            <div className="hub-user-section">
              <div
                className={`hub-avatar ${localProfile?.avatarFrame?.style || ''} ${localProfile?.avatarAnimation?.type || 'none'}`}
                aria-hidden="true"
                style={{
                  '--animation-speed': localProfile?.avatarAnimation?.speed || 1,
                  borderColor: localProfile?.avatarFrame?.color || undefined
                } as React.CSSProperties}
              >
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
                  {localProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'User'}
                </span>
                <span className="hub-user-handle">
                  @{profileUser?.handle || user?.uid?.slice(0, 8) || 'user'}
                </span>
                <span className="hub-user-status">
                  {localProfile?.bio || 'Creative developer & designer'}
                </span>
                <div className="hub-user-level">
                  <span className="level-badge">LVL • {Math.floor((profileUser?.stats?.totalViews || 0) / 100) + 1}</span>
                  <span className="member-since">
                    Member since {profileUser?.joinDate ? new Date(profileUser.joinDate.toDate ? profileUser.joinDate.toDate() : profileUser.joinDate).getFullYear() : new Date().getFullYear()}
                  </span>
                </div>
              </div>
            </div>
            <div className="quick-nav-buttons"></div>

            {/* Public Profile Banner - Only show in public view */}
            {isPublicView && (
              <div className="public-profile-banner">
                <div className="profile-stats-row">
                  <div className="profile-stat">
                    <span className="stat-number">{localProfile?.repRack?.length || 0}</span>
                    <span className="stat-label">Projects</span>
                  </div>
                  <div className="profile-stat">
                    <span className="stat-number">{profileUser?.stats?.followersCount || profileUser?.followersCount || 0}</span>
                    <span className="stat-label">Followers</span>
                  </div>
                  <div className="profile-stat">
                    <span className="stat-number">{profileUser?.stats?.followingCount || 0}</span>
                    <span className="stat-label">Following</span>
                  </div>
                  <div className="profile-stat">
                    <span className="stat-number">{profileUser?.stats?.totalViews || profileUser?.totalViews || 0}</span>
                    <span className="stat-label">Views</span>
                  </div>
                </div>

                {/* Bio Section */}
                {profileUser?.bio && (
                  <div className="profile-bio-section">
                    <p className="profile-bio">{profileUser.bio}</p>
                  </div>
                )}

                {/* Interests Section */}
                {profileUser?.interests && profileUser.interests.length > 0 && (
                  <div className="profile-interests-section">
                    <h4 className="section-title">Interests</h4>
                    <div className="interests-grid">
                      {profileUser.interests.map((interestId) => {
                        const interestData = getInterestData(interestId);
                        return (
                          <div key={interestId} className="interest-tag" style={{ backgroundColor: interestData.color + '20', borderColor: interestData.color }}>
                            <span className="interest-icon">{interestData.icon}</span>
                            <span className="interest-label">{interestData.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Goals Section */}
                {profileUser?.goals && profileUser.goals.length > 0 && (
                  <div className="profile-goals-section">
                    <h4 className="section-title">Goals</h4>
                    <div className="goals-grid">
                      {profileUser.goals.map((goalId) => {
                        const goalData = getGoalData(goalId);
                        return (
                          <div key={goalId} className="goal-tag" style={{ backgroundColor: goalData.color + '20', borderColor: goalData.color }}>
                            <span className="goal-icon">{goalData.icon}</span>
                            <span className="goal-label">{goalData.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {profile && profile.links && profile.links.length > 0 && (
                  <div className="profile-links-section">
                    <h4 className="section-title">Links</h4>
                    <div className="links-grid">
                      {profile.links.map((link, index) => (
                        <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="profile-link">
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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
          {isExpanded && (
            <div className="hub-expanded-layout">
              <div
                className="hub-expanded-content"
                style={{
                  overflowY: 'auto',
                  flex: 1,
                  maxHeight: mode === 'edit' ? 'calc(100vh - 200px)' : undefined
                }}
              >
                {!isPublicView && (
                  <CollapsibleSection id="customization-shop" title="🛍️ Customization Shop" defaultOpen={true}>
                    <CustomizationShop
                      profile={localProfile}
                      onSave={async (updates) => {
                        if (!user?.uid) return;
                        try {
                          await saveProfile(user.uid, updates);
                          // Update local profile state after save
                          setLocalProfile(prev => ({ ...prev, ...updates }));
                          console.log('Customization saved successfully!');
                        } catch (error) {
                          console.error('Error saving customization:', error);
                        }
                      }}
                      onReset={() => {
                        setLocalProfile(profile || { repRack: [], theme: { mode: 'neo' } });
                        // Also reset the theme state if it was changed
                        setTheme(profile?.theme?.mode || 'neo');
                      }}
                    />
                  </CollapsibleSection>
                )}

                {/* Featured Projects Section - Enhanced for public view */}
                <CollapsibleSection id="featured" title="🏆 Featured Projects" defaultOpen={mode === 'edit'}>
                  <div className="featured-projects-grid">
                    {Array.from({ length: 6 }, (_, index) => {
                      const item = localProfile?.repRack?.[index % 3];
                      return (
                        <div key={index} className="featured-project-card">
                          <div className="project-image-container">
                            {item?.imageUrl ? (
                              <img className="project-image" src={item.imageUrl} alt={item.title || 'Project'} />
                            ) : (
                              <div className="project-image-placeholder">
                                {item?.title?.charAt(0) || '🎨'}
                              </div>
                            )}
                            <div className="project-overlay">
                              <h4 className="project-title">{item?.title || `Project ${index + 1}`}</h4>
                              <div className="project-stats">
                                <span className="project-stat">❤️ 0</span>
                                <span className="project-stat">👁️ 0</span>
                                <span className="project-stat">⭐ 0</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleSection>

                {/* Activity Timeline - Enhanced */}
                <CollapsibleSection id="activity" title="📅 Recent Activity" defaultOpen={false}>
                  <div className="activity-timeline">
                    <div className="activity-item">
                      <div className="activity-icon">🎨</div>
                      <div className="activity-content">
                        <div className="activity-text">Created a new interactive widget</div>
                        <div className="activity-time">2 hours ago</div>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon">❤️</div>
                      <div className="activity-content">
                        <div className="activity-text">Received 5 likes on "Portfolio Showcase"</div>
                        <div className="activity-time">5 hours ago</div>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon">👥</div>
                      <div className="activity-content">
                        <div className="activity-text">New follower: @designguru</div>
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
                      <div className="activity-icon">💬</div>
                      <div className="activity-content">
                        <div className="activity-text">Commented on "Data Visualization Tool"</div>
                        <div className="activity-time">1 week ago</div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Social Connections - Only in public view */}
                {isPublicView && (
                  <CollapsibleSection id="social" title="🌐 Social Connections" defaultOpen={false}>
                    <div className="social-connections">
                      <div className="social-stats">
                        <div className="social-stat">
                          <span className="social-number">{profileUser?.stats?.followersCount || 0}</span>
                          <span className="social-label">Followers</span>
                        </div>
                        <div className="social-stat">
                          <span className="social-number">{profileUser?.stats?.followingCount || 0}</span>
                          <span className="social-label">Following</span>
                        </div>
                      </div>
                      <div className="social-actions">
                        <button className="social-btn follow-btn" onClick={handleFollow}>
                          {profileUser?.stats?.followersCount && profileUser.stats.followersCount > 0 ? 'Following' : 'Follow'}
                        </button>
                        <button className="social-btn message-btn" onClick={handleMessage}>
                          Message
                        </button>
                        <div className="share-dropdown">
                          <button
                            className="social-btn share-btn"
                            onClick={() => setShowShareMenu(!showShareMenu)}
                          >
                            Share Profile
                          </button>
                          {showShareMenu && (
                            <div className="share-menu">
                              <button className="share-option" onClick={handleShare}>
                                <span>📱</span>
                                Share
                              </button>
                              <button className="share-option" onClick={handleShareToTwitter}>
                                <span>🐦</span>
                                Twitter
                              </button>
                              <button className="share-option" onClick={handleShareToLinkedIn}>
                                <span>💼</span>
                                LinkedIn
                              </button>
                              <button className="share-option" onClick={() => fallbackShare(`${window.location.origin}/u/${profileUser?.id}`, `Check out ${profileUser?.displayName || 'this creator'}'s profile on inQ!`)}>
                                <span>📋</span>
                                Copy Link
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleSection>
                )}

                {/* Recent Followers Section - Only in public view */}
                {isPublicView && (
                  <CollapsibleSection id="followers" title="👥 Recent Followers" defaultOpen={false}>
                    <div className="followers-grid">
                      {Array.from({ length: 6 }, (_, index) => (
                        <div key={index} className="follower-item">
                          <div className="follower-avatar">
                            <span role="img" aria-label="Follower avatar">
                              {['👨‍💻', '👩‍🎨', '🧑‍🔬', '👨‍🎨', '👩‍💻', '🧑‍🎨'][index] || '👤'}
                            </span>
                          </div>
                          <div className="follower-info">
                            <span className="follower-name">Creator {index + 1}</span>
                            <span className="follower-handle">@creator{index + 1}</span>
                          </div>
                          <button className="follower-action">Follow</button>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Following Section - Only in edit mode */}
                {!isPublicView && (
                  <CollapsibleSection id="following" title="👥 Following" defaultOpen={false}>
                    <div className="following-grid">
                      {Array.from({ length: 6 }, (_, index) => (
                        <div key={index} className="following-item">
                          <div className="following-avatar">
                            <span role="img" aria-label="Following avatar">
                              {['👨‍💻', '👩‍🎨', '🧑‍🔬', '👨‍🎨', '👩‍💻', '🧑‍🎨'][index] || '👤'}
                            </span>
                          </div>
                          <div className="following-info">
                            <span className="following-name">Creator {index + 1}</span>
                            <span className="following-handle">@creator{index + 1}</span>
                            <span className="following-projects">{Math.floor(Math.random() * 20) + 1} projects</span>
                          </div>
                          <button className="following-action">Unfollow</button>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}
                <CollapsibleSection id="quicknav" title="Quick Navigation" defaultOpen={false}>
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
                </CollapsibleSection>

              </div>

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
      </div>
      {/* Only show overlay when expanded/chatbot AND not billboard AND not edit mode */}
      {variant !== 'billboard' && isModalOpen && mode !== 'edit' ? (
        <div
          className="profile-hub-overlay"
          onClick={handleCloseModal}
          style={{
            pointerEvents: isExpanded ? 'none' : 'auto',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          } as React.CSSProperties}
        />
      ) : null}
      {!isPublicView && showRepRackManager && (
        <RepRackManager onProjectSelect={(p) => handleRepRackSelect({ id: p.id, title: p.title, imageUrl: p.imageUrl })} onClose={() => setShowRepRackManager(false)} />
      )}
    </div>
  );
};

export default ProfileHub;


