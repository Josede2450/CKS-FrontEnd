"use client";

import { Suspense, useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import anonImg from "../../public/images/annonymous.jpg";
import { fetchWithCsrf } from "../../lib/fetchWithCsrf"; // ✅ CSRF wrapper

function ResendVerificationInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [okText, setOkText] = useState(
    "If the account exists and is unverified, a new verification link has been sent."
  );
  const abortRef = useRef<AbortController | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

  // Pre-fill from ?email=foo@bar.com
  useEffect(() => {
    const q = searchParams.get("email");
    if (q && !email) setEmail(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetchWithCsrf(
        `${apiBase}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
          signal: abortRef.current.signal,
        }
      );

      const data = await res
        .json()
        .catch(() => ({} as { message?: string; error?: string }));

      if (res.ok) {
        setOkText(
          "If the account exists and is unverified, a new verification link has been sent."
        );
        setOk(true);
        return;
      }

      const msg = (data?.message || data?.error || "").toString();

      if (/already\s+verified/i.test(msg)) {
        setOkText("Your account is already verified. You can log in.");
        setOk(true);
        setError(null);
        return;
      }

      if (res.status === 429) {
        setError(
          data?.message ||
            "You're trying too soon. Please wait a few minutes before resending."
        );
        return;
      }

      if (res.status === 400 || res.status === 404) {
        setError(
          msg ||
            "We couldn't process your request. Please check the email and try again."
        );
        return;
      }

      setError(msg || "We couldn't process your request. Please try again.");
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="bg-white mt-12 px-4">
      <div className="mx-auto w-full max-w-[1200px] flex flex-col md:flex-row items-center md:items-stretch rounded-[50px] overflow-hidden shadow-md h-auto md:h-[625px]">
        {/* Left side */}
        <div className="hidden md:flex w-1/2 bg-gray-100">
          <Image
            src={anonImg}
            alt="Resend verification"
            className="object-cover w-full h-full"
            priority
          />
        </div>

        {/* Right side */}
        <div className="flex w-full md:w-1/2 flex-col justify-center bg-[var(--color-light)] p-6 sm:p-8">
          <div className="mx-auto w-full max-w-sm md:-translate-y-6">
            <h2 className="text-center text-[30px] font-extralight mb-6">
              Resend Verification Email
            </h2>

            <p className="text-center text-sm text-gray-500 mb-4">
              Enter your account email and we’ll send a new verification link.
            </p>

            <div aria-live="polite">
              {ok && (
                <div className="mb-4 rounded-lg p-3 text-sm bg-green-100 text-green-800 border border-green-200">
                  {okText}
                </div>
              )}
              {error && (
                <div className="mb-4 rounded-lg p-3 text-sm bg-red-100 text-red-800 border border-red-200">
                  {error}
                </div>
              )}
            </div>

            <form
              onSubmit={onSubmit}
              className="space-y-4 bg-white rounded-[50px] p-5 sm:p-6 shadow"
              noValidate
            >
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-[var(--color-gray)] px-3 py-2 text-sm outline-none font-extralight"
                required
                inputMode="email"
              />

              <button
                disabled={disabled}
                className="w-full rounded-md bg-[var(--color-green)] py-2 text-white font-extralight hover:opacity-90 transition disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send Verification Link"}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-[14px] italic text-[var(--color-blue)] hover:underline"
                >
                  Back to Login
                </Link>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Tip: check spam/junk and mark our email as “Not spam” to receive
                future messages.
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ResendVerificationPageWrapper() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-gray-600">Loading…</p>}>
      <ResendVerificationInner />
    </Suspense>
  );
}
