import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface EngagementStats {
  likes: number;
  shares: number;
  views: number;
  score: number;
}

interface ProjectEngagement {
  projectId: string;
  userId: string;
  stats: EngagementStats;
  userLiked: boolean;
  userShared: boolean;
  lastUpdated: string;
}

interface UseEngagementProps {
  projectId?: string;
  userId?: string;
}

export const useEngagement = ({ projectId, userId }: UseEngagementProps = {}) => {
  const { user } = useAuth();
  const [engagement, setEngagement] = useState<ProjectEngagement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load engagement data
  useEffect(() => {
    if (projectId && userId) {
      loadEngagement();
    }
  }, [projectId, userId]);

  const loadEngagement = async () => {
    if (!projectId || !userId) return;

    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/engagement/${projectId}/${userId}`);
      // const data = await response.json();

      // Mock data for now
      const mockData: ProjectEngagement = {
        projectId,
        userId,
        stats: {
          likes: Math.floor(Math.random() * 1000),
          shares: Math.floor(Math.random() * 100),
          views: Math.floor(Math.random() * 5000),
          score: Math.floor(Math.random() * 100),
        },
        userLiked: false,
        userShared: false,
        lastUpdated: new Date().toISOString(),
      };

      setEngagement(mockData);
    } catch (err) {
      setError('Failed to load engagement data');
      console.error('Engagement loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const likeProject = async () => {
    if (!user || !engagement) return;

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/engagement/${engagement.projectId}/like`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ userId: user.uid })
      // });

      // Mock update
      setEngagement(prev => prev ? {
        ...prev,
        stats: {
          ...prev.stats,
          likes: prev.userLiked ? prev.stats.likes - 1 : prev.stats.likes + 1,
          score: prev.userLiked ? prev.stats.score - 1 : prev.stats.score + 1,
        },
        userLiked: !prev.userLiked,
        lastUpdated: new Date().toISOString(),
      } : null);
    } catch (err) {
      setError('Failed to update like');
      console.error('Like error:', err);
    } finally {
      setLoading(false);
    }
  };

  const shareProject = async () => {
    if (!user || !engagement) return;

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/engagement/${engagement.projectId}/share`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ userId: user.uid })
      // });

      // Mock update
      setEngagement(prev => prev ? {
        ...prev,
        stats: {
          ...prev.stats,
          shares: prev.userShared ? prev.stats.shares - 1 : prev.stats.shares + 1,
          score: prev.userShared ? prev.stats.score - 2 : prev.stats.score + 2,
        },
        userShared: !prev.userShared,
        lastUpdated: new Date().toISOString(),
      } : null);
    } catch (err) {
      setError('Failed to update share');
      console.error('Share error:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewProject = async () => {
    if (!engagement) return;

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/engagement/${engagement.projectId}/view`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ userId: user?.uid })
      // });

      // Mock update
      setEngagement(prev => prev ? {
        ...prev,
        stats: {
          ...prev.stats,
          views: prev.stats.views + 1,
        },
        lastUpdated: new Date().toISOString(),
      } : null);
    } catch (err) {
      console.error('View error:', err);
    }
  };

  const calculateScore = (stats: EngagementStats): number => {
    // Weighted scoring algorithm
    const likeWeight = 1;
    const shareWeight = 2;
    const viewWeight = 0.1;
    
    return Math.round(
      (stats.likes * likeWeight) + 
      (stats.shares * shareWeight) + 
      (stats.views * viewWeight)
    );
  };

  const getEngagementLevel = (score: number): string => {
    if (score >= 1000) return 'viral';
    if (score >= 500) return 'trending';
    if (score >= 100) return 'popular';
    if (score >= 50) return 'rising';
    return 'new';
  };

  const getEngagementColor = (level: string): string => {
    switch (level) {
      case 'viral': return '#ff6b6b';
      case 'trending': return '#4ecdc4';
      case 'popular': return '#45b7d1';
      case 'rising': return '#96ceb4';
      default: return '#feca57';
    }
  };

  return {
    engagement,
    loading,
    error,
    likeProject,
    shareProject,
    viewProject,
    calculateScore,
    getEngagementLevel,
    getEngagementColor,
    refresh: loadEngagement,
  };
};

export default useEngagement;
