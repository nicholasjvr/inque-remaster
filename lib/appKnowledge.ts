/**
 * App Knowledge Base
 * Contains structured information about the application
 * that can be injected into AI prompts for context-aware responses
 */

export interface AppFeature {
  name: string;
  description: string;
  location: string;
  howTo: string[];
  relatedFeatures?: string[];
}

export const APP_KNOWLEDGE: AppFeature[] = [
  {
    name: 'Widget Studio',
    description: 'Create and upload interactive widgets (HTML, CSS, JavaScript)',
    location: '/studio',
    howTo: [
      'Navigate to Widget Studio from the Floating Orb or /studio',
      'You have 3 slots available for widgets',
      'Click "Upload Widget" in an empty slot',
      'Upload HTML, CSS, and JavaScript files (or ZIP file)',
      'Your widget will be saved to Firebase Storage and Firestore'
    ],
    relatedFeatures: ['Explore', 'RepRack', 'Profile Hub']
  },
  {
    name: 'Floating Orb Navigation (Robert)',
    description: '3D interactive navigation orb with rotating menu - This is Robert, your AI assistant',
    location: 'Homepage center',
    howTo: [
      'Robert is the Floating Orb - your AI assistant and navigation hub',
      'Rotate Robert by dragging or using mouse wheel',
      'Click on icons around Robert to navigate to different sections',
      'Each icon represents a different part of the platform',
      'Keyboard navigation: Arrow keys or Enter to activate',
      'Chat with Robert by opening the Profile Hub chatbot'
    ],
    relatedFeatures: ['Explore', 'Widget Studio', 'Showcase', 'Profile Hub']
  },
  {
    name: 'Profile Hub',
    description: 'Your personal command center for profile management',
    location: 'Bottom of homepage, expandable',
    howTo: [
      'Click the Profile Hub card to expand',
      'Customize avatar, background, and theme',
      'Manage RepRack (featured projects)',
      'View stats, followers, and activity',
      'Access quick navigation and actions'
    ],
    relatedFeatures: ['Customization Shop', 'RepRack Manager', 'Widget Studio']
  },
  {
    name: 'RepRack',
    description: 'Featured projects showcase (max 3 projects)',
    location: 'Profile Hub > Featured Projects',
    howTo: [
      'Go to Profile Hub > Featured Projects section',
      'Click "Manage RepRack"',
      'Select up to 3 projects from your uploaded widgets',
      'These will display prominently on your profile'
    ],
    relatedFeatures: ['Widget Studio', 'Profile Hub']
  },
  {
    name: 'Customization Shop',
    description: 'Personalize your profile with avatar frames, animations, and backgrounds',
    location: 'Profile Hub > Customization Shop',
    howTo: [
      'Expand Profile Hub',
      'Open Customization Shop section',
      'Choose avatar frames and animations',
      'Select background images from gallery',
      'Changes save automatically'
    ],
    relatedFeatures: ['Profile Hub']
  },
  {
    name: 'Explore Page',
    description: 'Discover projects from the community',
    location: '/explore',
    howTo: [
      'Navigate via Floating Orb or /explore',
      'Filter by category and sort by popularity',
      'View project details and interact with creators',
      'Like and share projects you enjoy'
    ],
    relatedFeatures: ['Widget Studio', 'Showcase']
  },
  {
    name: 'Showcase',
    description: 'Top projects and featured work',
    location: '/showcase',
    howTo: [
      'View featured and trending projects',
      'See top creators and their work',
      'Get inspired by community creations'
    ],
    relatedFeatures: ['Explore', 'Widget Studio']
  },
  {
    name: 'User Onboarding',
    description: 'First-time setup for new users',
    location: 'Automatic on first sign-in',
    howTo: [
      'Complete profile information',
      'Select interests (web-dev, design, animation, etc.)',
      'Choose goals (showcase, learn, collaborate, etc.)',
      'Your profile will be created with default settings'
    ],
    relatedFeatures: ['Profile Hub']
  }
];

/**
 * Get relevant app context for a user query
 */
export function getRelevantContext(query: string): string {
  const normalizedQuery = query.toLowerCase();
  const relevantFeatures: AppFeature[] = [];
  
  // Find features that match the query
  for (const feature of APP_KNOWLEDGE) {
    const featureText = `${feature.name} ${feature.description} ${feature.location}`.toLowerCase();
    if (
      featureText.includes(normalizedQuery) ||
      normalizedQuery.includes(feature.name.toLowerCase()) ||
      feature.howTo.some(step => step.toLowerCase().includes(normalizedQuery))
    ) {
      relevantFeatures.push(feature);
    }
  }
  
  // If no matches, return general context
  if (relevantFeatures.length === 0) {
    return `This is inQ, a creative platform for showcasing interactive widgets and projects. 
Main features: Widget Studio, Profile Hub, Explore page, Floating Orb navigation, RepRack showcase.`;
  }
  
  // Build context string from relevant features
  let context = 'Relevant app features:\n\n';
  for (const feature of relevantFeatures.slice(0, 3)) { // Limit to top 3
    context += `**${feature.name}**\n`;
    context += `Description: ${feature.description}\n`;
    context += `Location: ${feature.location}\n`;
    context += `How to use:\n${feature.howTo.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\n`;
  }
  
  return context;
}

/**
 * Get system prompt with app context
 */
export function getSystemPrompt(userName?: string | null): string {
  return `You are Robert, an AI assistant for inQ, a creative platform where users showcase interactive widgets and projects.

You ARE the Floating Orb - the central navigation hub of the platform. You're the interactive 3D orb that users see and interact with on the homepage.

Your role:
- Help users navigate and understand the platform
- Provide clear, step-by-step instructions
- Be friendly and encouraging
- Focus on practical, actionable advice
- Remember: You are the Floating Orb itself, guiding users through the platform

Key platform features:
- Widget Studio: Create/upload HTML/CSS/JS widgets (3 slots)
- Profile Hub: Customize profile, manage RepRack, view stats
- Floating Orb (You!): 3D navigation interface - this is you
- Explore: Discover community projects
- RepRack: Featured projects showcase (max 3)
- Customization Shop: Avatar frames, backgrounds, themes

${userName ? `The user's name is ${userName}.` : 'The user is a guest.'}

Always be concise, helpful, and encouraging. If you don't know something specific about the app, 
direct them to explore the relevant section or ask for clarification.`;
}

