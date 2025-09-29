// app/auth/forgot-password/page.tsx
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import anonImg from "../../public/images/annonymous.jpg";

// ✅ Use CSRF-aware fetch wrapper
import { fetchWithCsrf } from "../../lib/fetchWithCsrf";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL!;

  const disabled = useMemo(
    () => submitting || !email || !/^\S+@\S+\.\S+$/.test(email),
    [submitting, email]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setOk(false);

    try {
      // ✅ use CSRF wrapper with env base
      const res = await fetchWithCsrf(`${apiBase}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        setOk(true);
        setEmail("");
        return;
      }

      if (res.status === 401 || res.status === 403) {
        setError("Request was blocked. Please refresh and try again.");
        return;
      }

      const data = await res.json().catch(() => null);
      setError(
        data?.error || "We couldn't process your request. Please try again."
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

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
        {/* Left side: illustration */}
        <div className="hidden md:flex w-1/2 bg-gray-100">
          <Image
            src={anonImg}
            alt="Reset illustration"
            className="object-cover w-full h-full"
            priority
          />
        </div>

        {/* Right side: form */}
        <div className="flex w-full md:w-1/2 flex-col justify-center bg-[var(--color-light)] p-6 sm:p-8">
          <div className="mx-auto w-full max-w-sm md:-translate-y-6">
            <h2 className="text-center text-[30px] font-extralight mb-6">
              Reset Password
            </h2>

            <p className="text-center text-sm text-gray-500 mb-4">
              Enter the email associated with your account and we’ll send you a
              link to reset your password.
            </p>

            {ok && (
              <div className="mb-4 rounded-lg p-3 text-sm bg-green-100 text-green-800 border border-green-200">
                If the account exists, a reset link has been sent.
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-lg p-3 text-sm bg-red-100 text-red-800 border border-red-200">
                {error}
              </div>
            )}

            <form
              onSubmit={onSubmit}
              className="space-y-4 bg-white rounded-[50px] p-5 sm:p-6 shadow"
            >
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-[var(--color-gray)] px-3 py-2 text-sm outline-none font-extralight"
                required
              />

              <button
                disabled={disabled}
                className="w-full rounded-md bg-[var(--color-green)] py-2 text-white font-extralight hover:opacity-90 transition disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send Reset Link"}
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
