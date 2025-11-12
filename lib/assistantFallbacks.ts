const FALLBACKS = [
  {
    match: (message: string) => /\b(create|project|upload)\b/.test(message),
    reply:
      "To create a new project, go to the Widget Studio (/studio). You can upload HTML, CSS, and JavaScript files to create interactive widgets. Click 'Upload Widget' in an empty slot to get started!"
  },
  {
    match: (message: string) => /\b(customize|profile|avatar)\b/.test(message),
    reply:
      "To customize your profile, expand the Profile Hub and open the 'Customization Shop' section. You can choose avatar frames, animations, and background images to personalize your profile!"
  },
  {
    match: (message: string) => /\b(reprack|featured)\b/.test(message),
    reply:
      "RepRack is your featured projects showcase! You can select up to 3 projects from your uploaded widgets to display prominently on your profile. Go to Featured Projects and use the RepRack Manager to select your best work."
  },
  {
    match: (message: string) => /\b(explore|discover|browse)\b/.test(message),
    reply:
      "Check out the Explore page (/explore) to discover amazing projects from the community. You can filter by category, sort by popularity, and interact with other creators' work!"
  },
  {
    match: (message: string) => /\b(studio|widget)\b/.test(message),
    reply:
      "The Widget Studio (/studio) is where you create and manage your projects. You have 3 slots available - upload HTML/CSS/JS files to create interactive widgets that showcase your creativity!"
  },
  {
    match: (message: string) => /\b(help|how|what)\b/.test(message),
    reply:
      "I can help you with:\n• Creating and uploading projects\n• Customizing your profile\n• Navigating the app\n• Understanding features like RepRack\n• Finding and exploring content\n\nWhat specific topic would you like help with?"
  },
  {
    match: (message: string) => /\b(sign in|login|account)\b/.test(message),
    reply:
      "To sign in, click the Auth button in the header. You can sign in with Google or create an account with email/password. Once signed in, you'll have access to all features!"
  },
  {
    match: (message: string) => /\b(get started|start|begin|first|new|tutorial)\b/.test(message),
    reply:
      "Great! Here's how to get started:\n\n1. **Sign In** - Click the Auth button to create an account or sign in\n2. **Explore** - Check out the Explore page to see what others are creating\n3. **Create** - Go to Widget Studio (/studio) to upload your first project\n4. **Customize** - Expand your Profile Hub to personalize your profile\n\nWould you like me to explain any of these steps in more detail?"
  },
  {
    match: (message: string) => /\b(floating orb|orb|navigate|navigation|robert)\b/.test(message),
    reply:
      "That's me! I'm Robert, the Floating Orb - your navigation hub and assistant! 🎯\n\n• Rotate me by dragging or using your mouse wheel\n• Click on the icons around me to navigate\n• Each icon represents a different part of the platform\n• I'm always here on the homepage to help guide you\n• Chat with me anytime through the Profile Hub\n\nTry rotating me now to see all the available sections!"
  },
  {
    match: (message: string) => /\b(profile hub|profile|hub)\b/.test(message),
    reply:
      "Your Profile Hub is your command center! 🎛️\n\nYou can:\n• Customize your avatar and background\n• Manage your RepRack (featured projects)\n• View your stats and followers\n• Access quick navigation\n• Chat with me (you're doing it now!)\n\nExpand the Profile Hub card at the bottom of the page to see all options!"
  }
] as const;

export const DEFAULT_GREETING =
  "Hi! I'm Robert. I can help you navigate the app, create projects, customize your profile, and answer questions. What would you like to know?";

// Tutorial welcome message for first-time visitors
export const TUTORIAL_GREETING = `Welcome to inQ! 👋 I'm Robert, and I'm here to help you get started.

Let me show you around! Here's what you can do:

🎨 **Widget Studio** - Create interactive widgets by uploading HTML, CSS, and JavaScript files
🔍 **Explore** - Discover amazing projects from the community
👥 **Creators** - Find and follow other creators
🏆 **Showcase** - See top projects and featured work
⚙️ **Profile Hub** - Customize your profile, avatar, and showcase your best work

Would you like me to explain any of these features in more detail? Just ask! You can also ask me questions like:
• "How do I create a project?"
• "How do I customize my profile?"
• "What is RepRack?"
• "How do I explore content?"

What would you like to know first?`;

const DEFAULT_FALLBACK =
  "I'm Robert! I'm here to help. You can ask me about:\n• Creating projects\n• Customizing your profile\n• Navigating the app\n• Using features\n• Getting started\n\nWhat would you like to know?";

export function getAssistantFallback(message: string, userName?: string | null): string {
  const normalized = message.toLowerCase().trim();

  if (/\b(hello|hi|hey)\b/.test(normalized)) {
    return `Hello${userName ? `, ${userName}` : ' there'}! I'm Robert. How can I help you today?`;
  }

  const match = FALLBACKS.find((entry) => entry.match(normalized));
  return match?.reply ?? DEFAULT_FALLBACK;
}

