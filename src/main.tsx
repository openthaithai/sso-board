import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

console.log(Date.now())

import {initializeApp} from "firebase/app";
import {getAnalytics} from "firebase/analytics";
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App baseUrl="/ssoboard" />
  </StrictMode>,
)
