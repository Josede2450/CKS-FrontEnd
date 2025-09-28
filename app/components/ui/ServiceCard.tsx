// components/ui/ServiceCard.tsx
"use client";

import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import clsx from "clsx";
import React from "react";

type CategoryMini = { name?: string; slug?: string };

type ServiceCardProps = {
  title: string;
  summary?: string;
  description?: string;
  href: string;
  ctaLabel?: string;
  imageSrc?: string | StaticImageData;
  icon?: React.ReactNode;
  tag?: string; // mid-chip (hidden if "Popular")
  categories?: CategoryMini[];
  className?: string;
  onLearnMore?: () => void;
  popular?: boolean; // corner badge

  // NEW: accepted but NOT rendered here
  priceRange?: string | null;
  duration?: string | null;
};

export default function ServiceCard({
  title,
  summary,
  description,
  href,
  ctaLabel = "Learn More",
  imageSrc,
  icon,
  tag,
  categories = [],
  className,
  onLearnMore,
  popular = false,

  // keep these for downstream use (e.g., modal), but don't show on the card
  priceRange: _priceRange,
  duration: _duration,
}: ServiceCardProps) {
  // Prefer summary; fallback to description (trimmed)
  const preview =
    summary ??
    (description
      ? description.length > 140
        ? description.slice(0, 140) + "…"
        : description
      : "");

  const [imgOk, setImgOk] = React.useState(true);
  const showImage = !!imageSrc && imgOk;
  const isRemote = typeof imageSrc === "string";

  // Smaller gradient button (auto width) and no dot
  const gradientBtn =
    "px-5 py-2 rounded-[8px] " +
    "text-[14px] font-semibold text-white " +
    "shadow-md bg-gradient-to-r from-[#F84E33] to-[#890F4C] " +
    "hover:opacity-90 transition";

  // Hide mid-chip if it's literally "Popular" or when corner badge is shown
  const showMidTag =
    !!tag && tag.trim().toLowerCase() !== "popular" && !popular;

  return (
    <div
      className={clsx(
        "relative",
        "bg-white rounded-[22px] shadow-sm hover:shadow-md transition p-5 md:p-6",
        "flex flex-col items-center text-center h-[360px] w-full",
        className
      )}
    >
      {/* Corner badge with reserved space */}
      <div className="absolute top-3 right-3 h-6">
        {popular && (
          <span
            className="rounded-full bg-amber-500 text-white text-[10px] font-bold px-3 py-1 shadow-sm"
            aria-label="Popular service"
            title="Popular"
          >
            Popular
          </span>
        )}
      </div>

      {/* Image */}
      <div className="w-full max-w-[220px] h-28 md:h-32 rounded-2xl bg-gray-100 overflow-hidden mb-3 flex items-center justify-center">
        {showImage ? (
          isRemote ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc as string}
              alt={title}
              width={220}
              height={120}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgOk(false)}
            />
          ) : (
            <Image
              src={imageSrc as StaticImageData}
              alt={title}
              width={220}
              height={120}
              className="w-full h-full object-cover"
              onError={() => setImgOk(false)}
            />
          )
        ) : icon ? (
          <span className="text-4xl" aria-hidden>
            {icon}
          </span>
        ) : (
          <span className="text-3xl" aria-hidden>
            🧩
          </span>
        )}
      </div>

      {/* Optional mid-chip */}
      {showMidTag && (
        <span className="mb-1 inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
          {tag}
        </span>
      )}

      {/* Title */}
      <h3 className="text-base md:text-lg font-semibold mb-2 line-clamp-2">
        {title}
      </h3>

      {/* Categories */}
      {categories?.length ? (
        <div className="mb-2 flex flex-wrap justify-center gap-1.5 max-h-7 overflow-hidden">
          {categories.slice(0, 3).map((c, i) => (
            <span
              key={`${c.slug ?? c.name ?? i}`}
              className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] text-gray-700"
            >
              {c.name ?? c.slug ?? "—"}
            </span>
          ))}
        </div>
      ) : (
        <div className="mb-4" />
      )}

      {/* Summary */}
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
        {preview}
      </p>

      <div className="flex-1" />

      {/* CTA */}
      {onLearnMore ? (
        <button
          type="button"
          onClick={onLearnMore}
          className={gradientBtn}
          aria-label={`${ctaLabel} – ${title}`}
        >
          {ctaLabel}
        </button>
      ) : (
        <Link
          href={href || "/services"}
          className={gradientBtn}
          aria-label={`${ctaLabel} – ${title}`}
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
