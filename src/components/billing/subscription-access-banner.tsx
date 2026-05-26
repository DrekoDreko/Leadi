"use client";

import Link from "next/link";
import type {
  ResourceAccessSummary,
  SubscriptionNotice
} from "@/lib/billing/subscription-limits.server";
import { useDashboardBillingNotice } from "@/components/billing/billing-notice-context";

type SubscriptionAccessBannerProps = {
  notice: SubscriptionNotice | ResourceAccessSummary;
};

export function SubscriptionAccessBanner({ notice }: SubscriptionAccessBannerProps) {
  const hasDashboardBillingNotice = useDashboardBillingNotice();
  const isResourceAccessSummary = "reason" in notice;
  const isSubscriptionBlocked =
    isResourceAccessSummary &&
    (notice.reason === "no_subscription" || notice.reason === "inactive_subscription");

  if (hasDashboardBillingNotice && isSubscriptionBlocked) {
    return null;
  }

  return (
    <section className="surface-alert-warning rounded-[28px] p-5 text-foreground">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{notice.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground/82">{notice.message}</p>
        </div>
        <Link
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/92"
          href={notice.actionHref}
        >
          {notice.actionLabel}
        </Link>
      </div>
    </section>
  );
}
