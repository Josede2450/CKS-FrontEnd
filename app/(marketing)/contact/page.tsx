// app/contact/page.tsx
"use client";

import Image from "next/image";
import ContactForm from "../../components/ui/ContactForm";
import contactArt from "../../public/images/ContactUs.jpg";
import { Raleway, Source_Sans_3 } from "next/font/google";

const raleway = Raleway({ subsets: ["latin"], weight: ["400", "700"] });
const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["200"] });

export default function ContactPage() {
  return (
    // ⬇️ clip any horizontal overflow from the edge-to-edge hero
    <main className="bg-white mt-12 overflow-x-clip">
      {/* TOP TAGLINE */}
      <section>
        <div className="mx-auto w-full max-w-[1200px] flex justify-center items-center">
          <p className="text-2xl md:text-4xl italic text-gray-900 text-center font-serif tracking-wide">
            Where ideas meet precision
          </p>
        </div>
      </section>

      {/* ===== Contact Hero ===== */}
      <section
        className="w-screen left-1/2 -translate-x-1/2 relative rounded-[50px] overflow-hidden mt-20"
        style={{
          background:
            "linear-gradient(to right, #376877 0%, #80A5A2 25%, #C1DAD7 50%, #80A5A2 75%, #376877 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-[1200px] h-full min-h-[650px] py-10 px-4 md:px-6 flex flex-col items-center">
          {/* Section Heading */}
          <div className="text-center">
            <h2
              className={`${raleway.className} text-black italic font-bold text-[26px] md:text-[32px]`}
            >
              Contact Us
            </h2>
            <div
              className="mx-auto mt-2 h-[3px] w-20 rounded-full"
              style={{
                background:
                  "linear-gradient(to right, #C78B3B 0%, #E8C877 25%, #FCEBA4 50%, #E8C877 75%, #C78B3B 100%)",
              }}
            />
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full mt-8">
            {/* ================= RIGHT: form (first on mobile) ================= */}
            <div className="order-1 md:order-2 flex justify-center md:justify-start items-center">
              <div className="w-full max-w-[420px] bg-white rounded-[20px] shadow-xl p-6 md:p-8">
                <div className={sourceSans.className}>
                  <ContactForm />
                </div>
              </div>
            </div>

            {/* ================= LEFT: info + styled image (second on mobile) ================= */}
            <div className="order-2 md:order-1 flex flex-col items-center text-center gap-5 mt-5">
              {/* Pill */}
              <div
                className={`${raleway.className} inline-block rounded-full px-4 py-1 text-xs md:text-sm italic font-bold shadow-sm`}
                style={{
                  background:
                    "linear-gradient(to right, #C78B3B 0%, #E8C877 25%, #FCEBA4 50%, #E8C877 75%, #C78B3B 100%)",
                }}
              >
                Get in touch
              </div>

              {/* Supporting text */}
              <p className="max-w-[500px] italic font-bold text-sm md:text-lg leading-relaxed">
                Find answers to the most common questions about our services,
                pricing, and support. If you can’t find what you’re looking for,
                feel free to reach out — we’re here to help.
              </p>

              {/* Crystal-styled image */}
              <div className="relative bg-black/10 backdrop-blur-md border border-black/20 rounded-2xl shadow-xl p-2">
                <div className="overflow-hidden rounded-xl w-[200px] h-[140px] md:w-[300px] md:h-[270px]">
                  <Image
                    src={contactArt}
                    alt="Creative contact artwork"
                    width={220}
                    height={160}
                    quality={100}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                {/* subtle crystal accent dot */}
                <span className="pointer-events-none absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-black/15 border border-black/20 backdrop-blur-sm" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
