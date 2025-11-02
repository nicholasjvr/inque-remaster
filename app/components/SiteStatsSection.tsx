'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AuthButton from './AuthButton';
import '../site-stats.css';

type StatItem = {
  label: string;
  value: number;
  suffix?: string;
  icon: string;
};

type SiteStats = {
  activeCreators: number;
  projectsShared: number;
  widgetsCreated: number;
  communitiesJoined: number;
};

const AnimatedCounter = ({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasAnimated) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            
            const startTime = performance.now();
            const startValue = 0;
            const endValue = target;

            const animate = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              // Easing function for smooth animation
              const easeOutQuart = 1 - Math.pow(1 - progress, 4);
              const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
              
              setCount(currentValue);

              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                setCount(endValue);
              }
            };

            requestAnimationFrame(animate);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (elementRef.current) {
      observerRef.current.observe(elementRef.current);
    }

    return () => {
      if (observerRef.current && elementRef.current) {
        observerRef.current.unobserve(elementRef.current);
      }
    };
  }, [target, duration, hasAnimated]);

  return (
    <div ref={elementRef} className="stat-counter">
      {count.toLocaleString()}{suffix}
    </div>
  );
};

export default function SiteStatsSection() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SiteStats>({
    activeCreators: 0,
    projectsShared: 0,
    widgetsCreated: 0,
    communitiesJoined: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      console.error('Firestore not initialized - site stats will show defaults');
      setLoading(false);
      return;
    }

    const fetchSiteStats = async () => {
      try {
        // Fetch active creators (users with onboarding completed)
        const usersRef = collection(db, 'users');
        const usersQuery = query(usersRef, where('onboardingCompleted', '==', true));
        const usersSnapshot = await getDocs(usersQuery);
        const activeCreators = usersSnapshot.size;

        // Fetch total projects
        const projectsRef = collection(db, 'projects');
        const projectsSnapshot = await getDocs(projectsRef);
        const projectsShared = projectsSnapshot.size;

        // Fetch total widgets
        const widgetsRef = collection(db, 'widgets');
        const widgetsSnapshot = await getDocs(widgetsRef);
        const widgetsCreated = widgetsSnapshot.size;

        // Fetch communities joined (using follows count as proxy)
        const followsRef = collection(db, 'follows');
        const followsSnapshot = await getDocs(followsRef);
        const communitiesJoined = followsSnapshot.size;

        setStats({
          activeCreators,
          projectsShared,
          widgetsCreated,
          communitiesJoined,
        });
      } catch (error) {
        console.error('Error fetching site stats:', error);
        // Keep defaults on error
      } finally {
        setLoading(false);
      }
    };

    fetchSiteStats();
  }, []);

  const STATS: StatItem[] = [
    { label: 'Active Creators', value: stats.activeCreators, suffix: '+', icon: '👥' },
    { label: 'Projects Shared', value: stats.projectsShared, suffix: '+', icon: '📊' },
    { label: 'Widgets Created', value: stats.widgetsCreated, suffix: '+', icon: '🎨' },
    { label: 'Communities Joined', value: stats.communitiesJoined, suffix: '+', icon: '🌐' },
  ];

  return (
    <section id="site-stats-section" className="site-stats-section">
      <div className="site-stats-container">
        <div className="site-stats-header">
          <h2 className="site-stats-title">
            Join the Creative Revolution
          </h2>
          <p className="site-stats-subtitle">
            Discover what thousands of creators are building on inQ Studio
          </p>
        </div>

        <div className="site-stats-grid">
          {STATS.map((stat, index) => (
            <div key={index} className="site-stat-card">
              <div className="stat-icon">{stat.icon}</div>
              {loading ? (
                <div className="stat-counter">...</div>
              ) : (
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              )}
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {!user && (
          <div className="site-stats-cta">
            <p className="cta-text">Ready to showcase your creativity?</p>
            <AuthButton />
          </div>
        )}

        {user && (
          <div className="site-stats-welcome">
            <p className="welcome-text">
              Welcome back! Continue building your creative presence.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

