// components/admin/ServicesManager.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// ✅ CSRF-aware fetch (relative import, no aliases)
import { fetchWithCsrf } from "../../lib/fetchWithCsrf";

/* =========================
   Types aligned to backend
   ========================= */

export type Category = {
  // tolerant id keys
  category_id?: number;
  categoryId?: number;
  id?: number;

  name?: string;
  slug?: string;
};

export type ServiceItem = {
  // tolerant id keys
  service_id?: number;
  serviceId?: number;
  id?: number;

  // fields in DB/entity
  title?: string;
  summary?: string | null;
  description?: string | null;
  image_url?: string | null; // snake_case (DB/JSON)
  imageUrl?: string | null; // camelCase (if entity uses this)

  // most popular (tolerant snake/camel)
  most_popular?: boolean | 0 | 1;
  mostPopular?: boolean;

  // categories on the entity (returned by backend)
  categories?: Category[];

  // pricing & duration
  price_range?: string | null; // snake
  priceRange?: string | null; // camel
  duration?: string | null;
};

export type Page<T> = {
  content: T[];
  number: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
};

/* =========================
   Small UI helpers
   ========================= */

function Spinner() {
  return (
    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
  );
}

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
          {children}
        </div>
      </div>
    </div>
  );
}

function IconButton({
  onClick,
  title,
  children,
  variant = "ghost",
  disabled,
  type = "button",
}: {
  onClick?: () => void;
  title: string;
  children: React.ReactNode;
  variant?: "ghost" | "solid" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs md:text-sm transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50";
  const styles =
    variant === "danger"
      ? "bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-300"
      : variant === "solid"
      ? "bg-gray-900 text-white hover:bg-black focus:ring-gray-300"
      : "hover:bg-gray-100 text-gray-700 focus:ring-gray-300";
  return (
    <button
      className={`${base} ${styles}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
}

/* =========================
   Helpers (tolerant keys)
   ========================= */

const getId = (s: ServiceItem) => s.service_id ?? s.serviceId ?? s.id ?? null;
const getCatId = (c: Category) => c.category_id ?? c.categoryId ?? c.id ?? null;

const getTitle = (s: ServiceItem) =>
  s.title ?? (getId(s) ? `#${getId(s)}` : "—");
const getSummary = (s: ServiceItem) => s.summary ?? "";
const getDescription = (s: ServiceItem) => s.description ?? "";
const getImageUrl = (s: ServiceItem) => s.imageUrl ?? s.image_url ?? "";
const getPopular = (s: ServiceItem) => {
  const v = s.mostPopular ?? s.most_popular ?? false;
  if (typeof v === "number") return v === 1;
  return !!v;
};
const getCategories = (s: ServiceItem) => s.categories ?? [];
const getPriceRange = (s: ServiceItem) => s.priceRange ?? s.price_range ?? "";
const getDuration = (s: ServiceItem) => s.duration ?? "";

/* =========================
   Component
   ========================= */

export default function ServicesManager({
  apiBase,
  pageSize = 8,
  heading = "Services",
  sortKey = "", // keep empty to avoid backend sort errors unless you know the property exists
  pollMs = 0,
}: {
  apiBase: string;
  pageSize?: number;
  heading?: string;
  sortKey?: string;
  pollMs?: number;
}) {
  // table state
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");
  const [showPopularOnly, setShowPopularOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [meta, setMeta] = useState<
    Pick<Page<ServiceItem>, "totalPages" | "number" | "first" | "last">
  >({
    totalPages: 1,
    number: 0,
    first: true,
    last: true,
  });

  // categories master list for filter + form
  const [cats, setCats] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [catsErr, setCatsErr] = useState<string | null>(null);

  // create/edit/delete state
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // form state — aligned with backend (plus categories)
  const [form, setForm] = useState<{
    title: string;
    summary: string;
    description: string;
    imageUrl: string;
    mostPopular: boolean;
    categoryIds: number[];
    priceRange: string;
    duration: string;
  }>({
    title: "",
    summary: "",
    description: "",
    imageUrl: "",
    mostPopular: false,
    categoryIds: [],
    priceRange: "",
    duration: "",
  });

  // manual refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);
  const doRefresh = () => setRefreshKey((k) => k + 1);

  /* =========================
     Fetch categories once
     ========================= */
  useEffect(() => {
    let cancel = false;
    async function loadCats() {
      setCatsLoading(true);
      setCatsErr(null);
      try {
        const url = new URL(`${apiBase}/api/categories`);
        url.searchParams.set("page", "0");
        url.searchParams.set("size", "200");
        url.searchParams.set("sort", "name,asc");

        const res = await fetch(url.toString(), {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Failed to load categories`);
        const data = await res.json();

        const list: Category[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
          ? data.content
          : [];

        if (!cancel) setCats(list);
      } catch (e: any) {
        if (!cancel) setCatsErr(e?.message ?? "Failed to load categories");
      } finally {
        if (!cancel) setCatsLoading(false);
      }
    }
    loadCats();
    return () => {
      cancel = true;
    };
  }, [apiBase]);

  /* =========================
     Fetch services page
     ========================= */
  const mounted = useRef(false);
  useEffect(() => {
    let cancelled = false;

    async function fetchPage(tryWithoutSort = false) {
      setLoading(true);
      setErr(null);
      try {
        const url = new URL(`${apiBase}/api/services`);
        if (q.trim()) url.searchParams.set("q", q.trim());
        if (selectedCategorySlug.trim())
          url.searchParams.set("category", selectedCategorySlug.trim());
        url.searchParams.set("page", String(page));
        url.searchParams.set("size", String(pageSize));
        if (sortKey && !tryWithoutSort)
          url.searchParams.set("sort", `${sortKey},desc`);

        const res = await fetch(url.toString(), {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text();
          const looksLikeBadSort =
            text.includes("PropertyReferenceException") ||
            text.includes("No property") ||
            res.status === 500 ||
            res.status === 400;

          if (sortKey && !tryWithoutSort && looksLikeBadSort) {
            return await fetchPage(true);
          }
          throw new Error(text || `Failed ${res.status}`);
        }

        const json = (await res.json()) as Page<ServiceItem>;
        if (!cancelled) {
          setItems(json.content ?? []);
          setMeta({
            totalPages: json.totalPages,
            number: json.number,
            first: json.first,
            last: json.last,
          });
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to load services");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPage();
    mounted.current = true;
    return () => {
      cancelled = true;
    };
  }, [apiBase, page, q, pageSize, sortKey, refreshKey, selectedCategorySlug]);

  // optional polling
  useEffect(() => {
    if (!pollMs || pollMs < 1000) return;
    const id = setInterval(() => setRefreshKey((k) => k + 1), pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  /* =========================
     Create / Edit helpers
     ========================= */
  function openCreate() {
    setForm({
      title: "",
      summary: "",
      description: "",
      imageUrl: "",
      mostPopular: false,
      categoryIds: [],
      priceRange: "",
      duration: "",
    });
    setCreating(true);
  }

  function openEdit(s: ServiceItem) {
    const currentIds = (getCategories(s) || [])
      .map((c) => getCatId(c))
      .filter((id): id is number => typeof id === "number");
    setForm({
      title: getTitle(s),
      summary: getSummary(s),
      description: getDescription(s),
      imageUrl: getImageUrl(s),
      mostPopular: getPopular(s),
      categoryIds: currentIds,
      priceRange: getPriceRange(s),
      duration: getDuration(s),
    });
    setEditing(s);
  }

  async function saveCreateOrEdit() {
    try {
      setSaving(true);

      if (form.priceRange && form.priceRange.length > 250) {
        throw new Error("priceRange must be ≤ 250 characters");
      }
      if (form.duration && form.duration.length > 255) {
        throw new Error("duration must be ≤ 255 characters");
      }

      const payload: any = {
        title: form.title,
        summary: form.summary,
        description: form.description,
        imageUrl: form.imageUrl || null,
        image_url: form.imageUrl || null, // tolerate snake
        mostPopular: !!form.mostPopular,
        most_popular: !!form.mostPopular,

        priceRange: form.priceRange || null,
        price_range: form.priceRange || null,
        duration: form.duration || null,

        categories:
          form.categoryIds?.map((id) => ({ categoryId: id })) ?? undefined,
      };

      const isEdit = !!editing;
      const idForEdit = editing ? getId(editing) : null;
      const url = isEdit
        ? `${apiBase}/api/services/${idForEdit}`
        : `${apiBase}/api/services`;

      // ✅ CSRF-aware wrapper for POST/PUT
      const res = await fetchWithCsrf(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          text || `Failed to ${isEdit ? "update" : "create"} service`
        );
      }

      setCreating(false);
      setEditing(null);
      setPage(0);
      doRefresh();
    } catch (e: any) {
      alert(e?.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(idLike: number) {
    if (!confirm(`Delete service #${idLike}? This cannot be undone.`)) return;
    try {
      setDeletingId(idLike);

      // ✅ CSRF-aware wrapper for DELETE
      const res = await fetchWithCsrf(`${apiBase}/api/services/${idLike}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to delete (#${idLike})`);
      }
      setItems((prev) => prev.filter((c) => getId(c) !== idLike)); // optimistic
      doRefresh();
    } catch (error: any) {
      alert(error?.message ?? "Could not delete");
    } finally {
      setDeletingId(null);
    }
  }

  async function togglePopular(row: ServiceItem) {
    const id = getId(row);
    if (id == null) return;
    try {
      setTogglingId(id);
      const nextPopular = !getPopular(row);

      const currentCatIds = (getCategories(row) || [])
        .map((c) => getCatId(c))
        .filter((x): x is number => typeof x === "number");

      const payload: any = {
        title: getTitle(row),
        summary: getSummary(row),
        description: getDescription(row),
        imageUrl: getImageUrl(row) || null,
        image_url: getImageUrl(row) || null,
        mostPopular: nextPopular,
        most_popular: nextPopular,

        priceRange: getPriceRange(row) || null,
        price_range: getPriceRange(row) || null,
        duration: getDuration(row) || null,

        categories: currentCatIds.map((cid) => ({ categoryId: cid })),
      };

      // ✅ CSRF-aware wrapper for PUT
      const res = await fetchWithCsrf(`${apiBase}/api/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to toggle popular");
      }

      setItems((prev) =>
        prev.map((it) =>
          getId(it) === id
            ? { ...it, mostPopular: nextPopular, most_popular: nextPopular }
            : it
        )
      );
    } catch (e: any) {
      alert(e?.message ?? "Could not update");
    } finally {
      setTogglingId(null);
    }
  }

  const sub = useMemo(() => "Newest first", []);

  const visibleItems = useMemo(() => {
    const base = items;
    return showPopularOnly ? base.filter((s) => getPopular(s)) : base;
  }, [items, showPopularOnly]);

  /* =========================
     UI
     ========================= */

  return (
    <div className="rounded-[28px] md:rounded-[36px] bg-gray-100/70 p-6 md:p-10">
      <div className="max-w-[980px] mx-auto bg-white rounded-[24px] shadow-sm ring-1 ring-black/5 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 md:px-7 py-5 border-b">
          <div>
            <h2 className="text-lg font-light">{heading}</h2>
            <p className="text-xs text-gray-500">{sub}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={q}
              onChange={(e) => {
                setPage(0);
                setQ(e.target.value);
              }}
              placeholder="Search services…"
              className="w-64 max-w-[70vw] rounded-full border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gray-200"
            />

            {/* Category filter */}
            <select
              value={selectedCategorySlug}
              onChange={(e) => {
                setSelectedCategorySlug(e.target.value);
                setPage(0);
              }}
              className="rounded-full border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              title="Filter by category"
            >
              <option value="">All categories</option>
              {cats.map((c) => (
                <option key={getCatId(c) ?? c.slug} value={c.slug ?? ""}>
                  {c.name ?? c.slug}
                </option>
              ))}
            </select>

            <label className="ml-2 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showPopularOnly}
                onChange={(e) => setShowPopularOnly(e.target.checked)}
              />
              Popular only
            </label>

            <IconButton title="Refresh" onClick={doRefresh}>
              🔄 Refresh
            </IconButton>
            <IconButton
              title="Create service"
              variant="solid"
              onClick={openCreate}
            >
              ➕ New
            </IconButton>
          </div>
        </div>

        {(catsLoading || catsErr) && (
          <div className="px-5 md:px-7 py-3 text-xs text-gray-500 border-b">
            {catsLoading ? "Loading categories…" : catsErr}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="px-5 md:px-7 py-3 font-medium">Title</th>
                <th className="px-5 md:px-7 py-3 font-medium">Summary</th>
                <th className="px-5 md:px-7 py-3 font-medium">Image</th>
                <th className="px-5 md:px-7 py-3 font-medium">Description</th>
                <th className="px-5 md:px-7 py-3 font-medium">Categories</th>
                <th className="px-5 md:px-7 py-3 font-medium">Price Range</th>
                <th className="px-5 md:px-7 py-3 font-medium">Duration</th>
                <th className="px-5 md:px-7 py-3 font-medium">Popular</th>
                <th className="px-5 md:px-7 py-3 font-medium whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 md:px-7 py-6 text-center text-gray-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}

              {err && !loading && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 md:px-7 py-6 text-center text-red-600"
                  >
                    {err}
                  </td>
                </tr>
              )}

              {!loading && !err && visibleItems.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 md:px-7 py-6 text-center text-gray-500"
                  >
                    No services found.
                  </td>
                </tr>
              )}

              {!loading &&
                !err &&
                visibleItems.map((s) => {
                  const id = getId(s);
                  const img = getImageUrl(s);
                  const isPopular = getPopular(s);
                  const catsArr = getCategories(s);
                  return (
                    <tr
                      key={id ?? Math.random()}
                      className="border-t align-top"
                    >
                      <td className="px-5 md:px-7 py-3">{getTitle(s)}</td>
                      <td className="px-5 md:px-7 py-3 max-w-[280px]">
                        <span className="line-clamp-2 text-gray-700">
                          {getSummary(s)}
                        </span>
                      </td>
                      <td className="px-5 md:px-7 py-3">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt="service"
                            className="h-10 w-10 object-cover rounded-md border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 md:px-7 py-3 max-w-[340px]">
                        <span className="line-clamp-2 text-gray-700">
                          {getDescription(s)}
                        </span>
                      </td>

                      <td className="px-5 md:px-7 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {catsArr && catsArr.length > 0 ? (
                            catsArr.map((c) => (
                              <span
                                key={`${getCatId(c) ?? c.slug}-chip`}
                                className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-700"
                                title={c.slug ?? ""}
                              >
                                {c.name ?? c.slug ?? "—"}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 md:px-7 py-3 whitespace-nowrap text-gray-700">
                        {getPriceRange(s) || "—"}
                      </td>

                      <td className="px-5 md:px-7 py-3 whitespace-nowrap text-gray-700">
                        {getDuration(s) || "—"}
                      </td>

                      <td className="px-5 md:px-7 py-3">
                        <button
                          className="text-lg"
                          title={
                            isPopular ? "Unmark as popular" : "Mark as popular"
                          }
                          onClick={() => togglePopular(s)}
                          disabled={togglingId === id}
                        >
                          {togglingId === id ? "…" : isPopular ? "⭐" : "☆"}
                        </button>
                      </td>
                      <td className="px-5 md:px-7 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <IconButton title="Edit" onClick={() => openEdit(s)}>
                            ✏️ Edit
                          </IconButton>
                          {id != null && (
                            <IconButton
                              title="Delete"
                              variant="danger"
                              onClick={() => handleDelete(id)}
                              disabled={deletingId === id}
                            >
                              {deletingId === id ? <Spinner /> : "🗑️ Delete"}
                            </IconButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-3 px-5 md:px-7 py-5 border-t">
          <button
            className="rounded-full px-3 py-1.5 text-sm border hover:bg-gray-50 disabled:opacity-50"
            disabled={meta.first}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ← Prev
          </button>
          <span className="text-xs text-gray-600">
            {meta.number + 1} / {meta.totalPages}
          </span>
          <button
            className="rounded-full px-3 py-1.5 text-sm border hover:bg-gray-50 disabled:opacity-50"
            disabled={meta.last}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Create/Edit modal */}
      <Modal
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      >
        <h3 className="mb-3 text-lg font-semibold">
          {editing ? "Edit service" : "Create service"}
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveCreateOrEdit();
          }}
          className="space-y-3"
        >
          <div className="space-y-1">
            <label className="text-sm">Title</label>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Summary</label>
            <input
              value={form.summary}
              onChange={(e) =>
                setForm((f) => ({ ...f, summary: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Description</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              rows={4}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Image URL</label>
            <input
              value={form.imageUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, imageUrl: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="https://…"
            />
          </div>

          {/* Price Range (≤250 chars) */}
          <div className="space-y-1">
            <label className="text-sm">
              Price Range{" "}
              <span className="text-gray-400">(e.g., “$500 – $2,000”)</span>
            </label>
            <input
              value={form.priceRange}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  priceRange: e.target.value.slice(0, 250),
                }))
              }
              maxLength={250}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="$500 – $2,000"
            />
            <p className="text-[11px] text-gray-400">
              {form.priceRange.length}/250
            </p>
          </div>

          {/* Duration (≤255 chars) */}
          <div className="space-y-1">
            <label className="text-sm">
              Duration{" "}
              <span className="text-gray-400">(e.g., “2–4 weeks”)</span>
            </label>
            <input
              value={form.duration}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  duration: e.target.value.slice(0, 255),
                }))
              }
              maxLength={255}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="2–4 weeks"
            />
            <p className="text-[11px] text-gray-400">
              {form.duration.length}/255
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="mostPopular"
              type="checkbox"
              checked={form.mostPopular}
              onChange={(e) =>
                setForm((f) => ({ ...f, mostPopular: e.target.checked }))
              }
            />
            <label htmlFor="mostPopular" className="text-sm select-none">
              Mark as <strong>Most Popular</strong>
            </label>
          </div>

          {/* Category multiselect */}
          <div className="pt-2">
            <p className="text-sm font-medium mb-1.5">Categories</p>
            {catsLoading && (
              <p className="text-xs text-gray-500">Loading categories…</p>
            )}
            {catsErr && <p className="text-xs text-red-600">{catsErr}</p>}
            {!catsLoading && !catsErr && (
              <div className="grid grid-cols-2 gap-2">
                {cats.map((c) => {
                  const cid = getCatId(c);
                  const checked = form.categoryIds.includes(cid ?? -1);
                  return (
                    <label
                      key={cid ?? c.slug}
                      className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setForm((f) => {
                            const set = new Set(f.categoryIds);
                            if (cid == null) return f;
                            if (e.target.checked) set.add(cid);
                            else set.delete(cid);
                            return { ...f, categoryIds: Array.from(set) };
                          });
                        }}
                      />
                      <span>{c.name ?? c.slug ?? "—"}</span>
                    </label>
                  );
                })}
                {cats.length === 0 && (
                  <p className="text-xs text-gray-500 col-span-2">
                    No categories yet. Create some first.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <IconButton
              title="Cancel"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Cancel
            </IconButton>
            <IconButton
              title="Save"
              variant="solid"
              type="submit"
              disabled={saving}
            >
              {saving ? <Spinner /> : "Save"}
            </IconButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
