// app/auth/register/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import towerImage from "../../public/images/tower.jpg";
import googleIcon from "../../public/images/GoogleIcon.svg";

type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

/** Read XSRF-TOKEN cookie set by Spring Security */
function getCsrfToken(): string | null {
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Ensure CSRF cookie exists by hitting a public GET that passes CsrfFilter */
async function ensureCsrfToken(apiBase: string): Promise<string | null> {
  let t = getCsrfToken();
  if (t) return t;
  try {
    await fetch(`${apiBase}/api/services`, {
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    // ignore; we'll re-check
  }
  return getCsrfToken();
}

export default function RegisterPage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ---- email & phone helpers ----
  const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
  const PHONE_MIN = 10;
  const PHONE_MAX = 15;
  const digitsOnly = (s: string) => s.replace(/\D/g, "");
  const phoneAllowed = (s: string) => /^\+?[0-9\s().-]*$/.test(s);

  // ---- password helpers ----
  const PWD_MIN = 8;
  const PWD_MAX = 64;
  function passwordIssues(pw: string): string[] {
    const issues: string[] = [];
    if (pw.length < PWD_MIN || pw.length > PWD_MAX)
      issues.push(`be ${PWD_MIN}–${PWD_MAX} characters`);
    if (!/[a-z]/.test(pw)) issues.push("include a lowercase letter");
    if (!/[A-Z]/.test(pw)) issues.push("include an uppercase letter");
    if (!/[0-9]/.test(pw)) issues.push("include a number");
    if (!/[^A-Za-z0-9]/.test(pw)) issues.push("include a special character");
    if (/\s/.test(pw)) issues.push("not contain spaces");
    return issues;
  }

  const validate = (f: FormState): Errors => {
    const err: Errors = {};

    if (!f.name.trim()) err.name = "Name is required.";

    if (!f.email.trim()) err.email = "Email is required.";
    else if (!isEmail(f.email)) err.email = "Enter a valid email.";

    if (!f.password) err.password = "Password is required.";
    else {
      const issues = passwordIssues(f.password);
      if (issues.length) err.password = `Password must ${issues.join(", ")}.`;
    }

    if (!f.confirmPassword)
      err.confirmPassword = "Please confirm your password.";
    else if (f.password !== f.confirmPassword)
      err.confirmPassword = "Passwords do not match.";

    if (!f.phone.trim()) err.phone = "Phone number is required.";
    else if (!phoneAllowed(f.phone))
      err.phone = "Only digits, spaces, +, (, ), - and . are allowed.";
    else {
      const d = digitsOnly(f.phone).length;
      if (d < PHONE_MIN || d > PHONE_MAX)
        err.phone = `Enter ${PHONE_MIN}–${PHONE_MAX} digits (currently ${d}).`;
    }

    return err;
  };

  const errors = useMemo(() => validate(form), [form]);
  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  function markTouchedAll() {
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      phone: true,
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setTouched((t) => ({ ...t, [e.target.name]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const err = validate(form);
    if (Object.keys(err).length > 0) {
      markTouchedAll();
      return;
    }

    setSubmitting(true);
    try {
      // 🔐 Ensure CSRF cookie, then include token + session
      const token = (await ensureCsrfToken(apiBase)) ?? "";

      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": token,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
        }),
      });

      if (res.ok) {
        const emailParam = encodeURIComponent(form.email.trim());
        router.push(`/login?status=verification_sent&email=${emailParam}`);
        return;
      }

      if (res.status === 401 || res.status === 403) {
        setServerError("Request was blocked. Please refresh and try again.");
        return;
      }

      const data = await res.json().catch(() => null);
      setServerError(data?.error || "Registration failed. Please try again.");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function onGoogleClick() {
    const nextUrl = `${window.location.origin}/auth/callback`;
    const url = `${apiBase}/api/auth/login/google?next=${encodeURIComponent(
      nextUrl
    )}`;
    window.location.href = url;
  }

  const inputClass = (field: keyof FormState) =>
    `w-full rounded-md border px-3 py-2 text-sm outline-none font-extralight ${
      touched[field] && errors[field]
        ? "border-red-400 focus:ring-2 focus:ring-red-300"
        : "border-[var(--color-gray)] focus:ring-2 focus:ring-[var(--color-green)]"
    }`;

  const pwdChecklist = passwordIssues(form.password);

  return (
    <main className="bg-white mt-16 md:mt-12 px-4">
      <div
        className="
          mx-auto w-full max-w-[1200px]
          flex flex-col md:flex-row items-center md:items-stretch
          rounded-[56px] overflow-hidden shadow-md
          h-auto md:h-[790px]
        "
      >
        {/* Left image — 1/2 width */}
        <div className="hidden md:flex w-1/2 bg-gray-100">
          <Image
            src={towerImage}
            alt="City tower illustration"
            className="object-cover w-full h-full"
            priority
          />
        </div>

        {/* Right form — 1/2 width */}
        <div className="flex w-full md:w-1/2 flex-col justify-center bg-[var(--color-light)] p-6 sm:p-10 md:p-12">
          <div className="mx-auto w-full max-w-md md:-translate-y-4">
            <h2 className="text-center text-[30px] font-extralight mb-6">
              Sign Up
            </h2>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-4 bg-white rounded-[50px] p-6 sm:p-7 shadow"
            >
              {/* Name */}
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClass("name")}
                  required
                />
                {touched.name && errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClass("email")}
                  required
                />
                {touched.email && errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClass("password")}
                  required
                />
                {touched.password && errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
                {!errors.password && form.password && (
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Looks good. Remember to keep it unique.
                  </p>
                )}
                {form.password && pwdChecklist.length > 0 && (
                  <ul className="mt-1 list-disc pl-5 text-[11px] text-zinc-600">
                    {pwdChecklist.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClass("confirmPassword")}
                  required
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1 (555) 123-4567"
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClass("phone")}
                  inputMode="tel"
                  pattern={String.raw`\+?[0-9\s().-]{7,20}`}
                  required
                />
                {touched.phone && errors.phone ? (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                ) : (
                  <p className="mt-1 text[11px] text-zinc-500">
                    Use 10–15 digits; you may include +, spaces, ( ), - and .
                  </p>
                )}
              </div>

              {serverError && (
                <p className="text-red-600 text-sm -mt-2">{serverError}</p>
              )}

              <button
                type="submit"
                disabled={submitting || hasErrors}
                className="w-full rounded-md bg-[var(--color-green)] py-2 text-white font-extralight hover:opacity-90 transition disabled:opacity-60"
                aria-disabled={submitting || hasErrors}
                title={hasErrors ? "Please fix the highlighted fields" : ""}
              >
                {submitting ? "Creating..." : "Create account"}
              </button>

              <div className="flex items-center gap-2 my-3">
                <span className="h-px flex-1 bg-gray-300"></span>
                <span className="text-xs text-gray-500">Or</span>
                <span className="h-px flex-1 bg-gray-300"></span>
              </div>

              <button
                type="button"
                onClick={onGoogleClick}
                className="w-[260px] h-[56px] mx-auto flex items-center justify-center gap-2 border border-[var(--color-gray)] rounded-[25px] text-sm font-extralight bg-[var(--color-gray)] hover:opacity-90 transition"
              >
                <Image
                  src={googleIcon}
                  alt="Google Logo"
                  width={22}
                  height={22}
                />
                Continue with Google
              </button>
            </form>

            <p className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[var(--color-blue)] hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
