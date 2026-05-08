"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  Building2,
  EyeOff,
  FolderKanban,
  Loader2,
  MessageSquareMore,
  RefreshCcw,
  SendHorizontal,
  ShieldCheck,
  UserRound,
  Users
} from "lucide-react";
import { Metric, PageHeading } from "@/components/dashboard/widgets";
import type {
  CreativeRequestAdminItem,
  CreativeRequestAdminListState
} from "@/lib/creative-requests/types";
import type {
  CreativeRequestCommentVisibility,
  CreativeRequestStatus
} from "@/lib/supabase/database.types";

const requestTypeFilterOptions = [
  { value: "all", label: "Todos os tipos" },
  { value: "design", label: "Design" },
  { value: "video", label: "Video" },
  { value: "campaign", label: "Kit de campanha" }
] as const;

const workflowStatusFilterOptions = [
  { value: "all", label: "Todos os status" },
  { value: "requested", label: "Recebido" },
  { value: "in_progress", label: "Em producao" },
  { value: "in_review", label: "Aguardando revisao" },
  { value: "approved", label: "Aprovado" },
  { value: "delivered", label: "Entregue" },
  { value: "cancelled", label: "Cancelado" }
] as const;

const typeLabels = {
  campaign: "Kit de campanha",
  design: "Design",
  video: "Video"
} as const;

const statusLabels = {
  approved: "Aprovado",
  cancelled: "Cancelado",
  delivered: "Entregue",
  in_progress: "Em producao",
  in_review: "Aguardando revisao",
  requested: "Recebido"
} as const;

const statusClasses = {
  approved: "bg-lagoon text-white",
  cancelled: "bg-ink/12 text-ink/70",
  delivered: "bg-cobalt text-white",
  in_progress: "bg-signal text-ink",
  in_review: "bg-white/70 text-ink",
  requested: "bg-white/62 text-ink"
} as const;

const priorityLabels = {
  high: "Alta",
  low: "Baixa",
  medium: "Media",
  urgent: "Urgente"
} as const;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

type RequestTypeFilter = CreativeRequestAdminItem["type"] | "all";
type RequestStatusFilter = CreativeRequestStatus | "all";

type CreateAdminCreativeRequestCommentResponse = {
  request?: CreativeRequestAdminItem;
  error?: string;
  mode?: CreativeRequestAdminListState["mode"];
};

