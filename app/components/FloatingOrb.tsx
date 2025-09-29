'use client';

import { useEffect } from 'react';

import '../floating-orb.css';

type NavItem = {
  id: string;
  icon: string;
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'nav-home', icon: '🏠', label: 'Home', href: '/' },
  { id: 'nav-explore', icon: '🔍', label: 'Explore', href: '/explore' },
  {
    id: 'nav-projects',
    icon: '📊',
    label: 'Projects',
    href: '/projects',
  },
  {
    id: 'nav-inventory',
    icon: '🗂️',
    label: 'Inventory',
    href: '/inventory',
  },
  {
    id: 'nav-studio',
    icon: '🎨',
    label: 'Widget Studio',
    href: '/studio',
  },
  {
    id: 'nav-knowledge',
    icon: '📚',
    label: 'Knowledge',
    href: '/knowledge',
  },
  { id: 'nav-showcase', icon: '🏆', label: 'Showcase', href: '/showcase' },
];

const ROTATION_STEP = 360 / NAV_ITEMS.length;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const FloatingOrb = () => {
  useEffect(() => {
    const container = document.getElementById('orb-container');
    if (!container) return;

    const existing = container.querySelector('.floating-orb-wrapper');
    if (existing) return;

    const previewEl = container.querySelector<HTMLDivElement>(
      '.orb-center-preview',
    );
    const labelEl = container.querySelector<HTMLDivElement>(
      '.orb-center-label',
    );

    const wrapper = document.createElement('div');
    wrapper.className = 'floating-orb-wrapper';
    wrapper.setAttribute('data-debug', 'false');

    const stage = document.createElement('div');
    stage.className = 'floating-orb-stage';

    const scrollLine = document.createElement('div');
    scrollLine.className = 'orb-scroll-line';

    const navContainer = document.createElement('div');
    navContainer.className = 'orb-nav-container';

    const orbButton = document.createElement('button');
    orbButton.type = 'button';
    orbButton.className = 'floating-orb';
    orbButton.setAttribute('aria-label', NAV_ITEMS[0].label);
    orbButton.setAttribute('tabindex', '0');

    stage.append(scrollLine, navContainer, orbButton);
    wrapper.append(stage);

    const tooltip = document.createElement('div');
    tooltip.className = 'orb-usage-tooltip';
    tooltip.textContent = 'Scroll or drag to rotate • Release to snap';
    wrapper.append(tooltip);

    container.append(wrapper);

    const navButtons: HTMLButtonElement[] = [];

    NAV_ITEMS.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'orb-nav-item';
      btn.setAttribute('data-id', item.id);
      btn.setAttribute('title', item.label);
      btn.setAttribute('aria-label', item.label);
      btn.textContent = item.icon;

      btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        window.location.href = item.href;
      });

      btn.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          window.location.href = item.href;
        }
      });

      navContainer.append(btn);
      navButtons.push(btn);
    });

    let animationFrame = 0;
    let hideRingTimeout: number | null = null;
    let tooltipTimeout: number | null = null;
    let pointerActive = false;
    let lastPointerX = 0;
    let activeIndex = 0;

    const scrollState = {
      currentRotation: 0,
      targetRotation: 0,
      lockPoints: NAV_ITEMS.map((_, i) => i * ROTATION_STEP),
    };

    const updateCenterPreview = () => {
      const item = NAV_ITEMS[activeIndex];
      if (previewEl) previewEl.textContent = item.icon;
      if (labelEl) labelEl.textContent = item.label;
      orbButton.setAttribute('aria-label', item.label);

      navButtons.forEach((btn, idx) => {
        if (idx === activeIndex) {
          btn.classList.add('in-front');
        } else {
          btn.classList.remove('in-front');
        }
      });
    };

    const updateActiveFromRotation = () => {
      let rot = scrollState.targetRotation % 360;
      if (rot < 0) rot += 360;
      const bucket = Math.round(rot / ROTATION_STEP) % NAV_ITEMS.length;
      const newActive = (NAV_ITEMS.length - bucket) % NAV_ITEMS.length;
      if (newActive !== activeIndex) {
        activeIndex = newActive;
        updateCenterPreview();
      } else if (!previewEl?.textContent) {
        updateCenterPreview();
      }
    };

    const updateOrbitPositions = () => {
      const radius = (container.clientWidth || 280) /
        (window.innerWidth <= 480 ? 2.6 : 2.3);
      const tilt = window.innerWidth <= 480 ? 0.2 : 0.28;

      const rotationRad = (scrollState.currentRotation * Math.PI) / 180;
      const stepRad = (2 * Math.PI) / NAV_ITEMS.length;

      navButtons.forEach((btn, index) => {
        const angle = stepRad * index + rotationRad;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * tilt;
        const isFront = Math.cos(angle) > 0;

        btn.style.setProperty('--x', `${x}px`);
        btn.style.setProperty('--y', `${y}px`);

        if (isFront) {
          btn.classList.add('in-front');
        } else {
          btn.classList.remove('in-front');
        }
      });
    };

    const animate = () => {
      const diff = scrollState.targetRotation - scrollState.currentRotation;
      const damping = prefersReducedMotion() ? 1 : 0.12;
      if (Math.abs(diff) > 0.05) {
        scrollState.currentRotation += diff * damping;
      } else {
        scrollState.currentRotation = scrollState.targetRotation;
      }

      if (scrollLine) {
        scrollLine.style.setProperty(
          '--scroll-rotation',
          `${scrollState.currentRotation}deg`,
        );
      }

      updateOrbitPositions();
      updateActiveFromRotation();

      animationFrame = requestAnimationFrame(animate);
    };

    const showRing = () => {
      if (!scrollLine) return;
      scrollLine.style.opacity = '1';
      if (hideRingTimeout) {
        window.clearTimeout(hideRingTimeout);
      }
      hideRingTimeout = window.setTimeout(() => {
        scrollLine.style.opacity = '0.3';
      }, 1600);
    };

    const snapToNearestLockPoint = () => {
      const normalized = ((scrollState.targetRotation % 360) + 360) % 360;
      let closest = scrollState.lockPoints[0];
      let minDist = Math.abs(normalized - closest);

      scrollState.lockPoints.forEach((lock) => {
        const dist = Math.min(
          Math.abs(normalized - lock),
          Math.abs(normalized - lock - 360),
          Math.abs(normalized - lock + 360),
        );
        if (dist < minDist) {
          closest = lock;
          minDist = dist;
        }
      });

      const base = Math.floor(scrollState.targetRotation / 360) * 360;
      scrollState.targetRotation = base + closest;
      wrapper.classList.add('lock-snap');
      window.setTimeout(() => wrapper.classList.remove('lock-snap'), 200);
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      scrollState.targetRotation += event.deltaY * 0.35;
      showRing();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if ((event.target as HTMLElement).closest('.orb-nav-item')) {
        return;
      }
      pointerActive = true;
      lastPointerX = event.clientX;
      container.setPointerCapture(event.pointerId);
      showRing();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerActive) return;
      const delta = event.clientX - lastPointerX;
      lastPointerX = event.clientX;
      scrollState.targetRotation += delta * 0.6;
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!pointerActive) return;
      pointerActive = false;
      container.releasePointerCapture(event.pointerId);
      snapToNearestLockPoint();
    };

    const setActiveIndex = (index: number, snap = true) => {
      const normalized = ((index % NAV_ITEMS.length) + NAV_ITEMS.length) %
        NAV_ITEMS.length;
      activeIndex = normalized;
      const baseRotation = -normalized * ROTATION_STEP;
      const current = scrollState.targetRotation;
      const loops = Math.round((current - baseRotation) / 360);
      scrollState.targetRotation = baseRotation + loops * 360;
      if (snap) {
        snapToNearestLockPoint();
      }
      updateCenterPreview();
    };

    orbButton.addEventListener('click', (event) => {
      event.preventDefault();
      const activeItem = NAV_ITEMS[activeIndex];
      window.location.href = activeItem.href;
    });

    orbButton.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setActiveIndex(activeIndex - 1, true);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setActiveIndex(activeIndex + 1, true);
      } else if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        snapToNearestLockPoint();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const activeItem = NAV_ITEMS[activeIndex];
        window.location.href = activeItem.href;
      }
    });

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerUp);

    updateCenterPreview();
    animate();

    try {
      if (!localStorage.getItem('orb-tooltip-seen')) {
        tooltip.classList.add('show');
        tooltipTimeout = window.setTimeout(() => {
          tooltip.classList.remove('show');
          localStorage.setItem('orb-tooltip-seen', '1');
        }, 3200);
      }
    } catch (error) {
      console.warn('Orb tooltip storage unavailable', error);
    }

    const handleResize = () => {
      updateOrbitPositions();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrame);
      if (hideRingTimeout) window.clearTimeout(hideRingTimeout);
      if (tooltipTimeout) window.clearTimeout(tooltipTimeout);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerUp);
      wrapper.remove();
    };
  }, []);

  return (
    <div className="floating-orb-shell">
      <div id="orb-container">
        <div className="orb-center-preview" aria-hidden="true" />
        <div className="orb-center-label" aria-live="polite" />
      </div>
    </div>
  );
};

export default FloatingOrb;


