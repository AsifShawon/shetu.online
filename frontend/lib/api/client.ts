export const PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const API_BASE_URL = PUBLIC_API_BASE_URL;

let csrfCookiePromise: Promise<void> | null = null;

export function getBrowserApiBaseUrl(): string {
  if (typeof window === "undefined") return PUBLIC_API_BASE_URL;

  try {
    const apiUrl = new URL(PUBLIC_API_BASE_URL);
    const browserHostname = window.location.hostname;
    const localHostnames = new Set(["localhost", "127.0.0.1"]);

    if (localHostnames.has(apiUrl.hostname) && localHostnames.has(browserHostname)) {
      apiUrl.hostname = browserHostname;
      return apiUrl.origin;
    }
  } catch {
    // Preserve the configured value if it is a relative or otherwise non-standard URL.
  }

  return PUBLIC_API_BASE_URL;
}

export async function apiDownload(path: string): Promise<{ blob: Blob; filename?: string }> {
  const response = await fetch(`${getBrowserApiBaseUrl()}${path}`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!response.ok) {
    let body: unknown = {};
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    throw new ApiError(response.status, body);
  }
  const disposition = response.headers.get("Content-Disposition") || "";
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  return {
    blob: await response.blob(),
    filename: filenameMatch?.[1],
  };
}

export function getMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.includes("backend:8000")) {
    const apiBaseUrl = getBrowserApiBaseUrl();
    return path.replace(/https?:\/\/backend:8000/, apiBaseUrl);
  }
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/legacy/")) return path;
  const apiBaseUrl = getBrowserApiBaseUrl();
  if (path.startsWith("/media/")) return `${apiBaseUrl}${path}`;
  return `${apiBaseUrl}/media/${path.replace(/^media\//, "")}`;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown
  ) {
    super(`API error ${status}`);
  }
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  const body = error.body;
  if (typeof body === "string" && body.trim()) {
    return body;
  }

  if (body && typeof body === "object") {
    const detail = (body as Record<string, unknown>).detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    for (const value of Object.values(body as Record<string, unknown>)) {
      if (typeof value === "string" && value.trim()) {
        return value;
      }
      if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
      }
    }
  }

  return fallback;
}

function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken="));
  return match ? match.split("=")[1] : "";
}

const CSRF_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function ensureCsrfCookie(): Promise<void> {
  if (typeof document === "undefined") return;
  if (getCsrfToken()) return;

  if (!csrfCookiePromise) {
    csrfCookiePromise = fetch(`${getBrowserApiBaseUrl()}/api/auth/csrf/`, {
      method: "GET",
      credentials: "include"
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to initialize CSRF cookie: ${response.status}`);
        }
      })
      .finally(() => {
        csrfCookiePromise = null;
      });
  }

  await csrfCookiePromise;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const needsCsrf = CSRF_METHODS.has(method);
  let csrfToken = "";

  if (needsCsrf) {
    await ensureCsrfCookie();
    csrfToken = getCsrfToken();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
    ...((init.headers as Record<string, string>) ?? {})
  };

  const response = await fetch(`${getBrowserApiBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    credentials: "include",
    headers
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:logout"));
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    throw new ApiError(response.status, body);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  method = "POST"
): Promise<T> {
  const needsCsrf = CSRF_METHODS.has(method.toUpperCase());
  let csrfToken = "";

  if (needsCsrf) {
    await ensureCsrfCookie();
    csrfToken = getCsrfToken();
  }

  const response = await fetch(`${getBrowserApiBaseUrl()}${path}`, {
    method,
    cache: "no-store",
    credentials: "include",
    headers: {
      ...(csrfToken ? { "X-CSRFToken": csrfToken } : {})
    },
    body: formData
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    throw new ApiError(response.status, body);
  }

  return response.json() as Promise<T>;
}
