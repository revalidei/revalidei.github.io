import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const PLACEHOLDER = "YOUR_API_KEY";

export function isFirebaseConfigured() {
  return (
    firebaseConfig &&
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== PLACEHOLDER &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
}

let app = null;
let auth = null;

if (isFirebaseConfigured()) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { app, auth };
