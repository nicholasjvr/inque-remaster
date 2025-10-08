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

### 2) Environment Variables
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

## Scripts
```json
"dev": "next dev --turbopack",
"build": "next build --turbopack",
"start": "next start"
```

---

## Documentation
See `docs/README.md` for:
- Data infrastructure
- Usage examples and hooks
- Orb and Profile Hub summaries
- Studio overview

---

## Contributing
- Keep types in `hooks/useFirestore.ts` up to date.
- Add/adjust rules in `firestore.rules` when introducing new writes/reads.
- Prefer hooks over ad-hoc Firestore calls in components.

---

## License
MIT — see `LICENSE`.
