// app/account/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type CurrentUser = {
  authenticated?: boolean;
  id?: number;
  email?: string;
  firstName?: string;
  lastName?: string | null;
  phone?: string | null;
  picture?: string | null; // MeDto.picture (avatarUrl or google picture)
};

function ReadonlyRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  const text =
    typeof value === "string" && value.trim().length > 0 ? value : "—";
  return (
    <div className="w-full">
      <div className="mb-1 text-center text-xs text-gray-500">{label}</div>
      <div className="mx-auto w-full max-w-[380px] rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-center text-sm shadow-sm">
        {text}
      </div>
    </div>
  );
}

function EditRow({
  label,
  value,
  onChange,
  name,
  type = "text",
  error,
  helper,
}: {
  label: string;
  value?: string | null;
  onChange: (v: string) => void;
  name: string;
  type?: "text" | "tel" | "email";
  error?: string | null;
  helper?: string | null;
}) {
  return (
    <div className="w-full">
      <label
        htmlFor={name}
        className="mb-1 block text-center text-xs text-gray-500"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`mx-auto block w-full max-w-[380px] rounded-full border bg-white px-5 py-2.5 text-sm text-center outline-none focus:ring-2 ${
          error
            ? "border-red-400 focus:ring-red-300"
            : "border-zinc-300 focus:ring-[var(--color-green)]"
        }`}
        autoComplete="off"
        inputMode={type === "tel" ? "tel" : undefined}
        pattern={type === "tel" ? String.raw`\+?[0-9\s().-]{7,20}` : undefined}
        aria-invalid={!!error}
        aria-describedby={helper ? `${name}-helper` : undefined}
      />
      {helper && (
        <div
          id={`${name}-helper`}
          className="mt-1 text-center text-[11px] text-zinc-500"
        >
          {helper}
        </div>
      )}
      {error && (
        <div className="mt-1 text-center text-[12px] text-red-600">{error}</div>
      )}
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // edit state
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  // phone validation
  const PHONE_MIN = 10;
  const PHONE_MAX = 15;
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneDigits, setPhoneDigits] = useState<number>(0);
  const digitsOnly = (s: string) => s.replace(/\D/g, "");
  const phoneAllowedChars = (s: string) => /^\+?[0-9\s().-]*$/.test(s);
  const validatePhone = (raw: string) => {
    const trimmed = raw.trim();
    const digits = digitsOnly(trimmed).length;
    setPhoneDigits(digits);

    if (trimmed === "") {
      setPhoneError(null); // optional field
      return true;
    }
    if (!phoneAllowedChars(trimmed)) {
      setPhoneError("Only digits, spaces, +, (, ), - and . are allowed.");
      return false;
    }
    if (digits < PHONE_MIN || digits > PHONE_MAX) {
      setPhoneError(
        `Enter between ${PHONE_MIN} and ${PHONE_MAX} digits (currently ${digits}).`
      );
      return false;
    }
    setPhoneError(null);
    return true;
  };

  // avatar upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ---- fetch current user (MeDto) ----
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/users/me`, {
          credentials: "include",
          headers: { Accept: "application/json" },
          signal: ac.signal,
        });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error(`Failed ${res.status}`);
        const body = (await res.json()) as CurrentUser;

        const user: CurrentUser = {
          authenticated: true,
          id: (body as any).id,
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          phone: body.phone ?? null,
          picture: body.picture ?? null,
        };
        setMe(user);
        setFirstName(user.firstName ?? "");
        setLastName(user.lastName ?? "");
        setPhone(user.phone ?? "");
        setPhoneDigits(digitsOnly(user.phone ?? "").length);
        setPhoneError(null);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setErr(e?.message ?? "Could not load profile");
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [router]);

  // validate live while editing
  useEffect(() => {
    if (editing) validatePhone(phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, editing]);

  // initials fallback (if no image)
  const initials = useMemo(() => {
    const fi = (me?.firstName ?? "").trim().charAt(0).toUpperCase();
    const li = (me?.lastName ?? "").trim().charAt(0).toUpperCase();
    return fi + li || (me?.email?.charAt(0)?.toUpperCase() ?? "");
  }, [me]);

  const avatarUrl = me?.picture || null;

  function enterEdit() {
    setFirstName(me?.firstName ?? "");
    setLastName(me?.lastName ?? "");
    setPhone(me?.phone ?? "");
    setPhoneDigits(digitsOnly(me?.phone ?? "").length);
    setPhoneError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setFirstName(me?.firstName ?? "");
    setLastName(me?.lastName ?? "");
    setPhone(me?.phone ?? "");
    setPhoneDigits(digitsOnly(me?.phone ?? "").length);
    setPhoneError(null);
    setEditing(false);
  }

  async function saveEdit() {
    if (!validatePhone(phone)) {
      setErr("Please fix the phone number before saving.");
      return;
    }
    setErr(null);

    try {
      setSaving(true);
      const res = await fetch(`/api/users/me`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone }),
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      const updated = (await res.json()) as CurrentUser;
      const user: CurrentUser = {
        authenticated: true,
        id: (updated as any).id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone ?? null,
        picture: updated.picture ?? null,
      };
      setMe(user);
      setEditing(false);
    } catch (e: any) {
      setErr(e?.message ?? "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarFile(file: File) {
    // Simple client validation
    const maxMB = 5;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      alert(`Please choose an image under ${maxMB} MB.`);
      return;
    }

    setUploading(true);
    setErr(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/users/me/avatar`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const { url } = (await res.json()) as { url: string };

      // cache-bust to ensure the new image shows immediately
      const busted = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
      setMe((prev) => (prev ? { ...prev, picture: busted } : prev));
    } catch (e: any) {
      setErr(e?.message ?? "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  }

  const phoneHelper =
    editing && phone.trim() !== ""
      ? `${phoneDigits} digit${
          phoneDigits === 1 ? "" : "s"
        } (allowed: ${PHONE_MIN}–${PHONE_MAX})`
      : null;

  const saveDisabled = saving || uploading || (editing && phoneError !== null);

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto w-full max-w-[1100px] px-4 md:px-6 py-8 md:py-10">
        <h1 className="mb-6 text-center text-2xl md:text-3xl italic">
          My Account
        </h1>

        <div className="mx-auto max-w-[680px] rounded-[28px] border border-zinc-200 bg-white shadow-sm">
          <div className="px-6 py-8 md:py-10">
            {/* Avatar with hover edit */}
            <div className="mb-6 flex justify-center">
              <div className="relative group">
                <div
                  className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-zinc-100 ring-1 ring-zinc-200 md:h-28 md:w-28"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  title="Change photo"
                  aria-label="Change profile photo"
                >
                  {avatarUrl ? (
                    // plain <img> avoids Next.js image-domain config
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                  ) : (
                    <span className="select-none text-2xl text-zinc-500">
                      {initials}
                    </span>
                  )}

                  {/* hover overlay */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 hidden items-center justify-center rounded-full bg-black/40 text-white group-hover:flex"
                    title="Change photo"
                  >
                    {uploading ? "Uploading…" : "Change"}
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAvatarFile(f);
                    // allow selecting same file again
                    e.currentTarget.value = "";
                  }}
                />
              </div>
            </div>

            {/* Content */}
            {loading && (
              <p className="text-center text-sm text-zinc-500">Loading…</p>
            )}
            {err && !loading && (
              <p className="mb-3 text-center text-sm text-red-600">{err}</p>
            )}

            {!loading && !err && (
              <div className="grid gap-4 md:gap-5">
                {editing ? (
                  <>
                    <EditRow
                      label="Name"
                      name="firstName"
                      value={firstName}
                      onChange={setFirstName}
                    />
                    <EditRow
                      label="Last name"
                      name="lastName"
                      value={lastName}
                      onChange={setLastName}
                    />
                    <EditRow
                      label="Phone"
                      name="phone"
                      type="tel"
                      value={phone}
                      onChange={setPhone}
                      error={phoneError}
                      helper={phoneHelper}
                    />

                    <div className="mt-2 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={saveDisabled}
                        className="rounded-full bg-[var(--color-green)] px-6 py-2 text-sm font-semibold text-white hover:bg-[var(--color-green)]/90 disabled:opacity-60"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={saving}
                        className="rounded-full border px-6 py-2 text-sm hover:bg-zinc-50 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <ReadonlyRow label="Name" value={me?.firstName} />
                    <ReadonlyRow label="Last name" value={me?.lastName ?? ""} />
                    <ReadonlyRow label="Email" value={me?.email ?? ""} />
                    <ReadonlyRow label="Phone" value={me?.phone ?? ""} />

                    <div className="mt-2 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={enterEdit}
                        className="rounded-full border px-6 py-2 text-sm hover:bg-zinc-50"
                      >
                        Edit
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
