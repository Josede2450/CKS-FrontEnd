"use client";

import React, { useEffect, useMemo, useState } from "react";

/* ========== CSRF helpers (inline, no aliases) ========== */

/** Read the XSRF-TOKEN cookie set by Spring Security */
function getCsrfToken(): string | null {
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Hit a public GET that *is not* CSRF-ignored so the CsrfFilter sets the cookie */
async function ensureCsrfToken(apiBase: string): Promise<string | null> {
  let t = getCsrfToken();
  if (t) return t;
  try {
    await fetch(`${apiBase}/api/services`, {
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    // ignore; cookie may still have been set
  }
  return getCsrfToken();
}

/** Wrapper that guarantees we send X-XSRF-TOKEN on mutating requests */
async function fetchWithCsrf(
  apiBase: string,
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  const method = (init.method ?? "GET").toUpperCase();
  const needsToken = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  let headers = new Headers(init.headers as HeadersInit);

  if (needsToken) {
    const token = (await ensureCsrfToken(apiBase)) ?? "";
    if (!headers.has("X-XSRF-TOKEN")) headers.set("X-XSRF-TOKEN", token);
  }
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
}

/* ================== API + Canonical Types ================== */

interface ApiUserRow {
  id?: number | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  enabled?: boolean | null;
  provider?: string | null;
  role?: string | null;
  roles?: string[] | null;
  avatar?: string | null;
  picture?: string | null;
  displayPicture?: string | null;
  phone?: string | null;
  gender?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastLoginAt?: string | null;
}

interface GenericPage<T> {
  content: T[];
  number: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

export type CanonUser = {
  id: number | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  enabled: boolean;
  provider: string | null;
  roles: string[];
  phone: string | null;
  gender: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastLoginAt: string | null;
  displayPicture: string | null;
};

function normalize(row: ApiUserRow): CanonUser {
  return {
    id: row?.id ?? null,
    email: row?.email ?? null,
    firstName: row?.firstName ?? null,
    lastName: row?.lastName ?? null,
    enabled: Boolean(row?.enabled),
    provider: row?.provider ?? null,
    roles: (row?.roles ?? []).filter(Boolean) as string[],
    phone: row?.phone ?? null,
    gender: row?.gender ?? null,
    createdAt: row?.createdAt ?? null,
    updatedAt: row?.updatedAt ?? null,
    lastLoginAt: row?.lastLoginAt ?? null,
    displayPicture: row?.displayPicture ?? row?.avatar ?? row?.picture ?? null,
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
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
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

const ROLE_OPTIONS = ["ADMIN", "CLIENT"] as const;
type RoleOption = (typeof ROLE_OPTIONS)[number];

const GENDER_OPTIONS = ["Male", "Female"] as const;
type GenderOption = (typeof GENDER_OPTIONS)[number];

export default function UsersManager({
  apiBase,
  pageSize = 10,
  heading = "Users",
  pollMs = 0,
}: {
  apiBase: string;
  pageSize?: number;
  heading?: string;
  pollMs?: number;
}) {
  // table state
  const [items, setItems] = useState<CanonUser[]>([]);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("createdAt,desc");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    totalPages: 1,
    number: 0,
    first: true,
    last: true,
  });

  // editing state
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<CanonUser | null>(null);

  // form for updates (mirrors UpdateUserRequest)
  const [form, setForm] = useState<{
    email: string; // read-only
    firstName: string;
    lastName: string;
    phone: string;
    gender: "" | GenderOption;
    enabled: boolean;
    roles: RoleOption[];
    avatarUrl: string;
  }>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    gender: "",
    enabled: true,
    roles: [],
    avatarUrl: "",
  });

  // manual refresh key
  const [refreshKey, setRefreshKey] = useState(0);
  const doRefresh = () => setRefreshKey((k) => k + 1);

  // fetch page (no-store to avoid stale auth)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const url = new URL(`${apiBase}/api/users`);
        url.searchParams.set("page", String(page));
        url.searchParams.set("size", String(pageSize));
        url.searchParams.set("sort", sort);

        const res = await fetch(url.toString(), {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Failed ${res.status}`);

        const json = await res.json();
        const pg: GenericPage<ApiUserRow> = {
          content: json.content ?? [],
          number: json.number ?? 0,
          size: json.size ?? pageSize,
          totalPages: json.totalPages ?? 1,
          totalElements:
            json.totalElements ?? json.pageable?.totalElements ?? 0,
          first: json.first ?? json.number === 0,
          last: json.last ?? false,
        };

        const normalized = (pg.content ?? []).map(normalize);
        if (!cancelled) {
          setItems(normalized);
          setMeta({
            totalPages: pg.totalPages,
            number: pg.number,
            first: pg.first,
            last: pg.last,
          });
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, page, pageSize, sort, refreshKey]);

  // optional polling
  useEffect(() => {
    if (!pollMs || pollMs < 1000) return;
    const id = setInterval(() => setRefreshKey((k) => k + 1), pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  function openEdit(u: CanonUser) {
    const onlyAllowed = (u.roles ?? [])
      .map((r) => r.toUpperCase())
      .filter((r): r is RoleOption =>
        (ROLE_OPTIONS as readonly string[]).includes(r)
      );

    const g = (u.gender ?? "").trim();
    const genderVal = (GENDER_OPTIONS as readonly string[]).includes(g)
      ? (g as GenderOption)
      : "";

    setEditing(u);
    setForm({
      email: u.email ?? "",
      firstName: u.firstName ?? "",
      lastName: u.lastName ?? "",
      phone: u.phone ?? "",
      gender: genderVal,
      enabled: Boolean(u.enabled),
      roles: onlyAllowed as RoleOption[],
      avatarUrl: u.displayPicture ?? "",
    });
  }

  function toggleRole(role: RoleOption) {
    setForm((f) => {
      const has = f.roles.includes(role);
      return {
        ...f,
        roles: has ? f.roles.filter((r) => r !== role) : [...f.roles, role],
      };
    });
  }

  async function saveEdit() {
    if (!editing || editing.id == null) return;
    try {
      setSaving(true);

      const payload: any = {
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        phone: form.phone || null,
        gender: form.gender || null, // "" → null
        enabled: form.enabled,
        roles: form.roles.length === 0 ? [] : form.roles, // ADMIN/CLIENT only
        avatarUrl: form.avatarUrl ?? null, // "" clears avatar
      };

      const res = await fetchWithCsrf(
        apiBase,
        `${apiBase}/api/users/${editing.id}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update user");
      }

      setEditing(null);
      doRefresh();
    } catch (e: any) {
      alert(e?.message ?? "Could not save user");
    } finally {
      setSaving(false);
    }
  }

  const sub = useMemo(() => {
    const [p, dir] = sort.split(",");
    return `Sorted by ${p} ${dir === "asc" ? "↑" : "↓"}`;
  }, [sort]);

  /* ================== UI ================== */

  return (
    <div className="rounded-[28px] md:rounded-[36px] bg-gray-100/70 p-6 md:p-10">
      <div className="max-w-[1100px] mx-auto bg-white rounded-[24px] shadow-sm ring-1 ring-black/5 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 md:px-7 py-5 border-b">
          <div>
            <h2 className="text-lg font-light">{heading}</h2>
            <p className="text-xs text-gray-500">{sub}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-full border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              value={sort}
              onChange={(e) => {
                setPage(0);
                setSort(e.target.value);
              }}
            >
              <option value="createdAt,desc">Newest</option>
              <option value="createdAt,asc">Oldest</option>
              <option value="email,asc">Email A→Z</option>
              <option value="email,desc">Email Z→A</option>
              <option value="lastLoginAt,desc">Recent logins</option>
            </select>
            <IconButton title="Refresh" onClick={doRefresh}>
              🔄 Refresh
            </IconButton>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="px-5 md:px-7 py-3 font-medium">User</th>
                <th className="px-5 md:px-7 py-3 font-medium">Email</th>
                <th className="px-5 md:px-7 py-3 font-medium">Roles</th>
                <th className="px-5 md:px-7 py-3 font-medium">Enabled</th>
                <th className="px-5 md:px-7 py-3 font-medium">Provider</th>
                <th className="px-5 md:px-7 py-3 font-medium whitespace-nowrap">
                  Last Login
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
                    colSpan={7}
                    className="px-5 md:px-7 py-6 text-center text-gray-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}

              {err && !loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 md:px-7 py-6 text-center text-red-600"
                  >
                    {err}
                  </td>
                </tr>
              )}

              {!loading && !err && items.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 md:px-7 py-6 text-center text-gray-500"
                  >
                    No users found.
                  </td>
                </tr>
              )}

              {!loading &&
                !err &&
                items.map((u) => (
                  <tr key={String(u.id ?? Math.random())} className="border-t">
                    <td className="px-5 md:px-7 py-3 max-w-[280px]">
                      <div className="flex items-center gap-3">
                        {u.displayPicture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.displayPicture}
                            alt="avatar"
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200" />
                        )}
                        <div>
                          <div className="text-gray-800">
                            {u.firstName ?? ""}
                            {u.firstName && u.lastName ? " " : ""}
                            {u.lastName ?? ""}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {u.id ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 md:px-7 py-3">{u.email ?? "—"}</td>
                    <td className="px-5 md:px-7 py-3">
                      {u.roles.length ? u.roles.join(", ") : "—"}
                    </td>
                    <td className="px-5 md:px-7 py-3">
                      {u.enabled ? "Yes" : "No"}
                    </td>
                    <td className="px-5 md:px-7 py-3">{u.provider ?? "—"}</td>
                    <td className="px-5 md:px-7 py-3 whitespace-nowrap text-gray-500">
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-5 md:px-7 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <IconButton title="Edit" onClick={() => openEdit(u)}>
                          ✏️ Edit
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

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)}>
        <h3 className="mb-3 text-lg font-semibold">Edit user</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveEdit();
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <div className="space-y-1">
            <label className="text-sm">Email</label>
            <input
              value={form.email}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none bg-gray-50 text-gray-600 cursor-not-allowed"
              type="email"
              disabled
              readOnly
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">First name</label>
            <input
              value={form.firstName}
              onChange={(e) =>
                setForm((f) => ({ ...f, firstName: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Last name</label>
            <input
              value={form.lastName}
              onChange={(e) =>
                setForm((f) => ({ ...f, lastName: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Phone</label>
            <input
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          {/* Gender limited to Male/Female */}
          <div className="space-y-1">
            <label className="text-sm">Gender</label>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              value={form.gender}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  gender: (e.target.value || "") as "" | GenderOption,
                }))
              }
            >
              <option value="">—</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Roles limited to ADMIN / CLIENT */}
          <div className="space-y-1">
            <label className="text-sm">Roles</label>
            <div className="flex items-center gap-4 border rounded-lg px-3 py-2">
              {ROLE_OPTIONS.map((r) => (
                <label key={r} className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.roles.includes(r)}
                    onChange={() => toggleRole(r)}
                  />
                  {r}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Select one or both. Leave both unchecked to clear all roles.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm">Avatar URL</label>
            <input
              value={form.avatarUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, avatarUrl: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="https://…"
            />
            <p className="text-xs text-gray-500">Set empty to clear avatar.</p>
          </div>

          <div className="col-span-full flex items-center gap-3 pt-2">
            <label className="text-sm flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) =>
                  setForm((f) => ({ ...f, enabled: e.target.checked }))
                }
              />
              Enabled
            </label>
            <div className="ml-auto flex gap-2">
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
          </div>
        </form>
      </Modal>
    </div>
  );
}
