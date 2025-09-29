// components/admin/TestimonialsManager.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

// ✅ CSRF-aware fetch helper (relative import, no aliases)
import { fetchWithCsrf } from "../../lib/fetchWithCsrf";

/* ================== API + Canonical Types ================== */

interface ApiUser {
  id?: number | null;
  first?: string | null;
  last?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  picture?: string | null;
  pictureUrl?: string | null;
}

interface ApiRow {
  id?: number | null;
  content?: string | null; // server field
  quote?: string | null; // UI alias (fallback)
  createdAt?: string | null;
  user?: ApiUser | null;
  favorite?: boolean | null;
}

interface PageResp<T> {
  content: T[];
  number: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

type CanonTestimonial = {
  id: number | null;
  quote: string | null;
  createdAt: string | null;
  userId: number | null;
  firstName: string | null;
  lastName: string | null;
  favorite: boolean;
};

function normalize(row: ApiRow): CanonTestimonial {
  const u = row?.user ?? {};
  const first = u.first ?? u.firstName ?? null;
  const last = u.last ?? u.lastName ?? null;

  return {
    id: row?.id ?? null,
    quote: row?.content ?? row?.quote ?? null,
    createdAt: row?.createdAt ?? null,
    userId: u?.id ?? null,
    firstName: first,
    lastName: last,
    favorite: !!row?.favorite,
  };
}

/* ================== Small UI Helpers ================== */

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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
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

/* ================== Component ================== */

export default function TestimonialsManager({
  pageSize = 8,
  heading = "Testimonials",
  pollMs = 0,
}: {
  pageSize?: number;
  heading?: string;
  pollMs?: number;
}) {
  // ✅ Use env var instead of prop
  const apiBase = process.env.NEXT_PUBLIC_API_URL!;

  const [items, setItems] = useState<CanonTestimonial[]>([]);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    totalPages: 1,
    number: 0,
    first: true,
    last: true,
  });

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<CanonTestimonial | null>(null);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState<{
    quote: string;
    userId: string;
    favorite: boolean;
  }>({
    quote: "",
    userId: "",
    favorite: false,
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const doRefresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const url = new URL(`${apiBase}/api/testimonials`);
        if (q.trim()) url.searchParams.set("q", q.trim());
        if (favoritesOnly) url.searchParams.set("favorite", "true");
        url.searchParams.set("page", String(page));
        url.searchParams.set("size", String(pageSize));
        url.searchParams.set("sort", "createdAt,desc");

        const res = await fetch(url.toString(), {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Failed ${res.status}`);

        const json = (await res.json()) as PageResp<ApiRow>;
        const normalized = (json.content ?? []).map(normalize);

        if (!cancelled) {
          setItems(normalized);
          setMeta({
            totalPages: json.totalPages,
            number: json.number,
            first: json.first,
            last: json.last,
          });
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
  }, [apiBase, page, q, pageSize, favoritesOnly, refreshKey]);

  useEffect(() => {
    if (!pollMs || pollMs < 1000) return;
    const id = setInterval(() => setRefreshKey((k) => k + 1), pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  function openCreate() {
    setForm({ quote: "", userId: "", favorite: false });
    setCreating(true);
  }
  function openEdit(t: CanonTestimonial) {
    setForm({
      quote: t.quote ?? "",
      userId: t.userId != null ? String(t.userId) : "",
      favorite: !!t.favorite,
    });
    setEditing(t);
  }

  async function saveCreateOrEdit() {
    try {
      setSaving(true);

      const payload: any = { content: form.quote, favorite: !!form.favorite };
      if (form.userId) payload.user = { userId: Number(form.userId) };

      const isEdit = !!editing && editing.id != null;
      const url = isEdit
        ? `${apiBase}/api/testimonials/${editing!.id}`
        : `${apiBase}/api/testimonials`;

      const res = await fetchWithCsrf(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          text || `Failed to ${isEdit ? "update" : "create"} testimonial`
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

  async function toggleFavorite(t: CanonTestimonial) {
    if (t.id == null) return;

    setItems((prev) =>
      prev.map((it) => (it.id === t.id ? { ...it, favorite: !t.favorite } : it))
    );

    try {
      const payload: any = { content: t.quote ?? "", favorite: !t.favorite };
      if (t.userId != null) payload.user = { userId: t.userId };

      const res = await fetchWithCsrf(`${apiBase}/api/testimonials/${t.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed ${res.status}`);
      }

      doRefresh();
    } catch (e: any) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === t.id ? { ...it, favorite: t.favorite } : it
        )
      );
      alert(e?.message ?? "Could not update favorite flag");
    }
  }

  async function handleDelete(id: number | null) {
    if (id == null) return;
    if (!confirm(`Delete testimonial #${id}? This cannot be undone.`)) return;
    try {
      setDeletingId(id);

      const res = await fetchWithCsrf(`${apiBase}/api/testimonials/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to delete (#${id})`);
      }
      setItems((prev) => prev.filter((c) => c.id !== id));
      doRefresh();
    } catch (error: any) {
      alert(error?.message ?? "Could not delete");
    } finally {
      setDeletingId(null);
    }
  }

  const sub = useMemo(
    () => (favoritesOnly ? "Showing only Favorites" : "Newest first"),
    [favoritesOnly]
  );

  /* ================== UI ================== */

  return (
    <div className="rounded-[28px] md:rounded-[36px] bg-gray-100/70 p-6 md:p-10">
      <div className="max-w-[980px] mx-auto bg-white rounded-[24px] shadow-sm ring-1 ring-black/5 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 md:px-7 py-5 border-b">
          <div>
            <h2 className="text-lg font-light">{heading}</h2>
            <p className="text-xs text-gray-500">{sub}</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={(e) => {
                  setFavoritesOnly(e.target.checked);
                  setPage(0);
                }}
              />
              Show only Favorites ★
            </label>

            <input
              value={q}
              onChange={(e) => {
                setPage(0);
                setQ(e.target.value);
              }}
              placeholder="Search quote or user id…"
              className="w-56 md:w-64 max-w-[70vw] rounded-full border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gray-200"
            />

            <IconButton title="Refresh" onClick={doRefresh}>
              🔄 Refresh
            </IconButton>
            <IconButton
              title="Create testimonial"
              variant="solid"
              onClick={openCreate}
            >
              ➕ New
            </IconButton>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="px-5 md:px-7 py-3 font-medium">Quote</th>
                <th className="px-5 md:px-7 py-3 font-medium">User</th>
                <th className="px-5 md:px-7 py-3 font-medium whitespace-nowrap">
                  Favorite
                </th>
                <th className="px-5 md:px-7 py-3 font-medium whitespace-nowrap">
                  Created
                </th>
                <th className="px-5 md:px-7 py-3 font-medium whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 md:px-7 py-6 text-center text-gray-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}

              {err && !loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 md:px-7 py-6 text-center text-red-600"
                  >
                    {err}
                  </td>
                </tr>
              )}

              {!loading && !err && items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 md:px-7 py-6 text-center text-gray-500"
                  >
                    No testimonials found.
                  </td>
                </tr>
              )}

              {!loading &&
                !err &&
                items.map((t) => (
                  <tr key={String(t.id ?? Math.random())} className="border-t">
                    <td className="px-5 md:px-7 py-3 max-w-[420px]">
                      <span className="line-clamp-2 text-gray-700">
                        {t.quote ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 md:px-7 py-3">
                      {t.firstName || t.lastName ? (
                        <>
                          {`${t.firstName ?? ""}${
                            t.firstName && t.lastName ? " " : ""
                          }${t.lastName ?? ""}`}
                          <span className="text-xs text-gray-500 ml-2">
                            ({t.userId ?? "—"})
                          </span>
                        </>
                      ) : (
                        t.userId ?? "—"
                      )}
                    </td>
                    <td className="px-5 md:px-7 py-3 whitespace-nowrap">
                      <button
                        className={`rounded-full px-2 py-1 text-sm ${
                          t.favorite ? "bg-yellow-100" : "bg-gray-100"
                        } hover:opacity-90`}
                        title={t.favorite ? "Unfavorite" : "Mark Favorite"}
                        onClick={() => toggleFavorite(t)}
                      >
                        {t.favorite ? "★ Favorite" : "☆ Mark Favorite"}
                      </button>
                    </td>
                    <td className="px-5 md:px-7 py-3 whitespace-nowrap text-gray-500">
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-5 md:px-7 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <IconButton title="Edit" onClick={() => openEdit(t)}>
                          ✏️ Edit
                        </IconButton>
                        {t.id != null && (
                          <IconButton
                            title="Delete"
                            variant="danger"
                            onClick={() => handleDelete(t.id)}
                            disabled={deletingId === t.id}
                          >
                            {deletingId === t.id ? <Spinner /> : "🗑️ Delete"}
                          </IconButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* Create / Edit Modal */}
      <Modal
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      >
        <h3 className="mb-3 text-lg font-semibold">
          {editing ? "Edit testimonial" : "Create testimonial"}
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveCreateOrEdit();
          }}
          className="space-y-3"
        >
          <div className="space-y-1">
            <label className="text-sm">Quote</label>
            <textarea
              value={form.quote}
              onChange={(e) =>
                setForm((f) => ({ ...f, quote: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              rows={4}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">User ID</label>
            <input
              type="number"
              value={form.userId}
              onChange={(e) =>
                setForm((f) => ({ ...f, userId: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="favorite"
              type="checkbox"
              checked={form.favorite}
              onChange={(e) =>
                setForm((f) => ({ ...f, favorite: e.target.checked }))
              }
              className="h-4 w-4"
            />
            <label htmlFor="favorite" className="text-sm">
              Mark as Favorite
            </label>
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
