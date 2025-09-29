// app/about/page.tsx
"use client";

import Image from "next/image";

// images (put under /public/images)
import leftFace from "../../public/images/LeftFace.jpg";
import brain from "../../public/images/brain.jpg";
import signature from "../../public/images/signature.png";
import heroSignature from "../../public/images/HeroSignature.svg"; // tagline
import computer from "../../public/images/computer.jpg";

export default function AboutPage() {
  return (
    // ⬇️ prevent any accidental horizontal scroll
    <main className="bg-white overflow-x-clip">
      {/* spacer for fixed nav if you have one */}
      <div className="h-12 md:h-16" />

      {/* ===== TOP TAGLINE ===== */}
      <section className="px-6">
        <div className="mx-auto w-full max-w-[1200px]">
          <div
            className="
        grid grid-cols-1 md:grid-cols-[auto_auto]
        justify-center items-center
        gap-3 md:gap-8
        text-center md:text-left
      "
          >
            {/* Tagline text */}
            <p className="text-2xl md:text-4xl text-gray-900 italic mx-auto md:mx-0">
              We make it possible
            </p>

            {/* Brush (kept small so it never pushes the text) */}
            <div className="w-20 sm:w-28 md:w-40 mx-auto md:mx-0">
              <Image
                src={heroSignature}
                alt="Signature brush"
                width={220}
                height={220}
                className="object-contain opacity-90"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Top gradient panel (edge-to-edge with rounded 50px) ===== */}
      <section
        className="w-full overflow-hidden px-6 md:px-10 py-10 md:py-14 rounded-[50px] md:h-[450px] relative"
        style={{
          background: "linear-gradient(140deg,#2BD879 0%, #052C48 100%)",
        }}
      >
        {/* subtle glow accents */}
        <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full bg-black/30 blur-2xl" />

        <div className="mx-auto w-full max-w-[1200px] h-full">
          {/* DESKTOP LAYOUT */}
          <div className="relative z-10 hidden md:grid md:grid-cols-[220px_1fr_220px] items-center gap-10 h-full">
            {/* left portrait */}
            <div className="flex justify-start">
              <div className="relative bg-white/20 backdrop-blur-md rounded-3xl p-2 shadow-[0_12px_30px_rgba(0,0,0,0.25)] ring-1 ring-white/30">
                <div className="overflow-hidden rounded-2xl w-[220px] h-[350px]">
                  <Image
                    src={leftFace}
                    alt="Creative portrait left"
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* center copy */}
            <div className="text-center text-white">
              <p className="max-w-[60ch] mx-auto text-[16px] md:text-[20px] italic leading-relaxed font-semibold text-white">
                CKS is a digital solutions company focused on helping businesses
                succeed in the modern world. We offer Software Development,
                Marketing, Design, and IT Support — providing innovative
                solutions that empower companies to grow, adapt, and thrive.
              </p>
            </div>

            {/* right portrait */}
            <div className="flex justify-end">
              <div className="relative bg-white/20 backdrop-blur-md rounded-3xl p-2 shadow-[0_12px_30px_rgba(0,0,0,0.25)] ring-1 ring-white/30">
                <div className="overflow-hidden rounded-2xl w-[220px] h-[350px]">
                  <Image
                    src={leftFace}
                    alt="Creative portrait right"
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE LAYOUT */}
          <div className="relative z-10 md:hidden flex flex-col items-center text-center">
            <div className="w-full max-w-[380px] bg-white/20 backdrop-blur-md rounded-[26px] px-6 py-6 shadow ring-1 ring-white/30">
              <p className="max-w-[60ch] mx-auto italic text-[16px] text-white leading-relaxed">
                CKS is a digital solutions company focused on helping businesses
                succeed in the modern world. We specialize in web development,
                custom software solutions, and reliable IT support that empower
                companies to grow, adapt, and innovate.
              </p>
            </div>

            {/* portraits row */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="relative bg-white/20 backdrop-blur-md w-[140px] h-[190px] rounded-[30px] overflow-hidden shadow ring-1 ring-white/30">
                <Image
                  src={leftFace}
                  alt="Creative portrait 1"
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <div className="relative bg-white/20 backdrop-blur-md w-[140px] h-[190px] rounded-[30px] overflow-hidden shadow ring-1 ring-white/30">
                <Image
                  src={leftFace}
                  alt="Creative portrait 2"
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Mission (glass card, badge + checklist) ===== */}
      <section
        className="w-full mt-12 md:mt-16 mb-12 md:mb-16 rounded-[50px]"
        style={{
          background: "linear-gradient(135deg,#F5F5F5 0%, #0B1F2F 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-[1100px] py-12 md:py-16 px-6 md:px-10">
          <div className="bg-white/70 backdrop-blur-md rounded-[30px] px-6 md:px-10 py-8 md:py-10 shadow ring-1 ring-black/5">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] items-center gap-8 md:gap-10">
              {/* text */}
              <div className="text-center md:text-left flex flex-col items-center md:items-start">
                <span className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-[#0b2236] bg-[#2BD879]/15 ring-1 ring-[#2BD879]/30">
                  Our purpose
                </span>
                <h2 className="italic text-[24px] sm:text-[28px] md:text-[32px] text-gray-900">
                  Mission
                </h2>

                <div className="mt-3 h-px w-16 bg-gradient-to-r from-[#2BD879] to-[#0b2236] rounded-full" />

                <p className="mt-4 italic text-[16px] sm:text-[20px] leading-relaxed text-gray-800 max-w-[70ch]">
                  Our mission is to combine creativity, technical expertise, and
                  strategic knowledge to deliver solutions that are not only
                  functional but also future-ready. From professional websites
                  and managed IT to custom digital platforms, every project is
                  aligned with your business goals.
                </p>

                {/* checklist */}
                <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700">
                  {[
                    "Human-centered design",
                    "Engineering quality & security",
                    "Measurable business outcomes",
                    "Reliable long-term support",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm md:text-base"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="#2BD879"
                      >
                        <path d="M7.629 13.233 4.4 10.004l1.2-1.2 2.029 2.03 6.771-6.77 1.2 1.2-7.971 7.97z" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* image */}
              <div className="flex justify-center md:justify-end">
                <div
                  className="
                    relative p-[3px]
                    rounded-full md:rounded-[26px]
                    bg-[linear-gradient(135deg,#F5F5F5_0%,#0B1F2F_100%)]
                  "
                >
                  <div
                    className="
                      w-[220px] h-[220px] md:w-[360px] md:h-[240px]
                      overflow-hidden bg-white
                      rounded-full md:rounded-[24px]
                      shadow ring-1 ring-black/5
                    "
                  >
                    <Image
                      src={brain}
                      alt="Brain illustration"
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Bottom gradient panel ===== */}
      <section
        className="w-full overflow-hidden px-6 md:px-10 py-10 md:py-14 rounded-[50px] mt-10"
        style={{
          background: "linear-gradient(140deg,#2BD879 0%, #052C48 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-10 items-center text-center md:text-left">
            {/* image left */}
            <div className="relative flex justify-center md:justify-start">
              {/* subtle decorative blob */}
              <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-white/20 blur-xl" />
              {/* image card */}
              <div className="relative bg-white/20 backdrop-blur-md rounded-3xl p-2 shadow-[0_12px_30px_rgba(0,0,0,0.25)] ring-1 ring-white/30">
                <div className="overflow-hidden rounded-2xl w-[240px] h-[320px] md:w-[300px] md:h-[380px]">
                  <Image
                    src={computer}
                    alt="CKS modern computing"
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                {/* corner accent */}
                <span className="pointer-events-none absolute -right-2 -bottom-2 h-10 w-10 rounded-full bg-white/30" />
              </div>
            </div>

            {/* text right */}
            <div className="order-1 text-white/95 flex flex-col items-center md:items-start">
              <span className="inline-block mb-3 rounded-full bg-white/15 px-4 py-1 text-xs tracking-wide ring-1 ring-white/25">
                End-to-end partner
              </span>

              <p className="max-w-[60ch] text-base md:text-[20px] italic leading-relaxed font-semibold">
                At CKS, we believe technology should work for you, not against
                you. That’s why we take pride in offering end-to-end services —
                from concept to launch and beyond — making us your trusted
                partner in digital transformation.
              </p>
              {/* mini highlights */}
              <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm md:text-base text-white/90">
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="opacity-90"
                  >
                    <path d="M7.629 13.233 4.4 10.004l1.2-1.2 2.029 2.03 6.771-6.77 1.2 1.2-7.971 7.97z" />
                  </svg>
                  Software development
                </li>
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="opacity-90"
                  >
                    <path d="M7.629 13.233 4.4 10.004l1.2-1.2 2.029 2.03 6.771-6.77 1.2 1.2-7.971 7.97z" />
                  </svg>
                  Marketing solutions
                </li>
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="opacity-90"
                  >
                    <path d="M7.629 13.233 4.4 10.004l1.2-1.2 2.029 2.03 6.771-6.77 1.2 1.2-7.971 7.97z" />
                  </svg>
                  Creative design
                </li>
                <li className="flex items-center justify-center md:justify-start gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="opacity-90"
                  >
                    <path d="M7.629 13.233 4.4 10.004l1.2-1.2 2.029 2.03 6.771-6.77 1.2 1.2-7.971 7.97z" />
                  </svg>
                  Reliable IT support
                </li>
              </ul>

              {/* CTA */}
              <div className="mt-6 flex justify-center md:justify-start w-full">
                <a
                  href="/services"
                  className="inline-flex items-center justify-center rounded-[14px] px-6 py-2.5
                     bg-white text-[#052C48] font-medium shadow
                     hover:bg-white/90 transition text-[14px]"
                >
                  Explore Services
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
