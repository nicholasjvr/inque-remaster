'use client';

import WidgetStudio from '../components/WidgetStudio';
import ProtectedRoute from '../components/ProtectedRoute';
import '../widget-studio.css';

export default function StudioPage() {
  return (
    <div className="min-h-screen w-full bg-[#04060d] text-white">
      <main className="flex min-h-screen w-full flex-col px-6 py-8 sm:px-10">
        <ProtectedRoute>
          <WidgetStudio />
        </ProtectedRoute>
      </main>
    </div>
  );
}
