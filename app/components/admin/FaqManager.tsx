// components/admin/FaqManager.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

/* ============== Types ============== */
export type Faq = {
  id: number; // mapped from id || faq_id || faqId
  question: string;
  answer: string;
  // category?: string; // enable later if your API exposes it
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

/* ============== Small UI helpers ============== */
function Spinner() {
  return (
    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
  );
}

function Modal({
  open,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
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
        <div
          className={`w-full ${
            wide ? "max-w-2xl" : "max-w-xl"
          } rounded-2xl bg-white p-5 shadow-xl`}
        >
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
  type?: "button" | "submit" | "reset";
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

/* ============== Main Component ============== */
export default function FaqManager({
  apiBase,
  pageSize = 8,
  heading = "FAQs",
}: {
  apiBase: string;
  pageSize?: number;
  heading?: string;
}) {
  // table state
  const [items, setItems] = useState<Faq[]>([]);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [meta, setMeta] = useState<
    Pick<Page<Faq>, "totalPages" | "number" | "first" | "last">
  >({
    totalPages: 1,
    number: 0,
    first: true,
    last: true,
  });

  // create/edit state
  const [editing, setEditing] = useState<Faq | null>(null);
  const [saving, setSaving] = useState(false);

  // delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  /* -------- fetch FAQs (GET /api/faqs) -------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const url = new URL(`${apiBase}/api/faqs`);
        if (q.trim()) url.searchParams.set("q", q.trim());
        url.searchParams.set("page", String(page));
        url.searchParams.set("size", String(pageSize));
        // DO NOT set sort — your table has no createdAt and PK is faq_id
        // url.searchParams.set("sort", "faqId,desc");

        const res = await fetch(url.toString(), { credentials: "include" });
        if (!res.ok) throw new Error(`Failed ${res.status}`);
        const json = (await res.json()) as Page<any>;

        // Map id defensively: API might return id, faq_id, or faqId
        const content: Faq[] = (json.content ?? []).map((f: any) => ({
          id: f.id ?? f.faq_id ?? f.faqId,
          question: f.question,
          answer: f.answer,
        }));

        if (!cancelled) {
          setItems(content);
          setMeta({
            totalPages: json.totalPages,
            number: json.number,
            first: json.first,
            last: json.last,
          });
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to load FAQs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiBase, page, q, pageSize]);

  /* -------- CRUD handlers -------- */
  function startCreate() {
    setEditing({ id: 0, question: "", answer: "" });
  }

  function startEdit(item: Faq) {
    setEditing({ ...item });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      setSaving(true);
      const method = editing.id && editing.id !== 0 ? "PUT" : "POST";
      const url =
        method === "POST"
          ? `${apiBase}/api/faqs`
          : `${apiBase}/api/faqs/${editing.id}`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          question: editing.question?.trim(),
          answer: editing.answer?.trim(),
          // category: editing.category?.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to save (status ${res.status})`);
      }
      const json = await res.json();
      // controller returns { message, faq } for POST/PUT
      const saved: Faq = json.faq
        ? {
            id: json.faq.id ?? json.faq.faq_id ?? json.faq.faqId,
            question: json.faq.question,
            answer: json.faq.answer,
          }
        : {
            id: json.id ?? json.faq_id ?? json.faqId,
            question: json.question,
            answer: json.answer,
          };

      // optimistic update
      setItems((prev) => {
        const idx = prev.findIndex((x) => x.id === saved.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = saved;
          return copy;
        }
        return [saved, ...prev];
      });

      setEditing(null);
    } catch (error: any) {
      alert(error?.message ?? "Could not save FAQ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm(`Delete FAQ #${id}? This cannot be undone.`)) return;
    try {
      setDeletingId(id);
      const res = await fetch(`${apiBase}/api/faqs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to delete (#${id})`);
      setItems((prev) => prev.filter((c) => c.id !== id));
    } catch (error: any) {
      alert(error?.message ?? "Could not delete FAQ");
    } finally {
      setDeletingId(null);
    }
  }

  const sub = useMemo(() => "Manage questions & answers", []);

  /* -------- Render -------- */
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
              placeholder="Search question or answer…"
              className="w-64 max-w-[70vw] rounded-full border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gray-200"
            />
            <IconButton title="Add FAQ" variant="solid" onClick={startCreate}>
              ➕ Add
            </IconButton>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="px-5 md:px-7 py-3 font-medium">Question</th>
                <th className="px-5 md:px-7 py-3 font-medium">Answer</th>
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
                    No FAQs found.
                  </td>
                </tr>
              )}

              {!loading &&
                !err &&
                items.map((f) => (
                  <tr key={f.id} className="border-t">
                    <td className="px-5 md:px-7 py-3 max-w-[360px]">
                      <span className="line-clamp-2 text-gray-900 font-medium">
                        {f.question}
                      </span>
                    </td>
                    <td className="px-5 md:px-7 py-3 max-w-[480px]">
                      <span className="line-clamp-2 text-gray-700">
                        {f.answer}
                      </span>
                    </td>
                    <td className="px-5 md:px-7 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <IconButton title="Edit" onClick={() => startEdit(f)}>
                          ✏️ Edit
                        </IconButton>
                        <IconButton
                          title="Delete"
                          variant="danger"
                          onClick={() => handleDelete(f.id)}
                          disabled={deletingId === f.id}
                        >
                          {deletingId === f.id ? <Spinner /> : "🗑️ Delete"}
                        </IconButton>
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

      {/* Create / Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} wide>
        <form onSubmit={handleSave} className="space-y-4">
          <h3 className="text-lg font-semibold">
            {editing?.id && editing.id !== 0 ? "Edit FAQ" : "Create FAQ"}
          </h3>

          <div className="space-y-1">
            <label className="text-sm font-medium">Question</label>
            <input
              value={editing?.question ?? ""}
              onChange={(e) =>
                setEditing((prev) =>
                  prev ? { ...prev, question: e.target.value } : prev
                )
              }
              required
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="e.g., How do I reset my password?"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Answer</label>
            <textarea
              value={editing?.answer ?? ""}
              onChange={(e) =>
                setEditing((prev) =>
                  prev ? { ...prev, answer: e.target.value } : prev
                )
              }
              required
              rows={5}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="Provide a clear, concise answer…"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <IconButton title="Cancel" onClick={() => setEditing(null)}>
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
