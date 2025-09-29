// components/admin/CategoryManager.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { fetchWithCsrf } from "../../lib/fetchWithCsrf";

/* ========= Types ========= */
export type Category = {
  category_id?: number;
  categoryId?: number;
  id?: number;
  name: string;
  slug: string;
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

/* ========= Small UI helpers ========= */
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

/* ========= Helpers ========= */
const getId = (c: Category) => c.category_id ?? c.categoryId ?? c.id ?? null;

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

/* ========= Component ========= */
export default function CategoryManager({
  pageSize = 10,
  heading = "Categories",
}: {
  pageSize?: number;
  heading?: string;
}) {
  // ✅ always get API base from env
  const apiBase = process.env.NEXT_PUBLIC_API_URL!;

  // table state
  const [items, setItems] = useState<Category[]>([]);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [meta, setMeta] = useState<
    Pick<Page<Category>, "totalPages" | "number" | "first" | "last">
  >({
    totalPages: 1,
    number: 0,
    first: true,
    last: true,
  });

  // create/edit/delete state
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // form state
  const [form, setForm] = useState<{ name: string; slug: string }>({
    name: "",
    slug: "",
  });

  // manual refresh key + helper
  const [refreshKey, setRefreshKey] = useState(0);
  const doRefresh = () => setRefreshKey((k) => k + 1);

  // load page
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const url = new URL(`${apiBase}/api/categories`);
        if (q.trim()) url.searchParams.set("q", q.trim());
        url.searchParams.set("page", String(page));
        url.searchParams.set("size", String(pageSize));
        url.searchParams.set("sort", "name,asc");

        const res = await fetch(url.toString(), {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Failed ${res.status}`);
        }
        const json = (await res.json()) as Page<Category>;
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
        if (!cancelled) setErr(e?.message ?? "Failed to load categories");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiBase, page, q, pageSize, refreshKey]);

  /* ====== CRUD helpers ====== */
  function openCreate() {
    setForm({ name: "", slug: "" });
    setCreating(true);
  }

  function openEdit(c: Category) {
    setForm({ name: c.name ?? "", slug: c.slug ?? "" });
    setEditing(c);
  }

  async function saveCreateOrEdit() {
    try {
      setSaving(true);
      if (!form.name.trim()) {
        alert("Name is required");
        return;
      }
      const finalSlug = form.slug.trim() || slugify(form.name);

      const payload = {
        name: form.name.trim(),
        slug: finalSlug,
      };

      const isEdit = !!editing;
      const idForEdit = editing ? getId(editing) : null;
      const url = isEdit
        ? `${apiBase}/api/categories/${idForEdit}`
        : `${apiBase}/api/categories`;

      const res = await fetchWithCsrf(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          text ||
            `Failed to ${
              isEdit ? "update" : "create"
            } category (maybe slug conflict?)`
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
    if (!confirm(`Delete category #${idLike}? This cannot be undone.`)) return;
    try {
      setDeletingId(idLike);
      const res = await fetchWithCsrf(`${apiBase}/api/categories/${idLike}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to delete (#${idLike})`);
      }
      setItems((prev) => prev.filter((c) => getId(c) !== idLike));
    } catch (error: any) {
      alert(
        error?.message ??
          "Could not delete (is this category used by some services?)"
      );
    } finally {
      setDeletingId(null);
    }
  }

  const sub = useMemo(() => "Alphabetical by name", []);

  /* ====== UI ====== */
  return (
    <div className="rounded-[28px] md:rounded-[36px] bg-gray-100/70 p-6 md:p-10">
      <div className="max-w-[980px] mx-auto bg-white rounded-[24px] shadow-sm ring-1 ring-black/5 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 md:px-7 py-5 border-b">
          <div>
            <h2 className="text-lg font-light">{heading}</h2>
            <p className="text-xs text-gray-500">{sub}</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => {
                setPage(0);
                setQ(e.target.value);
              }}
              placeholder="Search name or slug…"
              className="w-64 max-w-[70vw] rounded-full border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gray-200"
            />
            <IconButton title="Refresh" onClick={doRefresh}>
              🔄 Refresh
            </IconButton>
            <IconButton
              title="Create category"
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
                <th className="px-5 md:px-7 py-3 font-medium">Name</th>
                <th className="px-5 md:px-7 py-3 font-medium">Slug</th>
                <th className="px-5 md:px-7 py-3 font-medium whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 md:px-7 py-6 text-center text-gray-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}

              {err && !loading && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 md:px-7 py-6 text-center text-red-600"
                  >
                    {err}
                  </td>
                </tr>
              )}

              {!loading && !err && items.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 md:px-7 py-6 text-center text-gray-500"
                  >
                    No categories found.
                  </td>
                </tr>
              )}

              {!loading &&
                !err &&
                items.map((c) => {
                  const id = getId(c)!;
                  return (
                    <tr key={id} className="border-t">
                      <td className="px-5 md:px-7 py-3">{c.name}</td>
                      <td className="px-5 md:px-7 py-3">
                        <code className="rounded bg-gray-50 px-2 py-0.5">
                          {c.slug}
                        </code>
                      </td>
                      <td className="px-5 md:px-7 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <IconButton title="Edit" onClick={() => openEdit(c)}>
                            ✏️ Edit
                          </IconButton>
                          <IconButton
                            title="Delete"
                            variant="danger"
                            onClick={() => handleDelete(id)}
                            disabled={deletingId === id}
                          >
                            {deletingId === id ? <Spinner /> : "🗑️ Delete"}
                          </IconButton>
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
          {editing ? "Edit category" : "Create category"}
        </h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveCreateOrEdit();
          }}
          className="space-y-3"
        >
          <div className="space-y-1">
            <label className="text-sm">Name</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  name: e.target.value,
                  slug:
                    f.slug.trim().length === 0
                      ? slugify(e.target.value)
                      : f.slug,
                }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm">Slug</label>
              <button
                type="button"
                className="text-xs underline"
                onClick={() =>
                  setForm((f) => ({ ...f, slug: slugify(f.name) }))
                }
                title="Auto-generate from name"
              >
                auto from name
              </button>
            </div>
            <input
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="e.g. web-apps"
            />
            <p className="text-[11px] text-gray-500">
              Lowercase, letters/numbers/dashes only. Must be unique.
            </p>
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
