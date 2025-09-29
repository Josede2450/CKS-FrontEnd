"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const search = useSearchParams();

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        // 1) Prime CSRF cookie (public GET that passes CsrfFilter)
        //    so subsequent POST/PUT from the app will have XSRF-TOKEN available.
        await fetch("/api/services", {
          credentials: "include",
          cache: "no-store",
          signal: ac.signal,
        }).catch(() => {
          /* ignore */
        });

        // 2) Confirm session is established (same-origin so cookies apply)
        const me = await fetch("/api/auth/me", {
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
