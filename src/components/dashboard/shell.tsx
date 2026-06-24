"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Ban, Bell, Check, CheckCircle2, Clock, Loader2, LogOut, Megaphone, Plus, Search, UserPlus, X, Link as LinkIcon } from "lucide-react";
import { SubscriptionAccessBanner } from "@/components/billing/subscription-access-banner";
import { DashboardBillingNoticeProvider } from "@/components/billing/billing-notice-context";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Lead } from "@/data/mock";
import { getClientTimezoneOffsetMinutes } from "@/lib/date/client-time";
import { getDashboardNavItems } from "@/lib/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SubscriptionNotice } from "@/lib/billing/subscription-limits.server";
import type { DashboardNavVariant } from "@/lib/workspaces/context";
import type { DashboardReminderItem } from "@/lib/dashboard-reminders/types";
import type { NotificationItem } from "@/lib/notifications/types";

const MIN_LEAD_SEARCH_LENGTH = 3;
const HEADER_LEAD_SEARCH_LIMIT = 6;
const DASHBOARD_REMINDERS_UPDATED_EVENT = "dashboard-reminders:updated";

export function DashboardShell({
  children,
  displayName = "Usuario",
  avatarUrl = null,
  navVariant = "owner-team",
  canCreateAd = false,
  preview = false,
  subscriptionNotice = null,
  notificationCount = 0,
  workspaceName = "Leadi"
}: {
  children: React.ReactNode;
  displayName?: string;
  avatarUrl?: string | null;
  navVariant?: DashboardNavVariant;
  canCreateAd?: boolean;
  preview?: boolean;
  subscriptionNotice?: SubscriptionNotice | null;
  notificationCount?: number;
  workspaceName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const primaryNavItems = getDashboardNavItems(navVariant, canCreateAd);
  const currentPath = pathname ?? "";
  const isFunnelPage = currentPath === "/dashboard/funil";
  const creationHref = "/dashboard/criacoes";
  const profileHref = "/dashboard/perfil";
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [hasSearchAttempt, setHasSearchAttempt] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [reminderCount, setReminderCount] = useState(notificationCount);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardReminderItem[]>([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [openSnoozeId, setOpenSnoozeId] = useState<string | null>(null);
  const [appNotifications, setAppNotifications] = useState<NotificationItem[]>([]);
  const [appUnreadCount, setAppUnreadCount] = useState(0);
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);
  const notificationsWrapperRef = useRef<HTMLDivElement | null>(null);

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
  const totalBadgeCount = reminderCount + appUnreadCount;
  const displayNotificationCount = totalBadgeCount > 99 ? "99+" : String(totalBadgeCount);

  const fetchAppNotifications = async () => {
    if (preview) {
      return;
    }
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as {
        notifications?: NotificationItem[];
        unreadCount?: number;
      };
      setAppNotifications(data.notifications ?? []);
      setAppUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Notificacoes sao best-effort; falha de rede nao deve travar o sino.
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    setAppNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item))
    );
    setAppUnreadCount((count) => Math.max(0, count - 1));
    if (preview) {
      return;
    }
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
    } catch {
      // Otimista: o estado local ja reflete a leitura.
    }
  };

  const fetchNotifications = async () => {
    if (preview) {
      setNotifications([
        {
          id: "mock-reminder-1",
          reminderDate: "2026-05-20",
          remindAt: new Date().toISOString(),
          message: "Revisar oferta da campanha PME antes de publicar.",
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
      setReminderCount(1);
      return;
    }

    setIsNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const response = await fetch("/api/dashboard-reminders");
      if (!response.ok) {
        throw new Error("Erro ao carregar notificacoes.");
      }
      const data = (await response.json()) as { reminders?: DashboardReminderItem[] };
      const loadedNotifications = data.reminders || [];
      const activeNotifications = loadedNotifications.filter((item) => !item.completed);
      const sorted = [...activeNotifications].sort((left, right) =>
        left.remindAt.localeCompare(right.remindAt)
      );
      setNotifications(sorted);
      setReminderCount(sorted.length);
    } catch (err) {
      setNotificationsError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  const handleCompleteReminder = async (id: string) => {
    if (preview) {
      const nextNotifications = notifications.filter((item) => item.id !== id);
      setNotifications(nextNotifications);
      setReminderCount(nextNotifications.length);
      window.dispatchEvent(
        new CustomEvent(DASHBOARD_REMINDERS_UPDATED_EVENT, {
          detail: { count: nextNotifications.length }
        })
      );
      return;
    }

    try {
      const response = await fetch("/api/dashboard-reminders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id,
          action: "complete"
        })
      });

      if (!response.ok) {
        throw new Error("Erro ao concluir lembrete.");
      }

      await fetchNotifications();
      window.dispatchEvent(new Event(DASHBOARD_REMINDERS_UPDATED_EVENT));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Nao foi possivel concluir o lembrete.");
    }
  };

  const handleSnoozeReminder = async (id: string, snoozeType: "one_hour" | "tomorrow") => {
    if (preview) {
      const nextNotifications = notifications.filter((item) => item.id !== id);
      setNotifications(nextNotifications);
      setReminderCount(nextNotifications.length);
      window.dispatchEvent(
        new CustomEvent(DASHBOARD_REMINDERS_UPDATED_EVENT, {
          detail: { count: nextNotifications.length }
        })
      );
      return;
    }

    try {
      const response = await fetch("/api/dashboard-reminders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id,
          action: "snooze",
          snoozeType,
          timezoneOffsetMinutes: getClientTimezoneOffsetMinutes(),
          clientNowIso: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error("Erro ao adiar lembrete.");
      }

      setOpenSnoozeId(null);
      await fetchNotifications();
      window.dispatchEvent(new Event(DASHBOARD_REMINDERS_UPDATED_EVENT));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Nao foi possivel adiar o lembrete.");
    }
  };

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
    setReminderCount(notificationCount);
  }, [notificationCount]);

  useEffect(() => {
    const handleReminderUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ count?: number }>;
      const nextCount = customEvent.detail?.count;

      if (typeof nextCount === "number" && Number.isFinite(nextCount)) {
        setReminderCount(Math.max(0, Math.floor(nextCount)));
        void fetchNotifications();
      }
    };

    window.addEventListener(DASHBOARD_REMINDERS_UPDATED_EVENT, handleReminderUpdate);
    return () => window.removeEventListener(DASHBOARD_REMINDERS_UPDATED_EVENT, handleReminderUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isNotificationsOpen) {
      void fetchNotifications();
      void fetchAppNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNotificationsOpen]);

  // Carrega a contagem de notificacoes nao lidas no mount para o badge refletir
  // avisos (ex.: anuncio aprovado) sem o usuario precisar abrir o sino.
  useEffect(() => {
    void fetchAppNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (!searchWrapperRef.current?.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (!notificationsWrapperRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (!(event.target as HTMLElement).closest(".snooze-container")) {
        setOpenSnoozeId(null);
      }
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
        className={`mx-auto grid w-full gap-4 lg:grid-cols-[88px_1fr] ${
          isFunnelPage ? "max-w-none" : "max-w-[1500px]"
        }`}
      >
        <aside className="glass-dark sticky top-4 hidden h-[calc(100vh-32px)] rounded-[38px] px-4 py-5 text-white lg:flex lg:flex-col lg:items-center lg:justify-between">
          <Link
            href={preview ? "/login" : profileHref}
            className="surface-card relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-foreground"
            aria-label={`Perfil de ${displayName}`}
            title={`${displayName} - ${workspaceName}`}
          >
            {!preview && avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : preview ? (
              "Le"
            ) : (
              getInitials(displayName)
            )}
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
                      ? "bg-surface-elevated text-foreground shadow-soft ring-1 ring-white/8"
                      : "bg-white/12 text-white/78 hover:bg-white/20 hover:text-white"
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
                ? "bg-signal text-accent-foreground shadow-soft"
                : "bg-signal text-accent-foreground hover:bg-signal/90"
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
                      ? "glass-strong rounded-[28px] max-h-[420px] border-border shadow-soft"
                      : "glass rounded-full max-h-12 border-border shadow-none"
                  } focus-within:border-cobalt/45 focus-within:bg-surface-elevated focus-within:shadow-[0_0_0_4px_rgba(52,98,238,0.12)]`}
                >
                  <div className="relative flex h-12 items-center">
                    <Search
                      className="pointer-events-none absolute left-4 text-muted-foreground/70"
                      size={18}
                      aria-hidden="true"
                    />
                    <input
                      autoCapitalize="none"
                      autoComplete="off"
                      autoCorrect="off"
                      aria-label="Buscar leads do CRM"
                      className="h-full w-full border-0 bg-transparent pl-11 pr-11 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0"
                      enterKeyHint="search"
                      name="dashboard-lead-search"
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
                      spellCheck={false}
                      type="search"
                      value={searchTerm}
                    />
                    {searchTerm ? (
                      <button
                        aria-label="Limpar busca de leads"
                        className="absolute right-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground"
                        onClick={clearLeadSearch}
                        type="button"
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>

                  {shouldShowSearchDropdown ? (
                    <div id="dashboard-header-lead-results" className="border-t border-ink/8">
                      <div className="text-muted-soft px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em]">
                        Busca em leads
                      </div>
                      {isSearchLoading ? (
                        <div className="text-muted-soft flex items-center gap-2 px-4 py-4 text-sm">
                          <Loader2 className="animate-spin text-cobalt" size={16} aria-hidden="true" />
                          Buscando leads...
                        </div>
                      ) : searchResults.length > 0 ? (
                        <ul className="max-h-[300px] overflow-y-auto p-2">
                          {searchResults.map((lead) => (
                            <li key={lead.id}>
                              <button
                                aria-label={`Abrir lead ${lead.name}`}
                                className="flex w-full items-start justify-between gap-3 rounded-[22px] px-3 py-3 text-left transition hover:bg-surface-elevated"
                                onClick={() => handleLeadSearchSelect(lead.id)}
                                onMouseDown={(event) => event.preventDefault()}
                                type="button"
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold text-ink">
                                    {lead.name}
                                  </span>
                                  <span className="text-muted-soft mt-1 block truncate text-xs">
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
                        <div className="text-muted-soft px-4 py-4 text-sm">
                          Nenhum lead encontrado para &quot;{searchTerm.trim()}&quot;.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
              <div ref={notificationsWrapperRef} className="relative">
                <button
                  aria-label={
                    totalBadgeCount > 0 ? `${totalBadgeCount} notificações` : "Notificações"
                  }
                  className={`icon-button relative z-50 transition-all ${
                    isNotificationsOpen ? "bg-surface-elevated/90 shadow-soft" : ""
                  }`}
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  type="button"
                  title="Notificações"
                >
                  <Bell size={18} aria-hidden="true" />
                  {totalBadgeCount > 0 ? (
                    <span
                      aria-hidden="true"
                      className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border border-white/80 bg-[#ff3b30] px-1.5 text-[10px] font-semibold leading-none text-white shadow-[0_0_0_1px_rgba(18,23,33,0.04)]"
                    >
                      {displayNotificationCount}
                    </span>
                  ) : null}
                </button>

                <div
                  className={`absolute right-0 top-14 z-40 flex w-[320px] origin-top-right flex-col overflow-hidden rounded-[28px] border transition-all duration-300 ease-in-out md:w-[360px] ${
                    isNotificationsOpen
                      ? "glass-strong max-h-[420px] border-border shadow-soft opacity-100 visible translate-y-0"
                      : "glass max-h-0 border-border shadow-none opacity-0 invisible pointer-events-none -translate-y-2"
                  }`}
                >
                  <div className="border-b border-ink/8 px-4 py-3 flex items-center justify-between">
                    <span className="text-muted-soft text-[11px] font-semibold uppercase tracking-[0.18em]">
                      Lembretes e Notificações
                    </span>
                    {totalBadgeCount > 0 && (
                      <span className="shrink-0 rounded-full bg-cobalt/8 px-2 py-0.5 text-[10px] font-semibold text-cobalt">
                        {totalBadgeCount} ativos
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto min-h-0 animate-fade-in">
                    {appNotifications.length > 0 ? (
                      <ul className="p-2 space-y-1">
                        {appNotifications.map((notification) => {
                          const approved = notification.type === "campaign_approved";
                          const isInvitePending = notification.type === "invite_pending";
                          const isTeamMemberAdded = notification.type === "team_member_added";
                          return (
                            <li key={notification.id}>
                              <div
                                className={`surface-card-strong group relative flex flex-col items-start gap-1.5 rounded-[20px] px-4 py-3 transition ${
                                  notification.readAt ? "opacity-60" : ""
                                }`}
                              >
                                <div className="flex w-full items-center justify-between gap-2">
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                      approved
                                        ? "bg-emerald-500/12 text-emerald-700"
                                        : isInvitePending || isTeamMemberAdded
                                          ? "bg-cobalt/12 text-cobalt"
                                          : "bg-red-500/12 text-red-600"
                                    }`}
                                  >
                                    {approved ? (
                                      <CheckCircle2 size={11} aria-hidden="true" />
                                    ) : isTeamMemberAdded ? (
                                      <UserPlus size={11} aria-hidden="true" />
                                    ) : isInvitePending ? (
                                      <LinkIcon size={11} aria-hidden="true" />
                                    ) : (
                                      <Ban size={11} aria-hidden="true" />
                                    )}
                                    {approved
                                      ? "Aprovado"
                                      : isTeamMemberAdded
                                        ? "Equipe"
                                        : isInvitePending
                                          ? "Pendente"
                                          : "Reprovado"}
                                  </span>
                                  {notification.readAt || notification.type === "invite_pending" ? null : (
                                    <button
                                      onClick={() => handleMarkNotificationRead(notification.id)}
                                      className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-muted-foreground transition hover:bg-surface-elevated"
                                      type="button"
                                      title="Marcar como lida"
                                    >
                                      <Check size={12} aria-hidden="true" />
                                      Lida
                                    </button>
                                  )}
                                </div>
                                <p className="text-sm font-semibold leading-snug text-foreground/90">
                                  {notification.title}
                                </p>
                                {notification.body ? (
                                  <p className="text-xs leading-snug text-muted-foreground">
                                    {notification.body}
                                  </p>
                                ) : null}
                                {notification.linkUrl ? (
                                  <Link
                                    href={getHref(notification.linkUrl)}
                                    onClick={() => {
                                      setIsNotificationsOpen(false);
                                      if (!notification.readAt && notification.type !== "invite_pending") {
                                        void handleMarkNotificationRead(notification.id);
                                      }
                                    }}
                                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-cobalt hover:underline"
                                  >
                                    {notification.type === "invite_pending" ? (
                                      <>
                                        <LinkIcon size={12} aria-hidden="true" />
                                        Ver equipe
                                      </>
                                    ) : (
                                      <>
                                        <Megaphone size={12} aria-hidden="true" />
                                        Ver campanha
                                      </>
                                    )}
                                  </Link>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                    {isNotificationsLoading ? (
                      <div className="text-muted-soft flex items-center justify-center gap-2 px-4 py-8 text-sm">
                        <Loader2 className="animate-spin text-cobalt" size={16} aria-hidden="true" />
                        <span>Carregando notificações...</span>
                      </div>
                    ) : notificationsError ? (
                      <div className="px-4 py-6 text-sm text-red-500 text-center">
                        {notificationsError}
                      </div>
                    ) : notifications.length > 0 ? (
                      <ul className="p-2 space-y-1">
                        {notifications.map((reminder) => {
                          const dateObj = new Date(reminder.remindAt);
                          const formattedTime = new Intl.DateTimeFormat("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit"
                          }).format(dateObj);

                          const formattedDate = new Intl.DateTimeFormat("pt-BR", {
                            day: "2-digit",
                            month: "short"
                          }).format(dateObj);

                          const isSnoozeOpen = openSnoozeId === reminder.id;

                          return (
                            <li key={reminder.id}>
                              <div className="surface-card-strong group relative flex flex-col items-start gap-2 rounded-[20px] px-4 py-3 transition hover:border-cobalt/24">
                                <div className="flex w-full items-center justify-between gap-2">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-cobalt bg-cobalt/8 px-2 py-0.5 rounded-full">
                                    {formattedDate} às {formattedTime}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-sm font-medium leading-snug text-foreground/84">
                                  {reminder.message}
                                </p>
                                <div className="flex items-center gap-2 mt-2 w-full border-t border-ink/4 pt-2">
                                  <button
                                    onClick={() => handleCompleteReminder(reminder.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition duration-200 border border-emerald-200/50 cursor-pointer"
                                    type="button"
                                  >
                                    <Check size={13} aria-hidden="true" />
                                    Feito
                                  </button>
                                  
                                  <div className="snooze-container flex items-center gap-1.5">
                                    {!isSnoozeOpen ? (
                                      <button
                                        onClick={() => setOpenSnoozeId(reminder.id)}
                                        className="surface-action-secondary flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                                        type="button"
                                      >
                                        <Clock size={13} aria-hidden="true" />
                                        Adiar
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => handleSnoozeReminder(reminder.id, "one_hour")}
                                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-cobalt bg-cobalt/5 hover:bg-cobalt/10 border border-cobalt/20 transition duration-200 cursor-pointer animate-fade-in"
                                          type="button"
                                          title="Lembre-me em uma hora"
                                        >
                                          <Clock size={12} aria-hidden="true" />
                                          +1h
                                        </button>
                                        <button
                                          onClick={() => handleSnoozeReminder(reminder.id, "tomorrow")}
                                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-cobalt bg-cobalt/5 hover:bg-cobalt/10 border border-cobalt/20 transition duration-200 cursor-pointer animate-fade-in"
                                          type="button"
                                          title="Lembre-me amanhã (mesmo horário)"
                                        >
                                          <Clock size={12} aria-hidden="true" />
                                          Amanhã
                                        </button>
                                        <button
                                          onClick={() => setOpenSnoozeId(null)}
                                          className="flex items-center justify-center rounded-full p-1.5 text-muted-foreground transition duration-200 cursor-pointer animate-fade-in hover:bg-surface-elevated"
                                          type="button"
                                          title="Cancelar"
                                        >
                                          <X size={13} aria-hidden="true" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : appNotifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                        <Bell size={24} className="mb-2 text-muted-foreground/45" />
                        <p className="text-muted-soft text-sm font-medium">Nenhum lembrete para este mês</p>
                        <p className="mt-1 text-xs text-muted-foreground/72">Tudo limpo por aqui!</p>
                      </div>
                    ) : null}
                  </div>

                </div>
              </div>
              <ThemeToggle />
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
                      ? "bg-surface-elevated text-foreground shadow-soft"
                      : "bg-white/18 text-white/76 hover:bg-white/24 hover:text-white"
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
                  ? "bg-surface-elevated text-foreground shadow-soft"
                  : "bg-white/18 text-white/76 hover:bg-white/24 hover:text-white"
              }`}
              href={getHref(creationHref)}
              title="Novas criações"
            >
              <Plus size={19} aria-hidden="true" />
            </Link>
          </nav>

          <DashboardBillingNoticeProvider hasSubscriptionNotice={Boolean(subscriptionNotice)}>
            {subscriptionNotice ? <SubscriptionAccessBanner notice={subscriptionNotice} /> : null}
            {children}
          </DashboardBillingNoticeProvider>
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
