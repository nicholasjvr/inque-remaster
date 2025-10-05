'use client';

import ProfileHub from '@/app/components/ProfileHub';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicUserById } from '@/hooks/useFirestore';

export default function EditProfileHubPage({ params }: { params: { id: string } }) {
  const { user: authUser } = useAuth();
  const { user } = usePublicUserById(params.id);

  const isOwner = authUser?.uid === params.id;

  return (
    <ProtectedRoute>
      {isOwner ? (
        <div className="min-h-screen w-full bg-[#04060d] text-white">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <ProfileHub mode="edit" profileUser={user} initialState="expanded" />
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

