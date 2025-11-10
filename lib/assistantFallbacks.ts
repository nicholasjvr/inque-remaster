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
  }
] as const;

export const DEFAULT_GREETING =
  "Hi! I'm your inQu assistant. I can help you navigate the app, create projects, customize your profile, and answer questions. What would you like to know?";

const DEFAULT_FALLBACK =
  "I'm here to help! You can ask me about:\n• Creating projects\n• Customizing your profile\n• Navigating the app\n• Using features\n• Getting started\n\nWhat would you like to know?";

export function getAssistantFallback(message: string, userName?: string | null): string {
  const normalized = message.toLowerCase().trim();

  if (/\b(hello|hi|hey)\b/.test(normalized)) {
    return `Hello${userName ? `, ${userName}` : ' there'}! How can I help you today?`;
  }

  const match = FALLBACKS.find((entry) => entry.match(normalized));
  return match?.reply ?? DEFAULT_FALLBACK;
}