export function AdminPedidosWorkspace({
  initialRequests,
  listMode,
  listMessage
}: {
  initialRequests: CreativeRequestAdminItem[];
  listMode: CreativeRequestAdminListState["mode"];
  listMessage?: string;
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [selectedRequestId, setSelectedRequestId] = useState(initialRequests[0]?.id ?? "");
  const [commentBody, setCommentBody] = useState("");
  const [commentVisibility, setCommentVisibility] =
    useState<CreativeRequestCommentVisibility>("workspace");
  const [commentingRequestId, setCommentingRequestId] = useState("");
  const [typeFilter, setTypeFilter] = useState<RequestTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("all");
  const [currentListMode, setCurrentListMode] = useState(listMode);
  const [currentListMessage] = useState(listMessage ?? "");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const filteredRequests = useMemo(
    () =>
      requests.filter((request) => {
        const matchesType = typeFilter === "all" ? true : request.type === typeFilter;
        const matchesStatus = statusFilter === "all" ? true : request.status === statusFilter;

        return matchesType && matchesStatus;
      }),
    [requests, statusFilter, typeFilter]
  );
  const selectedRequest =
    filteredRequests.find((request) => request.id === selectedRequestId) ?? filteredRequests[0] ?? null;
  const hasActiveFilters = typeFilter !== "all" || statusFilter !== "all";
  const metrics = useMemo(() => buildMetrics(requests), [requests]);

  function clearFilters() {
    setTypeFilter("all");
    setStatusFilter("all");
  }

  async function handleCommentSubmit(event: FormEvent<HTMLFormElement>, requestId: string) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const nextComment = commentBody.trim();

    if (!nextComment) {
      setError("Comentario obrigatorio.");
      return;
    }

    setCommentingRequestId(requestId);

    try {
      const response = await fetch(`/api/admin/creative-requests/${encodeURIComponent(requestId)}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          body: nextComment,
          visibility: commentVisibility
        })
      });
      const payload =
        (await response.json().catch(() => null)) as CreateAdminCreativeRequestCommentResponse | null;

      if (!response.ok || !payload?.request) {
        throw new Error(payload?.error ?? "Nao foi possivel salvar o comentario interno.");
      }

      setRequests((current) =>
        current.map((request) => (request.id === payload.request?.id ? payload.request : request))
      );
      setCurrentListMode(payload.mode ?? currentListMode);
      setSelectedRequestId(payload.request.id);
      setCommentBody("");
      setCommentVisibility("workspace");
      const latestComment = payload.request.comments[payload.request.comments.length - 1];
      setSuccessMessage(
        latestComment?.visibility === "ops_only"
          ? "Comentario salvo como visivel apenas para a operacao."
          : "Comentario compartilhado com a equipe do pedido."
      );
    } catch (commentError) {
      setError(
        commentError instanceof Error
          ? commentError.message
          : "Nao foi possivel salvar o comentario interno."
      );
    } finally {
      setCommentingRequestId("");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Admin"
        title="Fila operacional de pedidos"
        description="Visualize briefings de todas as organizacoes em uma area protegida para suporte e revisão, sem publicar campanhas pelas contas dos clientes."
      >
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-white/72 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white"
          href="/dashboard/criacoes/validador"
        >
          Voltar para pedidos
        </Link>
      </PageHeading>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Pedidos na fila" value={String(metrics.total)} note={metrics.totalNote} tone="dark" />
        <Metric
          label="Organizacoes ativas"
          value={String(metrics.organizations)}
          note={metrics.organizationsNote}
          tone="blue"
        />
        <Metric label="Entregues" value={String(metrics.delivered)} note={metrics.deliveredNote} tone="teal" />
        <Metric label="Urgentes" value={String(metrics.urgent)} note={metrics.urgentNote} tone="yellow" />
      </div>

      {currentListMessage ? (
        <div
          className={`rounded-[26px] border p-4 text-sm ${
            currentListMode === "supabase"
              ? "border-white/46 bg-white/34 text-ink/72"
              : "border-amber-200/70 bg-amber-50/80 text-amber-900"
          }`}
        >
          {currentListMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[24px] border border-red-200/70 bg-red-50/80 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-[24px] border border-emerald-200/70 bg-emerald-50/80 p-4 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_390px] xl:items-start">
        <section className="glass-strong rounded-[34px] p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-ink/54">Visao global</p>
              <h2 className="text-2xl font-semibold">Pedidos de todas as organizacoes</h2>
            </div>
            <div className="rounded-full bg-ink/6 px-3 py-2 text-xs font-semibold text-ink/62">
              Area restrita
            </div>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/48">Tipo</span>
              <select
                className={fieldClassName}
                onChange={(event) => setTypeFilter(event.target.value as RequestTypeFilter)}
                value={typeFilter}
              >
                {requestTypeFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/48">Status</span>
              <select
                className={fieldClassName}
                onChange={(event) => setStatusFilter(event.target.value as RequestStatusFilter)}
                value={statusFilter}
              >
                {workflowStatusFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink/58">
            <span className="rounded-full bg-white/58 px-3 py-1.5">
              Mostrando {filteredRequests.length} de {requests.length} pedidos
            </span>
            {hasActiveFilters ? (
              <button
                className="rounded-full bg-ink/8 px-3 py-1.5 text-ink transition hover:bg-ink/12"
                onClick={clearFilters}
                type="button"
              >
                Limpar filtros
              </button>
            ) : null}
            <button
              className="inline-flex items-center gap-2 rounded-full bg-white/72 px-3 py-1.5 text-ink transition hover:bg-white"
              onClick={() => window.location.reload()}
              type="button"
            >
              <RefreshCcw size={14} aria-hidden="true" />
              Atualizar
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/55 bg-white/24 p-6">
              <h3 className="text-lg font-semibold text-ink">Nenhum pedido na fila global</h3>
              <p className="mt-2 text-sm leading-6 text-ink/62">
                Quando as organizacoes enviarem novos briefings, eles aparecerao nesta visao.
              </p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/55 bg-white/24 p-6">
              <h3 className="text-lg font-semibold text-ink">Nenhum pedido encontrado</h3>
              <p className="mt-2 text-sm leading-6 text-ink/62">
                Ajuste os filtros para recuperar a fila completa.
              </p>
              <button
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
                onClick={clearFilters}
                type="button"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredRequests.map((request) => {
                const isSelected = selectedRequest?.id === request.id;

                return (
                  <button
                    aria-pressed={isSelected}
                    className={`rounded-[26px] p-4 text-left transition ${
                      isSelected
                        ? "bg-white/72 ring-2 ring-cobalt/28"
                        : "bg-white/42 hover:bg-white/56"
                    }`}
                    key={request.id}
                    onClick={() => {
                      setSelectedRequestId(request.id);
                      setCommentBody("");
                      setCommentVisibility("workspace");
                    }}
                    type="button"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-ink/68">
                        {typeLabels[request.type]}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[request.status]}`}
                      >
                        {statusLabels[request.status]}
                      </span>
                      <span className="rounded-full bg-ink/6 px-3 py-1 text-xs font-semibold text-ink/62">
                        Prioridade {priorityLabels[request.priority]}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-semibold leading-tight text-ink">{request.title}</h3>
                    <p className="mt-2 text-sm font-medium text-ink/72">{request.objective}</p>

                    <div className="mt-4 grid gap-2 text-xs font-semibold text-ink/58">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/62 px-3 py-1.5">
                        <Building2 size={14} aria-hidden="true" />
                        {request.organizationName}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/62 px-3 py-1.5">
                        <UserRound size={14} aria-hidden="true" />
                        {request.requesterName}
                      </span>
                      <span className="rounded-full bg-white/62 px-3 py-1.5">
                        {request.dueAt ? `Prazo ${formatDate(request.dueAt)}` : "Sem prazo definido"}
                      </span>
                      <span className="rounded-full bg-white/62 px-3 py-1.5">
                        {getCommentSummary(request.comments.length)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          {selectedRequest ? (
            <section className="glass rounded-[34px] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-ink/54">Detalhe operacional</p>
                  <h2 className="text-xl font-semibold">{selectedRequest.title}</h2>
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClasses[selectedRequest.status]}`}
                >
                  {statusLabels[selectedRequest.status]}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-ink/58">
                <span className="rounded-full bg-white/62 px-3 py-1.5">
                  {typeLabels[selectedRequest.type]}
                </span>
                <span className="rounded-full bg-white/62 px-3 py-1.5">
                  Prioridade {priorityLabels[selectedRequest.priority]}
                </span>
                <span className="rounded-full bg-white/62 px-3 py-1.5">
                  Atualizado em {formatDateTime(selectedRequest.updatedAt)}
                </span>
              </div>

              <div className="mt-4 rounded-[24px] bg-white/52 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/48">
                  Organizacao
                </p>
                <p className="mt-2 text-sm leading-6 text-ink/72">{selectedRequest.organizationName}</p>
              </div>

              <div className="mt-4 rounded-[24px] bg-white/52 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/48">
                  Solicitante
                </p>
                <p className="mt-2 text-sm leading-6 text-ink/72">{selectedRequest.requesterName}</p>
                <p className="text-sm leading-6 text-ink/56">{selectedRequest.requesterEmail}</p>
              </div>

              <div className="mt-4 rounded-[24px] bg-white/52 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/48">Objetivo</p>
                <p className="mt-2 text-sm leading-6 text-ink/72">{selectedRequest.objective}</p>
              </div>

              <div className="mt-4 rounded-[24px] bg-white/52 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/48">Briefing</p>
                <p className="mt-2 text-sm leading-6 text-ink/72">{selectedRequest.briefing}</p>
              </div>

              {selectedRequest.notes ? (
                <div className="mt-4 rounded-[24px] bg-white/52 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/48">
                    Observacoes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink/72">{selectedRequest.notes}</p>
                </div>
              ) : null}

              <div className="mt-4 rounded-[24px] border border-white/50 bg-white/48 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink/72">
                  <ShieldCheck size={16} aria-hidden="true" />
                  Controle de acesso
                </div>
                <p className="mt-2 text-sm leading-6 text-ink/62">
                  Esta rota so pode ser carregada por perfis marcados como admin operacional da
                  plataforma.
                </p>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/50 bg-white/48 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink/74">Comentarios internos</p>
                    <p className="mt-1 text-xs text-ink/52">
                      Centralize alinhamentos entre operacao e equipe do pedido.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/72 px-3 py-1.5 text-xs font-semibold text-ink/64">
                    <MessageSquareMore size={14} aria-hidden="true" />
                    {getCommentSummary(selectedRequest.comments.length)}
                  </span>
                </div>

                {selectedRequest.comments.length === 0 ? (
                  <p className="mt-4 text-sm text-ink/58">
                    Nenhum comentario registrado ainda para este pedido.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {selectedRequest.comments.map((comment) => (
                      <article className="rounded-[22px] bg-white/72 p-4" key={comment.id}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-ink">{comment.authorName}</p>
                            <p className="text-xs text-ink/52">{comment.authorEmail}</p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                comment.visibility === "ops_only"
                                  ? "bg-ink text-white"
                                  : "bg-white text-ink/68"
                              }`}
                            >
                              {comment.visibility === "ops_only" ? (
                                <EyeOff size={12} aria-hidden="true" />
                              ) : (
                                <Users size={12} aria-hidden="true" />
                              )}
                              {comment.visibility === "ops_only"
                                ? "Somente operacao"
                                : "Compartilhado com equipe"}
                            </span>
                            <p className="mt-2 text-xs font-medium text-ink/52">
                              {formatDateTime(comment.createdAt)}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-ink/72">{comment.body}</p>
                      </article>
                    ))}
                  </div>
                )}

                <form className="mt-4 space-y-3" onSubmit={(event) => void handleCommentSubmit(event, selectedRequest.id)}>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink/72">Novo comentario</span>
                    <textarea
                      className={`${fieldClassName} min-h-[104px] resize-y`}
                      disabled={commentingRequestId === selectedRequest.id}
                      onChange={(event) => setCommentBody(event.target.value)}
                      placeholder="Ex.: compartilhar primeira proposta com a equipe e manter a versao com cortes extras apenas na operacao."
                      value={commentBody}
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink/72">Visibilidade</span>
                    <select
                      className={fieldClassName}
                      disabled={commentingRequestId === selectedRequest.id}
                      onChange={(event) =>
                        setCommentVisibility(event.target.value as CreativeRequestCommentVisibility)
                      }
                      value={commentVisibility}
                    >
                      <option value="workspace">Compartilhar com equipe</option>
                      <option value="ops_only">Somente operacao</option>
                    </select>
                  </label>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-ink/52">
                      Comentarios compartilhados aparecem no workspace da organizacao. Comentarios operacionais ficam apenas nesta area.
                    </p>
                    <button
                      className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={commentingRequestId === selectedRequest.id}
                      type="submit"
                    >
                      {commentingRequestId === selectedRequest.id ? (
                        <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                      ) : (
                        <SendHorizontal size={16} aria-hidden="true" />
                      )}
                      {commentingRequestId === selectedRequest.id ? "Enviando" : "Adicionar comentario"}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          ) : (
            <section className="glass rounded-[34px] p-5">
              <div className="rounded-[24px] border border-dashed border-white/55 bg-white/24 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink/72">
                  <FolderKanban size={16} aria-hidden="true" />
                  Nenhum detalhe selecionado
                </div>
                <p className="mt-2 text-sm leading-6 text-ink/62">
                  Selecione um pedido na fila para ver organizacao, solicitante, briefing e prazo.
                </p>
              </div>
            </section>
          )}
        </aside>
      </section>
    </div>
  );
}

function buildMetrics(requests: CreativeRequestAdminItem[]) {
  const delivered = requests.filter((request) => request.status === "delivered").length;
  const urgent = requests.filter((request) => request.priority === "urgent").length;
  const organizations = new Set(requests.map((request) => request.organizationId)).size;

  return {
    total: requests.length,
    totalNote: requests.length === 1 ? "1 pedido no radar" : `${requests.length} pedidos no radar`,
    organizations,
    organizationsNote:
      organizations === 1 ? "1 organizacao na fila" : `${organizations} organizacoes na fila`,
    delivered,
    deliveredNote:
      delivered === 1 ? "1 entrega concluida" : `${delivered} entregas concluidas`,
    urgent,
    urgentNote: urgent === 1 ? "1 item urgente" : `${urgent} itens urgentes`
  };
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

function getCommentSummary(commentCount: number) {
  if (commentCount === 0) {
    return "Sem comentarios";
  }

  if (commentCount === 1) {
    return "1 comentario";
  }

  return `${commentCount} comentarios`;
}

const fieldClassName =
  "w-full rounded-[20px] border border-white/58 bg-white/72 px-4 py-3 text-sm text-ink outline-none transition focus:border-cobalt/38 focus:bg-white";
