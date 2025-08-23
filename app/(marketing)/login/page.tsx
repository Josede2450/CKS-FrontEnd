"use client";

import Image from "next/image";
import Link from "next/link";
import loginPicture from "../../public/images/login-picture.jpg";
import googleIcon from "../../public/images/GoogleIcon.svg"; // ✅ import the icon

export default function LoginPage() {
  return (
    // starts just below the navbar; add px for safe side gutters on small screens
    <main className="bg-white mt-12 px-4">
      {/* Max 1200, responsive height: auto on mobile, 625px on md+ */}
      <div
        className="
        mx-auto w-full max-w-[1200px]
        flex flex-col md:flex-row items-center md:items-stretch
        rounded-[50px] overflow-hidden shadow-md
        h-auto md:h-[625px]
      "
      >
        {/* Left image: only show on md+ so mobile stays clean */}
        <div className="hidden md:flex w-1/2 bg-gray-100">
          <Image
            src={loginPicture}
            alt="Login Illustration"
            className="object-cover w-full h-full"
            priority
          />
        </div>

        {/* Right side form */}
        <div className="flex w-full md:w-1/2 flex-col justify-center bg-[var(--color-light)] p-6 sm:p-8">
          <div className="mx-auto w-full max-w-sm md:-translate-y-6">
            <h2 className="text-center text-[30px] font-extralight mb-6">
              Log In
            </h2>

            {/* Inner card */}
            <div className="space-y-4 bg-white rounded-[50px] p-5 sm:p-6 shadow">
              <input
                type="email"
                placeholder="Email"
                className="w-full rounded-md border border-[var(--color-gray)] px-3 py-2 text-sm outline-none font-extralight"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full rounded-md border border-[var(--color-gray)] px-3 py-2 text-sm outline-none font-extralight"
              />

              <button className="w-full rounded-md bg-[var(--color-green)] py-2 text-white font-extralight hover:opacity-90 transition">
                Sign In
              </button>

              <div className="text-center text-xs">
                <Link
                  href="#"
                  className="text-[14px] italic text-[var(--color-blue)] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="text-center text-[14px] italic">
                New to CKS?{" "}
                <Link
                  href="#"
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

              <button className="w-[225px] h-[55px] mx-auto flex items-center justify-center gap-2 border border-[var(--color-gray)] rounded-[25px] text-sm font-extralight bg-[var(--color-gray)] hover:opacity-90 transition">
                <Image
                  src={googleIcon}
                  alt="Google Logo"
                  width={22}
                  height={22}
                />
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
