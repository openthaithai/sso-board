import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App baseUrl="/ssoboard" />
      </StrictMode>,
    )
  } catch (e) {
    if (import.meta.env.DEV) {
      console.error("React render failed:", e);
    }
  }
} else {
  if (import.meta.env.DEV) {
    console.error("CRITICAL: Root element not found in DOM");
  }
}

const scheduleIdle = (cb: () => void) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(cb);
  } else {
    setTimeout(cb, 1000);
  }
};

if (import.meta.env.PROD && firebaseConfig.apiKey && firebaseConfig.measurementId) {
  scheduleIdle(async () => {
    try {
      const [{ initializeApp }, { getAnalytics }] = await Promise.all([
        import('firebase/app'),
        import('firebase/analytics')
      ]);
      const app = initializeApp(firebaseConfig);
      getAnalytics(app);
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error("Firebase init failed:", e);
      }
    }
  });
}
