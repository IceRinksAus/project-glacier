import { getAccessToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers ?? {}),
    },
  });

if (response.status === 401) {
  if (typeof window !== "undefined") {
    localStorage.removeItem("glacier_access_token");
    localStorage.removeItem("glacier_user");
    window.location.href = "/login";
  }

  throw new Error("Your session has expired. Please sign in again.");
}

if (!response.ok) {
  let message = `Request failed (${response.status})`;

  try {
    const errorBody = await response.json();

    if (
      errorBody &&
      typeof errorBody.message === "string"
    ) {
      message = errorBody.message;
    }
  } catch {
    // Keep the default message if the response
    // body is not valid JSON.
  }

  throw new Error(message);
}

  const responseBody = await response.text();

  if (!responseBody) {
    return null as T;
  }

  return JSON.parse(responseBody) as T;
}

async function requestBlob(path: string) {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error(`Unable to load image (${response.status})`);
  return response.blob();
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  upload: <T>(path: string, body: FormData) =>
    request<T>(path, { method: "POST", body }),

  blob: (path: string) => requestBlob(path),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string) =>
    request<T>(path, {
      method: "DELETE",
    }),
};
