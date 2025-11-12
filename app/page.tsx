'use client';

import FloatingOrb, { type NavItem, NAV_ITEMS } from './components/FloatingOrb';
import ProfileHub from './components/ProfileHub';
import AuthButton from './components/AuthButton';
import TutorialModal from './components/TutorialModal';
import PersonalInfoModal from './components/PersonalInfoModal';
import ContactUsModal from './components/ContactUsModal';
import SiteStatsSection from './components/SiteStatsSection';
import './styles/hero-hub.css';
import { useEffect, useState, useCallback } from 'react';

// Different slogans to cycle through
const SLOGANS = [
  "showcase, communicate, create your way. the orb is our navigation pulse.",
  "connect, collaborate, create together. discover the power of our floating interface.",
  "express yourself through interactive widgets. join the creative revolution today.",
  "build, share, inspire. your digital canvas awaits in the floating orb.",
  "seamlessly navigate your creative journey. the future of social platforms is here."
];

export default function Home() {
  const [activeNavItem, setActiveNavItem] = useState<NavItem>(NAV_ITEMS[0]);
  const quickAccessText = `Open ${activeNavItem.label}`;
  // Track ProfileHub state to show dedicated section when expanded/chatbot/dm
  const [hubState, setHubState] = useState<'minimized' | 'expanded' | 'chatbot' | 'dm'>('minimized');
  const showExtended = hubState === 'expanded' || hubState === 'chatbot' || hubState === 'dm';

  // Typing effect state
  const [currentSloganIndex, setCurrentSloganIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isUserScrolled, setIsUserScrolled] = useState(false);

  // Modal states
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  const [isContactUsOpen, setIsContactUsOpen] = useState(false);

  // Legacy redirect: support /?user=ID -> /u/ID
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const legacyUser = params.get('user');
    if (legacyUser) {
      const target = `/u/${legacyUser}`;
      window.location.replace(target);
    }
  }, []);

  // Detect when user scrolls away from top to pause typing animation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const hasScrolled = scrollY > 100; // Consider scrolled if more than 100px from top
      setIsUserScrolled(hasScrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to extended hub section when it opens - Memoized for better performance
  const scrollToExtendedSection = useCallback(() => {
    const section = document.getElementById('hub-extended-section');
    if (!section) return;

    // Don't scroll if user is already scrolled down (avoid interrupting natural scroll)
    if (window.scrollY > 200) {
      return;
    }

    // Use multiple requestAnimationFrame and delay to ensure DOM is ready
    // This is especially important on mobile where content needs to render
    const scrollTimeout = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const isMobile = window.innerWidth <= 768;

          // Get section position relative to viewport
          const rect = section.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const viewportTop = 0;

          // Check if section is accessible in viewport
          // On mobile, ensure at least a significant portion is visible
          const isAccessible = isMobile
            ? (rect.top >= viewportTop - 100 && rect.bottom > viewportTop + 100) // Allow some tolerance
            : (rect.top >= viewportTop && rect.bottom <= viewportHeight);

          // If not accessible, scroll to it
          if (!isAccessible) {
            // On mobile, use 'start' to ensure section appears at top with some padding
            section.scrollIntoView({
              behavior: 'smooth',
              block: isMobile ? 'start' : 'nearest',
              inline: 'nearest'
            });
          }
        });
      });
    }, 200); // Delay to ensure state updates and content rendering are complete

    return () => clearTimeout(scrollTimeout);
  }, []);

  useEffect(() => {
    const modalOpen = hubState === 'expanded' || hubState === 'chatbot' || hubState === 'dm';
    if (modalOpen) {
      // Only scroll for expanded state, not for chatbot/dm which are overlays
      // BUT: Don't scroll if user has already scrolled down - let them stay where they are
      if (hubState === 'expanded' && window.scrollY < 200) {
        return scrollToExtendedSection();
      }
    }
  }, [hubState, scrollToExtendedSection]);

  // Typing effect animation - only runs when user is at top of page
  useEffect(() => {
    // Don't run typing animation if user has scrolled away from top
    if (isUserScrolled) {
      // Show complete current slogan when scrolled
      if (displayedText !== SLOGANS[currentSloganIndex]) {
        setDisplayedText(SLOGANS[currentSloganIndex]);
      }
      return;
    }

    const currentSlogan = SLOGANS[currentSloganIndex];
    const typingSpeed = 80;
    const deletingSpeed = 80;
    const pauseTime = 3000;

    const timer = setTimeout(() => {
      if (isTyping) {
        if (currentCharIndex < currentSlogan.length) {
          setDisplayedText(currentSlogan.slice(0, currentCharIndex + 1));
          setCurrentCharIndex(currentCharIndex + 1);
        } else {
          setTimeout(() => {
            setIsTyping(false);
          }, pauseTime);
        }
      } else {
        if (currentCharIndex > 0) {
          setDisplayedText(currentSlogan.slice(0, currentCharIndex - 1));
          setCurrentCharIndex(currentCharIndex - 1);
        } else {
          setCurrentSloganIndex((prev) => (prev + 1) % SLOGANS.length);
          setIsTyping(true);
        }
      }
    }, isTyping ? typingSpeed : deletingSpeed);

    return () => clearTimeout(timer);
  }, [currentCharIndex, isTyping, currentSloganIndex, isUserScrolled, displayedText]);

  return (
    <div className="min-h-screen w-full bg-[#04060d] text-white">
      {/* Top Buttons */}
      <div className="homepage-top-buttons">
        <button
          className="homepage-top-btn"
          onClick={() => setIsTutorialOpen(true)}
          aria-label="Open tutorial"
          title="Don't know where to start?"
        >
          ?
        </button>
        <button
          className="homepage-top-btn"
          onClick={() => setIsPersonalInfoOpen(true)}
          aria-label="Personal information"
          title="Personal information"
        >
          ℹ
        </button>
      </div>

      {/* Modals */}
      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
      <PersonalInfoModal
        isOpen={isPersonalInfoOpen}
        onClose={() => setIsPersonalInfoOpen(false)}
        onContactClick={() => {
          setIsPersonalInfoOpen(false);
          setTimeout(() => setIsContactUsOpen(true), 250);
        }}
      />
      <ContactUsModal isOpen={isContactUsOpen} onClose={() => setIsContactUsOpen(false)} />

      <main className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-6 py-20 sm:px-10 md:py-16">
        <header className="flex flex-col items-center gap-8 text-center">
          <span className="text-sm uppercase tracking-[0.8em] text-[#4ff1ff]">inqu studio</span>
          <h1 className="font-orbitron text-4xl text-[#66faff] sm:text-5xl md:text-6xl">
            creatives platform
          </h1>
          <div className="text-animation-container max-w-xl">
            <p className="text-balance text-base text-[#bdefff]/80 sm:text-lg min-h-[3.5rem] sm:min-h-[4rem] flex items-center justify-center">
              <span className="text-content" style={{
                display: 'inline-block',
                minWidth: '1ch',
                contain: 'layout style',
                willChange: 'contents'
              }}>
                {displayedText}
                <span
                  className={`ml-1 inline-block h-5 w-0.5 bg-[#4ff1ff] ${!isUserScrolled && isTyping && currentCharIndex === SLOGANS[currentSloganIndex].length ? 'animate-pulse' : ''
                    }`}
                  style={{ verticalAlign: 'baseline' }}
                />
              </span>
            </p>
          </div>
          <div className="social-media-icons">
            <a
              href="https://www.instagram.com/inqu_studio/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon group"
              aria-label="Instagram"
            >
              <svg
                className="w-6 h-6 sm:w-7 sm:h-7"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a
              href="https://www.youtube.com/@inqustudio"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon group"
              aria-label="YouTube"
            >
              <svg
                className="w-6 h-6 sm:w-7 sm:h-7"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
            <a
              href="https://github.com/nicholasjvr"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon group"
              aria-label="GitHub"
            >
              <svg
                className="w-6 h-6 sm:w-7 sm:h-7"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
          <FloatingOrb onActiveChange={setActiveNavItem} />
          <AuthButton />
        </header>
        {!showExtended && (
          <section>
            <div className="hero-profile-integration">
              <ProfileHub variant="billboard" onStateChange={setHubState} />
            </div>
          </section>
        )}
        {showExtended && (
          <section id="hub-extended-section">
            <div className="hero-profile-extended">
              <ProfileHub variant="billboard" initialState={hubState} onStateChange={setHubState} />
            </div>
          </section>
        )}
        <SiteStatsSection />
      </main>
    </div>
  );
}
