# Usage Examples - inQ Data Infrastructure

## Quick Reference Guide

### Table of Contents

1. [User Profile Examples](#user-profile-examples)
2. [Projects Management](#projects-management)
3. [Stats Updates](#stats-updates)
4. [Engagement Tracking](#engagement-tracking)
5. [Real-World Scenarios](#real-world-scenarios)

---

## User Profile Examples

### Display User Stats in Component

```typescript
"use client";

import { usePublicUserById, useUserStats } from "@/hooks/useFirestore";

export default function UserProfileCard({ userId }: { userId: string }) {
  const { user, loading } = usePublicUserById(userId);
  const { stats } = useUserStats(userId);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="profile-card">
      <img
        src={user.photoURL || "/default-avatar.png"}
        alt={user.displayName}
      />
      <h2>{user.displayName}</h2>
      <p>{user.bio}</p>

      <div className="stats-grid">
        <div className="stat">
          <span className="value">{stats?.projectsCount || 0}</span>
          <span className="label">Projects</span>
        </div>
        <div className="stat">
          <span className="value">{stats?.followersCount || 0}</span>
          <span className="label">Followers</span>
        </div>
        <div className="stat">
          <span className="value">{stats?.totalLikes || 0}</span>
          <span className="label">Likes</span>
        </div>
      </div>

      {user.interests && (
        <div className="interests">
          {user.interests.map((interest) => (
            <span key={interest} className="interest-badge">
              {interest}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Projects Management

### Create Project Component

```typescript
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/hooks/useFirestore";

export default function CreateProjectForm() {
  const { user } = useAuth();
  const { addProject } = useProjects(user?.uid);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    demoUrl: "",
    tags: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const projectId = await addProject({
        userId: user.uid,
        ...formData,
        featured: false,
      });

      console.log("Project created:", projectId);
      alert("Project created successfully!");

      // Reset form
      setFormData({
        title: "",
        description: "",
        imageUrl: "",
        demoUrl: "",
        tags: [],
      });
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-project-form">
      <input
        type="text"
        placeholder="Project Title"
        value={formData.title}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, title: e.target.value }))
        }
        required
      />

      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, description: e.target.value }))
        }
        required
      />

      <input
        type="url"
        placeholder="Image URL"
        value={formData.imageUrl}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
        }
      />

      <input
        type="url"
        placeholder="Demo URL"
        value={formData.demoUrl}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, demoUrl: e.target.value }))
        }
      />

      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Project"}
      </button>
    </form>
  );
}
```

### Display User's Projects

```typescript
"use client";

import { useProjects } from "@/hooks/useFirestore";

