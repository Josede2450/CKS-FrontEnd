// lib/auth.ts
export async function fetchMe() {
  const res = await fetch("/api/auth/me", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return { authenticated: false } as const;
  return res.json();
}
