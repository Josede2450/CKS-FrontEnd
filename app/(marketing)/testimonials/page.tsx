"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useCallback } from "react";
import heroSignature from "../../public/images/HeroSignature.svg";
import blockHead from "../../public/images/BlockHead.jpg";

// Default fallback if testimonial has no image
const DEFAULT_IMG =
  "https://i.pinimg.com/736x/27/5f/99/275f99923b080b18e7b474ed6155a17f.jpg";

type ApiTestimonial = {
  id?: number;
  quote?: string;
  content?: string;
  createdAt?: string | null;
  favorite?: boolean;
  imgUrl?: string | null;
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

export default function TestimonialsPage() {
  const [items, setItems] = useState<ApiTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

  // ✅ Fetch testimonials
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const url = `${apiBase}/api/testimonials?favorite=true&sort=createdAt,desc`;
        const res = await fetch(url, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error(`Failed ${res.status}`);

        const data = (await res.json()) as Page<ApiTestimonial>;
        const list = (data.content ?? []).map((t) => ({
          id: t.id ?? 0,
          quote: t.quote ?? t.content ?? "",
          createdAt: t.createdAt ?? null,
          imgUrl: t.imgUrl ?? DEFAULT_IMG,
        }));

        if (!cancelled) {
          setItems(list);
          setIdx(0);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to load testimonials");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiBase]);

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

  // Keyboard navigation
  useEffect(() => {
    if (!items.length) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length, prev, next]);

  /* ================== UI ================== */

  return (
    <main className="bg-white overflow-x-clip mt-12 px-4">
      {/* TOP TAGLINE */}
      <section>
        <div className="mx-auto w-full max-w-[1200px] flex justify-center items-center">
          <p className="text-2xl md:text-4xl italic text-gray-900 text-center font-serif tracking-wide">
            Excellence through creativity
          </p>
        </div>
      </section>

      {/* ===== Hero Section ===== */}
      <section
        className="relative w-screen left-1/2 -translate-x-1/2 h-[450px] rounded-[50px] overflow-hidden mt-20"
        style={{
          background:
            "linear-gradient(to right, #C78B3B 0%, #E8C877 25%, #FCEBA4 50%, #E8C877 75%, #C78B3B 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-[1200px] h-full flex flex-col md:flex-row items-center justify-center gap-10 px-6 md:px-10">
          {/* LEFT CONTENT */}
          <div className="flex flex-col items-center text-center text-black gap-4">
            <h2 className="text-2xl md:text-3xl italic font-bold">
              Testimonials
            </h2>

            <div
              className="inline-block mb-3 rounded-full px-4 py-1 text-xs md:text-sm text-white font-semibold tracking-wide shadow-sm"
              style={{
                background:
                  "linear-gradient(135deg, #FFD700 0%, #DAA520 50%, #8B7500 100%)",
              }}
            >
              Opinions matter
            </div>

            <p className="max-w-[500px] italic font-bold text-sm md:text-lg text-black/90 leading-relaxed">
              At CKS, we value every client voice. These testimonials highlight
              the trust, creativity, and partnerships that drive us forward —{" "}
              because your opinion truly matters to us.
            </p>
          </div>

          {/* RIGHT IMAGE */}
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

      {/* ===== Carousel Section ===== */}
      <section className="mx-auto w-full max-w-[1200px] px-3 md:px-20 mt-12">
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
              <div
                className={`transition-opacity duration-200 ${
                  fading ? "opacity-0" : "opacity-100"
                }`}
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-8">
                  {/* Image */}
                  <div className="shrink-0">
                    <div
                      className="w-[110px] h-[110px] md:w-[140px] md:h-[140px] rounded-full overflow-hidden shadow-xl p-[3px]
                       bg-gradient-to-r from-[#C78B3B] via-[#FCEBA4] to-[#C78B3B]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={current.imgUrl ?? DEFAULT_IMG}
                        alt="testimonial visual"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="flex-1 text-center md:text-left">
                    <blockquote className="text-[15px] md:text-[18px] text-gray-800 leading-relaxed italic whitespace-pre-line">
                      {current.quote}
                    </blockquote>

                    <div className="mt-4 text-[13px] md:text-sm text-gray-600">
                      <span className="font-medium text-gray-800">
                        {new Date(current.createdAt ?? "").toLocaleDateString()}
                      </span>
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
                      >
                        ← Prev
                      </button>
                      <span className="text-[12px] text-gray-700 select-none">
                        {idx + 1} / {items.length}
                      </span>
                      <button
                        onClick={next}
                        className="rounded-full border border-gray-400 px-4 py-2 text-xs md:text-sm hover:bg-white/70 active:scale-95 shadow-sm bg-white"
                      >
                        Next →
                      </button>
                    </div>

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
              </div>
            )}

            {!loading && !err && !current && (
              <p className="text-center text-sm text-gray-700">
                No testimonials yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
