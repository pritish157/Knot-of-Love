import { apiRequest } from "./http";

/**
 * GET /api/profiles?filters...
 *
 * Backend returns: { profiles: [...], total, page, pages }
 */
export async function fetchProfilesRequest(filters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  const data = await apiRequest(query ? `/api/profiles?${query}` : "/api/profiles");

  return {
    profiles: Array.isArray(data) ? data : Array.isArray(data.profiles) ? data.profiles : [],
    isDemo: false
  };
}
