"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Cookie must be first-party → we call our own /api/ path (rewritten to backend)
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        // You could store the user in some global state here if you have one
        router.replace("/dashboard");
      } else {
        router.replace("/login?error=oauth");
      }
    })();
  }, [router]);

  return <p className="p-6 text-sm text-gray-600">Signing you in…</p>;
}
