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
  runTransaction,
  DocumentData,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ---------------------
// Public user interfaces
// ---------------------
export type UserStats = {
  projectsCount: number;
  widgetsCount: number;
  followersCount: number;
  followingCount: number;
  totalViews: number;
  totalLikes: number;
  badgesCount: number;
  achievementsUnlocked: string[];
};

export type PublicUser = {
  id: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  handle?: string;
  email?: string;
  
  // Onboarding data
  interests?: string[];
  goals?: string[];
  
  // Stats
  stats?: UserStats;
  
  // Profile
  profile?: UserProfile;
  
  // Metadata
  onboardingCompleted?: boolean;
  joinDate?: any;
  lastActiveAt?: any;
  createdAt?: any;
  updatedAt?: any;
  isPublic?: boolean;
  isVerified?: boolean;
  
  // Legacy fields for backward compatibility
  projectsCount?: number;
  followersCount?: number;
  totalViews?: number;
  totalLikes?: number;
  badgesCount?: number;
};

export type WidgetBundle = {
  id: string;
  title?: string;
  description?: string;
  uploadId?: string;
  storagePath?: string;
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
  likes?: number;
  views?: number;
  shares?: number;
  commentsCount?: number;
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
  displayName?: string;
  bio?: string;
  theme?: {
    accent?: string;
    bg?: string;
    mode?: 'neo' | 'minimal' | 'cyber';
  };
  repRack?: RepRackItem[]; // up to 3 items
  sections?: Array<{ id: string; type: string; content?: any; }>; // future
  links?: Array<{ label: string; url: string }>;

  // Profile Customization Fields
  avatarFrame?: {
    id: string;
    style: string;
    color: string;
  };
  avatarAnimation?: {
    id: string;
    type: 'pulse' | 'glow' | 'float' | 'bounce' | 'none';
    speed: number; // 0.5 to 2.0
  };
  profileBackground?: {
    type: 'gif' | 'image';
    url: string;
    animationSpeed?: number; // for GIFs, 0.5 to 2.0
  };

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
    // Guard: don't attach realtime listener if db is not initialized
    if (!db) {
      console.error('Firestore not initialized - useUserProfile will not attach listeners');
      setError('Firestore not initialized');
      setLoading(false);
      return;
    }

    const ref = doc(db, 'users', userId);
    try {
      const unsubscribe = onSnapshot(
        ref,
        (snap) => {
          const data = snap.data() as any;
          setProfile((data?.profile ?? null) as UserProfile | null);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching profile:', err);
          setError(err.message || String(err));
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err: any) {
      console.error('Failed to attach user profile listener:', err);
      setError(err?.message || String(err));
      setLoading(false);
    }
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
  storagePath?: string; // optional storage base path for this widget's files
  entry?: string; // relative path to the HTML entry file
  thumbnailUrl?: string; // URL for the widget thumbnail/preview image
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

    if (!db) {
      console.error('Firestore not initialized - useWidgets will not attach listeners');
      setError('Firestore not initialized');
      setWidgets([]);
      setLoading(false);
      return;
    }

    // Read-mostly -- use a one-time fetch to avoid persistent failing realtime channels
    (async () => {
      try {
        const widgetsRef = collection(db, 'widgets');
        const q = query(widgetsRef, where('userId', '==', userId));
        const snap = await getDocs(q);
        const widgetsData = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Widget[];
        widgetsData.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
        });
        setWidgets(widgetsData);
        setLoading(false);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching widgets (getDocs):', err);
        setError(err?.message || String(err));
        setWidgets([]);
        setLoading(false);
      }
    })();
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

// Hook for getting ALL widgets (for explore pages)
export function useAllWidgets({ limitCount = 100 }: { limitCount?: number } = {}) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      console.error('Firestore not initialized - useAllWidgets will not attach listeners');
      setError('Firestore not initialized');
      setWidgets([]);
      setLoading(false);
      return;
    }

    // Read-only explore listing: fetch once rather than realtime
    (async () => {
      try {
        const widgetsRef = collection(db, 'widgets');
        const q = query(widgetsRef, limit(limitCount));
        const snap = await getDocs(q);
        const widgetsData = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Widget[];
        widgetsData.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
        });
        setWidgets(widgetsData);
        setLoading(false);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching all widgets (getDocs):', err);
        setError(err?.message || String(err));
        setWidgets([]);
        setLoading(false);
      }
    })();
  }, [limitCount]);

  return { widgets, loading, error };
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

    if (!db) {
      console.error('Firestore not initialized - useWidget will not attach listeners');
      setError('Firestore not initialized');
      setWidget(null);
      setLoading(false);
      return;
    }

    const widgetRef = doc(db, 'widgets', widgetId);
    try {
      const unsubscribe = onSnapshot(widgetRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setWidget({ id: docSnap.id, ...(docSnap.data() as any) } as Widget);
          } else {
            setWidget(null);
          }
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching widget:', err);
          setError(err?.message || String(err));
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err: any) {
      console.error('Failed to attach widget listener:', err);
      setError(err?.message || String(err));
      setLoading(false);
    }
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
    if (!db) {
      console.error('Firestore not initialized - usePublicUsers will not attach listeners');
      setError('Firestore not initialized');
      setUsers([]);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(limitCount));
        const snap = await getDocs(q);
        const list: PublicUser[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setUsers(list);
        setLoading(false);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching public users (getDocs):', err);
        setError(err?.message || String(err));
        setUsers([]);
        setLoading(false);
      }
    })();
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
    if (!db) {
      console.error('Firestore not initialized - usePublicUserById will not attach listeners');
      setError('Firestore not initialized');
      setUser(null);
      setLoading(false);
      return;
    }

    const ref = doc(db, 'users', userId);
    try {
      const unsubscribe = onSnapshot(
        ref,
        (snap) => {
          setUser(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as PublicUser) : null);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching user:', err);
          setError(err?.message || String(err));
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err: any) {
      console.error('Failed to attach public user listener:', err);
      setError(err?.message || String(err));
      setLoading(false);
    }
  }, [userId]);

  return { user, loading, error };
}

