import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration - conditionally initialize only when needed
let firebaseConfig: any = null;

if (typeof window !== 'undefined') {
  // Only initialize Firebase config on client side to prevent build errors
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  // Validate required environment variables (only on client side)
  const requiredEnvVars = {
    'NEXT_PUBLIC_FIREBASE_API_KEY': apiKey,
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': authDomain,
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID': projectId,
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': storageBucket,
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': messagingSenderId,
    'NEXT_PUBLIC_FIREBASE_APP_ID': appId,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value || value.trim() === '')
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('🔥 Missing required Firebase environment variables:', missingVars.join(', '));
    console.error('Please check your .env.local file and Vercel environment variables.');
    console.error('Current values:', Object.fromEntries(
      Object.entries(requiredEnvVars).map(([key, value]) => [key, value ? '[SET]' : '[MISSING]'])
    ));
    console.error('Window location:', typeof window !== 'undefined' ? window.location.href : 'SSR');
    firebaseConfig = null;
  } else {
    firebaseConfig = {
      apiKey,
      authDomain,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      projectId,
      storageBucket,
      messagingSenderId: Number(messagingSenderId),
      appId,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };
  }
}

// Initialize Firebase only if config is available and valid
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let analytics: any = null;

if (firebaseConfig && typeof window !== 'undefined') {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Only initialize analytics if measurementId is provided
    if (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
      analytics = getAnalytics(app);
    }

    console.log('✅ Firebase initialized successfully');
    console.log('Project ID:', firebaseConfig.projectId);
    console.log('Auth Domain:', firebaseConfig.authDomain);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Reset services to null if initialization fails
    app = null;
    auth = null;
    db = null;
    storage = null;
    analytics = null;
  }
}

// Export services (will be null during build if config is missing)
export { auth, db, storage, analytics };

export default app;
