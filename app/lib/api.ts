// lib/api.ts

/**
 * Build a relative API path with optional query params.
 * Thanks to next.config.ts rewrites, /api/... is forwarded
 * to ${process.env.API_URL} (dev/prod).
 */
export function apiUrl(path: string, query?: Record<string, unknown>) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const prefixed = normalized.startsWith("/api/")
    ? normalized
    : `/api${normalized}`;
  const url = new URL(prefixed, "http://localhost"); // base is ignored by fetch when relative

  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v == null) return;
      if (Array.isArray(v)) {
        v.forEach((vv) => url.searchParams.append(k, String(vv)));
      } else {
        url.searchParams.set(k, String(v));
      }
    });
  }

  // Return only pathname + search (relative URL for fetch)
  return url.pathname + url.search;
}

/**
 * Fetch wrapper with:
 * - `credentials: "include"`
 * - JSON parsing
 * - Error handling
 */
export async function api<T = unknown>(
  path: string,
  init: RequestInit & { query?: Record<string, unknown> } = {}
): Promise<T> {
  const { query, headers, ...rest } = init;
  const url = apiUrl(path, query);

  const res = await fetch(url, {
    credentials: "include",
    headers: { Accept: "application/json", ...(headers || {}) },
    ...rest,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  // handle 204 or empty body
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}
