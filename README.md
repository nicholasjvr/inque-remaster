# Inque - Creatives Platform

A Next.js application with Firebase integration for showcasing and managing interactive widgets.

## Features

- 🎨 **Widget Studio**: Create, upload, and manage interactive widgets
- 🔐 **Firebase Authentication**: Secure user authentication with Google Sign-in
- 📊 **Real-time Database**: Firestore for storing widget data
- 📁 **File Storage**: Firebase Storage for widget files
- 🎯 **Responsive Design**: Mobile-first design with floating orb navigation

## Setup

### 1. Environment Variables

Create a `.env.local` file in the root directory with your Firebase configuration:

```env

```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Firebase Configuration

The application uses the following Firebase services:

- **Authentication**: User sign-in/sign-up with email/password and Google
- **Firestore**: Real-time database for widget data
- **Storage**: File storage for widget assets
- **Analytics**: Usage tracking (client-side only)

## Project Structure

```
app/
├── components/          # React components
│   ├── WidgetStudio.tsx # Main studio component
│   ├── WidgetCarousel.tsx # Widget carousel
│   ├── WidgetCard.tsx   # Individual widget cards
│   └── UploadWorkspace.tsx # File upload interface
├── studio/             # Studio page
├── globals.css         # Global styles
└── widget-studio.css   # Studio-specific styles

lib/
└── firebase.ts         # Firebase configuration

contexts/
└── AuthContext.tsx     # Authentication context

hooks/
├── useFirestore.ts     # Firestore data hooks
└── useStorage.ts       # Storage upload hooks
```

## Widget Studio Features

### Carousel

- Horizontal scrollable widget timeline
- Real-time widget previews in iframes
- Keyboard navigation support
- Empty slot management

### Upload Workspace

- Drag-and-drop file uploads
- File validation (HTML, CSS, JS, images)
- Multiple file support
- Real-time upload progress

### Authentication

- Email/password authentication
- Google Sign-in integration
- User profile management
- Protected routes

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Firebase Hosting

```bash
npm run build
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Development

### Adding New Features

1. Create components in `app/components/`
2. Add Firebase hooks in `hooks/`
3. Update styles in CSS files
4. Test with Firebase emulators

### Firebase Emulators

```bash
npm install -g firebase-tools
firebase emulators:start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
