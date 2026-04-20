import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./useAuth";

// Module-level variables to hold the singleton connection state
let socketInstance = null;
let connectionCount = 0;

/**
 * True singleton Socket.IO connection hook for the authenticated user.
 * It ensures only ONE socket connection exists across the entire app
 * even if multiple components call useSocket() simultaneously.
 */
export function useSocket() {
  const { token } = useAuth();
  const [socket, setSocket] = useState(socketInstance);

  useEffect(() => {
    // 1. Clean up when user logs out
    if (!token) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      setSocket(null);
      return;
    }

    // 2. Initialize the singleton socket if it doesn't exist
    if (!socketInstance) {
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api")
        .replace(/\/api\/?$/, "");

      socketInstance = io(baseUrl, {
        auth: { token },
        withCredentials: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        transports: ["websocket", "polling"]
      });

      socketInstance.on("connect_error", () => {
        // Silently handle — will auto-reconnect per reconnectionAttempts
      });
    }

    // 3. Keep track of active subscribers (components)
    setSocket(socketInstance);
    connectionCount++;

    // 4. Clean up only when the LAST component unmounts
    return () => {
      connectionCount--;
      
      // Use a small timeout to prevent thrashing during fast navigation/StrictMode
      setTimeout(() => {
        if (connectionCount === 0 && socketInstance) {
          socketInstance.disconnect();
          socketInstance = null;
          setSocket(null);
        }
      }, 100);
    };
  }, [token]);

  return socket;
}
