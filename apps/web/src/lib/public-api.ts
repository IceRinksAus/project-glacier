const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type":
          "application/json",
        ...(options.headers ?? {}),
      },
    },
  );

  if (!response.ok) {
    let message =
      `Request failed (${response.status})`;

    try {
      const errorBody =
        await response.json();

      if (
        errorBody &&
        typeof errorBody.message ===
          "string"
      ) {
        message = errorBody.message;
      }
    } catch {
      // Keep the default message if the
      // response body is not valid JSON.
    }

    throw new Error(message);
  }

  return response.json();
}

export const publicApi = {
  get: <T>(path: string) =>
    request<T>(path),

  post: <T>(
    path: string,
    body: unknown,
  ) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};