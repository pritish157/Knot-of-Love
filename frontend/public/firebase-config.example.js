// firebase-config.example.js
// -------------------------------------------------------------------
// Copy this file to firebase-config.js and fill in your real values.
// The service worker (firebase-messaging-sw.js) imports firebase-config.js.
//
// ⚠️  IMPORTANT:
//   - firebase-config.js must NOT be committed to git (add to .gitignore)
//   - firebase-config.example.js SHOULD be committed as a template
//   - firebase-config.js is served as a public static file by Vite
// -------------------------------------------------------------------

self.FIREBASE_CONFIG = {
  apiKey:            "YOUR_FIREBASE_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "1:YOUR_SENDER_ID:web:YOUR_APP_ID"
};
