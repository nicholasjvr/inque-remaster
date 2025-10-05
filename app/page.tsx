'use client';

import FloatingOrb, { type NavItem, NAV_ITEMS } from './components/FloatingOrb';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [activeNavItem, setActiveNavItem] = useState<NavItem>(NAV_ITEMS[0]);
  const quickAccessText = `Open ${activeNavItem.label}`;

  return (
    <div className="min-h-screen w-full bg-[#04060d] text-white">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-16 px-6 py-24 sm:px-10">
        <header className="flex flex-col items-center gap-6 text-center">
          <span className="text-sm uppercase tracking-[0.8em] text-[#4ff1ff]">inq social</span>
          <h1 className="font-orbitron text-4xl text-[#66faff] sm:text-5xl md:text-6xl">
            creatives platform
          </h1>
          <p className="max-w-xl text-balance text-base text-[#bdefff]/80 sm:text-lg">
            showcase, communicate, create your way. the orb is our navigation pulse.
          </p>
        </header>

        <FloatingOrb onActiveChange={setActiveNavItem} />

        {/* Quick Access to Widget Studio */}
        <div className="quick-access">
          <Link 
            href={activeNavItem.href}
            className="studio-link"
          >
            <span className="studio-icon">{activeNavItem.icon}</span>
            <span className="studio-text">{quickAccessText}</span>
            <span className="studio-arrow">→</span>
          </Link>
        </div>

        <section className="grid gap-4 text-center text-sm uppercase tracking-[0.32em] text-[#6cdfff]">
          <p>scroll or drag to rotate • release to snap</p>
          <p>enter to jump • arrow keys to explore</p>
        </section>
      </main>
    </div>
  );
}
