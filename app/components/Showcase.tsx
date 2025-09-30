'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  author: {
    name: string;
    avatar: string;
    id: string;
  };
  stats: {
    likes: number;
    shares: number;
    views: number;
    score: number;
  };
  createdAt: string;
  category: string;
}

interface ShowcaseProps {
  className?: string;
}

const Showcase = ({ className = '' }: ShowcaseProps) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeframe, setTimeframe] = useState('week');

  const categories = [
    { id: 'all', label: 'All Projects', icon: '🌟' },
    { id: 'web', label: 'Web Apps', icon: '🌐' },
    { id: 'mobile', label: 'Mobile Apps', icon: '📱' },
    { id: 'design', label: 'Design', icon: '🎨' },
    { id: 'game', label: 'Games', icon: '🎮' },
    { id: 'ai', label: 'AI/ML', icon: '🤖' },
  ];

  const timeframes = [
    { id: 'day', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'all', label: 'All Time' },
  ];

  // Mock data for demonstration
  useEffect(() => {
    const mockProjects: Project[] = [
      {
        id: '1',
        title: 'Neural Network Visualizer',
        description: 'Interactive 3D visualization of neural network training',
        imageUrl: '/api/placeholder/400/300',
        author: {
          name: 'Alex Chen',
          avatar: '/api/placeholder/60/60',
          id: 'alex-chen',
        },
        stats: {
          likes: 1247,
          shares: 89,
          views: 15632,
          score: 95.8,
        },
        createdAt: '2024-01-15',
        category: 'ai',
      },
      {
        id: '2',
        title: 'EcoTracker Mobile App',
        description: 'Track your carbon footprint with beautiful animations',
        imageUrl: '/api/placeholder/400/300',
        author: {
          name: 'Sarah Johnson',
          avatar: '/api/placeholder/60/60',
          id: 'sarah-johnson',
        },
        stats: {
          likes: 892,
          shares: 156,
          views: 12345,
          score: 92.3,
        },
        createdAt: '2024-01-12',
        category: 'mobile',
      },
      {
        id: '3',
        title: 'Pixel Art Generator',
        description: 'AI-powered pixel art creation tool',
        imageUrl: '/api/placeholder/400/300',
        author: {
          name: 'Mike Rodriguez',
          avatar: '/api/placeholder/60/60',
          id: 'mike-rodriguez',
        },
        stats: {
          likes: 2156,
          shares: 234,
          views: 28901,
          score: 98.1,
        },
        createdAt: '2024-01-10',
        category: 'design',
      },
    ];

    setTimeout(() => {
      setProjects(mockProjects);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredProjects = projects.filter(project => 
    selectedCategory === 'all' || project.category === selectedCategory
  );

  const topThree = filteredProjects.slice(0, 3);
  const remainingProjects = filteredProjects.slice(3);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  const getRankClass = (index: number) => {
    switch (index) {
      case 0: return 'showcase-winner showcase-gold';
      case 1: return 'showcase-winner showcase-silver';
      case 2: return 'showcase-winner showcase-bronze';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className={`showcase-container ${className}`}>
        <div className="showcase-loading">
          <div className="loading-spinner"></div>
          <p>Loading showcase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`showcase-container ${className}`}>
      <div className="showcase-header">
        <h1 className="showcase-title">
          <span className="showcase-icon">🏆</span>
          Project Showcase
        </h1>
        <p className="showcase-subtitle">
          Discover the most innovative and engaging projects from our community
        </p>
      </div>

      <div className="showcase-controls">
        <div className="showcase-filters">
          <div className="filter-group">
            <label>Category</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Timeframe</label>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              className="filter-select"
            >
              {timeframes.map(tf => (
                <option key={tf.id} value={tf.id}>
                  {tf.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {topThree.length > 0 && (
        <div className="showcase-podium">
          <h2 className="podium-title">Top Performers</h2>
          <div className="podium-container">
            {topThree.map((project, index) => (
              <div key={project.id} className={`podium-item ${getRankClass(index)}`}>
                <div className="podium-rank">
                  <span className="rank-icon">{getRankIcon(index)}</span>
                  <span className="rank-number">#{index + 1}</span>
                </div>
                <div className="podium-project">
                  <div className="project-image">
                    <img src={project.imageUrl} alt={project.title} />
                    <div className="project-overlay">
                      <div className="project-stats">
                        <span>{project.stats.likes} ❤️</span>
                        <span>{project.stats.shares} 🔗</span>
                        <span>{project.stats.views} 👁️</span>
                      </div>
                    </div>
                  </div>
                  <div className="project-info">
                    <h3 className="project-title">{project.title}</h3>
                    <p className="project-description">{project.description}</p>
                    <div className="project-author">
                      <img src={project.author.avatar} alt={project.author.name} />
                      <span>{project.author.name}</span>
                    </div>
                    <div className="project-score">
                      <span className="score-label">Score</span>
                      <span className="score-value">{project.stats.score}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {remainingProjects.length > 0 && (
        <div className="showcase-leaderboard">
          <h2 className="leaderboard-title">Community Leaderboard</h2>
          <div className="leaderboard-list">
            {remainingProjects.map((project, index) => (
              <div key={project.id} className="leaderboard-item">
                <div className="leaderboard-rank">
                  <span className="rank-number">#{index + 4}</span>
                </div>
                <div className="leaderboard-project">
                  <div className="project-thumbnail">
                    <img src={project.imageUrl} alt={project.title} />
                  </div>
                  <div className="project-details">
                    <h4 className="project-title">{project.title}</h4>
                    <p className="project-description">{project.description}</p>
                    <div className="project-meta">
                      <div className="project-author">
                        <img src={project.author.avatar} alt={project.author.name} />
                        <span>{project.author.name}</span>
                      </div>
                      <div className="project-stats">
                        <span>{project.stats.likes} ❤️</span>
                        <span>{project.stats.shares} 🔗</span>
                        <span>{project.stats.views} 👁️</span>
                        <span className="score">{project.stats.score}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredProjects.length === 0 && (
        <div className="showcase-empty">
          <div className="empty-icon">🏆</div>
          <h3>No projects found</h3>
          <p>Try adjusting your filters or check back later for new submissions.</p>
        </div>
      )}
    </div>
  );
};

export default Showcase;
