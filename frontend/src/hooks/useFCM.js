import { useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../config/firebase";
import { apiRequest } from "../services/http";

export function useFCM() {
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    async function requestPermission() {
      try {
        if (!messaging) {
          console.warn("Firebase messaging not supported in this browser.");
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
          
          if (!vapidKey) {
            console.error("VITE_FIREBASE_VAPID_KEY is missing in .env");
            return;
          }

          const token = await getToken(messaging, { vapidKey });
          if (token) {
            setFcmToken(token);
            // Send token to backend
            await apiRequest("/api/notifications/fcm-token", {
              method: "PUT",
              body: JSON.stringify({ token })
            }).catch(err => {
              console.error("Failed to save FCM token to backend", err);
            });
          } else {
            console.log("No registration token available. Request permission to generate one.");
          }
        } else {
          console.log("Notification permission not granted.");
        }
      } catch (error) {
        console.error("Error retrieving FCM token:", error);
      }
    }

    requestPermission();

    // Foreground message handler (optional, but good for real-time updates when app is open
    // if Socket.IO isn't handling this specific notification)
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("Message received in foreground: ", payload);
        // You can dispatch a custom event or show a toast here
      });

      return () => unsubscribe();
    }
  }, []);

  return { fcmToken };
}
