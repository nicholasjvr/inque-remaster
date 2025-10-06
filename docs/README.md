# inQ Social - Documentation

Welcome to the inQ Social documentation! This guide will help you understand and work with the platform's infrastructure.

## 📚 Documentation Index

### Core Documentation

1. **[Data Infrastructure](./DATA_INFRASTRUCTURE.md)** - Complete guide to the data structure

   - User profile schema
   - Firestore collections
   - Stats management
   - Projects system
   - Engagement tracking
   - Security rules

2. **[Usage Examples](./USAGE_EXAMPLES.md)** - Practical code examples
   - User profile components
   - Projects management
   - Stats updates
   - Engagement tracking
   - Real-world scenarios

### Feature Documentation

3. **[Orb Element Summary](./ORB_ELEMENT_SUMMARY.md)** - Floating Orb navigation
4. **[Profile Banner Summary](./PROFILE_BANNER_SUMMARY.md)** - Profile banners
5. **[Studio Summary](./STUDIO_SUMMARY.md)** - Widget Studio features

## 🚀 Quick Start

### New User Onboarding

When a user signs up, they go through an engaging 5-step onboarding process:

1. **Welcome** - Platform introduction
2. **Profile Setup** - Name, bio, handle
3. **Interests** - Select areas of interest
4. **Goals** - Define what they want to achieve
5. **Complete** - Profile ready!

### Creating Your First Project

```typescript
import { useProjects } from "@/hooks/useFirestore";

const { addProject } = useProjects(userId);

await addProject({
  userId: currentUserId,
  title: "My Awesome Project",
  description: "Built with React and TypeScript",
  imageUrl: "https://...",
  demoUrl: "https://demo.com",
  tags: ["react", "typescript"],
  featured: false,
});
```

### Tracking Engagement

```typescript
import { trackEngagement } from "@/hooks/useFirestore";

// Track a like
await trackEngagement("project", projectId, "like", userId);

// Track a view
await trackEngagement("user", profileId, "view", viewerId);

// Track a share
await trackEngagement("widget", widgetId, "share", userId);
```

## 🎯 Key Features

### 1. User Profiles

- **Customizable themes** - Neo, Minimal, Cyber modes
- **Rep Rack** - Showcase up to 3 favorite projects
- **Stats tracking** - Projects, followers, views, likes
- **Achievements** - Unlock badges for milestones
- **Activity timeline** - Track user activity

### 2. Projects System

- **Create & manage** projects with metadata
- **Engagement tracking** - Likes, views, shares
- **Auto-updating stats** - Stats update automatically
- **Public/private** - Control project visibility
- **Rich metadata** - Images, demos, repos, tags

### 3. Stats Management

All stats are automatically managed:

- `projectsCount` - Total projects created
- `widgetsCount` - Total widgets created
- `followersCount` - Number of followers
- `followingCount` - Number following
- `totalViews` - All-time profile views
- `totalLikes` - All-time likes received
- `badgesCount` - Achievements unlocked

### 4. Engagement System

Track all interactions:

- **Likes** - On projects, widgets, profiles
- **Views** - Profile visits, project views
- **Shares** - Social sharing tracking

## 📦 Data Structure

### User Document

```typescript
{
  id: string;
  displayName: string;
  photoURL?: string;
  bio?: string;

  stats: {
    projectsCount: number;
    followersCount: number;
    totalViews: number;
    totalLikes: number;
    badgesCount: number;
    ...
  },

  profile: {
    theme: { mode, accent, bg },
    repRack: [...],
    ...
  }
}
```

### Project Document

```typescript
{
  id: string;
  userId: string;
  title: string;
  description: string;
  likes: number;
  views: number;
  shares: number;
  createdAt: Timestamp;
  ...
}
```

## 🔐 Security

All data is protected by Firestore security rules:

- ✅ Public read access to profiles and projects
- ✅ Users can only edit their own data
- ✅ Stats are protected from manipulation
- ✅ Engagement tracking is authenticated
- ❌ No direct stat manipulation from client
- ❌ No user document deletion

See [firestore.rules](../firestore.rules) for complete rules.

## 🛠️ Development

### Available Hooks

```typescript
// User data
import { usePublicUserById, useUserStats } from "@/hooks/useFirestore";
const { user } = usePublicUserById(userId);
const { stats } = useUserStats(userId);

// Projects
import { useProjects } from "@/hooks/useFirestore";
const { projects, addProject, updateProject, deleteProject } =
  useProjects(userId);

// Widgets
import { useWidgets } from "@/hooks/useFirestore";
const { widgets, addWidget, updateWidget, deleteWidget } = useWidgets(userId);

// Auth
import { useAuth } from "@/contexts/AuthContext";
const { user, needsOnboarding, signIn, signUp, logout } = useAuth();
```

### Helper Functions

```typescript
// Update stats
import { updateUserStats } from "@/hooks/useFirestore";
await updateUserStats(userId, { projectsCount: 1 }, "increment");

// Track engagement
import { trackEngagement } from "@/hooks/useFirestore";
await trackEngagement("project", projectId, "like", userId);
```

## 📊 Firestore Collections

| Collection     | Purpose              | Access                             |
| -------------- | -------------------- | ---------------------------------- |
| `users`        | User profiles        | Read: Public, Write: Owner         |
| `projects`     | User projects        | Read: Public, Write: Owner         |
| `widgets`      | User widgets         | Read: Public, Write: Owner         |
| `engagement`   | Interaction tracking | Read: Public, Write: Authenticated |
| `achievements` | Platform badges      | Read: Public, Write: Backend only  |

## 🎨 UI Components

### Onboarding

```typescript
import UserOnboarding from "@/app/components/UserOnboarding";

<UserOnboarding isOpen={needsOnboarding} onComplete={completeOnboarding} />;
```

### Profile Hub

```typescript
import ProfileHub from "@/app/components/ProfileHub";

<ProfileHub
  mode="public" // or "edit"
  profileUser={user}
  initialState="expanded"
/>;
```

## 🐛 Troubleshooting

### Onboarding not showing

Check if user has `onboardingCompleted: true` in their document.

### Stats not updating

- Ensure you're using the hooks, not direct queries
- Check console for errors
- Verify Firestore rules are deployed

### Engagement not tracking

- User must be authenticated for engagement tracking
- Check network tab for failed requests
- Verify target document exists

## 📝 Best Practices

1. **Always use hooks** - Don't query Firestore directly
2. **Handle loading states** - Show loaders while data loads
3. **Error handling** - Wrap database operations in try/catch
4. **Optimize reads** - Cache data when possible
5. **Use real-time listeners** - Only when needed
6. **Increment vs Set** - Use increment for relative changes

## 🚀 Deployment

### Before Deploying

1. Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. Deploy Storage rules: `firebase deploy --only storage`
3. Test in production mode: `npm run build && npm start`
4. Verify all security rules are working

### Environment Variables

Ensure these are set in your hosting environment:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## 🤝 Contributing

When adding new features:

1. Update type definitions in `hooks/useFirestore.ts`
2. Add security rules to `firestore.rules`
3. Create hooks for data access
4. Update documentation
5. Add usage examples

## 📞 Support

For questions or issues:

1. Check documentation in `/docs`
2. Review code examples in `USAGE_EXAMPLES.md`
3. Check Firestore console for data structure
4. Review browser console for errors

---

## 📖 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [React Hooks Guide](https://react.dev/reference/react)

---

**Last Updated**: October 6, 2025  
**Version**: 1.0.0  
**Maintained by**: inQ Social Team
