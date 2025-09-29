// app/auth/reset-password/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import doubleFace from "../../public/images/doubleface.jpg";

// ✅ import the CSRF-aware fetch wrapper
import { fetchWithCsrf } from "../../lib/fetchWithCsrf";

type FormState = {
  password: string;
  confirmPassword: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") ?? "").trim();

  const [form, setForm] = useState<FormState>({
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

  // ---- password rules (same as register) ----
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
    if (!f.password) err.password = "Password is required.";
    else {
      const issues = passwordIssues(f.password);
      if (issues.length) err.password = `Password must ${issues.join(", ")}.`;
    }
    if (!f.confirmPassword)
      err.confirmPassword = "Please confirm your password.";
    else if (f.password !== f.confirmPassword)
      err.confirmPassword = "Passwords do not match.";
    return err;
  };

  const errors = useMemo(() => validate(form), [form]);
  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);
  const pwdChecklist = passwordIssues(form.password);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setTouched((t) => ({ ...t, [e.target.name]: true }));
  }

  function markTouchedAll() {
    setTouched({ password: true, confirmPassword: true });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!token) {
      setServerError(
        "Missing or invalid reset token. Please use the link from your email."
      );
      return;
    }

    const err = validate(form);
    if (Object.keys(err).length > 0) {
      markTouchedAll();
      return;
    }

    setSubmitting(true);
    setOk(false);

    try {
      // ✅ Use CSRF-aware wrapper and env-based API
      const res = await fetchWithCsrf(`${apiBase}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: form.password }),
      });

      if (res.ok) {
        setOk(true);
        setForm({ password: "", confirmPassword: "" });
      } else {
        const data = await res.json().catch(() => null);
        setServerError(
          data?.error ||
            "Unable to reset password. The link might be invalid or expired."
        );
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field: keyof FormState) =>
    `w-full rounded-md border px-3 py-2 text-sm outline-none font-extralight ${
      touched[field] && errors[field]
        ? "border-red-400 focus:ring-2 focus:ring-red-300"
        : "border-[var(--color-gray)] focus:ring-2 focus:ring-[var(--color-green)]"
    }`;

  const disableForm = submitting || hasErrors || !token;

  return (
    <main className="bg-white mt-12 px-4">
      <div
        className="
          mx-auto w-full max-w-[1200px]
          flex flex-col md:flex-row items-center md:items-stretch
          rounded-[50px] overflow-hidden shadow-md
          h-auto md:h-[625px]
        "
      >
        {/* Left: illustration */}
        <div className="hidden md:flex w-1/2 bg-gray-100">
          <Image
            src={doubleFace}
            alt="Reset Password Illustration"
            className="object-cover w-full h-full"
            priority
          />
        </div>

        {/* Right: form */}
        <div className="flex w-full md:w-1/2 flex-col justify-center bg-[var(--color-light)] p-6 sm:p-8">
          <div className="mx-auto w-full max-w-sm md:-translate-y-6">
            <h2 className="text-center text-[30px] font-extralight mb-6">
              Reset Password
            </h2>

            {!token && (
              <div className="mb-4 rounded-lg p-3 text-sm bg-red-100 text-red-800 border border-red-200">
                Missing or invalid token. Please open the reset link from your
                email again.
              </div>
            )}

            {ok && (
              <div className="mb-4 rounded-lg p-3 text-sm bg-green-100 text-green-800 border border-green-200">
                Password reset successful. You can now{" "}
                <Link href="/login" className="underline">
                  log in
                </Link>
                .
              </div>
            )}
            {serverError && (
              <div className="mb-4 rounded-lg p-3 text-sm bg-red-100 text-red-800 border border-red-200">
                {serverError}
              </div>
            )}

            <form
              onSubmit={onSubmit}
              noValidate
              className="space-y-4 bg-white rounded-[50px] p-5 sm:p-6 shadow"
            >
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="New password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClass("password")}
                  required
                  disabled={!token || submitting}
                />
                {touched.password && errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
                {form.password && pwdChecklist.length > 0 && (
                  <ul className="mt-1 list-disc pl-5 text-[11px] text-zinc-600">
                    {pwdChecklist.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClass("confirmPassword")}
                  required
                  disabled={!token || submitting}
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                disabled={disableForm}
                className="w-full rounded-md bg-[var(--color-green)] py-2 text-white font-extralight hover:opacity-90 transition disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-[14px] italic text-[var(--color-blue)] hover:underline"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
