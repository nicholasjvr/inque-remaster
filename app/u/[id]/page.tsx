'use client';

import ProfileHub from '@/app/components/ProfileHub';
import { usePublicUserById } from '@/hooks/useFirestore';

export default function PublicProfilePage({ params }: { params: { id: string } }) {
  const { user } = usePublicUserById(params.id);

  return (
    <div className="min-h-screen w-full bg-[#04060d] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ProfileHub mode="public" profileUser={user} initialState="expanded" />
      </div>
    </div>
  );
}

