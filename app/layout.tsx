import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./floating-orb.css";
import "./profile-hub.css";
import "./user-onboarding.css";
import { AuthProvider } from "@/contexts/AuthContext";
import OnboardingWrapper from "@/components/OnboardingWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "inQ Social • Orb Prototype",
  description: "Early hero experience rebuilt with the floating Orb navigation hub.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <OnboardingWrapper>
            {children}
          </OnboardingWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
