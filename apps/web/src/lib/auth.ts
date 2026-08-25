const ACCESS_TOKEN_KEY = "glacier_access_token";
const USER_KEY = "glacier_user";

export interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  accessScope?: string;
  organizationId?: string;
}

let cachedUserRaw: string | null | undefined;
let cachedUser: AuthUser | null = null;

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAuthSession(accessToken: string, user: unknown) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  const serializedUser = JSON.stringify(user);
  localStorage.setItem(USER_KEY, serializedUser);
  cachedUserRaw = serializedUser;
  cachedUser = user as AuthUser;
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  cachedUserRaw = null;
  cachedUser = null;
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const rawUser = localStorage.getItem(USER_KEY);
  if (rawUser === cachedUserRaw) return cachedUser;

  try {
    cachedUserRaw = rawUser;
    cachedUser = JSON.parse(rawUser ?? "null") as AuthUser | null;
    return cachedUser;
  } catch {
    cachedUserRaw = rawUser;
    cachedUser = null;
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

export function getAuthUserSnapshot() {
  return getAuthUser();
}

export function getServerAuthUserSnapshot() {
  return null;
}
