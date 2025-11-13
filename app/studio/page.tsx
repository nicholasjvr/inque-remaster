'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';

export default function StudioPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to projects page since WidgetStudio has been replaced
    router.replace('/projects');
  }, [router]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full bg-[#04060d] text-white flex items-center justify-center">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Redirecting to Projects...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
