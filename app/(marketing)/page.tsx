"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion"; // ⬅️ animations

// Images
import heroPic from "../public/images/HomeAbstract1.jpg";
import heroSignature from "../public/images/HeroSignature.svg";
import cksLogoWhite from "../public/images/CKS-WHITE.png";

// UI
import ServiceCard from "../components/ui/ServiceCard";
import ServiceModal from "../components/ui/ServiceModal";

type CategoryMini = { name?: string; slug?: string };

type Svc = {
  service_id?: number;
  serviceId?: number;
  id?: number;
  slug?: string | null;
  title?: string;
  summary?: string | null;
  description?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;

  // popularity flags (various shapes)
  mostPopular?: boolean;
  most_popular?: boolean | 0 | 1;
  popular?: boolean | 0 | 1;
  featured?: boolean | 0 | 1;

  // tag-like
  tag?: string | null;
  badge?: string | null;
  label?: string | null;

  categories?: CategoryMini[];

  // optional extras used by modal
  priceRange?: string | null;
  price_range?: string | null;
  duration?: string | null;
};

interface ViewUser {
  id: number;
  firstName: string;
  lastName: string;
  pictureUrl?: string;
}

interface ViewTestimonial {
  id: number;
  quote: string;
  createdAt: string;
  favorite: boolean;
  user?: ViewUser;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// tolerant helpers
const getId = (s: Svc) => s.service_id ?? s.serviceId ?? s.id ?? 0;
const getImg = (s: Svc) => s.imageUrl ?? s.image_url ?? undefined;
const isPopular = (s: Svc) => {
  const yesNo = (v: any) => (typeof v === "number" ? v === 1 : Boolean(v));
  return (
    yesNo(s.mostPopular) ||
    yesNo(s.most_popular) ||
    yesNo(s.popular) ||
    yesNo(s.featured)
  );
};

export default function HomePage() {
  // ===== Testimonials (existing) =====
  const [favorites, setFavorites] = useState<ViewTestimonial[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    async function loadFavorites() {
      try {
        const res = await fetch(
          `${API}/api/testimonials?favorite=true&sort=createdAt,desc`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Failed to fetch testimonials");
        const json = await res.json();
        setFavorites(json.content || []);
      } catch (e) {
        console.error(e);
        setFavorites([]);
      }
    }
    loadFavorites();
  }, []);

  function next() {
    setIndex((i) => (i + 1) % (favorites.length || 1));
  }
  function prev() {
    setIndex(
      (i) => (i - 1 + (favorites.length || 1)) % (favorites.length || 1)
    );
  }

  const current = favorites[index];

  // animation helpers for testimonials
  const [direction, setDirection] = useState(1); // 1 = next/right, -1 = prev/left
  const onPrev = () => {
    setDirection(-1);
    prev();
  };
  const onNext = () => {
    setDirection(1);
    next();
  };

  const cardVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98,
    }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, scale: 0.98 }),
  };

  // ===== Popular Services (new inline replacement) =====
  const [svcLoading, setSvcLoading] = useState(true);
  const [svcErr, setSvcErr] = useState<string | null>(null);
  const [services, setServices] = useState<Svc[]>([]);

  // Quick view modal state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<null | {
    id: number;
    title: string;
    description: string;
    image_url?: string;
    summary?: string;
    priceRange?: string | null;
    duration?: string | null;
    // popularity for badge in modal image
    mostPopular?: boolean | 0 | 1;
    most_popular?: boolean | 0 | 1;
    popular?: boolean | 0 | 1;
    featured?: boolean | 0 | 1;
  }>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setSvcLoading(true);
        setSvcErr(null);

        // Ask backend for popular; still filter client-side in case it's ignored.
        const res = await fetch(`${API}/api/services?size=24&popular=true`, {
          credentials: "include",
        });
        if (!res.ok)
          throw new Error((await res.text()) || `Failed ${res.status}`);

        const raw = await res.json();
        const list: Svc[] = Array.isArray(raw) ? raw : raw?.content ?? [];
        if (!cancelled) setServices(list);
      } catch (e: any) {
        if (!cancelled) setSvcErr(e?.message ?? "Failed to load services");
      } finally {
        if (!cancelled) setSvcLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const popularOnly = useMemo(() => services.filter(isPopular), [services]);

  async function openModal(s: Svc) {
    const id = getId(s);
    try {
      const res = await fetch(`${API}/api/services/${id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const full = (await res.json()) as Svc;
        setSelected({
          id,
          title: full.title ?? s.title ?? "",
          description: full.description ?? s.description ?? "",
          image_url: full.image_url ?? full.imageUrl ?? getImg(s),
          summary: full.summary ?? s.summary ?? "",
          priceRange:
            full.priceRange ??
            full.price_range ??
            s.priceRange ??
            s.price_range ??
            null,
          duration: full.duration ?? s.duration ?? null,
          mostPopular: full.mostPopular ?? s.mostPopular,
          most_popular: full.most_popular ?? s.most_popular,
          popular: full.popular ?? s.popular,
          featured: full.featured ?? s.featured,
        });
      } else {
        setSelected({
          id,
          title: s.title ?? "",
          description: s.description ?? "",
          image_url: getImg(s),
          summary: s.summary ?? "",
          priceRange: s.priceRange ?? s.price_range ?? null,
          duration: s.duration ?? null,
          mostPopular: s.mostPopular,
          most_popular: s.most_popular,
          popular: s.popular,
          featured: s.featured,
        });
      }
    } catch {
      setSelected({
        id,
        title: s.title ?? "",
        description: s.description ?? "",
        image_url: getImg(s),
        summary: s.summary ?? "",
        priceRange: s.priceRange ?? s.price_range ?? null,
        duration: s.duration ?? null,
        mostPopular: s.mostPopular,
        most_popular: s.most_popular,
        popular: s.popular,
        featured: s.featured,
      });
    } finally {
      setOpen(true);
    }
  }

  return (
    <main className="bg-white overflow-x-clip">
      {/* clears fixed navbar */}
      <div className="h-12 md:h-16" />

      {/* TOP TAGLINE */}
      <section className="px-0">
        <div
          className="
      mx-auto w-full max-w-[1200px]
      flex flex-col md:flex-row
      items-center
      gap-6 md:gap-12
      justify-center text-center
    "
        >
          <p className="text-2xl md:text-4xl text-gray-900 italic">
            We make it possible
          </p>
          <div className="w-28 md:w-56">
            <Image
              src={heroSignature}
              alt="Signature brush"
              width={220}
              height={220}
              className="object-contain mx-auto"
              priority
            />
          </div>
        </div>
      </section>

      {/* HERO PILL */}
      <section
        className="w-full rounded-[50px]"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.9) 0%, #2C8B7E 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-[1200px] px-5 md:px-10 py-10 md:h-[550px] flex flex-col justify-center">
          {/* Mobile layout */}
          <div className="md:hidden flex flex-col items-center text-center gap-4 text-white">
            <Image
              src={cksLogoWhite}
              alt="CKS logo"
              width={180}
              height={60}
              className="h-auto w-[150px]"
              priority
            />

            {/* Tagline pill */}
            <div
              className="inline-block mb-3 rounded-full bg-white/10 
             px-4 py-1 text-xs md:text-sm text-white font-semibold 
             tracking-wide ring-1 ring-white/25"
            >
              Built for scale
            </div>

            <p className="italic text-[22px]">
              Creativity, Knowledge & Software
            </p>

            <p className="italic text-[20px] leading-relaxed max-w-[320px]">
              CKS is a modern web development company dedicated to creating
              high-quality, user-focused digital solutions—with reliable IT
              support.
            </p>

            {/* Glass picture container + single bubble */}
            <div className="relative rounded-2xl p-2 bg-white/10 backdrop-blur-md shadow-lg">
              <Image
                src={heroPic}
                alt="CKS creative technology"
                width={320}
                height={420}
                quality={100}
                className="rounded-xl object-cover w-[260px] h-auto"
                priority
              />
              <span
                className="pointer-events-none absolute -bottom-3 -right-3 w-10 h-10 rounded-full 
                         bg-white/20 border border-white/30 backdrop-blur-sm"
              />
            </div>

            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-[14px] px-6 py-2.5
                   bg-white text-[#052C48] font-medium shadow
                   hover:bg-white/90 transition text-[14px]"
            >
              About Us
            </Link>
          </div>

          {/* Desktop layout */}
          <div className="hidden md:grid grid-cols-2 gap-10 h-full">
            <div className="flex items-start justify-center">
              {/* Glass picture container + single bubble */}
              <div className="relative rounded-2xl p-3 bg-white/10 backdrop-blur-md shadow-xl">
                <Image
                  src={heroPic}
                  alt="CKS creative technology"
                  width={350}
                  height={500}
                  quality={100}
                  className="rounded-xl object-contain"
                  priority
                />
                <span
                  className="pointer-events-none absolute -bottom-4 -right-4 w-10 h-10 rounded-full 
                           bg-white/20 border border-white/30 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="flex flex-col items-center text-center text-white self-start mt-4">
              <Image
                src={cksLogoWhite}
                alt="CKS logo"
                width={180}
                height={60}
                className="mb-4 h-auto w-[150px]"
                priority
              />

              {/* Tagline pill */}
              <div
                className="mb-3 inline-flex items-center rounded-full px-4 py-1.5
                        bg-white/10 text-white text-sm font-medium
                        border border-white/40 backdrop-blur-sm shadow-sm"
              >
                Built for scale
              </div>

              <p className="text-base md:text-[26px] italic leading-relaxed font-semibold mb-3">
                Creativity, Knowledge & Software
              </p>
              <p className="text-base md:text-[22px] italic leading-relaxed font-semibold mb-5 max-w-[550px]">
                CKS is a modern web development company dedicated to creating
                high-quality, user-focused digital solutions—with reliable IT
                support.
              </p>

              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-[14px] px-6 py-2.5
                     bg-white text-[#052C48] font-medium shadow
                     hover:bg-white/90 transition"
              >
                About Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES + MOST POPULAR (now inline using ServiceCard) ===== */}
      <section
        className="w-full rounded-[50px] mt-12 md:mt-16 overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#F5F5F5 0%, #0B1F2F 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10 py-12 md:py-16">
          {/* Header */}
          <div className="mx-auto w-full max-w-[900px] text-center">
            <h2 className="italic text-[28px] sm:text-[36px] text-gray-900">
              Services
            </h2>
            <p className="mt-3 text-[18px] sm:text-[20px] italic leading-relaxed font-semibold text-slate-700">
              At CKS, we provide end-to-end web development and reliable IT
              support to help businesses succeed in the digital world.
            </p>
            <div className="mx-auto mt-5 h-[3px] w-24 rounded-full bg-[linear-gradient(140deg,#2BD879_0%,#052C48_100%)]" />
          </div>

          <div className="mt-8 rounded-[28px] bg-white/85 backdrop-blur-sm ring-1 ring-black/5 shadow-sm p-4 sm:p-6 md:p-8">
            {svcLoading && (
              <div className="py-10 text-center text-gray-500">Loading…</div>
            )}
            {svcErr && (
              <div className="py-10 text-center text-red-600">{svcErr}</div>
            )}
            {!svcLoading && !svcErr && popularOnly.length === 0 && (
              <div className="py-10 text-center text-gray-500">
                No popular services yet.
              </div>
            )}

            {!svcLoading && !svcErr && popularOnly.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 text-center">
                  {popularOnly.slice(0, 6).map((s) => {
                    const id = getId(s);
                    return (
                      <ServiceCard
                        key={id}
                        title={s.title ?? "—"}
                        summary={s.summary ?? undefined}
                        description={s.description ?? undefined}
                        imageSrc={getImg(s)}
                        href={`/services/${s.slug ?? id}`}
                        categories={s.categories ?? []}
                        popular={true}
                        onLearnMore={() => openModal(s)}
                      />
                    );
                  })}
                </div>

                <div className="flex justify-center mt-10">
                  <Link
                    href="/services"
                    className="inline-flex items-center justify-center rounded-[14px] px-12 py-2.5 
                      bg-[#1E293B] text-white text-sm font-medium shadow-[0_4px_6px_rgba(0,0,0,0.3)] 
                      hover:bg-[#0f172a] transition"
                  >
                    Services
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section
        className="w-full mt-14 md:mt-16 mb-16 relative rounded-[50px] overflow-hidden"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.9) 0%, #2C8B7E 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-[1100px] py-12 px-6 md:px-10 flex flex-col items-center text-center gap-8 text-white">
          {/* Heading */}
          <h3 className="italic text-white text-[28px] md:text-[34px]">
            What our clients say
          </h3>

          {current ? (
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current.id ?? index}
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                className="w-full max-w-3xl rounded-[28px] px-8 py-10 flex flex-col items-center gap-6
                     bg-white/10 backdrop-blur-md shadow-xl border border-white/20"
              >
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 border border-white/30">
                  <img
                    src={
                      current.user?.pictureUrl ||
                      "/images/avatar-placeholder.png"
                    }
                    alt="Client avatar"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Quote */}
                <blockquote className="text-white/90 italic text-lg leading-relaxed max-w-xl">
                  {current.quote}
                </blockquote>

                {/* Author */}
                <footer className="text-sm text-white/70">
                  —{" "}
                  <b>{`${current.user?.firstName || ""} ${
                    current.user?.lastName || ""
                  }`}</b>
                </footer>

                {/* Controls */}
                {favorites.length > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      className="px-3 py-2 rounded-full bg-white/10 border border-white/30 text-white hover:bg-white/20"
                      onClick={() => {
                        setDirection(-1);
                        prev();
                      }}
                    >
                      ← Prev
                    </motion.button>
                    <span className="text-white/70 text-sm">
                      {index + 1} / {favorites.length}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      className="px-3 py-2 rounded-full bg-white/10 border border-white/30 text-white hover:bg-white/20"
                      onClick={() => {
                        setDirection(1);
                        next();
                      }}
                    >
                      Next →
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <p className="text-white/80 italic">
              No favorite testimonials yet.
            </p>
          )}

          {/* CTA */}
          <Link
            href="/testimonials"
            className="inline-flex items-center justify-center 
                rounded-[14px] px-12 py-2.5 
                bg-white text-[#052C48] text-[14px] font-medium
                shadow hover:bg-white/90 transition"
          >
            Testimonials
          </Link>
        </div>
      </section>

      {/* Quick view modal */}
      <ServiceModal
        open={open}
        onClose={() => setOpen(false)}
        service={selected}
      />
    </main>
  );
}
