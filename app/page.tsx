'use client';

import FloatingOrb, { type NavItem, NAV_ITEMS } from './components/FloatingOrb';
import Link from 'next/link';
import ProfileHub from './components/ProfileHub';
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

  // Prevent scrolling (JavaScript approach)
  useEffect(() => {
    const preventScroll = (e: WheelEvent | TouchEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent scroll events
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });

    // Cleanup
    return () => {
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  // Typing effect animation
  useEffect(() => {
    const currentSlogan = SLOGANS[currentSloganIndex];
    const typingSpeed = 50; // milliseconds per character
    const deletingSpeed = 30; // milliseconds per character when deleting
    const pauseTime = 2000; // pause at the end of a slogan

    const timer = setTimeout(() => {
      if (isTyping) {
        // Typing phase
        if (currentCharIndex < currentSlogan.length) {
          setDisplayedText(currentSlogan.slice(0, currentCharIndex + 1));
          setCurrentCharIndex(currentCharIndex + 1);
        } else {
          // Finished typing, start pause before deleting
          setTimeout(() => {
            setIsTyping(false);
          }, pauseTime);
        }
      } else {
        // Deleting phase
        if (currentCharIndex > 0) {
          setDisplayedText(currentSlogan.slice(0, currentCharIndex - 1));
          setCurrentCharIndex(currentCharIndex - 1);
        } else {
          // Finished deleting, move to next slogan
          setCurrentSloganIndex((prev) => (prev + 1) % SLOGANS.length);
          setIsTyping(true);
        }
      }
    }, isTyping ? typingSpeed : deletingSpeed);

    return () => clearTimeout(timer);
  }, [currentCharIndex, isTyping, currentSloganIndex]);

  return (
    <div className="min-h-screen w-full bg-[#04060d] text-white overflow-hidden">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-16 px-6 py-24 sm:px-10">
        <header className="flex flex-col items-center gap-8 text-center">
          <span className="text-sm uppercase tracking-[0.8em] text-[#4ff1ff]">inq social</span>
          <h1 className="font-orbitron text-4xl text-[#66faff] sm:text-5xl md:text-6xl">
            creatives platform
          </h1>
          <p className="max-w-xl text-balance text-base text-[#bdefff]/80 sm:text-lg">
            {displayedText}
            <span
              className={`ml-1 inline-block h-5 w-0.5 bg-[#4ff1ff] ${
                isTyping && currentCharIndex === SLOGANS[currentSloganIndex].length ? 'animate-pulse' : ''
              }`}
            />
          </p>
          <div className="hero-profile-integration">
            <ProfileHub variant="billboard" />
          </div>
        <FloatingOrb onActiveChange={setActiveNavItem} />
        </header>
      </main>
    </div>
  );
}
