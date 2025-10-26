'use client';

import { use } from 'react';
import ProfileHub from '@/app/components/ProfileHub';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicUserById } from '@/hooks/useFirestore';

export default function EditProfileHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: authUser } = useAuth();
  const { user } = usePublicUserById(id);

  const isOwner = authUser?.uid === id;

  return (
    <ProtectedRoute>
      {isOwner ? (
        <div className="min-h-screen w-full bg-[#04060d] text-white">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Edit Profile Hub</h1>
              <p className="text-gray-400">Customize your profile hub appearance and content</p>
            </div>
            <div className="bg-[#0a0f1a] rounded-lg border border-[#00f0ff]/20 p-1 h-[calc(100vh-200px)] min-h-[600px]">
              <ProfileHub mode="edit" profileUser={user} initialState="expanded" />
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen w-full bg-[#04060d] text-white">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <h2 className="font-orbitron text-2xl text-[#66faff]">You don't have permission to edit this hub.</h2>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
