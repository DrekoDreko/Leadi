"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Plus, Search } from "lucide-react";
import { SubscriptionAccessBanner } from "@/components/billing/subscription-access-banner";
import { BrandMark } from "@/components/brand-mark";
import { getDashboardNavItems } from "@/lib/navigation";
import type { SubscriptionNotice } from "@/lib/billing/subscription-limits.server";
import type { DashboardNavVariant } from "@/lib/workspaces/context";

export function DashboardShell({
  children,
  displayName = "Usuario",
  navVariant = "supervisor-team",
  preview = false,
  subscriptionNotice = null,
  workspaceName = "LeadHealth"
}: {
  children: React.ReactNode;
  displayName?: string;
  navVariant?: DashboardNavVariant;
  preview?: boolean;
  subscriptionNotice?: SubscriptionNotice | null;
  workspaceName?: string;
}) {
  const pathname = usePathname();
  const primaryNavItems = getDashboardNavItems(navVariant);
  const currentPath = pathname ?? "";
  const isFunnelPage = currentPath === "/dashboard/funil";
  const creationHref = "/dashboard/criacoes";
  const profileHref = "/dashboard/perfil";

  const getHref = (href: string) => (preview ? "/preview" : href);
  const isActive = (href: string) => {
    if (preview) {
      return href === "/dashboard";
    }

    return href === "/dashboard"
      ? currentPath === href
      : currentPath === href || currentPath.startsWith(`${href}/`);
  };
  const creationActive = isActive(creationHref);

  return (
    <main className="min-h-screen px-4 py-4 lg:px-6">
      <div
        className={`mx-auto grid gap-4 lg:grid-cols-[88px_1fr] ${
          isFunnelPage ? "max-w-[1720px]" : "max-w-[1500px]"
        }`}
      >
        <aside className="glass-dark sticky top-4 hidden h-[calc(100vh-32px)] rounded-[38px] px-4 py-5 text-white lg:flex lg:flex-col lg:items-center lg:justify-between">
          <Link
            href={preview ? "/login" : profileHref}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink"
            aria-label={`Perfil de ${displayName}`}
            title={`${displayName} - ${workspaceName}`}
          >
            {preview ? "LH" : getInitials(displayName)}
          </Link>
          <nav className="flex flex-col gap-3" aria-label="Menu principal do dashboard">
            {primaryNavItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={`group relative flex h-12 w-12 items-center justify-center rounded-full transition ${
                    active
                      ? "bg-white text-ink shadow-soft"
                      : "bg-white/8 text-white/72 hover:bg-white/16 hover:text-white"
                  }`}
                  href={getHref(item.href)}
                  key={item.label}
                  title={item.label}
                >
                  <item.icon size={19} aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
          <Link
            aria-current={creationActive ? "page" : undefined}
            aria-label="Novas criações"
            className={`group relative flex h-12 w-12 items-center justify-center rounded-full transition ${
              creationActive
                ? "bg-signal text-ink shadow-soft"
                : "bg-signal text-ink hover:bg-signal/90"
            }`}
            href={getHref(creationHref)}
            title="Novas criações"
          >
            <Plus size={21} aria-hidden="true" />
          </Link>
        </aside>

        <div className="min-w-0 space-y-4">
          <header className="glass flex flex-col gap-4 rounded-[34px] p-4 md:flex-row md:items-center md:justify-between">
            <BrandMark />
            <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-[280px] sm:flex-none">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/38"
                  size={18}
                  aria-hidden="true"
                />
                <input
                  className="liquid-input py-3 pl-11"
                  placeholder="Buscar lead, telefone ou email"
                  type="search"
                />
              </div>
              <button className="icon-button" type="button" title="Notificações">
                <Bell size={18} aria-hidden="true" />
              </button>
              <Link
                className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
                href={preview ? "/login" : profileHref}
              >
                {preview ? "Entrar" : displayName}
              </Link>
            </div>
          </header>

          <nav
            className="glass flex gap-2 overflow-x-auto overflow-y-visible rounded-[26px] p-2 lg:hidden"
            aria-label="Menu principal do dashboard"
          >
            {primaryNavItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={`group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
                    active
                      ? "bg-ink text-white"
                      : "bg-white/42 text-ink/62 hover:bg-white/70 hover:text-ink"
                  }`}
                  href={getHref(item.href)}
                  key={item.label}
                  title={item.label}
                >
                  <item.icon size={18} aria-hidden="true" />
                </Link>
              );
            })}
            <Link
              aria-current={creationActive ? "page" : undefined}
              aria-label="Novas criações"
              className={`group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
                creationActive
                  ? "bg-ink text-white"
                  : "bg-white/42 text-ink/62 hover:bg-white/70 hover:text-ink"
              }`}
              href={getHref(creationHref)}
              title="Novas criações"
            >
              <Plus size={19} aria-hidden="true" />
            </Link>
          </nav>

          {subscriptionNotice ? <SubscriptionAccessBanner notice={subscriptionNotice} /> : null}
          {children}
        </div>
      </div>
    </main>
  );
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "LH"
  );
}
