// lib/fetchWithCsrf.ts
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/** Read the XSRF-TOKEN cookie emitted by Spring */
function getCsrfCookie(): string | null {
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Hit a public GET (NOT CSRF-ignored) to force Spring to write the XSRF-TOKEN cookie */
async function primeCsrfCookie(): Promise<void> {
  await fetch(`${API}/api/services?ts=${Date.now()}`, {
    credentials: "include",
    cache: "no-store",
  }).catch(() => {});
}

/** Add CSRF header when method is mutating */
function needsCsrf(method?: string) {
  const m = (method ?? "GET").toUpperCase();
  return m !== "GET" && m !== "HEAD" && m !== "OPTIONS";
}

/**
 * Fetch that guarantees CSRF header on mutating calls.
 * - Ensures cookie exists.
 * - Sends X-XSRF-TOKEN header.
 * - Retries once on 403 in case the token rotated.
 */
export async function fetchWithCsrf(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  // Always include cookies
  init.credentials = "include";
  init.cache = init.cache ?? "no-store";

  if (needsCsrf(init.method)) {
    let token = getCsrfCookie();
    if (!token) {
      await primeCsrfCookie();
      // allow the cookie to settle in this tick
      await Promise.resolve();
      token = getCsrfCookie();
    }
    init.headers = {
      ...(init.headers || {}),
      "X-XSRF-TOKEN": token ?? "",
    };
  }

  const res = await fetch(input, init);

  // Optional: retry once on 403 if CSRF might have rotated (e.g., new session)
  if (res.status === 403 && needsCsrf(init.method)) {
    await primeCsrfCookie();
    const token = getCsrfCookie() ?? "";
    const retryInit: RequestInit = {
      ...init,
      headers: { ...(init.headers || {}), "X-XSRF-TOKEN": token },
    };
    return fetch(input, retryInit);
  }

  return res;
}
