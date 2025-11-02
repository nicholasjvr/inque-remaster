'use client';

import FloatingOrb, { type NavItem, NAV_ITEMS } from './components/FloatingOrb';
import ProfileHub from './components/ProfileHub';
import AuthButton from './components/AuthButton';
import './styles/hero-hub.css';
import { useEffect, useState } from 'react';

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
  
  // Smooth scroll to extended hub section when it opens
  useEffect(() => {
    const modalOpen = hubState === 'expanded' || hubState === 'chatbot' || hubState === 'dm';
    if (modalOpen) {
      const section = document.getElementById('hub-extended-section');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hubState]);

  // Typing effect animation
  useEffect(() => {
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
  }, [currentCharIndex, isTyping, currentSloganIndex]);

  return (
    <div className="min-h-screen w-full bg-[#04060d] text-white">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-12 px-6 py-20 sm:px-10 md:py-16">
        <header className="flex flex-col items-center gap-8 text-center">
          <span className="text-sm uppercase tracking-[0.8em] text-[#4ff1ff]">inqu studio</span>
          <h1 className="font-orbitron text-4xl text-[#66faff] sm:text-5xl md:text-6xl">
            creatives platform
          </h1>
          <div className="text-animation-container max-w-xl">
            <p className="text-balance text-base text-[#bdefff]/80 sm:text-lg min-h-[3.5rem] sm:min-h-[4rem] flex items-center justify-center">
              <span className="text-content">
                {displayedText}
                <span
                  className={`ml-1 inline-block h-5 w-0.5 bg-[#4ff1ff] ${
                    isTyping && currentCharIndex === SLOGANS[currentSloganIndex].length ? 'animate-pulse' : ''
                  }`}
                />
              </span>
            </p>
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
      </main>
    </div>
  );
}
