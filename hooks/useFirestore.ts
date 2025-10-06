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
  targetType: 'project' | 'widget' | 'user',
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

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setStats(snap.data().stats || null);
      } else {
        setStats(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { stats, loading };
}
