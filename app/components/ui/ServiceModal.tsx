// components/ui/ServiceModal.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, MouseEvent } from "react";

type ServiceDetail = {
  id: number;
  title: string;
  description: string;
  image_url?: string;
  summary?: string;
  priceRange?: string | null;
  duration?: string | null;

  // popularity flags (optional)
  mostPopular?: boolean | 0 | 1;
  most_popular?: boolean | 0 | 1;
  popular?: boolean | 0 | 1;
  featured?: boolean | 0 | 1;
};

export default function ServiceModal({
  open,
  onClose,
  service,
}: {
  open: boolean;
  onClose: () => void;
  service: ServiceDetail | null;
}) {
  // ESC to close modal
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock background scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function stop(e: MouseEvent) {
    e.stopPropagation();
  }

  const summaryText =
    service?.summary?.trim() ||
    (service?.description ? service.description.split(/(?<=\.)\s/)[0] : "");

  const isPopular =
    !!service?.mostPopular ||
    !!service?.most_popular ||
    !!service?.popular ||
    !!service?.featured;

  return (
    <AnimatePresence>
      {open && service && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[80] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className="
              fixed left-1/2 top-1/2 z-[90]
              -translate-x-1/2 -translate-y-1/2
              w-[92vw] max-w-[1100px]
              h-[70dvh] md:h-[60vh]
              bg-white rounded-3xl shadow-2xl overflow-hidden
              flex flex-col md:flex-row
              min-h-0
            "
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={stop}
          >
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="
                md:hidden absolute top-3 right-3
                grid place-items-center h-9 w-9 rounded-full
                bg-gradient-to-br from-[#F84E33] to-[#890F4C]
                text-white shadow-md hover:scale-[1.05] transition
              "
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>

            {/* LEFT: Scrollable Content */}
            <div
              className="
                flex-1 px-6 py-6 md:px-10 md:py-10
                overflow-y-auto max-h-full min-h-0
                touch-pan-y
              "
              style={{
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
              }}
            >
              <div className="mx-auto max-w-[680px] text-center">
                {/* Title */}
                <h2 className="text-xl md:text-2xl font-semibold italic text-gray-900">
                  {service.title}
                </h2>

                {/* Accent bar */}
                <div
                  className="mx-auto mt-2 h-[3px] w-24 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #F84E33 0%, #890F4C 100%)",
                  }}
                />

                {/* Description — now supports rich HTML */}
                <div
                  className="
                    mt-6
                    text-[16px] md:text-base
                    text-gray-700 leading-7 tracking-[0.005em]
                    prose prose-gray max-w-none text-justify
                  "
                  dangerouslySetInnerHTML={{
                    __html: service.description || "",
                  }}
                />

                {/* Price & Duration Cards */}
                {(service.priceRange || service.duration) && (
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {service.priceRange && (
                      <div className="rounded-2xl border border-gray-200/70 bg-gradient-to-b from-white to-gray-50 shadow-sm px-5 py-4">
                        <div className="mx-auto mb-2 h-9 w-9 rounded-full grid place-items-center bg-emerald-50 text-[#2C8B7E]">
                          $
                        </div>
                        <div className="text-[16px] md:text-base font-semibold text-gray-900">
                          Price Range
                        </div>
                        <div className="mt-1 text-[16px] md:text-sm text-gray-700">
                          <span className="opacity-60">Starting from </span>
                          <strong>{service.priceRange}</strong>
                        </div>
                      </div>
                    )}

                    {service.duration && (
                      <div className="rounded-2xl border border-gray-200/70 bg-gradient-to-b from-white to-gray-50 shadow-sm px-5 py-4">
                        <div className="mx-auto mb-2 h-9 w-9 rounded-full grid place-items-center bg-indigo-50 text-indigo-600">
                          ⏱
                        </div>
                        <div className="text-[16px] md:text-base font-semibold text-gray-900">
                          Duration
                        </div>
                        <div className="mt-1 text-[16px] md:text-sm text-gray-700">
                          <strong>{service.duration}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CTA */}
                <div className="mt-8 flex justify-center">
                  <a
                    href="/contact"
                    className="
                      w-[200px] md:w-[300px]
                      flex items-center justify-center
                      rounded-[10px]
                      px-6 py-3
                      text-[16px] font-semibold text-white
                      shadow-md
                      bg-gradient-to-r from-[#F84E33] to-[#890F4C]
                      hover:opacity-90 transition
                    "
                    aria-label="Contact Us"
                  >
                    Contact Us
                  </a>
                </div>

                {/* MOBILE IMAGE PANEL */}
                {service.image_url && (
                  <div
                    className="md:hidden mt-6 rounded-[22px] px-4 py-5 flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, #F84E33 0%, #890F4C 50%, #0F0200 100%)",
                    }}
                  >
                    <div className="w-full flex flex-col items-center justify-center text-center relative">
                      <div
                        className="
                          mx-auto relative
                          rounded-2xl overflow-hidden ring-1 ring-black/15 shadow-lg bg-black/10
                          w-[230px] h-[135px]
                        "
                      >
                        {isPopular && (
                          <div className="absolute top-3 right-3 h-6 pointer-events-none">
                            <span className="rounded-full bg-amber-500 text-white text-[10px] font-bold px-3 py-1 shadow-sm">
                              Popular
                            </span>
                          </div>
                        )}
                        <img
                          src={service.image_url}
                          alt={service.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {summaryText && (
                        <div
                          className="
                            mt-4 max-w-[95%]
                            rounded-full 
                            bg-gradient-to-r from-[#F84E33] to-[#890F4C]
                            text-white shadow-md
                            px-5 py-2
                            text-[14px] font-semibold tracking-wide
                          "
                        >
                          {summaryText}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Desktop Gradient Panel */}
            <div
              className="
                relative hidden md:flex md:w-[440px]
                items-center justify-center
                px-6 py-10 md:rounded-l-[28px] min-h-0
              "
              style={{
                background:
                  "linear-gradient(135deg, #F84E33 0%, #890F4C 50%, #0F0200 100%)",
              }}
            >
              {/* Divider Glow */}
              <span
                aria-hidden
                className="absolute left-0 top-0 h-full w-[3px]"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.7), rgba(255,255,255,0))",
                }}
              />

              {/* Desktop Close Button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 grid place-items-center h-8 w-8 rounded-full bg-white text-[#6b21a8] shadow-md hover:scale-[1.03] transition"
                aria-label="Close"
                title="Close"
              >
                ✕
              </button>

              {service.image_url && (
                <div className="space-y-4 text-center relative">
                  <div className="mx-auto relative w-[300px] h-[190px] rounded-2xl overflow-hidden ring-1 ring-white/20 shadow-lg">
                    {isPopular && (
                      <div className="absolute top-3 right-3 h-6 pointer-events-none">
                        <span className="rounded-full bg-amber-500 text-white text-[10px] font-bold px-3 py-1 shadow-sm">
                          Popular
                        </span>
                      </div>
                    )}
                    <img
                      src={service.image_url}
                      alt={service.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {summaryText && (
                    <div className="mx-auto max-w-[300px] rounded-full bg-white/15 text-white/95 px-4 py-1.5 text-sm">
                      {summaryText}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
