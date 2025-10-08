## inQue Docs

Welcome to the inQue documentation. This index links the focused guides and gives you copy‑ready snippets to work with the current code.

### Index

1. **[Data Infrastructure](./DATA_INFRASTRUCTURE.md)** — users, projects, widgets, bundles, engagement, security
2. **[Usage Examples](./USAGE_EXAMPLES.md)** — ready-made React + hook snippets
3. **[Orb Element Summary](./ORB_ELEMENT_SUMMARY.md)** — Floating Orb behavior and UX
4. **[Profile Banner Summary](./PROFILE_BANNER_SUMMARY.md)** — Profile Hub overview
5. **[Studio Summary](./STUDIO_SUMMARY.md)** — Widget Studio flow and UX

---

## Quick Start

### Environment

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

### Auth Provider

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

## UI Modules

- **Floating Orb**: Drag/wheel/keyboard ring; click or Enter activates; R3F glass orb mounted into `#orb-container`.
- **Profile Hub**: Public banner + edit controls, theme presets, quick nav/actions, share helpers. Variants: inline billboard on hero or modal shell.
- **Widget Studio**: Slots, drag/drop uploads, ZIP extraction, Storage uploads, Firestore docs. `ProtectedRoute`-gated.

---

## Collections (at a glance)

- `users`: public profile + `stats`
- `projects`: user projects with `likes`, `views`, `shares`
- `widgets`: uploaded widget records mapped to Storage files
- `bundles`: explore feed items (with `likes` and `commentsCount`)
- `engagement`: like/view/share events

See full details in `DATA_INFRASTRUCTURE.md`.

---

## Deployment

- Vercel (recommended): connect repo, add env vars, push to deploy.
- Firebase rules:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

---

Last updated: October 8, 2025
