// components/ui/ContactForm.tsx
"use client";

import { useMemo, useState } from "react";
import { Raleway } from "next/font/google";

const raleway = Raleway({ subsets: ["latin"], weight: ["600"] });

type Errors = Partial<Record<"name" | "email" | "message" | "phone", string>>;

export default function ContactForm({ msgMax = 1200 }: { msgMax?: number }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<null | "ok" | "fail">(null);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [company, setCompany] = useState(""); // honeypot

  const errors: Errors = useMemo(() => {
    const e: Errors = {};
    if (!name.trim()) e.name = "Please enter your name.";
    if (!email.trim()) e.email = "Please enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Please enter a valid email.";
    if (!message.trim()) e.message = "Please write a brief message.";
    else if (message.length > msgMax)
      e.message = `Please keep your message under ${msgMax} characters.`;
    if (phone && !/^[\d\s()+\-\.]{7,}$/.test(phone))
      e.phone = "That phone number doesn't look right.";
    return e;
  }, [name, email, phone, message, msgMax]);

  const isInvalid = Object.keys(errors).length > 0;
  const markTouched = (f: string) => setTouched((t) => ({ ...t, [f]: true }));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(null);
    setServerMsg(null);

    if (company) {
      setSubmitted("ok"); // honeypot triggered
      return;
    }
    if (isInvalid) {
      setTouched({
        name: true,
        email: true,
        phone: !!errors.phone,
        message: true,
      });
      return;
    }

    try {
      setLoading(true);

      // ✅ RELATIVE path (rewrites → backend)
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, email, phone, message }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setSubmitted("fail");
        setServerMsg(
          text && text.length < 400
            ? text
            : "Something went wrong. Please try again."
        );
        return;
      }

      setSubmitted("ok");
      setServerMsg("Thanks! Your message has been received.");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setTouched({});
    } catch {
      setSubmitted("fail");
      setServerMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-xl bg-white/20 backdrop-blur-lg border border-white/30 px-4 py-3 text-[14px] font-light text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E8C877] focus:border-[#E8C877]";
  const fieldErr = "border-rose-300 focus:ring-rose-200 focus:border-rose-300";
  const label = "block mb-1 text-[14px] font-medium text-gray-700 select-none";
  const errText = "mt-1 text-[12px] text-rose-600";

  return (
    <form className="grid gap-5" onSubmit={onSubmit} noValidate>
      {submitted && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-xl px-4 py-3 text-sm border ${
            submitted === "ok"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {serverMsg}
        </div>
      )}

      {/* honeypot */}
      <label className="sr-only" aria-hidden="true">
        Company
        <input
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="hidden"
        />
      </label>

      {/* Name & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="cf-name" className={label}>
            Name
          </label>
          <input
            id="cf-name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            className={`${field} ${
              touched.name && errors.name ? fieldErr : ""
            }`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => markTouched("name")}
            aria-invalid={!!errors.name && touched.name}
            aria-describedby="name-err"
          />
          {touched.name && errors.name && (
            <p id="name-err" className={errText}>
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="cf-phone" className={label}>
            Phone (optional)
          </label>
          <input
            id="cf-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+1 (555) 555-5555"
            className={`${field} ${
              touched.phone && errors.phone ? fieldErr : ""
            }`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => markTouched("phone")}
            aria-invalid={!!errors.phone && touched.phone}
            aria-describedby="phone-err"
          />
          {touched.phone && errors.phone && (
            <p id="phone-err" className={errText}>
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="cf-email" className={label}>
          Email
        </label>
        <input
          id="cf-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={`${field} ${
            touched.email && errors.email ? fieldErr : ""
          }`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => markTouched("email")}
          aria-invalid={!!errors.email && touched.email}
          aria-describedby="email-err"
        />
        {touched.email && errors.email && (
          <p id="email-err" className={errText}>
            {errors.email}
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="cf-message" className={label}>
          Message
        </label>
        <div className="relative">
          <textarea
            id="cf-message"
            rows={6}
            placeholder="Tell us a bit about your project…"
            className={[field, "rounded-2xl"].join(" ")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={() => markTouched("message")}
            aria-invalid={!!errors.message && touched.message}
            aria-describedby="message-err"
            maxLength={msgMax}
          />
          <div className="absolute right-3 bottom-3 text-[12px] text-gray-500">
            {message.length}/{msgMax}
          </div>
        </div>
        {touched.message && errors.message && (
          <p id="message-err" className={errText}>
            {errors.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <div className="pt-1 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className={[
            `${raleway.className}`,
            "inline-flex items-center justify-center rounded-lg px-6 py-2 text-sm font-semibold shadow-md transition-all",
            "bg-[linear-gradient(to_right,#C78B3B_0%,#E8C877_25%,#FCEBA4_50%,#E8C877_75%,#C78B3B_100%)] text-black",
            loading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90",
          ].join(" ")}
        >
          {loading ? "Sending…" : "Submit"}
        </button>
      </div>
    </form>
  );
}
