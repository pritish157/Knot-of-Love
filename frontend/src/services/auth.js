import { apiRequest } from "./http";

/**
 * POST /api/auth/login
 * Returns { token, user: { name, email, profileCompletion } }
 */
export function loginRequest(payload) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

/**
 * POST /api/auth/register
 * Returns { message }
 */
export function registerRequest(payload) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
