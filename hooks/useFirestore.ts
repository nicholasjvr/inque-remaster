'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  DocumentData,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Widget interface
export interface Widget {
  id: string;
  title: string;
  description: string;
  slot: number;
  files: Array<{
    fileName: string;
    downloadURL: string;
    size: number;
    type: string;
  }>;
  tags?: string[];
  userId: string;
  uploadId?: string;
  createdAt: any;
  updatedAt: any;
}

// WidgetBundle interface (zipped bundle stored under a base storage path)
export interface WidgetBundle {
  id: string;
  title: string;
  description?: string;
  ownerUid: string;
  slot?: number;
  tags?: string[] | string;
  status?: 'ready' | 'failed' | 'processing' | string;
  uploadId?: string; // when present, files live under uploads/{uploadId}
  storagePath?: string; // explicit storage base path override
  createdAt?: any;
  updatedAt?: any;
  error?: string;
}

// Hook for managing widgets
export function useWidgets(userId?: string) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setWidgets([]);
      setLoading(false);
      return;
    }

    const widgetsRef = collection(db, 'widgets');
    // Temporarily remove orderBy to avoid index requirement
    const q = query(
      widgetsRef, 
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot: QuerySnapshot<DocumentData>) => {
        const widgetsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Widget[];
        
        // Sort by createdAt on client side to avoid index requirement
        widgetsData.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
        });
        
        setWidgets(widgetsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching widgets:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addWidget = async (widgetData: Omit<Widget, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'widgets'), {
        ...widgetData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding widget:', error);
      throw error;
    }
  };

  const updateWidget = async (widgetId: string, updates: Partial<Widget>) => {
    try {
      const widgetRef = doc(db, 'widgets', widgetId);
      await updateDoc(widgetRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating widget:', error);
      throw error;
    }
  };

  const deleteWidget = async (widgetId: string) => {
    try {
      await deleteDoc(doc(db, 'widgets', widgetId));
    } catch (error) {
      console.error('Error deleting widget:', error);
      throw error;
    }
  };

  return {
    widgets,
    loading,
    error,
    addWidget,
    updateWidget,
    deleteWidget,
  };
}

// Hook for getting a single widget
export function useWidget(widgetId: string) {
  const [widget, setWidget] = useState<Widget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!widgetId) {
      setWidget(null);
      setLoading(false);
      return;
    }

    const widgetRef = doc(db, 'widgets', widgetId);
    
    const unsubscribe = onSnapshot(widgetRef, 
      (doc) => {
        if (doc.exists()) {
          setWidget({ id: doc.id, ...doc.data() } as Widget);
        } else {
          setWidget(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching widget:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [widgetId]);

  return { widget, loading, error };
}

// Hook for querying public widget bundles for Explore
export function useWidgetBundles(options?: { ownerUid?: string; limitCount?: number; orderByCreated?: boolean }) {
  const [bundles, setBundles] = useState<WidgetBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bundlesRef = collection(db, 'widgetBundles');
    const constraints: any[] = [];
    if (options?.ownerUid) constraints.push(where('ownerUid', '==', options.ownerUid));
    if (options?.orderByCreated) constraints.push(orderBy('createdAt', 'desc'));
    if (options?.limitCount) constraints.push(limit(options.limitCount));
    const q = constraints.length ? query(bundlesRef, ...constraints) : query(bundlesRef);

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WidgetBundle));
        if (!options?.orderByCreated) {
          rows.sort((a, b) => {
            const at = a.createdAt?.toDate?.().getTime?.() ?? 0;
            const bt = b.createdAt?.toDate?.().getTime?.() ?? 0;
            return bt - at;
          });
        }
        setBundles(rows);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching widgetBundles:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [options?.ownerUid, options?.limitCount, options?.orderByCreated]);

  return { bundles, loading, error };
}

// Hook for basic user list (for Users page)
export interface PublicUser {
  id: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  projectsCount?: number;
  lastActiveAt?: any;
}

export function usePublicUsers(options?: { limitCount?: number }) {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const constraints: any[] = [];
    constraints.push(orderBy('createdAt', 'desc'));
    if (options?.limitCount) constraints.push(limit(options.limitCount));
    const q = query(usersRef, ...constraints);

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PublicUser));
        setUsers(rows);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching users:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [options?.limitCount]);

  return { users, loading, error };
}

// Hook for page visits tracking
export function usePageVisits() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const visitsRef = collection(db, 'page_visits');
    const q = query(visitsRef, orderBy('timestamp', 'desc'), limit(10));

    const unsubscribe = onSnapshot(q, 
      (snapshot: QuerySnapshot<DocumentData>) => {
        const visitsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVisits(visitsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching page visits:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const logPageVisit = async (url: string) => {
    try {
      await addDoc(collection(db, 'page_visits'), {
        url,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error logging page visit:', error);
    }
  };

  return { visits, loading, logPageVisit };
}