export default function UserProjects({ userId }: { userId: string }) {
  const { projects, loading, error, updateProject, deleteProject } =
    useProjects(userId);

  if (loading) return <div>Loading projects...</div>;
  if (error) return <div>Error: {error}</div>;
  if (projects.length === 0) return <div>No projects yet</div>;

  const handleToggleFeatured = async (
    projectId: string,
    currentState: boolean
  ) => {
    try {
      await updateProject(projectId, { featured: !currentState });
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await deleteProject(projectId, userId);
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  return (
    <div className="projects-grid">
      {projects.map((project) => (
        <div key={project.id} className="project-card">
          {project.imageUrl && (
            <img src={project.imageUrl} alt={project.title} />
          )}
          <h3>{project.title}</h3>
          <p>{project.description}</p>

          <div className="project-stats">
            <span>❤️ {project.likes}</span>
            <span>👁️ {project.views}</span>
            <span>🔗 {project.shares}</span>
          </div>

          {project.tags && (
            <div className="tags">
              {project.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="project-actions">
            <button
              onClick={() =>
                handleToggleFeatured(project.id, project.featured || false)
              }
            >
              {project.featured ? "Unfeature" : "Feature"}
            </button>
            <button onClick={() => handleDelete(project.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Stats Updates

### Manual Stats Update Example

```typescript
import { updateUserStats } from "@/hooks/useFirestore";

// Example: Award a user for completing a milestone
async function awardMilestone(userId: string, milestoneName: string) {
  try {
    // Increment badge count
    await updateUserStats(
      userId,
      {
        badgesCount: 1,
      },
      "increment"
    );

    console.log(`Awarded ${milestoneName} badge to user ${userId}`);
  } catch (error) {
    console.error("Error awarding milestone:", error);
  }
}

// Example: Batch update multiple stats
async function updateProfileStats(userId: string) {
  try {
    await updateUserStats(
      userId,
      {
        projectsCount: 5,
        totalViews: 1234,
        totalLikes: 89,
        badgesCount: 3,
      },
      "set"
    );

    console.log("Profile stats updated successfully");
  } catch (error) {
    console.error("Error updating stats:", error);
  }
}
```

---

## Engagement Tracking

### Like Button Component

```typescript
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { trackEngagement } from "@/hooks/useFirestore";

export default function LikeButton({
  projectId,
  initialLikes,
}: {
  projectId: string;
  initialLikes: number;
}) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (!user) {
      alert("Please sign in to like projects");
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      await trackEngagement("project", projectId, "like", user.uid);

      setLikes((prev) => prev + 1);
      setLiked(true);

      // This automatically:
      // 1. Creates engagement record
      // 2. Increments project.likes
      // 3. Increments owner's stats.totalLikes
    } catch (error) {
      console.error("Error liking project:", error);
      alert("Failed to like project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={liked || loading}
      className={`like-button ${liked ? "liked" : ""}`}
    >
      ❤️ {likes}
    </button>
  );
}
```

### Track Profile View

```typescript
"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { trackEngagement } from "@/hooks/useFirestore";

export default function ProfilePage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const profileUserId = params.id;

  useEffect(() => {
    // Track profile view when page loads
    const trackView = async () => {
      try {
        await trackEngagement(
          "user",
          profileUserId,
          "view",
          user?.uid // Can be undefined for anonymous views
        );
      } catch (error) {
        console.error("Error tracking view:", error);
      }
    };

    trackView();
  }, [profileUserId, user]);

  return <div className="profile-page">{/* Profile content */}</div>;
}
```

### Share Button Component

```typescript
"use client";

import { trackEngagement } from "@/hooks/useFirestore";

export default function ShareButton({
  projectId,
  projectTitle,
}: {
  projectId: string;
  projectTitle: string;
}) {
  const handleShare = async () => {
    try {
      // Track share engagement
      await trackEngagement("project", projectId, "share");

      // Share using Web Share API
      if (navigator.share) {
        await navigator.share({
          title: projectTitle,
          url: window.location.href,
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <button onClick={handleShare} className="share-button">
      🔗 Share
    </button>
  );
}
```

---

## Real-World Scenarios

### Scenario 1: User Creates First Project

```typescript
async function handleFirstProjectCreation(userId: string) {
  try {
    // Create the project
    const projectId = await addProject({
      userId,
      title: "My First Project",
      description: "This is my first project on inQ!",
      featured: false,
    });

    // Stats automatically updated: projectsCount +1

    // Check if this unlocks "First Project" badge
    const { stats } = await useUserStats(userId);
    if (stats?.projectsCount === 1) {
      // Award first project badge
      await updateUserStats(
        userId,
        {
          badgesCount: 1,
        },
        "increment"
      );

      // Show congratulations notification
      showNotification("🎉 Achievement Unlocked: First Project!");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
```

### Scenario 2: Project Gets 50 Likes

```typescript
async function checkLikeMilestone(projectId: string, newLikeCount: number) {
  if (newLikeCount === 50) {
    // Fetch project to get owner
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (!projectDoc.exists()) return;

    const ownerId = projectDoc.data().userId;

    // Award "Community Favorite" badge
    await updateUserStats(
      ownerId,
      {
        badgesCount: 1,
      },
      "increment"
    );

    // Send notification to owner
    sendNotification(ownerId, {
      type: "achievement",
      title: "Community Favorite!",
      message: "Your project reached 50 likes!",
    });
  }
}
```

### Scenario 3: Complete User Dashboard

```typescript
"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  usePublicUserById,
  useProjects,
  useUserStats,
} from "@/hooks/useFirestore";

export default function UserDashboard() {
  const { user } = useAuth();
  const { user: profileData } = usePublicUserById(user?.uid);
  const { projects } = useProjects(user?.uid);
  const { stats } = useUserStats(user?.uid);

  if (!user) return <div>Please sign in</div>;

  return (
    <div className="dashboard">
      <h1>Welcome back, {profileData?.displayName}!</h1>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <h3>{stats?.projectsCount || 0}</h3>
          <p>Projects</p>
        </div>
        <div className="stat-card">
          <h3>{stats?.totalViews || 0}</h3>
          <p>Total Views</p>
        </div>
        <div className="stat-card">
          <h3>{stats?.totalLikes || 0}</h3>
          <p>Total Likes</p>
        </div>
        <div className="stat-card">
          <h3>{stats?.followersCount || 0}</h3>
          <p>Followers</p>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="recent-projects">
        <h2>Your Projects</h2>
        <div className="projects-grid">
          {projects.slice(0, 6).map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button onClick={() => (window.location.href = "/studio")}>
          Create New Widget
        </button>
        <button onClick={() => (window.location.href = "/studio/project/new")}>
          Add New Project
        </button>
      </div>
    </div>
  );
}
```

---

## Tips & Tricks

### 1. Optimistic UI Updates

```typescript
const handleLike = async () => {
  // Update UI immediately
  setLikes((prev) => prev + 1);
  setLiked(true);

  try {
    await trackEngagement("project", projectId, "like", user.uid);
  } catch (error) {
    // Revert on error
    setLikes((prev) => prev - 1);
    setLiked(false);
    alert("Failed to like");
  }
};
```

### 2. Debounce View Tracking

```typescript
import { useEffect, useRef } from "react";

export function useTrackView(targetType: string, targetId: string) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;

    const timer = setTimeout(() => {
      trackEngagement(targetType as any, targetId, "view");
      tracked.current = true;
    }, 3000); // Track after 3 seconds

    return () => clearTimeout(timer);
  }, [targetType, targetId]);
}
```

### 3. Batch Updates

```typescript
// Instead of multiple updates
await updateUserStats(userId, { projectsCount: 1 }, "increment");
await updateUserStats(userId, { badgesCount: 1 }, "increment");

// Do this
await updateUserStats(
  userId,
  {
    projectsCount: 1,
    badgesCount: 1,
  },
  "increment"
);
```

---

## Common Pitfalls

❌ **Don't manually update stats that are auto-managed**

```typescript
// Bad: projectsCount is auto-managed
await updateUserStats(userId, { projectsCount: 5 }, "set");
```

❌ **Don't forget error handling**

```typescript
// Bad
await addProject({ ... });

// Good
try {
  await addProject({ ... });
} catch (error) {
  handleError(error);
}
```

❌ **Don't query inside loops**

```typescript
// Bad
for (const project of projects) {
  const user = await getDoc(doc(db, "users", project.userId));
}

// Good: Fetch once and cache
const userCache = new Map();
for (const project of projects) {
  if (!userCache.has(project.userId)) {
    const user = await getDoc(doc(db, "users", project.userId));
    userCache.set(project.userId, user);
  }
}
```

---

Happy coding! 🚀
