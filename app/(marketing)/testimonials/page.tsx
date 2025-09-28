// app/testimonials/page.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useCallback } from "react";

// Images
import heroSignature from "../../public/images/HeroSignature.svg";
import blockHead from "../../public/images/BlockHead.jpg"; // ✅ added import

// Final-guard default (your backend already provides a default)
const DEFAULT_PFP =
  "https://i.pinimg.com/736x/27/5f/99/275f99923b080b18e7b474ed6155a17f.jpg";

// Types reflecting your API
type ApiUser = {
  userId?: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  avatarUrl?: string;
  photoUrl?: string;
  imageUrl?: string;
  pictureUrl?: string; // backend-computed preferred URL
};

type ApiTestimonial = {
  testimonialId?: number;
  content?: string;
  quote?: string;
  createdAt: string | null;
  user?: ApiUser | null;
};

type Page<T> = {
  content: T[];
  number: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
};

type ViewTestimonial = {
  id?: number;
  quote: string;
  author?: string;
  role?: string;
  avatar_url: string;
};

export default function TestimonialsPage() {
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

  const [items, setItems] = useState<ViewTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  // Normalize API -> view model
  function normalize(api: ApiTestimonial | undefined): ViewTestimonial | null {
    if (!api) return null;

    const u = api.user || undefined;
    const author =
      u?.name ??
      (u?.firstName || u?.lastName
        ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
        : undefined);

    const role = u?.title ?? undefined;

    const avatar_url =
      u?.pictureUrl ||
      u?.avatarUrl ||
      u?.photoUrl ||
      u?.imageUrl ||
      DEFAULT_PFP;

    const text =
      typeof api.quote === "string" && api.quote.length > 0
        ? api.quote
        : api.content ?? "";

    return {
      id: api.testimonialId,
      quote: text,
      author,
      role,
      avatar_url,
    };
  }

  // Safe parse JSON
  function safeParsePage(raw: string): Page<ApiTestimonial> {
    let cleaned = raw.replace(/^\)\]\}',?\s*/, "").trim();
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first === -1 || last === -1 || last <= first) {
      throw new Error(
        `Response is not valid JSON. First 200 chars: ${cleaned.slice(0, 200)}`
      );
    }
    cleaned = cleaned.slice(first, last + 1);
    return JSON.parse(cleaned) as Page<ApiTestimonial>;
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const url = new URL(`${API}/api/testimonials`);
        url.searchParams.set("size", "50");
        url.searchParams.set("sort", "createdAt,desc");

        const res = await fetch(url.toString(), {
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        const raw = await res.text();
        if (!res.ok) {
          throw new Error(
            `${res.status} ${res.statusText}: ${raw.slice(0, 300)}`
          );
        }

        const data = safeParsePage(raw);
        const list = (data.content || [])
          .map(normalize)
          .filter(Boolean) as ViewTestimonial[];

        if (!cancelled) {
          setItems(list);
          setIdx(0);
        }
      } catch (e: any) {
        if (!cancelled)
          setErr(
            `${
              e?.message ?? "Failed to load testimonials"
            } — check NEXT_PUBLIC_API_URL and your /api/testimonials endpoint.`
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [API]);

  const current = useMemo(
    () =>
      items.length
        ? items[((idx % items.length) + items.length) % items.length]
        : null,
    [items, idx]
  );

  const go = useCallback(
    (dir: 1 | -1) => {
      if (!items.length) return;
      setFading(true);
      setTimeout(() => {
        setIdx((i) => (i + dir + items.length) % items.length);
        setTimeout(() => setFading(false), 10);
      }, 180);
    },
    [items.length]
  );

  const prev = useCallback(() => go(-1), [go]);
  const next = useCallback(() => go(1), [go]);

  useEffect(() => {
    if (!items.length) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length, prev, next]);

  return (
    // ⬇️ Prevent horizontal scrollbar from edge-to-edge hero
    <main className="bg-white overflow-x-clip mt-12 px-4">
      {/* TOP TAGLINE */}
      <section className="px-0">
        <div className="mx-auto w-full max-w-[1200px] flex justify-center items-center">
          <p className="text-2xl md:text-4xl italic text-gray-900 text-center font-serif tracking-wide">
            Excellence through creativity
          </p>
        </div>
      </section>

      {/* ===== Hero Testimonials (edge-to-edge, gold gradient, centered BlockHead crystal) ===== */}
      <section
        className="relative w-screen left-1/2 -translate-x-1/2 h-[450px] rounded-[50px] overflow-hidden mt-20"
        style={{
          background:
            "linear-gradient(to right, #C78B3B 0%, #E8C877 25%, #FCEBA4 50%, #E8C877 75%, #C78B3B 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-[1200px] h-full flex flex-col md:flex-row items-center justify-center gap-10 px-6 md:px-10">
          {/* LEFT CONTENT (centered) */}
          <div className="flex flex-col items-center text-center text-black gap-4">
            <h2 className="text-2xl md:text-3xl italic font-bold">
              Testimonials
            </h2>

            <div
              className="inline-block mb-3 rounded-full bg-black/10 
       px-4 py-1 text-xs md:text-sm text-black font-semibold 
       tracking-wide ring-1 ring-black/25"
            >
              Opinions matter
            </div>
            <p className="max-w-[500px] italic font-bold text-sm md:text-lg text-black/90 leading-relaxed">
              At CKS, we value every client voice. These testimonials highlight
              the trust, creativity, and partnerships that drive us forward —
              because your opinion truly matters to us.
            </p>
          </div>

          {/* RIGHT IMAGE (smaller crystal style) */}
          <div className="flex justify-center">
            <div className="relative bg-black/10 backdrop-blur-md border border-black/30 rounded-2xl shadow-xl p-2">
              <div className="overflow-hidden rounded-xl w-[280px] h-[180px] md:w-[320px] md:h-[320px]">
                <Image
                  src={blockHead}
                  alt="BlockHead creative artwork"
                  width={350}
                  height={500}
                  quality={100}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <span className="pointer-events-none absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-black/20 border border-black/30 backdrop-blur-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-6 md:h-10" />

      {/* ===== Carousel (one by one) ===== */}
      <section className="mx-auto w-full max-w-[1200px] px-3 md:px-20">
        <div
          className="rounded-[28px] md:rounded-[36px] p-5 md:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-black/5"
          style={{
            background:
              "linear-gradient(to right, #C78B3B 0%, #E8C877 25%, #FCEBA4 50%, #E8C877 75%, #C78B3B 100%)",
          }}
        >
          <div className="relative rounded-[28px] px-5 md:px-10 py-8 md:py-10 max-w-[980px] mx-auto bg-white backdrop-blur-sm shadow-sm ring-1 ring-black/5">
            {loading && (
              <p className="text-center text-sm text-gray-700">Loading…</p>
            )}
            {err && <p className="text-center text-red-600 text-sm">{err}</p>}

            {!loading && !err && current && (
              <>
                {/* Content */}
                <div
                  className={`transition-opacity duration-200 ${
                    fading ? "opacity-0" : "opacity-100"
                  }`}
                  aria-live="polite"
                >
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-8">
                    {/* Avatar with crystal gold style */}
                    <div className="shrink-0">
                      <div className="relative">
                        <div
                          className="w-[96px] h-[96px] md:w-[112px] md:h-[112px] rounded-full overflow-hidden shadow-xl p-[3px]
                 bg-gradient-to-r from-[#C78B3B] via-[#FCEBA4] to-[#C78B3B]
                 backdrop-blur-md"
                        >
                          <div className="w-full h-full rounded-full overflow-hidden bg-white/10 border border-white/30">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={current.avatar_url}
                              alt={current.author ?? "Client photo"}
                              className="w-full h-full object-cover rounded-full"
                              loading="lazy"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quote + author */}
                    <div className="flex-1 text-center md:text-left">
                      <div className="mx-auto md:mx-0 w-10 h-10 rounded-full grid place-items-center bg-gray-100 text-gray-500 mb-3">
                        {/* quote icon */}
                        <svg
                          viewBox="0 0 24 24"
                          className="w-5 h-5"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M7.2 11.4C7 9.5 8 7.7 9.7 6.8L9 5C6.2 6.3 4.6 9.2 5 12h4.5c.3 0 .5-.2.5-.6v-.1c0-.5-.3-.9-.8-.9H7.2zm8 0c-.2-1.9.8-3.7 2.5-4.6L17 5c-2.8 1.3-4.4 4.2-4 7h4.5c.3 0 .5-.2.5-.6v-.1c0-.5-.3-.9-.8-.9H15.2z" />
                        </svg>
                      </div>

                      <blockquote className="text-[15px] md:text-[18px] text-gray-800 leading-relaxed italic whitespace-pre-line">
                        {current.quote}
                      </blockquote>

                      {(current.author || current.role) && (
                        <div className="mt-4 text-[13px] md:text-sm text-gray-600">
                          —{" "}
                          <span className="font-medium text-gray-800">
                            {current.author ?? "Anonymous"}
                          </span>
                          {current.role ? `, ${current.role}` : null}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                {items.length > 1 && (
                  <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={prev}
                        className="rounded-full border border-gray-400 px-4 py-2 text-xs md:text-sm hover:bg-white/70 active:scale-95 shadow-sm bg-white"
                        aria-label="Previous testimonial"
                      >
                        ← Prev
                      </button>
                      <span className="text-[12px] text-gray-700 select-none">
                        {idx + 1} / {items.length}
                      </span>
                      <button
                        onClick={next}
                        className="rounded-full border border-gray-400 px-4 py-2 text-xs md:text-sm hover:bg-white/70 active:scale-95 shadow-sm bg-white"
                        aria-label="Next testimonial"
                      >
                        Next →
                      </button>
                    </div>

                    {/* Dots */}
                    <div className="flex items-center gap-2">
                      {items.map((_, i) => (
                        <span
                          key={i}
                          className={`h-2 w-2 rounded-full transition ${
                            i === idx ? "bg-gray-800" : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!loading && !err && !current && (
              <p className="text-center text-sm text-gray-700">
                No testimonials found yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
