const TOKEN_KEY = "knotToken";
const USER_KEY = "knotUser";

export function getStoredAuth() {
  try {
    const token = localStorage.getItem(TOKEN_KEY) || "";
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    return { token, user };
  } catch {
    return { token: "", user: null };
  }
}

export function persistAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token || "");
  localStorage.setItem(USER_KEY, JSON.stringify(user || null));
}

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
