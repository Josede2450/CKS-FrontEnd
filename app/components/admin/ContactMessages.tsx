// components/admin/ContactMessages.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { fetchWithCsrf } from "../../lib/fetchWithCsrf";

// ===== Types =====
export type ContactForm = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  createdAt?: string | null;
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

// ===== Small UI helpers =====
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
}: {
  onClick?: () => void;
  title: string;
  children: React.ReactNode;
  variant?: "ghost" | "solid" | "danger";
  disabled?: boolean;
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
    >
      {children}
    </button>
  );
}

// ===== Component =====
export default function ContactMessages({
  pageSize = 8,
  heading = "Contact Messages",
}: {
  pageSize?: number;
  heading?: string;
}) {
  // ✅ centralized backend URL
  const apiBase = process.env.NEXT_PUBLIC_API_URL!;

  // table state
  const [items, setItems] = useState<ContactForm[]>([]);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [meta, setMeta] = useState<
    Pick<Page<ContactForm>, "totalPages" | "number" | "first" | "last">
  >({
    totalPages: 1,
    number: 0,
    first: true,
    last: true,
  });

  // delete + view state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewing, setViewing] = useState<ContactForm | null>(null);

  // ---- fetch contact messages ----
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const url = new URL(`${apiBase}/api/contact`);
        if (q.trim()) url.searchParams.set("q", q.trim());
        url.searchParams.set("page", String(page));
        url.searchParams.set("size", String(pageSize));
        url.searchParams.set("sort", "createdAt,desc");

        const res = await fetch(url.toString(), {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Failed ${res.status}`);
        const json = (await res.json()) as Page<ContactForm>;
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
        if (!cancelled) setErr(e?.message ?? "Failed to load messages");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiBase, page, q, pageSize]);

  async function handleDelete(id: number) {
    if (!confirm(`Delete message #${id}? This cannot be undone.`)) return;
    try {
      setDeletingId(id);

      const res = await fetchWithCsrf(`${apiBase}/api/contact/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to delete (#${id})`);
      }
      setItems((prev) => prev.filter((c) => c.id !== id));
    } catch (error: any) {
      alert(error?.message ?? "Could not delete");
    } finally {
      setDeletingId(null);
    }
  }

  const sub = useMemo(() => "Newest first", []);

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
              placeholder="Search name, email, phone…"
              className="w-64 max-w-[70vw] rounded-full border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="px-5 md:px-7 py-3 font-medium">Name</th>
                <th className="px-5 md:px-7 py-3 font-medium">Email</th>
                <th className="px-5 md:px-7 py-3 font-medium">Phone</th>
                <th className="px-5 md:px-7 py-3 font-medium">Message</th>
                <th className="px-5 md:px-7 py-3 font-medium whitespace-nowrap">
                  Received
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
                    colSpan={6}
                    className="px-5 md:px-7 py-6 text-center text-gray-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}

              {err && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 md:px-7 py-6 text-center text-red-600"
                  >
                    {err}
                  </td>
                </tr>
              )}

              {!loading && !err && items.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 md:px-7 py-6 text-center text-gray-500"
                  >
                    No messages found.
                  </td>
                </tr>
              )}

              {!loading &&
                !err &&
                items.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-5 md:px-7 py-3">{m.name}</td>
                    <td className="px-5 md:px-7 py-3">{m.email}</td>
                    <td className="px-5 md:px-7 py-3">{m.phone || "—"}</td>
                    <td className="px-5 md:px-7 py-3 max-w-[320px]">
                      <span className="line-clamp-2 text-gray-700">
                        {m.message}
                      </span>
                    </td>
                    <td className="px-5 md:px-7 py-3 whitespace-nowrap text-gray-500">
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-5 md:px-7 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <IconButton
                          title="View full message"
                          onClick={() => setViewing(m)}
                        >
                          👁️ View
                        </IconButton>
                        <IconButton
                          title="Delete"
                          variant="danger"
                          onClick={() => handleDelete(m.id)}
                          disabled={deletingId === m.id}
                        >
                          {deletingId === m.id ? <Spinner /> : "🗑️ Delete"}
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

      {/* View modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)}>
        <h3 className="mb-3 text-lg font-semibold">Full Message</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Name:</strong> {viewing?.name}
          </p>
          <p>
            <strong>Email:</strong> {viewing?.email}
          </p>
          <p>
            <strong>Phone:</strong> {viewing?.phone || "—"}
          </p>
          <p>
            <strong>Received:</strong>{" "}
            {viewing?.createdAt
              ? new Date(viewing.createdAt).toLocaleString()
              : "—"}
          </p>
          <div className="mt-3 whitespace-pre-wrap">{viewing?.message}</div>
        </div>
        <div className="mt-4 flex justify-end">
          <IconButton title="Close" onClick={() => setViewing(null)}>
            Close
          </IconButton>
        </div>
      </Modal>
    </div>
  );
}
