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
import CategoryManager from "../../components/admin/CategoryManager"; // ✅ NEW

type Me = {
  authenticated: boolean;
  role?: string;
  roles?: string[];
  firstName?: string;
  lastName?: string | null;
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function DashboardPage() {
  const router = useRouter();

  const [me, setMe] = useState<Me | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ---- check admin ----
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          credentials: "include",
        });
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = (await res.json()) as Me;
        const roles = new Set(
          [data.role, ...(data.roles ?? [])].filter(Boolean) as string[]
        );
        if (![...roles].some((r) => r?.toUpperCase().includes("ADMIN"))) {
          router.replace("/");
          return;
        }
        setMe(data);
      } finally {
        setAuthLoading(false);
      }
    })();
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
        <ContactMessages apiBase={API} pageSize={8} />

        <div className="h-12" />

        {/* Categories Manager (NEW) */}
        <CategoryManager apiBase={API} pageSize={10} />

        <div className="h-12" />

        {/* Services Manager */}
        <ServicesManager apiBase={API} pageSize={8} pollMs={15000} />

        <div className="h-12" />

        {/* Testimonials Manager */}
        <TestimonialsManager apiBase={API} pageSize={8} pollMs={15000} />

        <div className="h-12" />

        {/* Users Manager */}
        <UsersManager apiBase={API} pageSize={8} pollMs={15000} />

        <div className="h-12" />

        {/* FAQs Manager (no pollMs prop) */}
        <FaqManager apiBase={API} pageSize={8} />
      </section>

      <div className="h-16 md:h-24" />
    </main>
  );
}
