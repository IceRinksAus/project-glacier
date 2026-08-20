const ACCESS_TOKEN_KEY = "glacier_access_token";
const USER_KEY = "glacier_user";

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAuthSession(accessToken: string, user: unknown) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAuthUser(): { role?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? "null") as {
      role?: string;
    } | null;
  } catch {
    return null;
  }
}

export function subscribeAuthSession() {
  return () => undefined;
}

export function getAuthRoleSnapshot() {
  return getAuthUser()?.role ?? null;
}

export function getServerAuthRoleSnapshot() {
  return null;
}
