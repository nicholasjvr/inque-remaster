'use client';

import { useEffect } from 'react';
import type { PublicUser } from '@/hooks/useFirestore';

interface ProfileSEOProps {
  profileUser: PublicUser | null | undefined;
}

export default function ProfileSEO({ profileUser }: ProfileSEOProps) {
  useEffect(() => {
    // Only run on client side to avoid SSR issues
    if (typeof window === 'undefined' || !profileUser) return;

    const baseUrl = window.location.origin;
    const profileUrl = `${baseUrl}/u/${profileUser.id}`;
    const displayName = profileUser.displayName || 'Creative Developer';
    const handle = profileUser.handle || profileUser.id?.slice(0, 8) || 'creator';
    const bio = profileUser.bio || 'Creative developer showcasing amazing projects on inQ';
    const avatarUrl = profileUser.photoURL || `${baseUrl}/default-avatar.png`;

    // Helper function to safely get date from Firestore timestamp
    const getISOString = (timestamp: any) => {
      try {
        if (timestamp?.toDate) {
          return timestamp.toDate().toISOString();
        }
        if (timestamp instanceof Date) {
          return timestamp.toISOString();
        }
        return new Date().toISOString();
      } catch {
        return new Date().toISOString();
      }
    };

    // Update document title
    if (document.title) {
      document.title = `${displayName} (@${handle}) • inQ`;
    }

    // Update meta description
    updateMetaTag('name', 'description', `${displayName} is a creative developer on inQ. ${bio} Follow for amazing projects and creative inspiration.`);

    // Open Graph tags
    updateMetaTag('property', 'og:title', `${displayName} (@${handle}) • inQ`);
    updateMetaTag('property', 'og:description', `${displayName} is a creative developer on inQ. ${bio}`);
    updateMetaTag('property', 'og:url', profileUrl);
    updateMetaTag('property', 'og:type', 'profile');
    updateMetaTag('property', 'og:image', avatarUrl);
    updateMetaTag('property', 'og:image:alt', `${displayName}'s profile picture`);
    updateMetaTag('property', 'og:site_name', 'inQ');
    updateMetaTag('property', 'profile:username', handle);

    // Twitter Card tags
    updateMetaTag('name', 'twitter:card', 'summary');
    updateMetaTag('name', 'twitter:title', `${displayName} (@${handle}) • inQ`);
    updateMetaTag('name', 'twitter:description', `${displayName} is a creative developer on inQ. ${bio}`);
    updateMetaTag('name', 'twitter:image', avatarUrl);
    updateMetaTag('name', 'twitter:image:alt', `${displayName}'s profile picture`);
    updateMetaTag('name', 'twitter:site', '@inqsocial');
    updateMetaTag('name', 'twitter:creator', `@${handle}`);

    // Additional SEO tags
    updateMetaTag('name', 'author', displayName);
    updateMetaTag('name', 'robots', 'index, follow');
    updateMetaTag('name', 'keywords', `creative developer, ${profileUser.interests?.join(', ') || 'creativity, development, design'}, portfolio, projects`);
    updateMetaTag('name', 'theme-color', '#00f0ff');

    // Canonical URL
    updateCanonicalLink(profileUrl);

    // Structured data (JSON-LD)
    updateStructuredData({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      'mainEntity': {
        '@type': 'Person',
        'name': displayName,
        'alternateName': handle,
        'description': bio,
        'image': avatarUrl,
        'url': profileUrl,
        'sameAs': profileUser.profile?.links?.map(link => link.url) || [],
      },
      'dateCreated': getISOString(profileUser.createdAt),
      'dateModified': getISOString(profileUser.updatedAt),
    });

  }, [profileUser]);

  const updateMetaTag = (attribute: string, name: string, content: string) => {
    try {
      if (typeof document === 'undefined') return;

      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }

      element.content = content;
    } catch (error) {
      console.warn('Failed to update meta tag:', error);
    }
  };

  const updateCanonicalLink = (url: string) => {
    try {
      if (typeof document === 'undefined') return;

      let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

      if (!element) {
        element = document.createElement('link');
        element.rel = 'canonical';
        document.head.appendChild(element);
      }

      element.href = url;
    } catch (error) {
      console.warn('Failed to update canonical link:', error);
    }
  };

  const updateStructuredData = (data: any) => {
    try {
      if (typeof document === 'undefined') return;

      let element = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;

      if (!element) {
        element = document.createElement('script');
        element.type = 'application/ld+json';
        document.head.appendChild(element);
      }

      element.textContent = JSON.stringify(data);
    } catch (error) {
      console.warn('Failed to update structured data:', error);
    }
  };

  // Don't render anything if no profile data or not in browser
  if (!profileUser || typeof window === 'undefined') {
    return null;
  }

  return null; // This component doesn't render anything visible
}
