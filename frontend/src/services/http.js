import { getStoredAuth } from "../utils/storage";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/**
 * Central fetch wrapper.
 * - Automatically attaches Bearer token from localStorage.
 * - Auto-sets Content-Type: application/json ONLY when body is a plain string
 *   (i.e. JSON.stringify output). Skips it for FormData so the browser can
 *   set the multipart/form-data boundary correctly.
 * - Normalises error responses to always throw Error with a user-readable message.
 */
export async function apiRequest(endpoint, options = {}) {
  const { token } = getStoredAuth();
  const headers = new Headers(options.headers || {});

  // Only auto-set JSON content-type for string bodies (not FormData/Blob)
  if (
    typeof options.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
  } catch (networkError) {
    // Network failure (offline, CORS, DNS) — always throw a clean message
    throw new Error("Unable to reach the server. Please check your connection.");
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null
        ? payload.message || `Request failed (${response.status}).`
        : `Request failed (${response.status}).`;
    throw new Error(message);
  }

  return payload;
}
