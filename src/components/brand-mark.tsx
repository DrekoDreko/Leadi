"use client";

import Image from "next/image";

type BrandMarkProps = {
  tone?: "light" | "dark";
};

export function BrandMark({ tone = "light" }: BrandMarkProps) {
  const textClassName = tone === "dark" ? "text-white" : "text-ink";

  return (
    <div className="inline-flex items-center gap-3" aria-label="Leadi" title="Leadi">
      <Image
        alt=""
        className="h-11 w-auto shrink-0"
        height={743}
        priority
        src="/assets/leadi-logo.png"
        width={667}
      />
      <span className={`text-xl font-semibold tracking-normal ${textClassName}`}>
        Leadi
      </span>
    </div>
  );
}
