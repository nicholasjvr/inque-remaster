## inQue — Creatives Platform

A Next.js 15 app with Firebase for building, showcasing, and exploring interactive widgets and projects. Featuring a 3D Floating Orb navigator, a Profile Hub, a Widget Studio with uploads to Firebase Storage, and an Explore page backed by Firestore.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/) [![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Storage-ffca28)](https://firebase.google.com/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://www.typescriptlang.org/) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#license)

### Highlights
- **Floating Orb navigation**: Glassy 3D orb with a snap-to-ring menu and keyboard/drag support.
- **Profile Hub**: Public/edit modes, themes (neo/minimal/cyber), quick actions, share links.
- **Widget Studio**: Upload workspace with ZIP extraction, multi-file upload to Firebase Storage, and Firestore-backed widgets.
- **Explore**: Live bundles feed (Firestore), filters/sorting, fullscreen demos, basic likes/follow scaffolding.
- **Auth**: Email/password and Google Sign-in via Firebase.
- **Data**: Firestore collections for `users`, `projects`, `widgets`, `bundles`, and engagement records.

---

## Getting Started

### 1) Requirements
- Node 18+ (recommended 20+)
- A Firebase project (Auth, Firestore, Storage enabled)

### 2) Environment
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3) Install & Run
```bash
npm install
npm run dev
# build/start
npm run build
npm start
```
Open `http://localhost:3000`.

---

## What’s in the Box

### Tech Stack
- Next.js 15 (Turbopack), React 19, TypeScript 5
- Firebase (Auth, Firestore, Storage, Analytics)
- three.js + react-three-fiber for the Glass Orb visuals

### Project Structure
```
app/
  components/
    FloatingOrb.tsx         # 3D orb + ring navigation
    GlassOrbCanvas.tsx      # R3F canvas for glass orb glow
    ProfileHub.tsx          # Public/Edit hub, themes, actions
    WidgetStudio.tsx        # Studio shell: carousel + uploads
    UploadWorkspace.tsx     # Drag/drop uploads, ZIP extraction
  explore/page.tsx          # Explore bundles grid + filters
  studio/page.tsx           # Protected studio route
  page.tsx                  # Hero with orb + ProfileHub
contexts/
  AuthContext.tsx           # Firebase auth provider
hooks/
  useFirestore.ts           # Users, projects, widgets, bundles, engagement
  useStorage.ts             # Storage uploads, validators, ZIP extract
lib/
  firebase.ts               # Firebase init (client)
docs/
  *.md                      # Detailed documentation
```

---

## Core Features

- **Floating Orb**
  - Drag, wheel, keyboard navigation; snap-to-item; accessible labels.
  - R3F glass orb rendering with configurable settings.

- **Profile Hub**
  - Public banner (stats, bio, interests/goals) and edit-mode controls.
  - Theming presets, "Quick Navigation" and "Quick Actions," share helpers.

- **Widget Studio**
  - Real-time widgets from Firestore, multi-file uploads to Storage.
  - ZIP file extraction, tag entry, per-slot upload actions.
  - `ProtectedRoute` gate using Firebase Auth.

- **Explore**
  - Live bundles feed with recent/popular/name/random sorting and search.
  - Fullscreen demo modal and basic social actions (likes/follow scaffold).

---

## Firebase Setup

1) Enable Auth providers you need (Email/Password, Google).
2) Create Firestore and Storage buckets.
3) Deploy rules (adjust as needed):
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```
Rules live in `firestore.rules` and `firebase-storage.rules`.

---

## Documentation (merged)

This repository includes a focused docs folder and this top-level README. The following consolidated docs index and quick snippets are included here for convenience — see docs/*.md for deeper details.

### Docs Index
1. Data Infrastructure — users, projects, widgets, bundles, engagement, security (docs/DATA_INFRASTRUCTURE.md)
2. Usage Examples — ready-made React + hook snippets (docs/USAGE_EXAMPLES.md)
3. Orb Element Summary — Floating Orb behavior and UX (docs/ORB_ELEMENT_SUMMARY.md)
4. Profile Banner Summary — Profile Hub overview (docs/PROFILE_BANNER_SUMMARY.md)
5. Studio Summary — Widget Studio flow and UX (docs/STUDIO_SUMMARY.md)

---

## Quick Start (Docs snippets)

### Environment (copy-ready)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

### Auth Provider (wrap once)
```tsx
// app/layout.tsx (wrap once)
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### Load a Public User + Stats
```tsx
"use client";
import { usePublicUserById, useUserStats } from "@/hooks/useFirestore";

export default function PublicProfile({ userId }: { userId: string }) {
  const { user } = usePublicUserById(userId);
  const { stats } = useUserStats(userId);
  if (!user) return null;
  return (
    <div>
      <h2>{user.displayName}</h2>
      <p>Projects: {stats?.projectsCount ?? 0}</p>
    </div>
  );
}
```

### Create a Project
```tsx
"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/hooks/useFirestore";

export default function CreateProject() {
  const { user } = useAuth();
  const { addProject } = useProjects(user?.uid);
  return (
    <button
      onClick={() =>
        user &&
        addProject({
          userId: user.uid,
          title: "My Project",
          description: "Built with inQue",
          featured: false,
        })
      }
    >
      Add Project
    </button>
  );
}
```

### Track Engagement
```ts
import { trackEngagement } from "@/hooks/useFirestore";
// Like a project
await trackEngagement("project", projectId, "like", userId);
// View a profile
await trackEngagement("user", profileId, "view");
```

---

## UI Modules (summary)

- Floating Orb: Drag/wheel/keyboard ring; click or Enter activates; R3F glass orb mounted into `#orb-container`.
- Profile Hub: Public banner + edit controls, theme presets, quick nav/actions, share helpers. Variants: inline billboard on hero or modal shell.
- Widget Studio: Slots, drag/drop uploads, ZIP extraction, Storage uploads, Firestore docs. `ProtectedRoute`-gated.

---

## Collections (at a glance)

- `users`: public profile + `stats`
- `projects`: user projects with `likes`, `views`, `shares`
- `widgets`: uploaded widget records mapped to Storage files
- `bundles`: explore feed items (with `likes` and `commentsCount`)
- `engagement`: like/view/share events

See docs/DATA_INFRASTRUCTURE.md for full details.

---

## Scripts
```json
"dev": "next dev --turbopack",
"build": "next build --turbopack",
"start": "next start"
```

---

## Contributing
- Keep types in `hooks/useFirestore.ts` up to date.
- Add/adjust rules in `firestore.rules` when introducing new writes/reads.
- Prefer hooks over ad-hoc Firestore calls in components.

---

## License
MIT — see `LICENSE`.

---

Last updated: October 8, 2025