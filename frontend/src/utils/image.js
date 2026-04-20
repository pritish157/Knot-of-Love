/**
 * image.js — Central image resolution utility.
 *
 * All profile images are now full ImageKit CDN URLs (https://ik.imagekit.io/...).
 * This module no longer needs to prepend an API base URL.
 */

/**
 * Default avatar — UI Avatars fallback with brand colour.
 */
export function getDefaultAvatar(name = "U", size = 400) {
  return `https://ui-avatars.com/api/?background=c7815c&color=fff&bold=true&size=${size}&name=${encodeURIComponent(name)}`;
}

/**
 * Resolve any image value to a displayable URL.
 *
 * Handles three cases:
 *   1. Full URL (http/https — ImageKit or any CDN) → returned as-is
 *   2. Relative path (legacy local uploads, e.g. "/uploads/profiles/xyz.jpg") → still works
 *   3. Falsy / empty → returns "" so callers can fall back to getDefaultAvatar
 */
export function getImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;              // ImageKit / external CDN
  // Legacy local path support (in case any old records exist in the DB)
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

/**
 * Build a ready-to-use <img src> with automatic fallback.
 * Primary resolver used throughout the app.
 */
export function getProfileImageSrc(imagePath, name = "U", size = 400) {
  const url = getImageUrl(imagePath);
  return url || getDefaultAvatar(name, size);
}

/**
 * onError handler for <img> tags — swaps in the default avatar on load failure.
 * Usage: <img onError={(e) => handleImageError(e, name)} ... />
 */
export function handleImageError(e, name = "U") {
  e.target.onerror = null;   // prevent infinite loop
  e.target.src = getDefaultAvatar(name);
}
