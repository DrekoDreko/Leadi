"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Link2,
  Loader2,
  Mail,
  QrCode,
  ShieldCheck,
  Timer,
  UserPlus,
  X
} from "lucide-react";
import { SubscriptionAccessBanner } from "@/components/billing/subscription-access-banner";
import type { ResourceAccessSummary } from "@/lib/billing/subscription-limits.server";
import type { TeamInvite, TeamSetupTeam } from "@/lib/workspaces/team";
import { createInviteByEmailAction, createInviteLinkAction } from "../../team/invite/actions";

type InviteRole = "admin" | "seller";

type PixData = {
  transparentId: string;
  brCode: string;
  brCodeBase64: string;
  amount: number;
  expiresAt: string;
};

type PendingInvite = {
  method: "email" | "link";
  role: InviteRole;
  email: string | null;
};

type InviteCardProps = {
  currentRole: "owner" | "admin" | "seller";
  inviteAccess: ResourceAccessSummary;
  invites: TeamInvite[];
  teams: TeamSetupTeam[];
};

export function InviteCard({
  currentRole,
  inviteAccess,
  invites: initialInvites,
  teams
}: InviteCardProps) {
  const [invites, setInvites] = useState(initialInvites);
  const [feedback, setFeedback] = useState<string | null>(null);
  const canInviteAdmins = currentRole === "owner";

  const [emailInviteEmail, setEmailInviteEmail] = useState("");
  const [emailInviteRole, setEmailInviteRole] = useState<InviteRole>(
    currentRole === "owner" ? "admin" : "seller"
  );
  const [emailInvitePath, setEmailInvitePath] = useState("");
  const emailInviteUrl = useAbsoluteInviteUrl(emailInvitePath);

  const [linkInviteRole, setLinkInviteRole] = useState<InviteRole>(
    currentRole === "owner" ? "admin" : "seller"
  );
  const [linkInvitePath, setLinkInvitePath] = useState("");
  const linkInviteUrl = useAbsoluteInviteUrl(linkInvitePath);

  const [pixData, setPixData] = useState<PixData | null>(null);
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>("PENDING");
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState("");
  const [pixCopied, setPixCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [reviewingInviteId, setReviewingInviteId] = useState<string | null>(null);

  const pendingApprovalCount = invites.filter((invite) => isPendingInviteReview(invite)).length;
  const visibleInvites = useMemo(() => {
    return [...invites]
      .sort((left, right) => Number(isPendingInviteReview(right)) - Number(isPendingInviteReview(left)))
      .slice(0, 8);
  }, [invites]);

  const isPaid =
    paymentStatus === "PAID" || paymentStatus === "APPROVED" || paymentStatus === "REDEEMED";

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!pixData) return;

    async function checkStatus() {
      try {
        const response = await fetch(
          `/api/billing/pix/status?id=${encodeURIComponent(pixData!.transparentId)}`
        );
        const data = await response.json().catch(() => null);

        if (data?.status) {
          setPaymentStatus(data.status);

          if (
            data.status === "PAID" ||
            data.status === "APPROVED" ||
            data.status === "REDEEMED" ||
            data.status === "EXPIRED" ||
            data.status === "CANCELLED" ||
            data.status === "FAILED"
          ) {
            stopPolling();
          }
        }
      } catch {}
    }

    pollRef.current = setInterval(checkStatus, 4000);
    checkStatus();

    return stopPolling;
  }, [pixData, stopPolling]);

  useEffect(() => {
    if (!pixData) return;

    function updateTimer() {
      const expires = new Date(pixData!.expiresAt).getTime();
      const now = Date.now();
      const diff = expires - now;

      if (diff <= 0) {
        setPixTimeLeft("Expirado");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setPixTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [pixData]);

  useEffect(() => {
    if (!isPaid || !pendingInvite || isCreatingInvite) return;

    async function createInviteAfterPayment() {
      setIsCreatingInvite(true);

      try {
        const formData = new FormData();
        formData.set("roleToAssign", pendingInvite!.role);

        let result;
        if (pendingInvite!.method === "email" && pendingInvite!.email) {
          formData.set("email", pendingInvite!.email);
          result = await createInviteByEmailAction(formData);
        } else {
          result = await createInviteLinkAction(formData);
        }

        if (!result.ok) {
          setFeedback(result.error);
          return;
        }

        const token = result.invitePath.split("/").at(-1) ?? result.invitePath;
        const nextInvite: TeamInvite = {
          id: result.id,
          token,
          teamId: null,
          teamName: null,
          invitePath: result.invitePath,
          roleToAssign: result.roleToAssign,
          status: result.status,
          requiresApproval: result.requiresApproval,
          approvalStatus: result.approvalStatus,
          approvedByUserId: null,
          invitedEmail: result.invitedEmail,
          createdAt: new Date().toISOString(),
          expiresAt: result.expiresAt
        };

        setInvites((current) => [nextInvite, ...current]);

        if (pendingInvite!.method === "email") {
          setEmailInvitePath(result.invitePath);
          setEmailInviteEmail("");
          setFeedback(
            `Pagamento confirmado! Convite criado para ${result.invitedEmail}. Copie o link e envie manualmente.`
          );
        } else {
          setLinkInvitePath(result.invitePath);
          setFeedback(
            result.requiresApproval
              ? "Pagamento confirmado! Link gerado. O membro precisara da sua aprovacao apos se cadastrar."
              : "Pagamento confirmado! Link gerado com sucesso."
          );
        }
      } catch {
        setFeedback("Pagamento confirmado, mas ocorreu um erro ao gerar o convite. Tente novamente.");
      } finally {
        setIsCreatingInvite(false);
        setPixData(null);
        setPendingInvite(null);
        setPaymentStatus("PENDING");
      }
    }

    createInviteAfterPayment();
  }, [isPaid, pendingInvite, isCreatingInvite]);

  async function startPayment(method: "email" | "link", role: InviteRole, email: string | null) {
    if (!inviteAccess.allowed) {
      setFeedback(inviteAccess.message);
      return;
    }

    setIsGeneratingPix(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/billing/user-slot/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleToAssign: role,
          inviteEmail: email
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.brCode) {
        setFeedback(data?.error ?? "Erro ao gerar o PIX.");
        return;
      }

      setPixData({
        transparentId: data.transparentId,
        brCode: data.brCode,
        brCodeBase64: data.brCodeBase64,
        amount: data.amount,
        expiresAt: data.expiresAt
      });
      setPendingInvite({ method, role, email });
      setPaymentStatus("PENDING");
    } catch {
      setFeedback("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsGeneratingPix(false);
    }
  }

  function handleEmailInvite() {
    if (!emailInviteEmail || !emailInviteEmail.includes("@")) {
      setFeedback("Informe um email valido.");
      return;
    }

    startPayment("email", emailInviteRole, emailInviteEmail.trim().toLowerCase());
  }

  function handleLinkInvite() {
    startPayment("link", linkInviteRole, null);
  }

  function cancelPayment() {
    stopPolling();
    setPixData(null);
    setPendingInvite(null);
    setPaymentStatus("PENDING");
    setFeedback(null);
  }

  async function copyToClipboard(url: string) {
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setFeedback("Link copiado para a area de transferencia.");
    } catch {
      setFeedback("Nao foi possivel copiar automaticamente.");
    }
  }

  async function copyPixCode() {
    if (!pixData) return;

    try {
      await navigator.clipboard.writeText(pixData.brCode);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    } catch {}
  }

  async function reviewInvite(inviteId: string, decision: "approved" | "rejected") {
    setReviewingInviteId(inviteId);
    setFeedback(null);

    try {
      const response = await fetch("/api/invites/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, decision })
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        invite?: TeamInvite;
      };

      if (!response.ok || !data.invite) {
        setFeedback(data.error ?? "Nao foi possivel revisar o convite agora.");
        return;
      }

      setInvites((current) =>
        current.map((invite) => (invite.id === inviteId ? data.invite! : invite))
      );
      setFeedback(
        decision === "approved"
          ? "Convite aprovado com sucesso."
          : "Convite rejeitado com sucesso."
      );
    } catch {
      setFeedback("Nao foi possivel revisar o convite agora.");
    } finally {
      setReviewingInviteId(null);
    }
  }

  const isPixExpired = paymentStatus === "EXPIRED" || pixTimeLeft === "Expirado";
  const isPixFailed = paymentStatus === "CANCELLED" || paymentStatus === "FAILED";

  if (pixData && !isPaid) {
    const formattedAmount = (pixData.amount / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

    const roleLabel = pendingInvite?.role === "admin" ? "Supervisor" : "Consultor";
    const methodLabel = pendingInvite?.method === "email"
      ? `por email (${pendingInvite.email})`
      : "por link";

    if (isPixExpired || isPixFailed) {
      return (
        <section className="glass-strong rounded-[34px] p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-lg bg-signal/14 p-4 text-sm font-semibold text-ink/72">
              {isPixExpired
                ? "O QR code PIX expirou. Gere um novo para continuar."
                : "O pagamento foi cancelado ou falhou."}
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cloud"
              onClick={cancelPayment}
              type="button"
            >
              Tentar novamente
            </button>
          </div>
        </section>
      );
    }

    return (
      <section className="glass-strong rounded-[34px] p-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cobalt text-white">
              <QrCode size={18} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Pagamento via PIX</h2>
              <p className="text-sm text-ink/62">
                Pague para adicionar 1 {roleLabel} {methodLabel}
              </p>
            </div>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-white/58 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white/72"
            onClick={cancelPayment}
            type="button"
          >
            <X size={16} aria-hidden="true" />
            Cancelar
          </button>
        </div>

        <div className="flex flex-col items-center gap-5">
          <div className="flex items-center gap-2 rounded-full bg-cobalt/10 px-4 py-2 text-sm font-semibold text-cobalt">
            <Timer size={16} aria-hidden="true" />
            Expira em {pixTimeLeft}
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-4">
            {pixData.brCodeBase64 ? (
              <img
                src={
                  pixData.brCodeBase64.startsWith("data:")
                    ? pixData.brCodeBase64
                    : `data:image/png;base64,${pixData.brCodeBase64}`
                }
                alt="QR Code PIX"
                width={220}
                height={220}
                className="mx-auto"
              />
            ) : (
              <div className="flex h-[220px] w-[220px] items-center justify-center">
                <QrCode size={80} className="text-ink/20" />
              </div>
            )}
          </div>

          <p className="text-2xl font-bold text-ink">{formattedAmount}</p>

          <p className="text-sm text-ink/54">
            1 vaga de {roleLabel} {methodLabel}
          </p>

          <button
            className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-ink/15 bg-ink/5 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink/10"
            onClick={copyPixCode}
            type="button"
          >
            {pixCopied ? (
              <>
                <CheckCircle2 size={16} className="text-lagoon" aria-hidden="true" />
                Codigo copiado!
              </>
            ) : (
              <>
                <Copy size={16} aria-hidden="true" />
                Copiar codigo PIX
              </>
            )}
          </button>

          <div className="flex items-center gap-2 text-sm text-cobalt">
            <Loader2 className="animate-spin" size={14} aria-hidden="true" />
            Aguardando pagamento...
          </div>

          <p className="text-center text-xs leading-5 text-ink/40">
            Abra o app do seu banco, escaneie o QR code ou cole o codigo PIX.
            Apos o pagamento, o convite sera gerado automaticamente.
          </p>
        </div>
      </section>
    );
  }

  if (isPaid && isCreatingInvite) {
    return (
      <section className="glass-strong rounded-[34px] p-8">
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lagoon/14">
            <CheckCircle2 className="text-lagoon" size={32} />
          </div>
          <p className="text-lg font-semibold">Pagamento confirmado!</p>
          <div className="flex items-center gap-2 text-sm text-cobalt">
            <Loader2 className="animate-spin" size={14} aria-hidden="true" />
            Criando convite...
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="glass-strong rounded-[34px] p-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cobalt/15">
          <UserPlus size={22} className="text-cobalt" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-semibold">Convidar Membros</h2>
          <p className="text-sm text-ink/54">
            Convide supervisores e consultores por email ou por link seguro.
          </p>
        </div>
      </div>

      {!inviteAccess.allowed ? (
        <SubscriptionAccessBanner notice={inviteAccess} />
      ) : null}

      {feedback ? (
        <p className="mb-4 rounded-[22px] bg-white/50 px-4 py-3 text-sm font-semibold text-ink">
          {feedback}
        </p>
      ) : null}

      {currentRole === "owner" && pendingApprovalCount > 0 ? (
        <p className="mb-4 rounded-[22px] bg-cobalt/12 px-4 py-3 text-sm font-semibold text-ink">
          {pendingApprovalCount === 1
            ? "1 convite aguarda sua aprovacao."
            : `${pendingApprovalCount} convites aguardam sua aprovacao.`}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Convite por Email */}
        <div className="rounded-[26px] border border-white/45 bg-white/20 p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cobalt text-white">
              <Mail size={18} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-lg font-semibold">Convite por email</h3>
              <p className="text-xs text-ink/54">Convite travado ao email informado</p>
            </div>
          </div>

          <p className="mb-4 text-sm leading-6 text-ink/62">
            Informe o email do novo membro. O convite so podera ser aceito por esse email,
            garantindo que ninguem mais use o link.
          </p>

          <label className="block text-sm font-medium text-ink/72" htmlFor="inviteEmailEquipes">
            Email do novo membro
          </label>
          <input
            className="liquid-input mt-2"
            id="inviteEmailEquipes"
            placeholder="consultor@exemplo.com"
            type="email"
            value={emailInviteEmail}
            onChange={(e) => setEmailInviteEmail(e.target.value)}
          />

          <label className="mt-4 block text-sm font-medium text-ink/72" htmlFor="emailRoleEquipes">
            Papel
          </label>
          <select
            className="liquid-input mt-2"
            id="emailRoleEquipes"
            value={emailInviteRole}
            onChange={(e) => setEmailInviteRole(e.target.value as InviteRole)}
          >
            {canInviteAdmins ? <option value="admin">Supervisor</option> : null}
            <option value="seller">Consultor</option>
          </select>

          <div className="mt-4 rounded-[18px] bg-ink/5 px-4 py-3">
            <p className="text-sm font-semibold text-ink/72">
              Valor: R$ 59,00/mes por usuario
            </p>
          </div>

          <button
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cloud transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isGeneratingPix || !emailInviteEmail}
            onClick={handleEmailInvite}
            type="button"
          >
            {isGeneratingPix ? (
              <Loader2 className="animate-spin" size={18} aria-hidden="true" />
            ) : (
              <QrCode size={18} aria-hidden="true" />
            )}
            Pagar e gerar convite
          </button>

          {emailInviteUrl ? (
            <div className="mt-5">
              <div className="rounded-[22px] bg-white/48 p-3 text-sm font-semibold text-ink/70 break-all">
                {emailInviteUrl}
              </div>
              <button
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cloud"
                onClick={() => copyToClipboard(emailInviteUrl)}
                type="button"
              >
                <Copy size={16} aria-hidden="true" />
                Copiar link
              </button>
            </div>
          ) : null}

          <div className="mt-5 flex items-start gap-2 rounded-[18px] bg-lagoon/10 px-4 py-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-lagoon" size={16} aria-hidden="true" />
            <p className="text-xs leading-5 text-ink/62">
              Apenas o email informado podera aceitar este convite. Se outra pessoa tentar usar
              o link, o acesso sera bloqueado.
            </p>
          </div>
        </div>

        {/* Convite por Link */}
        <div className="rounded-[26px] border border-white/45 bg-white/20 p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lagoon text-white">
              <Link2 size={18} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-lg font-semibold">Convite por link</h3>
              <p className="text-xs text-ink/54">Requer aprovacao do gestor</p>
            </div>
          </div>

          <p className="mb-4 text-sm leading-6 text-ink/62">
            Gere um link de convite e compartilhe manualmente. Qualquer pessoa autenticada pode
            usar o link, mas voce precisara aprovar o acesso antes de liberar.
          </p>

          <label className="block text-sm font-medium text-ink/72" htmlFor="linkRoleEquipes">
            Papel
          </label>
          <select
            className="liquid-input mt-2"
            id="linkRoleEquipes"
            value={linkInviteRole}
            onChange={(e) => setLinkInviteRole(e.target.value as InviteRole)}
          >
            {canInviteAdmins ? <option value="admin">Supervisor</option> : null}
            <option value="seller">Consultor</option>
          </select>

          <div className="mt-4 rounded-[18px] bg-ink/5 px-4 py-3">
            <p className="text-sm font-semibold text-ink/72">
              Valor: R$ 59,00/mes por usuario
            </p>
          </div>

          <button
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cloud transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isGeneratingPix}
            onClick={handleLinkInvite}
            type="button"
          >
            {isGeneratingPix ? (
              <Loader2 className="animate-spin" size={18} aria-hidden="true" />
            ) : (
              <QrCode size={18} aria-hidden="true" />
            )}
            Pagar e gerar link
          </button>

          {linkInviteUrl ? (
            <div className="mt-5">
              <div className="rounded-[22px] bg-white/48 p-3 text-sm font-semibold text-ink/70 break-all">
                {linkInviteUrl}
              </div>
              <button
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cloud"
                onClick={() => copyToClipboard(linkInviteUrl)}
                type="button"
              >
                <Copy size={16} aria-hidden="true" />
                Copiar link
              </button>
            </div>
          ) : null}

          <div className="mt-5 flex items-start gap-2 rounded-[18px] bg-cobalt/8 px-4 py-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-cobalt" size={16} aria-hidden="true" />
            <p className="text-xs leading-5 text-ink/62">
              Links gerados exigem aprovacao do gestor apos o cadastro. Apenas usuarios
              autenticados podem aceitar convites.
            </p>
          </div>
        </div>
      </div>

      {/* Convites recentes */}
      {visibleInvites.length > 0 ? (
        <div className="mt-6">
          <h3 className="mb-4 text-lg font-semibold">Convites recentes</h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleInvites.map((invite) => (
              <div
                className="rounded-[22px] border border-white/45 bg-white/38 p-4 shadow-soft"
                key={invite.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {invite.invitedEmail ? (
                      <p className="truncate text-sm font-semibold">{invite.invitedEmail}</p>
                    ) : (
                      <p className="truncate text-sm font-semibold text-ink/54">
                        Link aberto
                      </p>
                    )}
                    <p className="mt-1 text-xs text-ink/54">
                      {invite.roleToAssign === "admin" ? "Supervisor" : "Consultor"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getStatusBadgeClass(invite)}`}
                  >
                    {getInviteStatusLabel(invite)}
                  </span>
                </div>
                {invite.teamName ? (
                  <p className="mt-2 text-xs text-ink/54">Equipe: {invite.teamName}</p>
                ) : null}
                {currentRole === "owner" && isPendingInviteReview(invite) ? (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-white/45 pt-3">
                    <button
                      className="inline-flex items-center gap-2 rounded-full bg-cobalt px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                      disabled={reviewingInviteId === invite.id}
                      onClick={() => reviewInvite(invite.id, "approved")}
                      type="button"
                    >
                      {reviewingInviteId === invite.id ? (
                        <Loader2 className="animate-spin" size={14} aria-hidden="true" />
                      ) : (
                        <CheckCircle2 size={14} aria-hidden="true" />
                      )}
                      Aprovar
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-full bg-signal px-4 py-2 text-xs font-semibold text-ink dark:text-cloud disabled:opacity-60"
                      disabled={reviewingInviteId === invite.id}
                      onClick={() => reviewInvite(invite.id, "rejected")}
                      type="button"
                    >
                      Rejeitar
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function getInviteStatusLabel(invite: TeamInvite) {
  if (invite.status === "used") return "aceito";
  if (invite.status === "expired") return "expirado";
  if (invite.approvalStatus === "pending") return "pendente";
  if (invite.approvalStatus === "approved") return "aprovado";
  if (invite.approvalStatus === "rejected") return "rejeitado";
  return "ativo";
}

function getStatusBadgeClass(invite: TeamInvite) {
  const status = getInviteStatusLabel(invite);
  if (status === "aceito") return "bg-lagoon/14 text-lagoon";
  if (status === "pendente") return "bg-signal/24 text-ink/72";
  if (status === "rejeitado") return "bg-signal/34 text-ink/72";
  if (status === "expirado") return "bg-ink/10 text-ink/48";
  return "bg-white/64 text-ink/72";
}

function isPendingInviteReview(invite: TeamInvite) {
  return invite.requiresApproval && invite.approvalStatus === "pending" && invite.status === "active";
}

function useAbsoluteInviteUrl(invitePath: string) {
  return useMemo(() => {
    if (!invitePath || typeof window === "undefined") return "";
    return `${window.location.origin}${invitePath}`;
  }, [invitePath]);
}
