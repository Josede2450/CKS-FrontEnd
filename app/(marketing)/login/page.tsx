"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import loginPicture from "../../public/images/login-picture.jpg";
import googleIcon from "../../public/images/GoogleIcon.svg";

export default function LoginPage() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Where to go after login (default: home)
  const returnTo = useMemo(
    () => searchParams.get("next") ?? "/",
    [searchParams]
  );

  // Banner from verification redirect
  const verified = searchParams.get("verified"); // "true" | "false" | null
  const flash = useMemo(() => {
    if (verified === "true") {
      return {
        kind: "success" as const,
        text: "Account verified successfully. You can now log in.",
      };
    }
    if (verified === "false") {
      return {
        kind: "error" as const,
        text: "Invalid or expired verification link.",
      };
    }
    return null;
  }, [verified]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 204 || res.ok) {
        // Notify (optional) and do a full reload so Navbar reads the new session immediately
        try {
          window.dispatchEvent(new Event("cks:auth-changed"));
        } catch {}
        window.location.assign(returnTo);
        return;
      }

      const data = await res.json().catch(() => null);
      setError(
        data?.error === "Account is not verified"
          ? "Please verify your email before logging in."
          : data?.error || "Invalid email or password."
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function onGoogleClick() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
    const nextUrl = `${window.location.origin}/auth/callback`; // ensure this route exists and sets the session
    const url = `${apiBase}/api/auth/login/google?next=${encodeURIComponent(
      nextUrl
    )}`;
    window.location.href = url;
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
        <div className="hidden md:flex w-1/2 bg-gray-100">
          <Image
            src={loginPicture}
            alt="Login Illustration"
            className="object-cover w-full h-full"
            priority
          />
        </div>

        <div className="flex w-full md:w-1/2 flex-col justify-center bg-[var(--color-light)] p-6 sm:p-8">
          <div className="mx-auto w-full max-w-sm md:-translate-y-6">
            <h2 className="text-center text-[30px] font-extralight mb-6">
              Log In
            </h2>

            {/* Flash banner */}
            {flash && (
              <div
                className={[
                  "mb-4 rounded-lg p-3 text-sm",
                  flash.kind === "success"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200",
                ].join(" ")}
              >
                {flash.text}
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
              <input
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-[var(--color-gray)] px-3 py-2 text-sm outline-none font-extralight"
                required
              />

              {error && <p className="text-red-600 text-sm -mt-2">{error}</p>}

              <button
                disabled={submitting}
                className="w-full rounded-md bg-[var(--color-green)] py-2 text-white font-extralight hover:opacity-90 transition disabled:opacity-60"
              >
                {submitting ? "Signing in…" : "Sign In"}
              </button>

              <div className="text-center text-xs">
                <Link
                  href="/auth/forgot-password"
                  className="text-[14px] italic text-[var(--color-blue)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="text-center text-[14px] italic">
                New to CKS?{" "}
                <Link
                  href="/auth/register"
                  className="text-[14px] italic text-[var(--color-blue)] hover:underline"
                >
                  Create an account
                </Link>
              </div>

              <div className="flex items-center gap-2 my-3">
                <span className="h-px flex-1 bg-gray-300"></span>
                <span className="text-xs text-gray-500">OR</span>
                <span className="h-px flex-1 bg-gray-300"></span>
              </div>

              <button
                type="button"
                onClick={onGoogleClick}
                className="w-[225px] h-[55px] mx-auto flex items-center justify-center gap-2 border border-[var(--color-gray)] rounded-[25px] text-sm font-extralight bg-[var(--color-gray)] hover:opacity-90 transition"
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
          </div>
        </div>
      </div>
    </main>
  );
}
