'use client';

import { useAuth } from '@/contexts/AuthContext';
import UserOnboarding from '@/app/components/UserOnboarding';

export default function OnboardingWrapper({ children }: { children: React.ReactNode }) {
  const { user, needsOnboarding, completeOnboarding } = useAuth();

  return (
    <>
      {children}
      {user && needsOnboarding && (
        <UserOnboarding
          isOpen={true}
          onComplete={completeOnboarding}
        />
      )}
    </>
  );
}

