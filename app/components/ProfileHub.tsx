'use client';

import { useEffect, useMemo, useState } from 'react';

import '../profile-hub.css';

type HubState = 'minimized' | 'expanded' | 'chatbot';
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

const ProfileHub = () => {
  const [state, setState] = useState<HubState>('minimized');
  const [theme, setTheme] = useState<HubTheme>(() => loadPreferences().theme);
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_MESSAGE]);
  const [messageDraft, setMessageDraft] = useState('');
  const isExpanded = state === 'expanded';
  const isChatbot = state === 'chatbot';

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
    const overlay = document.querySelector('.profile-hub-overlay');
    if (!overlay) return;
    const shouldShow = state === 'expanded' || state === 'chatbot';
    overlay.classList.toggle('active', shouldShow);
  }, [state]);

  useEffect(() => {
    let handler: ((e: KeyboardEvent) => void) | null = null;
    handler = (event) => {
      if (event.key === 'Escape') {
        setState('minimized');
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      if (handler) window.removeEventListener('keydown', handler);
    };
  }, []);

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
    <div className="profile-hub-wrapper" aria-live="polite">
      <div className={`profile-hub-shell${isExpanded ? ' profile-hub-shell--expanded' : ''}`}>
        <div
          className="profile-hub"
          data-state={state}
          data-theme={themeClass}
          data-customizing={isExpanded ? 'true' : 'false'}
        >
          <div className="hub-core">
            <div className="hub-user-section">
              <div className="hub-avatar" aria-hidden="true">
                <span role="img" aria-label="Guest avatar">
                  👤
                </span>
              </div>
              <div className="hub-user-info">
                <span className="hub-user-name">Guest</span>
                <span className="hub-user-status">Customize your profile hub</span>
                <span className="hub-user-level">LVL • ?</span>
              </div>
            </div>

            <div className="hub-controls">
              <button
                type="button"
                className="hub-button"
                title="Toggle chat"
                onClick={() => setState((prev) => (prev === 'chatbot' ? 'minimized' : 'chatbot'))}
              >
                🤖
              </button>

              <button
                type="button"
                className="hub-button"
                title="Toggle customization panel"
                onClick={() => setState((prev) => (prev === 'expanded' ? 'minimized' : 'expanded'))}
              >
                🎛️
              </button>

              <button
                type="button"
                className="hub-toggle"
                title={isExpanded ? 'Collapse hub' : 'Expand hub'}
                onClick={() => setState((prev) => (prev === 'expanded' ? 'minimized' : 'expanded'))}
              >
                <span>⫷</span>
              </button>
            </div>
          </div>

          {isExpanded && (
            <div className="hub-expanded-content">
              <section className="hub-section" aria-labelledby="hub-stats-title">
                <h3 id="hub-stats-title">Stats</h3>
                <div className="hub-stats">
                  <div className="hub-stat-card">
                    <div className="hub-stat-value">0</div>
                    <div className="hub-stat-label">Widgets</div>
                  </div>
                  <div className="hub-stat-card">
                    <div className="hub-stat-value">0</div>
                    <div className="hub-stat-label">Followers</div>
                  </div>
                  <div className="hub-stat-card">
                    <div className="hub-stat-value">0</div>
                    <div className="hub-stat-label">Views</div>
                  </div>
                </div>
              </section>

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
                  </div>

                  <div className="customization-actions">
                    <button type="button" className="primary" onClick={() => persistPreferences({ theme, scale: 1 })}>
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTheme('neo');
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
          {isChatbot && (
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
      <div className="profile-hub-overlay" onClick={() => setState('minimized')} />
    </div>
  );
};

export default ProfileHub;


