// app/services/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import ServiceCard from "../../components/ui/ServiceCard";
import ServiceModal from "../../components/ui/ServiceModal";
import storePic from "../../public/images/store.jpg";
import Image from "next/image";

const CHUNK_SIZE = 9;
const FETCH_SIZE = 100;

// 👇 Use env var if provided, otherwise same-origin
const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";

type CategoryMini = { name?: string; slug?: string };

type Svc = {
  service_id?: number;
  serviceId?: number;
  id?: number;

  title?: string;
  description?: string | null;
  slug?: string | null;
  summary?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;

  mostPopular?: boolean;
  most_popular?: boolean | 0 | 1;
  popular?: boolean | 0 | 1;
  featured?: boolean | 0 | 1;

  tag?: string | null;
  badge?: string | null;
  label?: string | null;

  categories?: CategoryMini[];

  priceRange?: string | null;
  price_range?: string | null;
  duration?: string | null;
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

type Category = {
  category_id?: number;
  categoryId?: number;
  id?: number;
  name?: string;
  slug?: string;
};

// Helpers
const getId = (s: Svc) => s.service_id ?? s.serviceId ?? s.id!;
const getImg = (s: Svc) => s.imageUrl ?? s.image_url ?? undefined;
const getCatId = (c: Category) => c.category_id ?? c.categoryId ?? c.id;

const isPopular = (s: Svc) => {
  const yesNo = (v: any) => (typeof v === "number" ? v === 1 : Boolean(v));
  const direct =
    yesNo(s.mostPopular) ||
    yesNo(s.most_popular) ||
    yesNo(s.popular) ||
    yesNo(s.featured);
  if (direct) return true;
  const keys = ["popular", "featured", "top", "best"];
  const cats = (s.categories ?? []).map((c) =>
    (c.slug ?? c.name ?? "").toLowerCase()
  );
  return cats.some((k) => keys.includes(k));
};

const getPrimaryTag = (s: Svc) => {
  const raw = (s.tag ?? s.badge ?? s.label ?? "").toString().trim();
  return raw || (isPopular(s) ? "Popular" : "");
};

export default function ServicesPage() {
  const [allData, setAllData] = useState<Svc[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const [gridPage, setGridPage] = useState(0);
  const [listPage, setListPage] = useState(0);

  const [cats, setCats] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [catsErr, setCatsErr] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{
    id: number;
    title: string;
    description: string;
    image_url?: string;
    summary?: string;
    priceRange?: string | null;
    duration?: string | null;
    mostPopular?: boolean | 0 | 1;
    most_popular?: boolean | 0 | 1;
    popular?: boolean | 0 | 1;
    featured?: boolean | 0 | 1;
  } | null>(null);

  type SortKey = "popular" | "relevance" | "title_asc" | "title_desc";
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortKey, setSortKey] = useState<SortKey>("popular");

  // Fetch categories
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setCatsLoading(true);
        setCatsErr(null);

        const url = new URL(`${apiBase}/api/categories`);
        url.searchParams.set("page", "0");
        url.searchParams.set("size", "200");
        url.searchParams.set("sort", "name,asc");

        const res = await fetch(url.toString(), { credentials: "include" });
        if (!res.ok)
          throw new Error((await res.text()) || `Failed ${res.status}`);

        const raw = await res.json();
        const list: Category[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.content)
          ? raw.content
          : [];
        if (!cancelled) setCats(list);
      } catch (e: any) {
        if (!cancelled) setCatsErr(e?.message ?? "Failed to load categories");
      } finally {
        if (!cancelled) setCatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch services
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      setGridPage(0);
      setListPage(0);

      try {
        const aggregated: Svc[] = [];
        const MAX_PAGES = 100;
        for (let page = 0; page < MAX_PAGES; page++) {
          const url = new URL(`${apiBase}/api/services`);
          if (q.trim()) url.searchParams.set("q", q.trim());
          if (selectedCategorySlug.trim())
            url.searchParams.set("category", selectedCategorySlug.trim());
          url.searchParams.set("page", String(page));
          url.searchParams.set("size", String(FETCH_SIZE));

          const res = await fetch(url.toString(), { credentials: "include" });
          if (!res.ok)
            throw new Error((await res.text()) || `Failed ${res.status}`);

          const raw = await res.json();
          if (Array.isArray(raw)) {
            aggregated.push(...(raw as Svc[]));
            break;
          }

          const pageObj = raw as Page<Svc>;
          const batch = pageObj.content ?? [];
          aggregated.push(...batch);

          if (
            pageObj.last ||
            (pageObj.totalPages && page + 1 >= pageObj.totalPages) ||
            batch.length < FETCH_SIZE
          )
            break;
        }
        if (!cancelled) setAllData(aggregated);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to load services");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q, selectedCategorySlug]);

  useEffect(() => {
    setGridPage(0);
    setListPage(0);
  }, [sortKey]);

  async function openModal(s: Svc) {
    const id = getId(s);
    try {
      const res = await fetch(`${apiBase}/api/services/${id}`, {
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

  const content: Svc[] = useMemo(() => allData ?? [], [allData]);

  const sortedContent = useMemo(() => {
    if (!content) return [];
    const copy = [...content];
    if (sortKey === "popular") {
      copy.sort((a, b) => {
        const ap = isPopular(a) ? 1 : 0;
        const bp = isPopular(b) ? 1 : 0;
        if (bp - ap !== 0) return bp - ap;
        const at = (a.title ?? "").toLocaleLowerCase();
        const bt = (b.title ?? "").toLocaleLowerCase();
        return at.localeCompare(bt);
      });
      return copy;
    }
    if (sortKey === "title_asc") {
      return copy.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    }
    if (sortKey === "title_desc") {
      return copy.sort((a, b) => (b.title ?? "").localeCompare(a.title ?? ""));
    }
    return copy;
  }, [content, sortKey]);

  const totalGridPages = Math.max(
    1,
    Math.ceil(sortedContent.length / CHUNK_SIZE)
  );
  const gridStart = gridPage * CHUNK_SIZE;
  const gridSlice = sortedContent.slice(gridStart, gridStart + CHUNK_SIZE);
  const onPrevGrid = () => setGridPage((p) => Math.max(0, p - 1));
  const onNextGrid = () =>
    setGridPage((p) => Math.min(p + 1, totalGridPages - 1));

  const totalListPages = totalGridPages;
  const listStart = listPage * CHUNK_SIZE;
  const listSlice = sortedContent.slice(listStart, listStart + CHUNK_SIZE);
  const onPrevList = () => setListPage((p) => Math.max(0, p - 1));
  const onNextList = () =>
    setListPage((p) => Math.min(p + 1, totalListPages - 1));

  const shownCount =
    view === "grid"
      ? Math.min((gridPage + 1) * CHUNK_SIZE, sortedContent.length)
      : Math.min((listPage + 1) * CHUNK_SIZE, sortedContent.length);

  return (
    <main className="bg-white overflow-x-clip mt-12 px-4">
      {/* TOP TAGLINE */}
      <section className="px-0 mt-12">
        <div className="mx-auto w-full max-w-[1200px] flex justify-center items-center">
          <p className="text-2xl md:text-4xl italic text-gray-900 text-center font-serif tracking-wide">
            Services
          </p>
        </div>
      </section>

      {/* ===== Hero Services ===== */}
      <section
        className="relative w-screen left-1/2 -translate-x-1/2 h-[450px] rounded-[50px] overflow-hidden mt-20"
        style={{
          background:
            "linear-gradient(to right, #F84E33 0%, #890F4C 50%, #0F0200 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-[1200px] h-full flex flex-col items-center justify-center text-center text-white gap-4 px-6 md:px-10">
          {/* Image with glass/crystal effect */}
          <div className="p-[6px] rounded-2xl bg-white/10 backdrop-blur-md shadow-lg border border-white/20">
            <Image
              src={storePic}
              alt="CKS Store"
              width={160}
              height={100}
              className="rounded-xl"
            />
          </div>

          {/* Badge */}
          <div
            className="inline-block mb-3 rounded-full px-4 py-1 text-xs md:text-sm text-white font-semibold tracking-wide shadow-sm"
            style={{
              background:
                "linear-gradient(135deg, #F84E33 0%, #890F4C 50%, #0F0200 100%)",
            }}
          >
            What we offer
          </div>

          {/* Text */}
          <p className="max-w-[600px] italic font-bold text-sm md:text-lg text-white/90 leading-relaxed">
            CKS was designed to be a one-stop company for businesses ready to
            grow — offering cutting-edge web development, bold creative design,
            and powerful marketing strategies to bring your vision to life.
          </p>
        </div>
      </section>

      {/* ===== Services Panel ===== */}
      <section className="mx-auto w-full max-w-[1200px] px-4 md:px-8 mt-12">
        <div className="bg-white border border-gray-200/70 rounded-[28px] md:rounded-[40px] shadow-sm">
          {/* Toolbar */}
          <div className="top-0 z-10 px-4 md:px-8 py-4 md:py-6 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 rounded-t-[28px] md:rounded-t-[40px]">
            <div className="flex flex-col gap-4">
              {/* Row 1: Search + Sort + View toggle */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search services (e.g., “web”, “SEO”, “branding”)…"
                    className="w-full rounded-full border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>

                {/* Sort */}
                <select
                  className="w-full sm:w-[200px] rounded-full border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                  onChange={(e) => setSortKey(e.target.value as any)}
                  value={sortKey}
                  title="Sort results"
                >
                  <option value="popular">Sort: Popular first</option>
                  <option value="relevance">Relevance</option>
                  <option value="title_asc">Title A → Z</option>
                  <option value="title_desc">Title Z → A</option>
                </select>

                {/* View toggle */}
                <div className="inline-flex rounded-full border overflow-hidden">
                  <button
                    className={`px-4 py-2 text-sm ${
                      view === "grid"
                        ? "bg-gray-900 text-white"
                        : "bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => setView("grid")}
                    title="Grid view"
                  >
                    Grid
                  </button>
                  <button
                    className={`px-4 py-2 text-sm ${
                      view === "list"
                        ? "bg-gray-900 text-white"
                        : "bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => setView("list")}
                    title="List view"
                  >
                    List
                  </button>
                </div>
              </div>

              {/* Row 2: Category chips */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                <button
                  onClick={() => setSelectedCategorySlug("")}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs md:text-sm ${
                    !selectedCategorySlug
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  All
                </button>

                {cats.map((c) => {
                  const active = selectedCategorySlug === (c.slug ?? "");
                  return (
                    <button
                      key={getCatId(c) ?? c.slug}
                      onClick={() => setSelectedCategorySlug(c.slug ?? "")}
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs md:text-sm ${
                        active
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white hover:bg-gray-50"
                      }`}
                      title={c.name ?? c.slug ?? ""}
                    >
                      {c.name ?? c.slug}
                    </button>
                  );
                })}

                {catsLoading && (
                  <span className="text-xs text-gray-500">
                    Loading categories…
                  </span>
                )}
                {catsErr && (
                  <span className="text-xs text-red-600">{catsErr}</span>
                )}
              </div>
            </div>
          </div>

          {/* Stats / breadcrumbs */}
          <div className="px-4 md:px-8 pt-4 text-xs md:text-sm text-gray-600">
            {loading ? (
              <span>Fetching services…</span>
            ) : err ? (
              <span className="text-red-600">
                {err} — check your /api rewrite and backend.
              </span>
            ) : (
              <span>
                Showing <strong>{shownCount}</strong> of{" "}
                <strong>{sortedContent.length}</strong> result
                {sortedContent.length === 1 ? "" : "s"}
                {selectedCategorySlug ? (
                  <>
                    {" "}
                    in <strong>{selectedCategorySlug}</strong>
                  </>
                ) : null}
                {q ? (
                  <>
                    {" "}
                    for “<strong>{q}</strong>”
                  </>
                ) : null}
              </span>
            )}
          </div>

          {/* Results */}
          <div className="px-4 md:px-8 py-6 md:py-8">
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-2xl border p-4">
                    <div className="h-40 rounded-xl bg-gray-200" />
                    <div className="mt-4 h-4 w-2/3 bg-gray-200 rounded" />
                    <div className="mt-2 h-3 w-full bg-gray-200 rounded" />
                    <div className="mt-2 h-3 w-5/6 bg-gray-200 rounded" />
                    <div className="mt-4 flex gap-2">
                      <div className="h-6 w-16 bg-gray-200 rounded-full" />
                      <div className="h-6 w-20 bg-gray-200 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {err && !loading && (
              <div className="text-center text-red-600 py-8">
                {err} — try refreshing.
              </div>
            )}

            {!loading && !err && sortedContent.length === 0 && (
              <div className="text-center py-16">
                <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-3xl">
                  😶‍🌫️
                </div>
                <h4 className="mt-6 text-lg font-semibold">
                  No services found
                </h4>
                <p className="text-gray-600 text-sm mt-1">
                  Try clearing filters or adjusting your search.
                </p>
                <button
                  className="mt-5 rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => {
                    setQ("");
                    setSelectedCategorySlug("");
                  }}
                >
                  Reset filters
                </button>
              </div>
            )}

            {!loading && !err && sortedContent.length > 0 && (
              <>
                {/* Grid view */}
                {view === "grid" && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                      {gridSlice.map((s) => {
                        const id = getId(s);
                        return (
                          <div key={id}>
                            <ServiceCard
                              title={s.title ?? "—"}
                              summary={s.summary ?? undefined}
                              description={s.description ?? undefined}
                              imageSrc={getImg(s)}
                              href={`/services/${s.slug ?? id}`}
                              categories={s.categories ?? []}
                              tag={getPrimaryTag(s)}
                              popular={isPopular(s)}
                              onLearnMore={() => openModal(s)}
                            />
                            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/10 to-transparent" />
                          </div>
                        );
                      })}
                    </div>

                    {sortedContent.length > CHUNK_SIZE && (
                      <div className="mt-8 flex items-center justify-center gap-3">
                        <button
                          className="rounded-full px-5 py-2.5 border bg-white hover:bg-gray-50 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={onPrevGrid}
                          disabled={gridPage === 0}
                          title="Back"
                        >
                          Back
                        </button>

                        <span className="text-sm text-gray-600">
                          Page <strong>{gridPage + 1}</strong> of{" "}
                          <strong>{totalGridPages}</strong>
                        </span>

                        <button
                          className="rounded-full px-5 py-2.5 bg-gray-900 text-white shadow-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={onNextGrid}
                          disabled={gridPage >= totalGridPages - 1}
                          title="Next"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* List view */}
                {view === "list" && (
                  <>
                    <div className="flex flex-col divide-y rounded-2xl border overflow-hidden">
                      {listSlice.map((s) => {
                        const id = getId(s);
                        const img = getImg(s);
                        return (
                          <div
                            key={id}
                            className="flex gap-4 p-4 md:p-5 hover:bg-gray-50 transition"
                          >
                            <div className="w-28 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={img}
                                  alt={s.title ?? ""}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  No image
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <a
                                  href={`/services/${s.slug ?? id}`}
                                  className="font-semibold text-gray-900 hover:underline truncate"
                                  title={s.title ?? ""}
                                >
                                  {s.title ?? "—"}
                                </a>

                                {isPopular(s) && (
                                  <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] md:text-[11px]">
                                    Popular
                                  </span>
                                )}

                                <div className="flex items-center gap-1">
                                  {(s.categories ?? [])
                                    .slice(0, 3)
                                    .map((c, idx) => (
                                      <span
                                        key={`${c.slug}-${idx}`}
                                        className="inline-block text-[10px] md:text-[11px] px-2 py-0.5 rounded-full border bg-white"
                                      >
                                        {c.name ?? c.slug}
                                      </span>
                                    ))}
                                </div>
                              </div>
                              <p className="mt-1 text-sm text-gray-700 line-clamp-2">
                                {s.summary ?? s.description ?? "—"}
                              </p>

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => openModal(s)}
                                  className="rounded-full border px-3 py-1.5 text-xs hover:bg-gray-100"
                                >
                                  Quick view
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {sortedContent.length > CHUNK_SIZE && (
                      <div className="mt-8 flex items-center justify-center gap-3">
                        <button
                          className="rounded-full px-5 py-2.5 border bg-white hover:bg-gray-50 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={onPrevList}
                          disabled={listPage === 0}
                          title="Back"
                        >
                          Back
                        </button>

                        <span className="text-sm text-gray-600">
                          Page <strong>{listPage + 1}</strong> of{" "}
                          <strong>{totalListPages}</strong>
                        </span>

                        <button
                          className="rounded-full px-5 py-2.5 bg-gray-900 text-white shadow-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={onNextList}
                          disabled={listPage >= totalListPages - 1}
                          title="Next"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <div className="h-16 md:h-24" />

      {/* Modal mount */}
      <ServiceModal
        open={open}
        onClose={() => setOpen(false)}
        service={selected}
      />
    </main>
  );
}
