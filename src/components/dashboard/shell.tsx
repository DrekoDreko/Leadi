"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Loader2, LogOut, Plus, Search, X } from "lucide-react";
import { SubscriptionAccessBanner } from "@/components/billing/subscription-access-banner";
import { BrandMark } from "@/components/brand-mark";
import type { Lead } from "@/data/mock";
import { getDashboardNavItems } from "@/lib/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SubscriptionNotice } from "@/lib/billing/subscription-limits.server";
import type { DashboardNavVariant } from "@/lib/workspaces/context";

const MIN_LEAD_SEARCH_LENGTH = 3;
const HEADER_LEAD_SEARCH_LIMIT = 6;

export function DashboardShell({
  children,
  displayName = "Usuario",
  navVariant = "owner-team",
  preview = false,
  subscriptionNotice = null,
  workspaceName = "Leadi"
}: {
  children: React.ReactNode;
  displayName?: string;
  navVariant?: DashboardNavVariant;
  preview?: boolean;
  subscriptionNotice?: SubscriptionNotice | null;
  workspaceName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const primaryNavItems = getDashboardNavItems(navVariant);
  const currentPath = pathname ?? "";
  const isFunnelPage = currentPath === "/dashboard/funil";
  const creationHref = "/dashboard/criacoes";
  const profileHref = "/dashboard/perfil";
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [hasSearchAttempt, setHasSearchAttempt] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);

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

  const handleLogout = async () => {
    if (preview || !isSupabaseConfigured()) {
      router.push("/login");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    if (preview) {
      setIsSearchLoading(false);
      setSearchResults([]);
      setHasSearchAttempt(false);
      setIsSearchOpen(false);
      return;
    }

    const normalizedSearchTerm = searchTerm.trim();

    if (normalizedSearchTerm.length < MIN_LEAD_SEARCH_LENGTH) {
      setIsSearchLoading(false);
      setSearchResults([]);
      setHasSearchAttempt(false);
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearchLoading(true);
      setHasSearchAttempt(true);
      setSearchResults([]);

      try {
        const nextSearchParams = new URLSearchParams({
          search: normalizedSearchTerm,
          limit: String(HEADER_LEAD_SEARCH_LIMIT)
        });
        const response = await fetch(`/api/leads?${nextSearchParams.toString()}`, {
          headers: {
            Accept: "application/json"
          },
          signal: abortController.signal
        });
        const data = (await response.json()) as {
          leads?: Lead[];
          mode?: string;
        };

        if (
          !response.ok ||
          data.mode === "error" ||
          data.mode === "unauthenticated" ||
          !Array.isArray(data.leads)
        ) {
          throw new Error("Nao foi possivel carregar os leads.");
        }

        setSearchResults(data.leads.slice(0, HEADER_LEAD_SEARCH_LIMIT));
        setIsSearchOpen(true);
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        setSearchResults([]);
        setIsSearchOpen(true);
      } finally {
        if (!abortController.signal.aborted) {
          setIsSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [preview, searchTerm]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (searchWrapperRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsSearchOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function clearLeadSearch() {
    setSearchTerm("");
    setSearchResults([]);
    setHasSearchAttempt(false);
    setIsSearchLoading(false);
    setIsSearchOpen(false);
  }

  function handleLeadSearchSelect(leadId: string) {
    setIsSearchOpen(false);
    router.push(buildLeadSearchHref(searchTerm, leadId));
  }

  const shouldShowSearchDropdown =
    !preview &&
    isSearchOpen &&
    searchTerm.trim().length >= MIN_LEAD_SEARCH_LENGTH &&
    (isSearchLoading || hasSearchAttempt);

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
            {preview ? "Le" : getInitials(displayName)}
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
          <header className="glass relative z-30 flex flex-col gap-4 rounded-[34px] p-4 md:flex-row md:items-center md:justify-between">
            <BrandMark />
            <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
              <div ref={searchWrapperRef} className="relative h-12 min-w-0 flex-1 sm:w-[280px] sm:flex-none">
                <div
                  className={`absolute top-0 left-0 right-0 z-40 overflow-hidden transition-all duration-300 ease-in-out border ${
                    shouldShowSearchDropdown
                      ? "glass-strong rounded-[28px] max-h-[420px] border-white/60 shadow-soft"
                      : "glass rounded-full max-h-12 border-white/48 shadow-none"
                  } focus-within:border-cobalt/45 focus-within:bg-white/70 focus-within:shadow-[0_0_0_4px_rgba(52,98,238,0.12)]`}
                >
                  <div className="relative flex h-12 items-center">
                    <Search
                      className="pointer-events-none absolute left-4 text-ink/38"
                      size={18}
                      aria-hidden="true"
                    />
                    <input
                      aria-label="Buscar leads do CRM"
                      className="h-full w-full border-0 bg-transparent pl-11 pr-11 text-sm text-ink placeholder-ink/38 focus:outline-none focus:ring-0"
                      onChange={(event) => {
                        setSearchTerm(event.target.value);
                        setIsSearchOpen(true);
                      }}
                      onFocus={() => {
                        if (searchTerm.trim().length >= MIN_LEAD_SEARCH_LENGTH) {
                          setIsSearchOpen(true);
                        }
                      }}
                      placeholder="Buscar lead, telefone ou email"
                      role="searchbox"
                      type="text"
                      value={searchTerm}
                    />
                    {searchTerm ? (
                      <button
                        aria-label="Limpar busca de leads"
                        className="absolute right-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink/42 transition hover:bg-white/70 hover:text-ink"
                        onClick={clearLeadSearch}
                        type="button"
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>

                  {shouldShowSearchDropdown ? (
                    <div id="dashboard-header-lead-results" className="border-t border-ink/8">
                      <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/42">
                        Busca em leads
                      </div>
                      {isSearchLoading ? (
                        <div className="flex items-center gap-2 px-4 py-4 text-sm text-ink/64">
                          <Loader2 className="animate-spin text-cobalt" size={16} aria-hidden="true" />
                          Buscando leads...
                        </div>
                      ) : searchResults.length > 0 ? (
                        <ul className="max-h-[300px] overflow-y-auto p-2">
                          {searchResults.map((lead) => (
                            <li key={lead.id}>
                              <button
                                aria-label={`Abrir lead ${lead.name}`}
                                className="flex w-full items-start justify-between gap-3 rounded-[22px] px-3 py-3 text-left transition hover:bg-white/72"
                                onClick={() => handleLeadSearchSelect(lead.id)}
                                onMouseDown={(event) => event.preventDefault()}
                                type="button"
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold text-ink">
                                    {lead.name}
                                  </span>
                                  <span className="mt-1 block truncate text-xs text-ink/56">
                                    {lead.email || lead.phone}
                                  </span>
                                </span>
                                <span className="shrink-0 rounded-full bg-cobalt/8 px-3 py-1 text-[11px] font-semibold text-cobalt">
                                  {lead.stage}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-4 py-4 text-sm text-ink/64">
                          Nenhum lead encontrado para &quot;{searchTerm.trim()}&quot;.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
              <button className="icon-button" type="button" title="Notificações">
                <Bell size={18} aria-hidden="true" />
              </button>
              <button
                className="icon-button"
                onClick={handleLogout}
                title="Sair da conta"
                type="button"
              >
                <LogOut size={18} aria-hidden="true" />
              </button>
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
      .join("") || "Le"
  );
}

function buildLeadSearchHref(searchTerm: string, leadId: string) {
  const nextSearchParams = new URLSearchParams({
    lead: leadId,
    panel: "details"
  });
  const normalizedSearchTerm = searchTerm.trim();

  if (normalizedSearchTerm) {
    nextSearchParams.set("search", normalizedSearchTerm);
  }

  return `/dashboard/leads?${nextSearchParams.toString()}`;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
