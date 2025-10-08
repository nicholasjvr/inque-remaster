'use client';

import { use } from 'react';
import ProfileHub from '@/app/components/ProfileHub';
import { usePublicUserById } from '@/hooks/useFirestore';
import ProfileSEO from '../../components/ProfileSEO';

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = usePublicUserById(id);

  return (
    <>
      <ProfileSEO profileUser={user} />
      <div className="min-h-screen w-full bg-[#04060d] text-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <ProfileHub mode="public" profileUser={user} initialState="expanded" />
        </div>
      </div>
    </>
  );
}
