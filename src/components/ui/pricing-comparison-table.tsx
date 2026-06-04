"use client";

import { Fragment } from "react";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  ComparisonPlanSlug,
  MarketingPricingPlan,
  PricingComparisonCategory,
  PricingComparisonValue,
  PricingCycle
} from "@/data/pricing";

type PricingComparisonTableProps = {
  categories: PricingComparisonCategory[];
  cycle: PricingCycle;
  plans: MarketingPricingPlan[];
};

type ComparisonColumn = {
  slug: ComparisonPlanSlug;
  name: string;
  priceLabel: string;
  badge?: string;
  highlight?: boolean;
};

export function PricingComparisonTable({
  categories,
  cycle,
  plans
}: PricingComparisonTableProps) {
  const columns: ComparisonColumn[] = plans.map((plan) => ({
      slug: plan.slug,
      name: plan.name,
      priceLabel: `${plan.prices[cycle].amount}${plan.prices[cycle].suffix}`,
      badge: plan.badge,
      highlight: plan.highlight
    }));

  return (
    <div className="overflow-hidden rounded-[32px] border border-white/50 bg-white/72 shadow-soft backdrop-blur dark:border-white/10 dark:bg-[rgba(17,24,36,0.86)]">
      <div className="overflow-x-auto">
        <table className="min-w-[60rem] w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 min-w-[16rem] border-b border-ink/10 bg-white/92 px-5 py-5 text-left text-xs font-semibold uppercase tracking-[0.2em] text-ink/48 backdrop-blur dark:border-white/10 dark:bg-[rgba(17,24,36,0.96)] dark:text-cloud/48">
                Recurso
              </th>
              {columns.map((column) => (
                <th
                  key={column.slug}
                  className={cn(
                    "min-w-[11rem] border-b border-ink/10 px-5 py-5 text-left align-bottom dark:border-white/10",
                    column.highlight
                      ? "bg-signal/18 text-ink dark:bg-signal/12 dark:text-cloud"
                      : "bg-white/60 text-ink dark:bg-white/4 dark:text-cloud"
                  )}
                >
                  <div className="flex min-h-[5.75rem] flex-col justify-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{column.name}</span>
                      {column.badge ? (
                        <span className="rounded-full bg-signal px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-accent-foreground">
                          {column.badge}
                        </span>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        column.highlight ? "text-ink/70 dark:text-cloud/78" : "text-ink/56 dark:text-cloud/56"
                      )}
                    >
                      {column.priceLabel}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {categories.map((category) => (
              <Fragment key={category.title}>
                <tr key={`${category.title}-label`}>
                  <th
                    colSpan={columns.length + 1}
                    className="bg-ink/[0.045] px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-ink/58 dark:bg-white/[0.045] dark:text-cloud/58"
                  >
                    {category.title}
                  </th>
                </tr>

                {category.rows.map((row) => (
                  <tr key={`${category.title}-${row.label}`} className="align-middle">
                    <th className="sticky left-0 z-10 border-b border-ink/8 bg-white/92 px-5 py-4 text-left font-medium text-ink/78 backdrop-blur dark:border-white/8 dark:bg-[rgba(17,24,36,0.96)] dark:text-cloud/76">
                      {row.label}
                    </th>
                    {columns.map((column) => (
                      <td
                        key={`${row.label}-${column.slug}`}
                        className={cn(
                          "border-b border-ink/8 px-5 py-4 text-left dark:border-white/8",
                          column.highlight
                            ? "bg-signal/[0.11] dark:bg-signal/[0.07]"
                            : "bg-transparent"
                        )}
                      >
                        {renderComparisonValue(row.values[column.slug])}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderComparisonValue(value: PricingComparisonValue) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-2 font-medium text-ink dark:text-cloud">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/14 text-success dark:bg-success/18">
          <Check size={15} aria-hidden="true" />
        </span>
        <span>Sim</span>
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="inline-flex items-center gap-2 font-medium text-ink/48 dark:text-cloud/42">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink/6 text-ink/42 dark:bg-white/8 dark:text-cloud/44">
          <Minus size={15} aria-hidden="true" />
        </span>
        <span>-</span>
      </span>
    );
  }

  return <span className="font-medium text-ink/72 dark:text-cloud/74">{value}</span>;
}
