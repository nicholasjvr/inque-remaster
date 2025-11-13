'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';
import ProjectGrid from '../components/ProjectGrid';
import FullscreenWorkspace from '../components/FullscreenWorkspace';
import { useAuth } from '@/contexts/AuthContext';
import { useWidgets, Widget } from '@/hooks/useFirestore';
import '../projects.css';

function ProjectsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { widgets, loading } = useWidgets(user?.uid);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);

  // Auto-select widget if ID is provided in query params
  useEffect(() => {
    const widgetId = searchParams.get('id');
    const editMode = searchParams.get('edit') === 'true';

    if (widgetId && widgets.length > 0 && !selectedWidget) {
      const widget = widgets.find(w => w.id === widgetId);
      if (widget) {
        setSelectedWidget(widget);
      }
    }
  }, [searchParams, widgets, selectedWidget]);

  return (
    <div className="min-h-screen w-full bg-[#04060d] text-white">
      <ProtectedRoute>
        {selectedWidget ? (
          <FullscreenWorkspace
            widget={selectedWidget}
            widgets={widgets}
            onClose={() => setSelectedWidget(null)}
          />
        ) : (
          <main className="flex min-h-screen w-full flex-col px-6 py-8 sm:px-10">
            <div className="projects-page">
              {/* Header */}
              <header className="projects-header">
                <div className="header-content">
                  <div className="header-left">
                    <a href="/" className="back-btn">
                      <span>←</span>
                      <span>Back to Home</span>
                    </a>
                    <h1 className="page-title">📊 My Projects</h1>
                  </div>
                </div>
              </header>

              {/* Main Content */}
              <ProjectGrid
                widgets={widgets}
                loading={loading}
                onSelectWidget={setSelectedWidget}
              />
            </div>
          </main>
        )}
      </ProtectedRoute>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-[#04060d] text-white flex items-center justify-center">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  );
}

