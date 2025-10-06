"use client";

import React from "react";

type Props = { children: React.ReactNode };

// Minimal wrapper to avoid layout import errors in prototype builds.
export default function OnboardingWrapper({ children }: Props) {
  return <>{children}</>;
}
