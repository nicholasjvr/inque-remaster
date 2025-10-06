# inQ Data Infrastructure Documentation

## Overview

This document outlines the data structure and management system for user profiles, stats, projects, and engagement tracking in inQ Social.

## Table of Contents

1. [User Profile Structure](#user-profile-structure)
2. [Firestore Collections](#firestore-collections)
3. [Onboarding Flow](#onboarding-flow)
4. [Stats Management](#stats-management)
5. [Projects System](#projects-system)
6. [Engagement Tracking](#engagement-tracking)
7. [Best Practices](#best-practices)

---

## User Profile Structure

### Main User Document (`users/{userId}`)

```typescript
{
  // Basic Info
  id: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  handle?: string;
  email?: string;

  // Onboarding Data
  interests: string[];           // ['web-dev', 'design', ...]
  goals: string[];               // ['showcase', 'learn', ...]
  onboardingCompleted: boolean;

  // Stats Object
  stats: {
    projectsCount: number;
    widgetsCount: number;
    followersCount: number;
    followingCount: number;
    totalViews: number;
    totalLikes: number;
    badgesCount: number;
    achievementsUnlocked: string[];
  },

  // Profile Customization
  profile: {
    theme: {
      mode: 'neo' | 'minimal' | 'cyber';
      accent: string;           // Hex color
      bg: string;               // Hex color
    },
    repRack: RepRackItem[];     // Max 3 items
    sections: any[];
    links: { label: string; url: string }[];
  },

  // Metadata
  joinDate: Timestamp;
  lastActiveAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isPublic: boolean;
  isVerified: boolean;
}
```

### Rep Rack Item Structure

```typescript
{
  type: 'widget' | 'project';
  refId: string;              // Widget ID or Project ID
  title?: string;
  imageUrl?: string;
}
```

---

## Firestore Collections

### 1. `users` Collection

- **Purpose**: Store user profiles and public information
- **Access**:
  - Read: Public
  - Write: Owner only
- **Indexes**: None required (simple queries)

### 2. `projects` Collection

- **Purpose**: Global projects feed
- **Structure**:

```typescript
{
  id: string;
  userId: string;
  title: string;
  description: string;
  imageUrl?: string;
  demoUrl?: string;
  repoUrl?: string;
  tags: string[];
  featured: boolean;

  // Engagement
  likes: number;
  views: number;
  shares: number;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}
```

### 3. `widgets` Collection

- **Purpose**: User-created widgets
- **Access**:
  - Read: Public
  - Write: Owner only

### 4. `engagement` Collection

- **Purpose**: Track all interactions (likes, views, shares)
- **Structure**:

```typescript
{
  targetType: 'project' | 'widget' | 'user';
  targetId: string;
  engagementType: 'like' | 'view' | 'share';
  userId?: string;              // null for anonymous
  timestamp: Timestamp;
}
```

### 5. `achievements` Collection

- **Purpose**: Platform-wide achievement definitions
- **Access**: Read-only
- **Managed by**: Backend only

### 6. Subcollections

#### `users/{userId}/projects/{projectId}`

- User-specific project references
- Used for organizing user's own projects

#### `users/{userId}/activity/{activityId}`

- Private activity log
- Only accessible by user

---

## Onboarding Flow

### Process

1. **User Signs Up** → AuthContext detects no profile
2. **OnboardingWrapper** → Shows onboarding modal
3. **Steps**:

   - Welcome screen
   - Profile setup (name, bio, handle)
   - Interest selection (8 options)
   - Goals selection (6 options)
   - Completion summary

4. **Profile Creation** → Creates Firestore document with:
   - All onboarding data
   - Initial stats (all zeros)
   - Default theme settings
   - Empty rep rack

### Implementation

```typescript
// Check if user needs onboarding
const { user, needsOnboarding, completeOnboarding } = useAuth();

// Onboarding component automatically shows when needed
<OnboardingWrapper>{children}</OnboardingWrapper>;
```

---

## Stats Management

### Updating Stats

#### Method 1: Set Stats

```typescript
import { updateUserStats } from "@/hooks/useFirestore";

await updateUserStats(
  userId,
  {
    projectsCount: 5,
    totalViews: 1000,
  },
  "set"
);
```

#### Method 2: Increment Stats

```typescript
await updateUserStats(
  userId,
  {
    projectsCount: 1, // +1
    totalViews: 10, // +10
  },
  "increment"
);
```

### Reading Stats

```typescript
import { useUserStats } from "@/hooks/useFirestore";

const { stats, loading } = useUserStats(userId);

// Access stats
console.log(stats?.projectsCount);
console.log(stats?.totalLikes);
```

### Auto-Updated Stats

These stats are automatically updated by the system:

- `projectsCount`: When projects are added/deleted
- `widgetsCount`: When widgets are created/deleted
- `totalViews`: When engagement is tracked
- `totalLikes`: When engagement is tracked
- `totalShares`: When engagement is tracked

---

## Projects System

### Creating a Project

```typescript
import { useProjects } from "@/hooks/useFirestore";

const { addProject } = useProjects(userId);

const projectId = await addProject({
  userId: currentUserId,
  title: "My Awesome Project",
  description: "A cool project I built",
  imageUrl: "https://...",
  demoUrl: "https://demo.com",
  repoUrl: "https://github.com/...",
  tags: ["react", "typescript"],
  featured: false,
});

// Stats automatically updated: projectsCount +1
```

### Fetching User Projects

```typescript
const { projects, loading, error } = useProjects(userId);

projects.map((project) => <ProjectCard key={project.id} project={project} />);
```

### Updating a Project

```typescript
const { updateProject } = useProjects(userId);

await updateProject(projectId, {
  title: "Updated Title",
  featured: true,
});
```

### Deleting a Project

```typescript
const { deleteProject } = useProjects(userId);

await deleteProject(projectId, userId);

// Stats automatically updated: projectsCount -1
```

---

## Engagement Tracking

### Track Any Engagement

```typescript
import { trackEngagement } from "@/hooks/useFirestore";

// Track a like
await trackEngagement(
  "project", // targetType
  projectId, // targetId
  "like", // engagementType
  currentUserId // optional: userId (null for anonymous)
);

// This automatically:
// 1. Creates engagement record
// 2. Updates project.likes count
// 3. Updates user.stats.totalLikes
```

### Track Profile View

```typescript
await trackEngagement("user", profileUserId, "view", viewerUserId);

// Updates user.stats.totalViews
```

### Track Widget Share

```typescript
await trackEngagement("widget", widgetId, "share", userId);

// Updates widget.shares and user.stats.totalShares
```

---

## Best Practices

### 1. Always Use Hooks

✅ **Good**:

```typescript
const { stats } = useUserStats(userId);
const { projects } = useProjects(userId);
```

❌ **Avoid**:

```typescript
// Don't query Firestore directly
const userDoc = await getDoc(doc(db, "users", userId));
```

### 2. Handle Loading States

```typescript
const { projects, loading, error } = useProjects(userId);

if (loading) return <Loader />;
if (error) return <Error message={error} />;
return <ProjectList projects={projects} />;
```

### 3. Use Backward Compatibility

Stats can be accessed via `stats` object or legacy fields:

```typescript
// New way (preferred)
const followers = user?.stats?.followersCount || 0;

// Legacy fallback
const followers = user?.stats?.followersCount || user?.followersCount || 0;
```

### 4. Increment vs Set

- Use **increment** for relative changes:

  ```typescript
  updateUserStats(userId, { totalViews: 1 }, "increment");
  ```

- Use **set** for absolute values:
  ```typescript
  updateUserStats(userId, { badgesCount: 5 }, "set");
  ```

### 5. Error Handling

Always wrap database operations in try/catch:

```typescript
try {
  await addProject({ ... });
} catch (error) {
  console.error('Error creating project:', error);
  showToast('Failed to create project');
}
```

### 6. Optimize Reads

- Use real-time listeners only when needed
- Unsubscribe from listeners when component unmounts
- Cache data when possible

### 7. Security

- Never expose sensitive data in public profiles
- Validate all user inputs
- Use Firestore security rules (already configured)
- Don't allow direct manipulation of stats from client

---

## Firestore Security Rules Summary

```
✅ Users can read any public profile
✅ Users can only write their own profile
✅ Projects are publicly readable
✅ Only owners can create/update/delete their projects
✅ Engagement records can be created by any signed-in user
✅ Stats are protected - can only be updated by owner
❌ No one can delete user documents
❌ Only backend can create achievements
```

---

## Migration Guide

If you have existing users without the new structure:

1. The onboarding will automatically show for existing users
2. They'll complete the setup process
3. Their profile will be upgraded to the new structure
4. Legacy data remains accessible via fallback properties

---

## Future Enhancements

- [ ] Activity feed system
- [ ] Following/followers system
- [ ] Notifications
- [ ] Badge unlock notifications
- [ ] Leaderboards
- [ ] Project comments/reviews
- [ ] Social sharing integrations

---

## Support

For questions or issues with the data infrastructure:

1. Check this documentation
2. Review Firestore rules in `firestore.rules`
3. Check hook implementations in `hooks/useFirestore.ts`
4. Review type definitions for data structures

---

**Last Updated**: October 6, 2025
**Version**: 1.0.0
