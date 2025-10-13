'use client';

import { useEffect, useRef } from 'react';

import '../floating-orb.css';

export type NavItem = {
  id: string;
  icon: string;
  label: string;
  href: string;
};

export const NAV_ITEMS: NavItem[] = [
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
    id: 'nav-tracks',
    icon: '🗂️',
    label: 'Tracks',
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

type FloatingOrbProps = {
  onActiveChange?: (item: NavItem) => void;
};

const FloatingOrb = ({ onActiveChange }: FloatingOrbProps) => {
  const onActiveChangeRef = useRef(onActiveChange);

  useEffect(() => {
    onActiveChangeRef.current = onActiveChange;
  }, [onActiveChange]);

  useEffect(() => {
    const container = document.getElementById('orb-container');
    if (!container) return;

    const existing = container.querySelector('.floating-orb-wrapper');
    if (existing) {
      console.log('⚠️ Floating orb wrapper already exists, skipping initialization');
      return;
    }
    console.log('🔍 Container element:', container);
    console.log('🔍 Container children before:', container.children.length);

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

    const webglLayer = document.createElement('div');
    webglLayer.className = 'orb-webgl-layer';

    const scrollLine = document.createElement('div');
    scrollLine.className = 'orb-scroll-line';

    const navContainer = document.createElement('div');
    navContainer.className = 'orb-nav-container';

    const orbButton = document.createElement('button');
    orbButton.type = 'button';
    orbButton.className = 'floating-orb';
    orbButton.setAttribute('aria-label', NAV_ITEMS[0].label);
    orbButton.setAttribute('tabindex', '0');

    // Swipe indicator (mobile UX)
    const swipeIndicator = document.createElement('div');
    swipeIndicator.className = 'orb-swipe-indicator';
    swipeIndicator.innerHTML = `
      <span class="swipe-arrow left" aria-hidden="true"></span>
      <span class="swipe-text">Swipe</span>
      <span class="swipe-arrow right" aria-hidden="true"></span>
    `;

    // Tooltip (desktop UX)
    const tooltip = document.createElement('div');
    tooltip.className = 'orb-tooltip';
    tooltip.innerHTML = `
      <span class="tooltip-arrow" aria-hidden="true"></span>
      <span class="tooltip-text">Drag to navigate • Click to select</span>
    `;

    stage.append(webglLayer, scrollLine, navContainer, orbButton, swipeIndicator, tooltip);
    wrapper.append(stage);

    console.log('🏗️ DOM structure created:', {
      wrapper: wrapper.className,
      stage: stage.className,
      webglLayer: webglLayer.className,
      navContainer: navContainer.className,
      orbButton: orbButton.className
    });

    // Actually append the wrapper to the container
    container.appendChild(wrapper);

    console.log('🔗 Wrapper appended to container');
    console.log('🔍 Container children after append:', container.children.length);

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
    let lastInteractionAt = performance.now();
    let lastFrameAt = performance.now();
    // Orb drag UX state
    let orbDragActive = false;
    let orbLastX = 0;
    let orbMovedSinceDown = false;
    // Hidden controls state
    let showControls = false;
    let longPressTimer: number | null = null;
    const LONG_PRESS_MS = 1500;
    const AUTO_ROTATE_DELAY_MS = 2200;
    const AUTO_ROTATE_DEG_PER_SEC = 20; 

    const recordInteraction = () => {
      lastInteractionAt = performance.now();
    };

    const notifyActiveChange = () => {
      const item = NAV_ITEMS[activeIndex];
      onActiveChangeRef.current?.(item);
    };

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

      notifyActiveChange();
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
      const now = performance.now();
      const dt = (now - lastFrameAt) / 1000;
      lastFrameAt = now;

      // Idle auto-rotation when user is not interacting
      if (!prefersReducedMotion() && !pointerActive && now - lastInteractionAt > AUTO_ROTATE_DELAY_MS) {
        scrollState.targetRotation -= AUTO_ROTATE_DEG_PER_SEC * dt;
      }

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
      recordInteraction();
    };

    const handlePointerDown = (event: PointerEvent) => {
      // Do not start drag when pressing on center orb or a nav item
      if ((event.target as HTMLElement).closest('.orb-nav-item') ||
          (event.target as HTMLElement).closest('.floating-orb')) {
        return;
      }
      pointerActive = true;
      lastPointerX = event.clientX;
      container.setPointerCapture(event.pointerId);
      showRing();
      recordInteraction();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerActive) return;
      const delta = event.clientX - lastPointerX;
      lastPointerX = event.clientX;
      scrollState.targetRotation += delta * 0.6;
      recordInteraction();
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!pointerActive) return;
      pointerActive = false;
      container.releasePointerCapture(event.pointerId);
      snapToNearestLockPoint();
      recordInteraction();
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

    // Center ORB drag-and-click behavior with movement threshold
    orbButton.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      recordInteraction();
      orbDragActive = true;
      orbMovedSinceDown = false;
      orbLastX = e.clientX;
      try { orbButton.setPointerCapture(e.pointerId); } catch {}
      showRing();
    });

    orbButton.addEventListener('pointermove', (e) => {
      if (!orbDragActive) return;
      const delta = e.clientX - orbLastX;
      if (Math.abs(delta) > 2) orbMovedSinceDown = true;
      orbLastX = e.clientX;
      if (orbMovedSinceDown) {
        scrollState.targetRotation += delta * 0.6;
      }
      if (longPressTimer) { window.clearTimeout(longPressTimer); longPressTimer = null; }
    });

    orbButton.addEventListener('pointerup', (e) => {
      if (!orbDragActive) return;
      e.stopPropagation();
      orbDragActive = false;
      try { orbButton.releasePointerCapture(e.pointerId); } catch {}
      if (longPressTimer) { window.clearTimeout(longPressTimer); longPressTimer = null; }
      if (orbMovedSinceDown) {
        snapToNearestLockPoint();
      } else {
        const activeItem = NAV_ITEMS[activeIndex];
        window.location.href = activeItem.href;
      }
    });

    // Fallback click for accessibility/keyboard activation
    orbButton.addEventListener('click', (event) => {
      if (orbMovedSinceDown) return; // ignore click synthesized after drag
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
      const isMobile = window.innerWidth <= 768;
      const swipeSeen = localStorage.getItem('orb-swipe-seen');
      if (isMobile && !swipeSeen) {
        swipeIndicator.classList.add('visible');
      }

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

    const hideSwipe = () => {
      swipeIndicator.classList.remove('visible');
      try { localStorage.setItem('orb-swipe-seen', '1'); } catch {}
    };

    // Hide swipe hint after first interaction
    container.addEventListener('pointerdown', hideSwipe, { once: true });
    container.addEventListener('wheel', hideSwipe, { once: true });

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


