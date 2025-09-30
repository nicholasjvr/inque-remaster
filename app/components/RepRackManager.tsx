'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useEngagement from '@/hooks/useEngagement';

interface RepRackProject {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  createdAt: string;
  stats: {
    likes: number;
    shares: number;
    views: number;
    score: number;
  };
}

interface RepRackManagerProps {
  onProjectSelect?: (project: RepRackProject) => void;
  onClose?: () => void;
}

const RepRackManager = ({ onProjectSelect, onClose }: RepRackManagerProps) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<RepRackProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', label: 'All Projects', icon: '🌟' },
    { id: 'web', label: 'Web Apps', icon: '🌐' },
    { id: 'mobile', label: 'Mobile Apps', icon: '📱' },
    { id: 'design', label: 'Design', icon: '🎨' },
    { id: 'game', label: 'Games', icon: '🎮' },
    { id: 'ai', label: 'AI/ML', icon: '🤖' },
  ];

  // Load user's projects
  useEffect(() => {
    loadUserProjects();
  }, [user]);

  const loadUserProjects = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/users/${user.uid}/projects`);
      // const data = await response.json();

      // Mock data for now
      const mockProjects: RepRackProject[] = [
        {
          id: '1',
          title: 'Neural Network Visualizer',
          description: 'Interactive 3D visualization of neural network training',
          imageUrl: '/api/placeholder/300/200',
          category: 'ai',
          createdAt: '2024-01-15',
          stats: { likes: 1247, shares: 89, views: 15632, score: 95.8 },
        },
        {
          id: '2',
          title: 'EcoTracker Mobile App',
          description: 'Track your carbon footprint with beautiful animations',
          imageUrl: '/api/placeholder/300/200',
          category: 'mobile',
          createdAt: '2024-01-12',
          stats: { likes: 892, shares: 156, views: 12345, score: 92.3 },
        },
        {
          id: '3',
          title: 'Pixel Art Generator',
          description: 'AI-powered pixel art creation tool',
          imageUrl: '/api/placeholder/300/200',
          category: 'design',
          createdAt: '2024-01-10',
          stats: { likes: 2156, shares: 234, views: 28901, score: 98.1 },
        },
      ];

      setProjects(mockProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProjectSelect = (project: RepRackProject) => {
    onProjectSelect?.(project);
    onClose?.();
  };

  if (loading) {
    return (
      <div className="rep-rack-manager">
        <div className="rep-rack-manager-header">
          <h3>Select Project for Rep Rack</h3>
          <button className="rep-rack-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="rep-rack-loading">
          <div className="loading-spinner"></div>
          <p>Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rep-rack-manager">
      <div className="rep-rack-manager-header">
        <h3>Select Project for Rep Rack</h3>
        <button className="rep-rack-close-btn" onClick={onClose}>×</button>
      </div>

      <div className="rep-rack-manager-controls">
        <div className="rep-rack-search">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rep-rack-search-input"
          />
        </div>
        <div className="rep-rack-categories">
          {categories.map(category => (
            <button
              key={category.id}
              className={`rep-rack-category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rep-rack-projects-grid">
        {filteredProjects.map(project => (
          <div key={project.id} className="rep-rack-project-card">
            <div className="rep-rack-project-image">
              <img src={project.imageUrl} alt={project.title} />
              <div className="rep-rack-project-overlay">
                <button
                  className="rep-rack-select-btn"
                  onClick={() => handleProjectSelect(project)}
                >
                  Select for Rep Rack
                </button>
              </div>
            </div>
            <div className="rep-rack-project-info">
              <h4 className="rep-rack-project-title">{project.title}</h4>
              <p className="rep-rack-project-description">{project.description}</p>
              <div className="rep-rack-project-stats">
                <span className="rep-rack-stat">
                  {project.stats.likes} ❤️
                </span>
                <span className="rep-rack-stat">
                  {project.stats.shares} 🔗
                </span>
                <span className="rep-rack-stat">
                  {project.stats.views} 👁️
                </span>
                <span className="rep-rack-score">
                  Score: {project.stats.score}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="rep-rack-empty">
          <div className="empty-icon">📁</div>
          <h4>No projects found</h4>
          <p>Try adjusting your search or create a new project.</p>
        </div>
      )}
    </div>
  );
};

export default RepRackManager;
