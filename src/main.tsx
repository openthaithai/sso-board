import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

console.log("Main.tsx starting...");

import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

console.log("Firebase config loaded:", !!firebaseConfig.apiKey);

try {
  const app = initializeApp(firebaseConfig)
  getAnalytics(app)
  console.log("Firebase initialized");
} catch (e) {
  console.error("Firebase init failed:", e);
}

const rootElement = document.getElementById('root');
console.log("Root element found:", !!rootElement);

if (rootElement) {
  try {
    console.log("Starting React render...");
    createRoot(rootElement).render(
      <StrictMode>
        <App baseUrl="/ssoboard" />
      </StrictMode>,
    )
    console.log("React render called");
  } catch (e) {
    console.error("React render failed:", e);
  }
} else {
  console.error("CRITICAL: Root element not found in DOM");
}
