'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  DocumentData,
  onSnapshot,
  query,
  where,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type UploadedFile = {
  fileName: string;
  downloadURL: string;
  size?: number;
  type?: string;
};

export type ExploreProject = {
  id: string;
  kind: 'widget' | 'bundle';
  title: string;
  description?: string;
  ownerUid: string;
  tags?: string[];
  createdAt?: any;
  updatedAt?: any;
  // widget
  files?: UploadedFile[];
  slot?: number;
  // bundle
  status?: string;
  error?: string;
};

export type SortOption = 'recent' | 'popular' | 'name' | 'random';

export function useExploreProjects(options: {
  ownerUid?: string;
  category?: string;
  sort?: SortOption;
  limitCount?: number;
} = {}) {
  const { ownerUid, sort = 'recent', limitCount } = options;
  const [widgets, setWidgets] = useState<ExploreProject[]>([]);
  const [bundles, setBundles] = useState<ExploreProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const widgetsRef = collection(db, 'widgets');
    const widgetsQ = ownerUid
      ? query(widgetsRef, where('userId', '==', ownerUid))
      : query(widgetsRef);

    const bundlesRef = collection(db, 'widgetBundles');
    const bundlesQ = ownerUid
      ? query(bundlesRef, where('ownerUid', '==', ownerUid))
      : query(bundlesRef);

    const unsubWidgets = onSnapshot(
      widgetsQ,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          kind: 'widget' as const,
          title: doc.get('title') || 'Untitled',
          description: doc.get('description') || '',
          ownerUid: doc.get('userId') || '',
          tags: (doc.get('tags') as string[]) || [],
          files: (doc.get('files') as UploadedFile[]) || [],
          slot: doc.get('slot'),
          createdAt: doc.get('createdAt'),
          updatedAt: doc.get('updatedAt'),
        }));
        setWidgets(data);
      },
      (err) => {
        console.error('Widgets load error', err);
        setError(err.message);
      }
    );

    const unsubBundles = onSnapshot(
      bundlesQ,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          kind: 'bundle' as const,
          title: doc.get('title') || doc.id,
          description: doc.get('description') || '',
          ownerUid: doc.get('ownerUid') || '',
          tags: (doc.get('tags') as string[]) || [],
          status: doc.get('status') || 'unknown',
          error: doc.get('error') || undefined,
          slot: doc.get('slot'),
          createdAt: doc.get('createdAt'),
          updatedAt: doc.get('updatedAt'),
        }));
        setBundles(data);
      },
      (err) => {
        console.error('Bundles load error', err);
        setError(err.message);
      }
    );

    // Mark loading false soon after listeners attach
    const timeout = setTimeout(() => setLoading(false), 600);

    return () => {
      unsubWidgets();
      unsubBundles();
      clearTimeout(timeout);
    };
  }, [ownerUid]);

  const projects = useMemo(() => {
    const combined = [...widgets, ...bundles];
    const withDate = combined.map((p) => ({
      ...p,
      _ts: p.createdAt?.toDate?.()?.getTime?.() ?? p.createdAt ?? 0,
    }));

    switch (sort) {
      case 'name':
        withDate.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'popular':
        // Placeholder: without engagement metrics, fall back to recent
        withDate.sort((a, b) => (b._ts as number) - (a._ts as number));
        break;
      case 'random':
        withDate.sort(() => Math.random() - 0.5);
        break;
      default:
        withDate.sort((a, b) => (b._ts as number) - (a._ts as number));
    }

    return typeof limitCount === 'number' ? withDate.slice(0, limitCount) : withDate;
  }, [widgets, bundles, sort, limitCount]);

  return { projects, loading, error };
}

export function shuffleProjects(list: ExploreProject[]): ExploreProject[] {
  return [...list].sort(() => Math.random() - 0.5);
}
