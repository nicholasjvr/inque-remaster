'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { PublicUser, UserProfile, RepRackItem } from '@/hooks/useFirestore';
import { useUserProfile } from '@/hooks/useFirestore';
import RepRackManager from './RepRackManager';
import CustomizationShop from './CustomizationShop';
import FullscreenWrapper from './FullscreenWrapper';

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
import './FeaturedProjects.css';

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

type CollapsibleSectionProps = {
  id: string;
  title: string;
  defaultOpen?: boolean; // used only when uncontrolled
  children: React.ReactNode;
  sectionId?: string;
  open?: boolean; // controlled open state (preferred)
  onToggle?: () => void; // controlled toggle
  quickbar?: React.ReactNode; // optional sidebar rendered when open
  isFullscreen?: boolean;
  onEnterFullscreen?: () => void;
  onExitFullscreen?: () => void;
};

const CollapsibleSection = ({
  id,
  title,
  defaultOpen,
  children,
  sectionId,
  open,
  onToggle,
  quickbar,
  isFullscreen = false,
  onEnterFullscreen,
  onExitFullscreen
}: CollapsibleSectionProps) => {
  // Uncontrolled fallback for cases where parent doesn't manage open state
  const [uncontrolledOpen, setUncontrolledOpen] = useState<boolean>(() => defaultOpen ?? false);
  const isOpen = open ?? uncontrolledOpen;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onToggle) {
      onToggle();
    } else {
      setUncontrolledOpen(prev => !prev);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onToggle) {
        onToggle();
      } else {
        setUncontrolledOpen(prev => !prev);
      }
    }
  };

  const showFullscreenToggle = Boolean(onEnterFullscreen || onExitFullscreen);

  const handleFullscreenClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isFullscreen) {
      onExitFullscreen?.();
    } else {
      onEnterFullscreen?.();
    }
  };

  return (
    <div
      className={`hub-collapsible${isFullscreen ? ' hub-collapsible--fullscreen' : ''}`}
      data-open={isOpen}
      data-section={sectionId}
      data-fullscreen={isFullscreen ? 'true' : 'false'}
    >
      <div className="hub-collapsible__header">
        <div
          className="hub-collapsible__summary"
          aria-controls={id}
          aria-expanded={isOpen}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
        >
          <span className="hub-collapsible__caret" aria-hidden="true">▸</span>
          <span className="hub-collapsible__title">{title}</span>
        </div>
        {showFullscreenToggle ? (
          <div className="hub-collapsible__actions">
            <button
              type="button"
              className="hub-collapsible__fullscreen-btn"
              aria-pressed={isFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}
              onClick={handleFullscreenClick}
            >
              {isFullscreen ? '⤺' : '⤢'}
            </button>
          </div>
        ) : null}
      </div>
      {isOpen && (
        <div
          id={id}
          className="hub-collapsible__content"
          style={{
            display: 'grid',
            gridTemplateColumns: quickbar ? 'minmax(0, 1fr) 220px' : '1fr',
            alignItems: 'start',
            gap: 16
          }}
        >
          <div className="hub-collapsible__main" style={{ minWidth: 0 }}>
            {children}
          </div>
          {quickbar ? (
            <aside className="hub-collapsible__quickbar" style={{ width: 220 }}>
              {quickbar}
            </aside>
          ) : null}
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
  variant?: string;
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

  // Accordion: one open section at a time
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const isSectionActive = (id: string) => activeSection === id;
  const handleSectionToggle = (id: string) => {
    setActiveSection(prev => {
      const next = prev === id ? null : id;
      if (next === null) {
        setFullscreenSection(current => (current === id ? null : current));
      }
      return next;
    });
  };

  const openFullscreen = useCallback((id: string) => {
    setActiveSection(id);
    setFullscreenSection(id);
  }, []);

  const closeFullscreen = useCallback(() => {
    setFullscreenSection(null);
  }, []);

  // Fullscreen state for the entire ProfileHub
  const [isHubFullscreen, setIsHubFullscreen] = useState(false);

  // Fullscreen state for individual sections
  const [fullscreenSection, setFullscreenSection] = useState<string | null>(null);

  // Load profile for target user (owner or public user)
  const targetUserId = profileUser?.id || user?.uid || null;
  const { profile, saveProfile } = useUserProfile(targetUserId || undefined);
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null);
  const [showRepRackManager, setShowRepRackManager] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    setLocalProfile(profile || { repRack: [], theme: { mode: 'neo' } });
  }, [profile]);


  // Enhanced scroll focus when expanding - only on initial expansion
  // Skip for billboard variant as page.tsx handles scrolling to extended section
  // Also skip if user has already scrolled down - don't interrupt their scroll position
  useEffect(() => {
    if (!isModalOpen || variant === 'billboard') return;
    if (typeof window === 'undefined') return;

    const isMobile = window.innerWidth <= 768;
    // Don't scroll if user has already scrolled down - preserve their position
    const hasScrolledDown = window.scrollY > 200;

    // Only scroll on initial expansion, not on every state change
    // AND only if user hasn't scrolled down
    if (isMobile && isExpanded && !hasScrolledDown) {
      requestAnimationFrame(() => {
        const hubContent = document.querySelector('.hub-expanded-content');
        const hubElement = document.querySelector('.profile-hub-shell--expanded');

        // Only scroll if element is not already in viewport
        if (hubElement) {
          const rect = hubElement.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const isVisible = rect.top >= 0 && rect.top < viewportHeight &&
            rect.bottom > 0 && rect.bottom <= viewportHeight;

          if (!isVisible && hubContent) {
            (hubElement as HTMLElement).scrollIntoView({
              behavior: 'smooth',
              block: 'nearest', // Use 'nearest' to avoid aggressive scrolling
              inline: 'nearest'
            });

            // Focus the content area for keyboard navigation (without scrolling)
            setTimeout(() => {
              (hubContent as HTMLElement).focus({ preventScroll: true });
            }, 300);
          }
        }
      });
    }
  }, [isModalOpen, isExpanded, variant]);

  // Enhanced scroll lock for modal and fullscreen sections
  // Only locks body scroll for non-billboard variants (modal overlays)
  // Billboard variant should allow normal page scrolling since it's embedded in page flow
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isMobile = window.innerWidth <= 768;
    // Only lock body scroll for chatbot and dm states, never for expanded state in billboard variant
    const shouldLock = (isChatbot || isDM) && isMobile && !fullscreenSection;

    if (!shouldLock) return;

    // Cache DOM elements for better performance
    const bodyElement = document.body;
    const htmlElement = document.documentElement;
    const scrollPosition = window.scrollY;

    // Lock body scroll
    bodyElement.style.position = 'fixed';
    bodyElement.style.width = '100%';
    bodyElement.style.overflow = 'hidden';
    bodyElement.style.top = `-${scrollPosition}px`;
    htmlElement.style.overflow = 'hidden';
    bodyElement.dataset.scrollPosition = scrollPosition.toString();

    // Ensure hub content can scroll independently
    const hubContent = document.querySelector('.hub-expanded-content') as HTMLElement;
    if (hubContent) {
      hubContent.style.touchAction = 'pan-y';
      hubContent.style.overflowY = 'auto';
    }

    // Cleanup function - only runs when scroll was actually locked
    return () => {
      const hadScrollPosition = bodyElement.dataset.scrollPosition !== undefined;
      const savedScrollPosition = parseInt(bodyElement.dataset.scrollPosition || '0', 10);

      // Reset body styles
      bodyElement.style.position = '';
      bodyElement.style.width = '';
      bodyElement.style.overflow = '';
      bodyElement.style.top = '';
      htmlElement.style.overflow = '';
      delete bodyElement.dataset.scrollPosition;

      // Reset hub content styles
      if (hubContent) {
        hubContent.style.touchAction = '';
        hubContent.style.overflowY = '';
      }

      // Restore scroll position - only if we actually locked scroll and position was saved
      if (hadScrollPosition && savedScrollPosition > 0) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedScrollPosition, behavior: 'instant' });
        });
      }
    };
  }, [isModalOpen, variant, isChatbot, isDM, fullscreenSection]);


  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setState('minimized');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout]);

  const handleCloseModal = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setState('minimized');
      setIsClosing(false);
    }, 600); // Match animation duration
  }, []);

  // Rep Rack functionality - Memoized for better performance
  const handleUploadProject = useCallback(() => {
    // TODO: Implement project upload modal
    console.log('Upload new project');
  }, []);

  const handleSelectFromExisting = useCallback(() => {
    setShowRepRackManager(true);
  }, []);

  const handleRepRackAction = useCallback((action: string, slotIndex: number) => {
    console.log(`Rep Rack action: ${action} on slot ${slotIndex}`);
    // TODO: Implement like, share, view, remove actions
  }, []);

  const handleRepRackSelect = useCallback((project: { id: string; title: string; imageUrl: string }) => {
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
  }, []);

  const saveRepRack = useCallback(async () => {
    if (!user?.uid || isPublicView) return;
    try {
      await saveProfile(user.uid, { repRack: localProfile?.repRack?.slice(0, 3) });
    } catch (e) {
      console.error('Save rep rack failed', e);
    }
  }, [user?.uid, isPublicView, saveProfile, localProfile?.repRack]);

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

    // When expanding, focus the hub but only scroll if user hasn't scrolled down
    if (state === 'expanded') {
      const hubEl = document.querySelector('.profile-hub') as HTMLElement | null;
      if (hubEl) {
        hubEl.setAttribute('tabindex', '-1');
        hubEl.focus({ preventScroll: true });
        // Only scroll if user is near the top of the page - don't interrupt their scroll position
        if (typeof window !== 'undefined' && window.scrollY < 200) {
          hubEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
      }
    }
  }, [state]);

  // Enhanced keyboard navigation and focus management
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // ESC key handling
      if (event.key === 'Escape') {
        if (isExpanded) {
          handleCloseModal();
        } else {
          setState('minimized');
        }
        return;
      }

      // Tab navigation between sections when hub is expanded
      if (isExpanded) {
        const sections = document.querySelectorAll('.hub-collapsible[data-open="true"]');
        const currentIndex = Array.from(sections).findIndex(section =>
          section.contains(document.activeElement)
        );

        if (event.key === 'ArrowDown' && currentIndex < sections.length - 1) {
          event.preventDefault();
          const nextSection = sections[currentIndex + 1];
          (nextSection.querySelector('.hub-collapsible__summary') as HTMLElement)?.focus();
        } else if (event.key === 'ArrowUp' && currentIndex > 0) {
          event.preventDefault();
          const prevSection = sections[currentIndex - 1];
          (prevSection.querySelector('.hub-collapsible__summary') as HTMLElement)?.focus();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isExpanded]);

  const handleSendMessage = useCallback(() => {
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
  }, [messageDraft]);

  const themeClass = useMemo(() => THEME_MAP[theme], [theme]);
  const socialLinks = useMemo(
    () => [
      { id: 'twitter', label: 'X', href: 'https://x.com/inqsocial' },
      { id: 'discord', label: '💬', href: 'https://discord.gg/inqsocial' },
      { id: 'behance', label: 'Bē', href: 'https://www.behance.net/inqsocial' },
    ],
    []
  );

  // Social interaction handlers - Memoized for better performance
  const handleFollow = useCallback(async () => {
    if (!user?.uid || isPublicView) return;
    // TODO: Implement follow functionality
    console.log(`Following user ${profileUser?.id}`);
  }, [user?.uid, isPublicView, profileUser?.id]);

  const handleMessage = useCallback(async () => {
    if (!user?.uid || isPublicView) return;
    // TODO: Implement messaging functionality
    console.log(`Messaging user ${profileUser?.id}`);
  }, [user?.uid, isPublicView, profileUser?.id]);

  const fallbackShare = useCallback((url: string, text: string) => {
    navigator.clipboard.writeText(`${text} ${url}`);
    // TODO: Show toast notification
    console.log('Profile link copied to clipboard!');
  }, []);

  const handleShare = useCallback(async () => {
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
  }, [profileUser?.id, profileUser?.displayName, fallbackShare]);

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


  const hubContent = (
    <div
      className={`profile-hub-wrapper${isModalOpen && mode !== 'edit' ? ' profile-hub-wrapper--expanded' : ''}${fullscreenSection ? ' profile-hub-wrapper--fullscreen-active' : ''}`}
      data-variant={variant}
      data-expanded={isModalOpen && mode !== 'edit' ? 'true' : 'false'}
      data-fullscreen-active={fullscreenSection ? 'true' : 'false'}
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
                  <CollapsibleSection
                    id="customization-shop"
                    title="🛍️ Customization Shop"
                    defaultOpen={false}
                    sectionId="customization"
                    open={isSectionActive('customization')}
                    onToggle={() => handleSectionToggle('customization')}
                    isFullscreen={fullscreenSection === 'customization'}
                    onEnterFullscreen={() => openFullscreen('customization')}
                    onExitFullscreen={closeFullscreen}
                  >
                    <CustomizationShop
                      profile={localProfile}
                      onSave={async (updates) => {
                        if (!user?.uid) return;
                        try {
                          await saveProfile(user.uid, updates);
                          setLocalProfile(prev => ({ ...prev, ...updates }));
                          console.log('Customization saved successfully!');
                        } catch (error) {
                          console.error('Error saving customization:', error);
                        }
                      }}
                      onReset={() => {
                        setLocalProfile(profile || { repRack: [], theme: { mode: 'neo' } });
                        setTheme(profile?.theme?.mode || 'neo');
                      }}
                    />
                  </CollapsibleSection>
                )}

                {/* Featured Projects Section - Enhanced for public view */}
                <CollapsibleSection
                  id="featured"
                  title="🏆 Featured Projects"
                  defaultOpen={false}
                  sectionId="featured"
                  open={isSectionActive('featured')}
                  onToggle={() => handleSectionToggle('featured')}
                  isFullscreen={fullscreenSection === 'featured'}
                  onEnterFullscreen={() => openFullscreen('featured')}
                  onExitFullscreen={closeFullscreen}
                  quickbar={(
                    <div className="projects-toolbar">
                      <button className="projects-btn create-btn">+ New Project</button>
                      <button className="projects-btn manage-btn">Manage Projects</button>
                    </div>
                  )}
                >
                  <div className="featured-projects-enhanced">
                    <div className="featured-projects-grid">
                      {Array.from({ length: 12 }, (_, index) => {
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
                                  <span className="project-stat">❤️ {Math.floor(Math.random() * 50)}</span>
                                  <span className="project-stat">👁️ {Math.floor(Math.random() * 200)}</span>
                                  <span className="project-stat">⭐ {Math.floor(Math.random() * 20)}</span>
                                </div>
                                <div className="project-actions">
                                  <button className="project-action-btn view-btn">View</button>
                                  <button className="project-action-btn edit-btn">Edit</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="projects-toolbar">
                      <button className="projects-btn create-btn">+ New Project</button>
                      <button className="projects-btn manage-btn">Manage Projects</button>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Activity Timeline - Enhanced */}
                <CollapsibleSection
                  id="activity"
                  title="📅 Recent Activity"
                  defaultOpen={false}
                  sectionId="activity"
                  open={isSectionActive('activity')}
                  onToggle={() => handleSectionToggle('activity')}
                  isFullscreen={fullscreenSection === 'activity'}
                  onEnterFullscreen={() => openFullscreen('activity')}
                  onExitFullscreen={closeFullscreen}
                  quickbar={(
                    <div className="activity-filters">
                      <input
                        type="text"
                        placeholder="Search activity..."
                        className="activity-search"
                      />
                      <div className="activity-filter-buttons">
                        <button className="filter-btn active">All</button>
                        <button className="filter-btn">Projects</button>
                        <button className="filter-btn">Social</button>
                        <button className="filter-btn">Achievements</button>
                      </div>
                    </div>
                  )}
                >
                  <div className="activity-enhanced">
                    <div className="activity-timeline">
                      {Array.from({ length: 15 }, (_, index) => {
                        const activities = [
                          { icon: '🎨', text: 'Created a new interactive widget', time: '2 hours ago' },
                          { icon: '❤️', text: 'Received 5 likes on "Portfolio Showcase"', time: '5 hours ago' },
                          { icon: '👥', text: 'New follower: @designguru', time: '1 day ago' },
                          { icon: '🏆', text: 'Earned "Popular Creator" badge', time: '3 days ago' },
                          { icon: '💬', text: 'Commented on "Data Visualization Tool"', time: '1 week ago' },
                          { icon: '🚀', text: 'Published "React Dashboard"', time: '2 weeks ago' },
                          { icon: '🎆', text: 'Featured on community showcase', time: '3 weeks ago' },
                          { icon: '📊', text: 'Project reached 1000 views', time: '1 month ago' }
                        ];
                        const activity = activities[index % activities.length];
                        return (
                          <div key={index} className="activity-item">
                            <div className="activity-icon">{activity.icon}</div>
                            <div className="activity-content">
                              <div className="activity-text">{activity.text}</div>
                              <div className="activity-time">{activity.time}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="activity-filters">
                      <input
                        type="text"
                        placeholder="Search activity..."
                        className="activity-search"
                      />
                      <div className="activity-filter-buttons">
                        <button className="filter-btn active">All</button>
                        <button className="filter-btn">Projects</button>
                        <button className="filter-btn">Social</button>
                        <button className="filter-btn">Achievements</button>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Social Connections - Only in public view */}
                {isPublicView && (
                  <CollapsibleSection
                    id="social"
                    title="🌐 Social Connections"
                    defaultOpen={false}
                    sectionId="social"
                    open={isSectionActive('social')}
                    onToggle={() => handleSectionToggle('social')}
                    isFullscreen={fullscreenSection === 'social'}
                    onEnterFullscreen={() => openFullscreen('social')}
                    onExitFullscreen={closeFullscreen}
                  >
                    <div className="social-connections-enhanced">
                      <div className="social-stats-enhanced">
                        <div className="social-stat">
                          <span className="social-number">{profileUser?.stats?.followersCount || 0}</span>
                          <span className="social-label">Followers</span>
                        </div>
                        <div className="social-stat">
                          <span className="social-number">{profileUser?.stats?.followingCount || 0}</span>
                          <span className="social-label">Following</span>
                        </div>
                        <div className="social-stat">
                          <span className="social-number">{profileUser?.stats?.totalViews || 0}</span>
                          <span className="social-label">Profile Views</span>
                        </div>
                        <div className="social-stat">
                          <span className="social-number">{Math.floor((profileUser?.stats?.totalViews || 0) / 10)}</span>
                          <span className="social-label">Engagement</span>
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
                  <CollapsibleSection
                    id="followers"
                    title="👥 Recent Followers"
                    defaultOpen={false}
                    sectionId="followers"
                    open={isSectionActive('followers')}
                    onToggle={() => handleSectionToggle('followers')}
                    isFullscreen={fullscreenSection === 'followers'}
                    onEnterFullscreen={() => openFullscreen('followers')}
                    onExitFullscreen={closeFullscreen}
                    quickbar={(
                      <div className="followers-search">
                        <input
                          type="text"
                          placeholder="Search followers..."
                          className="search-input"
                        />
                      </div>
                    )}
                  >
                    <div className="followers-enhanced">
                      <div className="followers-grid">
                        {Array.from({ length: 20 }, (_, index) => (
                          <div key={index} className="follower-item">
                            <div className="follower-avatar">
                              <span role="img" aria-label="Follower avatar">
                                {['👨‍💻', '👩‍🎨', '🧑‍🔬', '👨‍🎨', '👩‍💻', '🧑‍🎨'][index % 6] || '👤'}
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
                      <div className="followers-search">
                        <input
                          type="text"
                          placeholder="Search followers..."
                          className="search-input"
                        />
                      </div>
                    </div>
                  </CollapsibleSection>
                )}

                {/* Following Section - Only in edit mode */}
                {!isPublicView && (
                  <CollapsibleSection
                    id="following"
                    title="👥 Following"
                    defaultOpen={false}
                    sectionId="following"
                    open={isSectionActive('following')}
                    onToggle={() => handleSectionToggle('following')}
                    isFullscreen={fullscreenSection === 'following'}
                    onEnterFullscreen={() => openFullscreen('following')}
                    onExitFullscreen={closeFullscreen}
                    quickbar={(
                      <div className="following-controls">
                        <input
                          type="text"
                          placeholder="Search following..."
                          className="search-input"
                        />
                        <div className="following-filter-buttons">
                          <button className="filter-btn active">All</button>
                          <button className="filter-btn">Active</button>
                          <button className="filter-btn">Recent</button>
                        </div>
                      </div>
                    )}
                  >
                    <div className="following-enhanced">
                      <div className="following-grid">
                        {Array.from({ length: 20 }, (_, index) => (
                          <div key={index} className="following-item">
                            <div className="following-avatar">
                              <span role="img" aria-label="Following avatar">
                                {['👨‍💻', '👩‍🎨', '🧑‍🔬', '👨‍🎨', '👩‍💻', '🧑‍🎨'][index % 6] || '👤'}
                              </span>
                            </div>
                            <div className="following-info">
                              <span className="following-name">Creator {index + 1}</span>
                              <span className="following-handle">@creator{index + 1}</span>
                              <span className="following-projects">{Math.floor(Math.random() * 20) + 1} projects</span>
                            </div>
                            <div className="following-actions">
                              <button className="following-action">Unfollow</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="following-controls">
                        <input
                          type="text"
                          placeholder="Search following..."
                          className="search-input"
                        />
                        <div className="following-filter-buttons">
                          <button className="filter-btn active">All</button>
                          <button className="filter-btn">Active</button>
                          <button className="filter-btn">Recent</button>
                        </div>
                      </div>
                    </div>
                  </CollapsibleSection>
                )}
                <CollapsibleSection
                  id="quicknav"
                  title="🧰 Quick Navigation"
                  defaultOpen={false}
                  sectionId="navigation"
                  open={isSectionActive('navigation')}
                  onToggle={() => handleSectionToggle('navigation')}
                  isFullscreen={fullscreenSection === 'navigation'}
                  onEnterFullscreen={() => openFullscreen('navigation')}
                  onExitFullscreen={closeFullscreen}
                >
                  <div className="navigation-enhanced">
                    <div className="expanded-nav-buttons">
                      <a
                        href="/explore"
                        className="expanded-nav-btn"
                        title="Explore Projects"
                      >
                        <span className="nav-icon">🔍</span>
                        <span className="nav-label">Explore</span>
                        <span className="nav-desc">Discover amazing projects from the community</span>
                      </a>
                      <a
                        href="/explore-reels"
                        className="expanded-nav-btn"
                        title="Explore Reels"
                      >
                        <span className="nav-icon">🎞️</span>
                        <span className="nav-label">Reels</span>
                        <span className="nav-desc">Swipe through demo videos</span>
                      </a>
                      <a
                        href="/users"
                        className="expanded-nav-btn"
                        title="Browse Creators"
                      >
                        <span className="nav-icon">👥</span>
                        <span className="nav-label">Creators</span>
                        <span className="nav-desc">Find and follow creators</span>
                      </a>
                      <a
                        href="/showcase"
                        className="expanded-nav-btn"
                        title="View Showcase"
                      >
                        <span className="nav-icon">🏆</span>
                        <span className="nav-label">Showcase</span>
                        <span className="nav-desc">Top projects and features</span>
                      </a>
                      <a
                        href="/studio"
                        className="expanded-nav-btn"
                        title="Widget Studio"
                      >
                        <span className="nav-icon">🎨</span>
                        <span className="nav-label">Studio</span>
                        <span className="nav-desc">Create new widgets</span>
                      </a>
                    </div>
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
                  {messages.map((message, index) => {
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const isConsecutive = prevMessage?.sender === message.sender;
                    const isUser = message.sender === 'me';
                    return (
                      <div
                        key={`${message.sender}-${index}`}
                        className={`hub-chat-message ${isUser ? 'hub-chat-message--user' : 'hub-chat-message--ai'} ${isConsecutive ? 'hub-chat-message--consecutive' : ''}`}
                      >
                        {!isConsecutive && (
                          <span className="avatar" aria-hidden="true">
                            {message.avatar}
                          </span>
                        )}
                        {isConsecutive && <span className="avatar avatar--hidden" aria-hidden="true"></span>}
                        <div className="bubble">{message.text}</div>
                      </div>
                    );
                  })}
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
      {fullscreenSection ? (
        <div
          role="presentation"
          className="hub-fullscreen-overlay"
          onClick={closeFullscreen}
        />
      ) : null}
      {/* Only show overlay when expanded/chatbot AND not billboard AND not edit mode */}
      {
        variant !== 'billboard' && isModalOpen && mode !== 'edit' ? (
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
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              zIndex: 999
            } as React.CSSProperties}
          />
        ) : null}
      {!isPublicView && showRepRackManager && (
        <RepRackManager onProjectSelect={(p) => handleRepRackSelect({ id: p.id, title: p.title, imageUrl: p.imageUrl })} onClose={() => setShowRepRackManager(false)} />
      )}
    </div>
  );

  // For billboard variant, return hub content directly
  if (variant === 'billboard') {
    return hubContent;
  }

  // For modal variants, wrap in FullscreenWrapper when expanded
  if (isExpanded) {
    return (
      <FullscreenWrapper
        isFullscreen={isHubFullscreen}
        onToggle={() => setIsHubFullscreen(!isHubFullscreen)}
        onClose={() => {
          setIsHubFullscreen(false);
          setState('minimized');
        }}
        title="Profile Hub"
        sectionId="profile-hub"
        className="profile-hub-fullscreen"
      >
        {hubContent}
      </FullscreenWrapper>
    );
  }

  return hubContent;
};

export default ProfileHub;


