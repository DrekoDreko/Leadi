import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardBillingNoticeProvider } from "./billing-notice-context";
import { SubscriptionAccessBanner } from "./subscription-access-banner";
import type { ResourceAccessSummary } from "@/lib/billing/subscription-limits.server";

describe("SubscriptionAccessBanner", () => {
  it("oculta avisos de assinatura quando o dashboard já mostra o aviso global", () => {
    const subscriptionBlockedNotice = {
      allowed: false,
      actionHref: "/dashboard/perfil/creditos",
      actionLabel: "Abrir billing",
      limit: null,
      message: "A assinatura da sua organizacao esta cancelada.",
      reason: "inactive_subscription",
      resource: "lead_creation",
      title: "Assinatura inativa",
      used: null
    } satisfies ResourceAccessSummary;

    render(
      <DashboardBillingNoticeProvider hasSubscriptionNotice>
        <SubscriptionAccessBanner notice={subscriptionBlockedNotice} />
      </DashboardBillingNoticeProvider>
    );

    expect(screen.queryByText("Assinatura inativa")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Abrir billing" })).not.toBeInTheDocument();
  });

  it("continua exibindo avisos de limite mesmo com aviso global", () => {
    const limitReachedNotice = {
      allowed: false,
      actionHref: "/dashboard/perfil/creditos",
      actionLabel: "Abrir billing",
      limit: 5,
      message: "Sua organizacao atingiu o limite de 5 usuarios.",
      reason: "limit_reached",
      resource: "team_invites",
      title: "Limite de usuarios atingido",
      used: 5
    } satisfies ResourceAccessSummary;

    render(
      <DashboardBillingNoticeProvider hasSubscriptionNotice>
        <SubscriptionAccessBanner notice={limitReachedNotice} />
      </DashboardBillingNoticeProvider>
    );

    expect(screen.getByText("Limite de usuarios atingido")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir billing" })).toBeInTheDocument();
  });
});
