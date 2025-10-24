// app/contact/page.tsx
"use client";

import Image from "next/image";
import ContactForm from "../../components/ui/ContactForm";
import contactArt from "../../public/images/ContactUs.jpg";
import { Raleway, Source_Sans_3 } from "next/font/google";
import { Instagram, Mail } from "lucide-react";

const raleway = Raleway({ subsets: ["latin"], weight: ["400", "700"] });
const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["200"] });

export default function ContactPage() {
  return (
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
          {/* Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full mt-8 items-center">
            {/* LEFT: all centered content */}
            <div className="order-1 md:order-1 flex flex-col items-center text-center justify-center gap-5 mt-5">
              {/* Contact Us title */}
              <div>
                <h2
                  className={`${raleway.className} text-black italic font-bold text-[26px] md:text-[32px] text-center`}
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

              {/* Get in touch badge */}
              <div
                className={`${raleway.className} inline-block rounded-full px-4 py-1 text-xs md:text-sm italic font-bold shadow-sm`}
                style={{
                  background:
                    "linear-gradient(to right, #C78B3B 0%, #E8C877 25%, #FCEBA4 50%, #E8C877 75%, #C78B3B 100%)",
                }}
              >
                Get in touch
              </div>

              {/* Description */}
              <p className="max-w-[500px] italic font-bold text-sm md:text-lg leading-relaxed">
                Find answers to the most common questions about our services,
                pricing, and support. If you can’t find what you’re looking for,
                feel free to reach out — we’re here to help. For faster
                responses, you can also message us directly on Instagram or
                email us.
              </p>

              {/* Contact links */}
              <div className="flex flex-col items-center gap-2">
                <a
                  href="https://instagram.com/cks_software"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm md:text-base font-bold text-black hover:underline"
                >
                  <Instagram className="w-5 h-5" /> @cks_software
                </a>

                <a
                  href="mailto:cks.software2021@gmail.com"
                  className="flex items-center gap-2 text-sm md:text-base font-bold text-black hover:underline"
                >
                  <Mail className="w-5 h-5" /> cks.software2021@gmail.com
                </a>
              </div>
            </div>

            {/* RIGHT: form (bottom on mobile) */}
            <div className="order-2 md:order-2 flex justify-center items-center">
              <div className="w-full max-w-[420px] bg-white rounded-[20px] shadow-xl p-6 md:p-8">
                <div className={sourceSans.className}>
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
