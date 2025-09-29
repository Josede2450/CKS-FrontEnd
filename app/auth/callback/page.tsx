"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchWithCsrf } from "../../lib/fetchWithCsrf";

function AuthCallbackInner() {
  const router = useRouter();
  const search = useSearchParams();
  const apiBase = process.env.NEXT_PUBLIC_API_URL!;

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        const me = await fetchWithCsrf(`${apiBase}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
          signal: ac.signal,
          headers: { Accept: "application/json" },
        });

        const nextUrl = search?.get("next") || "/dashboard";
        router.replace(me.ok ? nextUrl : "/login?error=oauth");
      } catch {
        router.replace("/login?error=oauth");
      }
    })();

    return () => ac.abort();
  }, [router, search, apiBase]);

  return <p className="p-6 text-sm text-gray-600">Signing you in…</p>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-gray-600">Loading…</p>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
