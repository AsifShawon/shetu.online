import "server-only";

export const SERVER_API_BASE_URL =
  process.env.SERVER_API_BASE_URL ??
  process.env.INTERNAL_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://backend:8000";
