"use client";

import Link from "next/link";
import type {
  ResourceAccessSummary,
  SubscriptionNotice
} from "@/lib/billing/subscription-limits.server";

type SubscriptionAccessBannerProps = {
  notice: SubscriptionNotice | ResourceAccessSummary;
};

export function SubscriptionAccessBanner({ notice }: SubscriptionAccessBannerProps) {
  return (
    <section className="rounded-[28px] border border-amber-200/80 bg-amber-50/90 p-5 text-amber-950">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{notice.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900/90">{notice.message}</p>
        </div>
        <Link
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
          href={notice.actionHref}
        >
          {notice.actionLabel}
        </Link>
      </div>
    </section>
  );
}
