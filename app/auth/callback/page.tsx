"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchWithCsrf } from "../../lib/fetchWithCsrf"; // ✅ reuse wrapper

export default function AuthCallback() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        // ✅ no need to manually prime; wrapper will ensure CSRF token exists
        const me = await fetchWithCsrf("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
          signal: ac.signal,
          headers: { Accept: "application/json" },
        });

        const next = search.get("next") || "/dashboard";
        router.replace(me.ok ? next : "/login?error=oauth");
      } catch {
        router.replace("/login?error=oauth");
      }
    })();

    return () => ac.abort();
  }, [router, search]);

  return <p className="p-6 text-sm text-gray-600">Signing you in…</p>;
}
