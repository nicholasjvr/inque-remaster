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

// ---------------------
// Public user interfaces
// ---------------------
export type PublicUser = {
  id: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  handle?: string;
  projectsCount?: number;
  lastActiveAt?: any;
  profile?: UserProfile;
};

export type WidgetBundle = {
  id: string;
  title?: string;
  uploadId?: string;
  storagePath?: string;
};

// ---------------------
// Profile schema
// ---------------------
export type RepRackItem = {
  type: 'widget' | 'project';
  refId: string; // widgetId or projectId
  title?: string;
  imageUrl?: string;
};

export type UserProfile = {
  theme?: {
    accent?: string;
    bg?: string;
    mode?: 'neo' | 'minimal' | 'cyber';
  };
  repRack?: RepRackItem[]; // up to 3 items
  sections?: Array<{ id: string; type: string; content?: any; }>; // future
  links?: Array<{ label: string; url: string }>;
  updatedAt?: any;
  publishedAt?: any;
};

export function useUserProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const ref = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() as any;
        setProfile((data?.profile ?? null) as UserProfile | null);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching profile:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  const saveProfile = async (userIdParam: string, updates: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', userIdParam);
    await updateDoc(userRef, {
      profile: {
        ...(profile ?? {}),
        ...updates,
      },
      updatedAt: serverTimestamp(),
    });
  };

  const publishProfile = async (userIdParam: string) => {
    const userRef = doc(db, 'users', userIdParam);
    await updateDoc(userRef, {
      'profile.publishedAt': serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  return { profile, loading, error, saveProfile, publishProfile };
}

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

// ---------------------
// Public users listing
// ---------------------
export function usePublicUsers({ limitCount = 100 }: { limitCount?: number } = {}) {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    // Read-mostly: order by displayName; client can re-sort
    const q = query(usersRef, limit(limitCount));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const list: PublicUser[] = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setUsers(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching users:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [limitCount]);

  return { users, loading, error };
}

// ---------------------
// Single public user
// ---------------------
export function usePublicUserById(userId?: string) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }
    const ref = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        setUser(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as PublicUser) : null);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching user:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  return { user, loading, error };
}

// Hook for widget bundles
export function useWidgetBundles({ orderByCreated = true, limitCount = 100 }: { orderByCreated?: boolean; limitCount?: number } = {}) {
  const [bundles, setBundles] = useState<WidgetBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bundlesRef = collection(db, 'bundles');

    let q = query(bundlesRef);
    if (orderByCreated) {
      q = query(bundlesRef, orderBy('createdAt', 'desc'));
    }
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const unsubscribe = onSnapshot(q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const bundlesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as WidgetBundle[];
        setBundles(bundlesData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching bundles:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderByCreated, limitCount]);

  return { bundles, loading, error };
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
