"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Plus, Search } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { navItems } from "@/data/mock";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const primaryNavItems = navItems.slice(0, 7);
  const currentPath = pathname ?? "";

  const isActive = (href: string) =>
    href === "/dashboard" ? currentPath === href : currentPath === href || currentPath.startsWith(`${href}/`);

  return (
    <main className="min-h-screen px-4 py-4 lg:px-6">
      <div className="mx-auto grid max-w-[1500px] gap-4 lg:grid-cols-[88px_1fr]">
        <aside className="glass-dark sticky top-4 hidden h-[calc(100vh-32px)] rounded-[38px] px-4 py-5 text-white lg:flex lg:flex-col lg:items-center lg:justify-between">
          <Link
            href="/"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink"
            aria-label="LeadHealth"
          >
            LH
          </Link>
          <nav className="flex flex-col gap-3" aria-label="Menu principal do dashboard">
            {primaryNavItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                    active
                      ? "bg-white text-ink shadow-soft"
                      : "bg-white/8 text-white/72 hover:bg-white/16 hover:text-white"
                  }`}
                  href={item.href}
                  key={item.label}
                  title={item.label}
                >
                  <item.icon size={19} aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
          <Link
            className="flex h-12 w-12 items-center justify-center rounded-full bg-signal text-ink"
            href="/pricing"
            title="Planos"
            aria-label="Planos"
          >
            <Plus size={20} aria-hidden="true" />
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
                href="/login"
              >
                Lucas
              </Link>
            </div>
          </header>

          <nav
            className="glass flex gap-2 overflow-x-auto rounded-[26px] p-2 lg:hidden"
            aria-label="Menu principal do dashboard"
          >
            {primaryNavItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
                    active
                      ? "bg-ink text-white"
                      : "bg-white/42 text-ink/62 hover:bg-white/70 hover:text-ink"
                  }`}
                  href={item.href}
                  key={item.label}
                  title={item.label}
                >
                  <item.icon size={18} aria-hidden="true" />
                </Link>
              );
            })}
          </nav>

          {children}
        </div>
      </div>
    </main>
  );
}