// Hook for widget bundles
export function useWidgetBundles({ orderByCreated = true, limitCount = 100, orderByField }: { orderByCreated?: boolean; limitCount?: number; orderByField?: 'createdAt' | 'likes' } = {}) {
  const [bundles, setBundles] = useState<WidgetBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      console.error('Firestore not initialized - useWidgetBundles will not attach listeners');
      setError('Firestore not initialized');
      setBundles([]);
      setLoading(false);
      return;
    }

    const bundlesRef = collection(db, 'bundles');
    let q = query(bundlesRef);
    if (orderByField === 'likes') {
      q = query(bundlesRef, orderBy('likes', 'desc'));
    } else if (orderByCreated) {
      q = query(bundlesRef, orderBy('createdAt', 'desc'));
    }
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    try {
      const unsubscribe = onSnapshot(q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const bundlesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WidgetBundle[];
          setBundles(bundlesData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching bundles:', err);
          setError(err?.message || String(err));
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err: any) {
      console.error('Failed to attach bundles listener:', err);
      setError(err?.message || String(err));
      setLoading(false);
    }
  }, [orderByCreated, limitCount, orderByField]);

  return { bundles, loading, error };
}

// Hook for page visits tracking
export function usePageVisits() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      console.error('Firestore not initialized - usePageVisits will not attach listeners');
      setVisits([]);
      setLoading(false);
      return;
    }

    const visitsRef = collection(db, 'page_visits');
    const q = query(visitsRef, orderBy('timestamp', 'desc'), limit(10));

    try {
      const unsubscribe = onSnapshot(q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const visitsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setVisits(visitsData);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching page visits:', err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err: any) {
      console.error('Failed to attach page visits listener:', err);
      setLoading(false);
    }
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

// ---------------------
// Projects Management
// ---------------------
export type Project = {
  id: string;
  userId: string;
  title: string;
  description: string;
  imageUrl?: string;
  demoUrl?: string;
  repoUrl?: string;
  tags?: string[];
  featured?: boolean;
  
  // Stats
  likes: number;
  views: number;
  shares: number;
  
  // Metadata
  createdAt: any;
  updatedAt: any;
  publishedAt?: any;
};

export function useProjects(userId?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const projectsRef = collection(db, 'projects');
    const q = query(
      projectsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const projectsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];
        setProjects(projectsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching projects:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'views' | 'shares'>) => {
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        ...projectData,
        likes: 0,
        views: 0,
        shares: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Update user stats
      if (projectData.userId) {
        await updateUserStats(projectData.userId, { projectsCount: 1 }, 'increment');
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (projectId: string, userId: string) => {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      
      // Update user stats
      await updateUserStats(userId, { projectsCount: -1 }, 'increment');
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  return {
    projects,
    loading,
    error,
    addProject,
    updateProject,
    deleteProject,
  };
}

// ---------------------
// Stats Management
// ---------------------
export async function updateUserStats(
  userId: string,
  stats: Partial<UserStats>,
  mode: 'set' | 'increment' = 'set'
) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('User document does not exist');
    }
    
    const currentStats = userSnap.data().stats || {};
    
    let updatedStats: any = {};
    
    if (mode === 'increment') {
      // Increment stats
      Object.keys(stats).forEach(key => {
        const value = stats[key as keyof UserStats];
        if (typeof value === 'number') {
          updatedStats[`stats.${key}`] = (currentStats[key] || 0) + value;
        }
      });
    } else {
      // Set stats
      updatedStats = {
        'stats': {
          ...currentStats,
          ...stats,
        }
      };
    }
    
    await updateDoc(userRef, {
      ...updatedStats,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
}

// Track engagement (likes, views, shares)
export async function trackEngagement(
  targetType: 'project' | 'widget' | 'user' | 'bundle',
  targetId: string,
  engagementType: 'like' | 'view' | 'share',
  userId?: string
) {
  try {
    // Create engagement record
    await addDoc(collection(db, 'engagement'), {
      targetType,
      targetId,
      engagementType,
      userId: userId || null,
      timestamp: serverTimestamp(),
    });
    
    // Update target document stats
    let targetRef;
    if (targetType === 'project') {
      targetRef = doc(db, 'projects', targetId);
    } else if (targetType === 'widget') {
      targetRef = doc(db, 'widgets', targetId);
    } else if (targetType === 'bundle') {
      targetRef = doc(db, 'bundles', targetId);
    } else if (targetType === 'user') {
      targetRef = doc(db, 'users', targetId);
    }
    
    if (targetRef) {
      const targetSnap = await getDoc(targetRef);
      if (targetSnap.exists()) {
        const data = targetSnap.data();
        const statKey = `${engagementType}s`;
        await updateDoc(targetRef, {
          [statKey]: (data[statKey] || 0) + 1,
          updatedAt: serverTimestamp(),
        });
        
        // If it's a user's project/widget, update their total stats
        if (data.userId) {
          const userRef = doc(db, 'users', data.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userStats = userSnap.data().stats || {};
            await updateDoc(userRef, {
              [`stats.total${engagementType.charAt(0).toUpperCase() + engagementType.slice(1)}s`]: 
                (userStats[`total${engagementType.charAt(0).toUpperCase() + engagementType.slice(1)}s`] || 0) + 1,
              updatedAt: serverTimestamp(),
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error tracking engagement:', error);
    throw error;
  }
}

// ---------------------
// Social: Likes / Comments / Follows (for bundles and widgets)
// ---------------------

export type BundleComment = {
  id: string;
  targetType: 'bundle' | 'widget';
  targetId: string;
  userId: string;
  text: string;
  createdAt: any;
};

export function useBundleSocial(bundleId?: string, currentUserId?: string, targetType: 'bundle' | 'widget' = 'bundle') {
  const [likes, setLikes] = useState<number>(0);
  const [comments, setComments] = useState<BundleComment[]>([]);
  const [likedByMe, setLikedByMe] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!!bundleId);

  useEffect(() => {
    if (!bundleId) { setLoading(false); return; }

    if (!db) {
      console.error('Firestore not initialized - useBundleSocial will not attach listeners');
      setLoading(false);
      return;
    }

    // Subscribe to doc for counters (likes/commentsCount) - use appropriate collection
    const collectionName = targetType === 'widget' ? 'widgets' : 'bundles';
    const targetRef = doc(db, collectionName, bundleId);
    let unsubA: Unsubscribe | null = null;
    let unsubB: Unsubscribe | null = null;
    let unsubC: Unsubscribe | null = null;
    try {
      unsubA = onSnapshot(targetRef, (snap) => {
        const d = snap.data() as any;
        setLikes((d?.likes ?? 0) as number);
      });

      // Subscribe to last 20 comments for quick display
      const commentsRef = collection(db, 'comments');
      const qC = query(
        commentsRef,
        where('targetType', '==', targetType),
        where('targetId', '==', bundleId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      unsubB = onSnapshot(qC, (snap) => {
        setComments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as BundleComment[]);
        setLoading(false);
      });

      // Is liked by me check (presence of like doc)
      if (currentUserId) {
        const likeDocId = `${targetType}_${bundleId}_user_${currentUserId}`;
        const likeRef = doc(db, 'likes', likeDocId);
        unsubC = onSnapshot(likeRef, (snap) => setLikedByMe(snap.exists()));
      }
    } catch (err: any) {
      console.error('Failed to attach bundle social listeners:', err);
      setLoading(false);
    }

    return () => { if (unsubA) unsubA(); if (unsubB) unsubB(); if (unsubC) unsubC(); };
  }, [bundleId, currentUserId, targetType]);

  const toggleLike = async (target: { id: string }) => {
    if (!currentUserId || !target?.id) return;
    const collectionName = targetType === 'widget' ? 'widgets' : 'bundles';
    const likeDocId = `${targetType}_${target.id}_user_${currentUserId}`;
    const likeRef = doc(db, 'likes', likeDocId);
    const targetRef = doc(db, collectionName, target.id);

    await runTransaction(db, async (tx) => {
      const likeSnap = await tx.get(likeRef);
      const targetSnap = await tx.get(targetRef);
      const prevLikes = (targetSnap.exists() ? ((targetSnap.data() as any).likes || 0) : 0) as number;
      if (likeSnap.exists()) {
        tx.delete(likeRef);
        tx.update(targetRef, { likes: Math.max(0, prevLikes - 1), updatedAt: serverTimestamp() });
      } else {
        tx.set(likeRef, { targetType, targetId: target.id, userId: currentUserId, createdAt: serverTimestamp() });
        tx.update(targetRef, { likes: prevLikes + 1, updatedAt: serverTimestamp() });
      }
    });
  };

  const addComment = async (target: { id: string }, text: string, userId: string) => {
    if (!target?.id || !userId || !text.trim()) return;
    await addDoc(collection(db, 'comments'), {
      targetType,
      targetId: target.id,
      userId,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
  };

  return { likes, comments, likedByMe, loading, toggleLike, addComment };
}

export async function toggleFollow(followerId: string, followingId: string) {
  if (!followerId || !followingId || followerId === followingId) return;
  const id = `${followerId}_${followingId}`;
  const ref = doc(db, 'follows', id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
  } else {
    await (await import('firebase/firestore')).setDoc(ref, {
      followerId,
      followingId,
      createdAt: serverTimestamp(),
    });
  }
}

// ---------------------
// Voting System for "Best Demo"
// ---------------------
export function useVoting(bundleId?: string, currentUserId?: string, targetType: 'bundle' | 'widget' = 'bundle') {
  const [votes, setVotes] = useState<number>(0);
  const [votedByMe, setVotedByMe] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!!bundleId);

  useEffect(() => {
    if (!bundleId) { setLoading(false); return; }

    if (!db) {
      console.error('Firestore not initialized - useVoting will not attach listeners');
      setLoading(false);
      return;
    }

    const collectionName = targetType === 'widget' ? 'widgets' : 'bundles';
    const targetRef = doc(db, collectionName, bundleId);
    let unsubA: Unsubscribe | null = null;
    let unsubB: Unsubscribe | null = null;

    try {
      // Subscribe to doc for vote counter
      unsubA = onSnapshot(targetRef, (snap) => {
        const d = snap.data() as any;
        setVotes((d?.votes ?? 0) as number);
      });

      // Check if current user has voted (presence of vote doc in subcollection)
      if (currentUserId) {
        const voteDocId = currentUserId;
        const voteRef = doc(db, collectionName, bundleId, 'votes', voteDocId);
        unsubB = onSnapshot(voteRef, (snap) => {
          setVotedByMe(snap.exists());
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Failed to attach voting listeners:', err);
      setLoading(false);
    }

    return () => { 
      if (unsubA) unsubA(); 
      if (unsubB) unsubB(); 
    };
  }, [bundleId, currentUserId, targetType]);

  const toggleVote = async (target: { id: string }) => {
    if (!currentUserId || !target?.id) return;
    const collectionName = targetType === 'widget' ? 'widgets' : 'bundles';
    const targetRef = doc(db, collectionName, target.id);
    const votesRef = collection(db, collectionName, target.id, 'votes');
    const voteDocId = currentUserId; // Use userId as document ID for one vote per user
    const voteRef = doc(votesRef, voteDocId);

    await runTransaction(db, async (tx) => {
      const voteSnap = await tx.get(voteRef);
      const targetSnap = await tx.get(targetRef);
      const prevVotes = (targetSnap.exists() ? ((targetSnap.data() as any).votes || 0) : 0) as number;
      
      if (voteSnap.exists()) {
        // User has voted, remove vote
        tx.delete(voteRef);
        tx.update(targetRef, { votes: Math.max(0, prevVotes - 1), updatedAt: serverTimestamp() });
      } else {
        // User hasn't voted, add vote
        tx.set(voteRef, { 
          userId: currentUserId, 
          createdAt: serverTimestamp() 
        });
        tx.update(targetRef, { votes: prevVotes + 1, updatedAt: serverTimestamp() });
      }
    });
  };

  return { votes, votedByMe, loading, toggleVote };
}

// Hook to use stats
export function useUserStats(userId?: string) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(!!userId);

  useEffect(() => {
    if (!userId) {
      setStats(null);
      setLoading(false);
      return;
    }
    if (!db) {
      console.error('Firestore not initialized - useUserStats will not attach listeners');
      setStats(null);
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', userId);
    try {
      const unsubscribe = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setStats(snap.data().stats || null);
        } else {
          setStats(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Failed to attach user stats listener:', err);
      setLoading(false);
    }
  }, [userId]);

  return { stats, loading };
}
