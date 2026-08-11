// firebase-messaging-sw.js
// Background push notification handler for Knot of Love.
//
// ⚠️  IMPORTANT: This service worker cannot access import.meta.env (Vite env vars).
//     You MUST create /public/firebase-config.js with your real Firebase project values.
//     Example content for /public/firebase-config.js:
//
//       self.FIREBASE_CONFIG = {
//         apiKey: "YOUR_API_KEY",
//         authDomain: "YOUR_PROJECT.firebaseapp.com",
//         projectId: "YOUR_PROJECT_ID",
//         storageBucket: "YOUR_PROJECT.appspot.com",
//         messagingSenderId: "YOUR_SENDER_ID",
//         appId: "YOUR_APP_ID"
//       };
//
//     Then import it here (already done below). Add /public/firebase-config.js to .gitignore.

importScripts('/firebase-config.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

if (typeof self.FIREBASE_CONFIG === 'undefined') {
  console.error('[SW] firebase-config.js is missing or did not define self.FIREBASE_CONFIG');
} else {
  firebase.initializeApp(self.FIREBASE_CONFIG);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new update.',
      icon: '/icon-192x192.png',
      data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}
