// app/faq/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import tree from "../../public/images/tree.jpg"; // ✅ import

/* ========= Types ========= */
export type Faq = {
  faq_id: number;
  question: string;
  answer: string;
};

/* ========= Enhanced FAQ Row ========= */
function EnhancedFaqRow({ q, a }: { q: string; a: string }) {
  return (
    <li className="group rounded-2xl bg-zinc-50/80 ring-1 ring-zinc-200 px-5 py-4 sm:px-6 sm:py-5 hover:shadow-md transition">
      <div className="flex items-start gap-4">
        {/* Q badge with new gradient */}
        <span
          className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center 
                     rounded-full text-white text-[13px] font-semibold shadow-sm"
          style={{
            background:
              "linear-gradient(135deg, #F84E33 0%, #890F4C 50%, #0F0200 100%)",
          }}
        >
          Q
        </span>

        {/* Content */}
        <div className="min-w-0">
          <p className="font-semibold italic text-zinc-900 text-[15px] sm:text-[16px] leading-snug">
            {q}
          </p>
          <p className="mt-2 text-zinc-700 text-[14px] sm:text-[15px] leading-relaxed">
            <span className="font-semibold not-italic">A:</span> {a}
          </p>
        </div>
      </div>
    </li>
  );
}

/* ========= Page ========= */
export default function FAQPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [query, setQuery] = useState("");

  // ✅ Centralize API base (env or localhost fallback)
  const apiBase = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  ).replace(/\/+$/, "");

  // Fetch FAQs
  useEffect(() => {
    async function loadFaqs() {
      try {
        const res = await fetch(`${apiBase}/api/faqs`, {
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch FAQs");
        const data = await res.json();
        setFaqs(data.content ?? []);
      } catch (err) {
        console.error("Error fetching FAQs:", err);
      }
    }
    loadFaqs();
  }, [apiBase]);

  // Filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
    );
  }, [query, faqs]);

  return (
    <main className="min-h-screen bg-white">
      {/* TOP TAGLINE */}
      <section className="px-0 mt-12">
        <div className="mx-auto w-full max-w-[1200px] flex justify-center items-center">
          <p className="text-2xl md:text-4xl italic text-gray-900 text-center font-serif tracking-wide">
            Your questions, our answers
          </p>
        </div>
      </section>

      {/* ===== Hero FAQ (edge-to-edge, same image size as Testimonials, image bottom on mobile) ===== */}
      <section
        className="relative w-screen left-1/2 -translate-x-1/2 h-[450px] rounded-[50px] overflow-hidden mt-20"
        style={{
          background:
            "linear-gradient(to right, #F84E33 0%, #890F4C 50%, #0F0200 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-[1200px] h-full flex flex-col md:flex-row items-center justify-center gap-10 px-6 md:px-10">
          {/* LEFT IMAGE -> bottom on mobile */}
          <div className="flex justify-center md:justify-start order-2 md:order-1">
            <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-2">
              <div className="overflow-hidden rounded-xl w-[280px] h-[180px] md:w-[320px] md:h-[320px]">
                <Image
                  src={tree}
                  alt="BlockHead creative artwork"
                  width={350}
                  height={500}
                  quality={100}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <span className="pointer-events-none absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm" />
            </div>
          </div>

          {/* RIGHT CONTENT -> top on mobile */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left text-white gap-4 order-1 md:order-2">
            <h2 className="text-2xl md:text-3xl italic font-bold">FAQ</h2>

            <div
              className="inline-block mb-3 rounded-full px-4 py-1 text-xs md:text-sm text-white font-semibold tracking-wide shadow-sm"
              style={{
                background:
                  "linear-gradient(135deg, #F84E33 0%, #890F4C 50%, #0F0200 100%)",
              }}
            >
              Frequently Asked Questions
            </div>

            <p className="max-w-[500px] italic font-bold text-sm md:text-lg text-white/90 leading-relaxed">
              Find answers to the most common questions about our services,
              pricing, and support. If you can’t find what you’re looking for,
              feel free to reach out — we’re here to help.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ list */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-8 md:mt-10">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-zinc-200 bg-white/90 backdrop-blur-sm shadow-sm">
          {/* Header bar */}
          <div className="flex items-center justify-between gap-4 px-6 sm:px-8 py-4 border-b border-zinc-200 rounded-t-[32px]">
            <h2 className="text-[15px] sm:text-base font-semibold text-zinc-800">
              Frequently Asked Questions
            </h2>
            <span className="inline-flex items-center gap-2 text-xs sm:text-[13px] text-zinc-600">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #F84E33 0%, #890F4C 50%, #0F0200 100%)",
                }}
              />
              {filtered.length} item{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3 border border-zinc-200 rounded-full bg-white px-4 py-2 shadow-sm mx-6 sm:mx-8 mt-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="h-5 w-5 text-zinc-500"
            >
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <path d="M20 20l-3.5-3.5" strokeWidth="2" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search question..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
          </div>

          {/* List */}
          <ul className="px-6 sm:px-8 py-6 sm:py-8 flex flex-col gap-4 sm:gap-5">
            {filtered.map((f) => (
              <EnhancedFaqRow key={f.faq_id} q={f.question} a={f.answer} />
            ))}

            {filtered.length === 0 && (
              <li className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500">
                No results. Try a different keyword.
              </li>
            )}
          </ul>
        </div>

        {/* Contact prompt */}
        <div className="mx-auto mt-12 max-w-2xl">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-8 text-center shadow-sm">
            <h3 className="text-base font-semibold text-zinc-800 mb-2">
              Still have questions?
            </h3>
            <p className="text-sm text-zinc-600 mb-4">
              We’re here to help you get the answers you need.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg px-6 py-2 text-sm font-semibold text-white shadow transition"
              style={{
                background:
                  "linear-gradient(135deg, #F84E33 0%, #890F4C 50%, #0F0200 100%)",
              }}
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
