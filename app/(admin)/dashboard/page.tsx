// app/(admin)/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// Keep imports consistent (relative paths)
import ContactMessages from "../../components/admin/ContactMessages";
import ServicesManager from "../../components/admin/ServicesManager";
import TestimonialsManager from "../../components/admin/TestimonialsManager";
import UsersManager from "../../components/admin/UsersManager";
import FaqManager from "../../components/admin/FaqManager";
import CategoryManager from "../../components/admin/CategoryManager";

// ✅ CSRF-aware wrapper (relative import, no aliases)
import { fetchWithCsrf } from "../../lib/fetchWithCsrf";

type Me = {
  authenticated: boolean;
  role?: string;
  roles?: string[];
  firstName?: string;
  lastName?: string | null;
};

// Centralized API base (no need to pass down anymore)
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function DashboardPage() {
  const router = useRouter();

  const [me, setMe] = useState<Me | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        // 1) Prime CSRF cookie with a public GET
        await fetch(`${API}/api/services?ts=${Date.now()}`, {
          credentials: "include",
          cache: "no-store",
          signal: ac.signal,
        });

        // 2) Check current user
        const res = await fetch(`${API}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: ac.signal,
        });

        if (res.status === 401 || res.status === 403) {
          router.replace("/login");
          return;
        }
        if (!res.ok) {
          router.replace("/login");
          return;
        }

        const data = (await res.json()) as Me;
        const rolesSet = new Set(
          [data.role, ...(data.roles ?? [])].filter(Boolean) as string[]
        );

        const isAdmin = [...rolesSet].some(
          (r) => r?.toUpperCase().replace(/^ROLE_/, "") === "ADMIN"
        );

        if (!isAdmin) {
          router.replace("/");
          return;
        }

        setMe(data);
      } catch {
        if (!ac.signal.aborted) {
          router.replace("/login");
        }
      } finally {
        if (!ac.signal.aborted) setAuthLoading(false);
      }
    })();

    return () => ac.abort();
  }, [router]);

  const heading = useMemo(
    () => (me?.firstName ? `Admin dashboard` : "Admin dashboard"),
    [me]
  );

  if (authLoading) {
    return (
      <main className="mx-auto max-w-[1200px] px-4 py-12">
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="bg-white">
      <section className="mx-auto w-full max-w-[1100px] px-4 md:px-6 py-8 md:py-10">
        <h1 className="text-center text-2xl md:text-3xl italic mb-8">
          {heading}
        </h1>

        {/* Contact Messages */}
        <ContactMessages pageSize={8} />

        <div className="h-12" />

        {/* Categories Manager */}
        <CategoryManager pageSize={10} />

        <div className="h-12" />

        {/* Services Manager */}
        <ServicesManager pageSize={8} pollMs={15000} />

        <div className="h-12" />

        {/* Testimonials Manager */}
        <TestimonialsManager pageSize={8} pollMs={15000} />

        <div className="h-12" />

        {/* Users Manager */}
        <UsersManager pageSize={8} pollMs={15000} />

        <div className="h-12" />

        {/* FAQs Manager */}
        <FaqManager pageSize={8} />
      </section>

      <div className="h-16 md:h-24" />
    </main>
  );
}
