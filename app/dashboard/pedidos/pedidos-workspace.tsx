"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Download,
  FilePlus2,
  Loader2,
  MessageSquareMore,
  Paperclip,
  RefreshCcw,
  SendHorizontal,
  SlidersHorizontal
} from "lucide-react";
import { SubscriptionAccessBanner } from "@/components/billing/subscription-access-banner";
import { Metric, PageHeading } from "@/components/dashboard/widgets";
import {
  CREATIVE_REQUEST_ATTACHMENT_ACCEPT,
  validateCreativeRequestAttachment
} from "@/lib/creative-requests/attachments";
import {
  creativeRequestWorkflowStatuses,
  type CreativeRequestItem,
  type CreativeRequestListState
} from "@/lib/creative-requests/types";
import type { ResourceAccessSummary } from "@/lib/billing/subscription-limits.server";
import type { CreativeRequestStatus } from "@/lib/supabase/database.types";

const requestTypeOptions = [
  { value: "design", label: "Design" },
  { value: "video", label: "Video" },
  { value: "campaign", label: "Kit de campanha" }
] as const;

const requestTypeFilterOptions = [
  { value: "all", label: "Todos os tipos" },
  ...requestTypeOptions
] as const;

const workflowStatusOptions = [
  { value: "requested", label: "Recebido" },
  { value: "in_progress", label: "Em producao" },
  { value: "in_review", label: "Aguardando revisao" },
  { value: "approved", label: "Aprovado" },
  { value: "delivered", label: "Entregue" }
] as const;

const workflowStatusFilterOptions = [
  { value: "all", label: "Todos os status" },
  ...workflowStatusOptions,
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

const initialForm = {
  type: "design",
  title: "",
  objective: "",
  briefing: "",
  dueAt: "",
  notes: ""
};

type FormState = typeof initialForm;
type RequestTypeFilter = CreativeRequestItem["type"] | "all";
type RequestStatusFilter = CreativeRequestStatus | "all";

type CreateCreativeRequestResponse = {
  request?: CreativeRequestItem;
  error?: string;
  mode?: CreativeRequestListState["mode"];
};

type AttachCreativeRequestFileResponse = CreateCreativeRequestResponse;

type UpdateCreativeRequestStatusResponse = CreateCreativeRequestResponse;
type CreateCreativeRequestCommentResponse = CreateCreativeRequestResponse;

type ListCreativeRequestsResponse = CreativeRequestListState & {
  error?: string;
};

export function PedidosWorkspace({
  createRequestAccess,
  initialRequests,
  listMode,
  listMessage,
  showAdminLink = false,
  workspaceName,
  workspaceVariant = "requests"
}: {
  createRequestAccess: ResourceAccessSummary;
  initialRequests: CreativeRequestItem[];
  listMode: CreativeRequestListState["mode"];
  listMessage?: string;
  showAdminLink?: boolean;
  workspaceName: string;
  workspaceVariant?: "requests" | "validator";
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(
    createRequestAccess.allowed && initialRequests.length === 0
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploadingRequestId, setUploadingRequestId] = useState("");
  const [updatingRequestId, setUpdatingRequestId] = useState("");
  const [commentingRequestId, setCommentingRequestId] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState(initialRequests[0]?.id ?? "");
  const [commentBody, setCommentBody] = useState("");
  const [typeFilter, setTypeFilter] = useState<RequestTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("all");
  const [currentListMode, setCurrentListMode] = useState(listMode);
  const [currentListMessage, setCurrentListMessage] = useState(listMessage ?? "");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const metrics = useMemo(() => buildMetrics(requests), [requests]);
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
  const canMutateRequests = currentListMode !== "error" && currentListMode !== "unauthenticated";
  const canCreateRequests = canMutateRequests && createRequestAccess.allowed;
  const visibleStatusLabels =
    workspaceVariant === "validator"
      ? {
          approved: "Aprovada",
          cancelled: "Cancelada",
          delivered: "Entregue/pronta",
          in_progress: "Em criação",
          in_review: "Aguardando aprovação",
          requested: "Aguardando análise"
        }
      : statusLabels;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!canCreateRequests) {
      setError(createRequestAccess.message);
      return;
    }

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/creative-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID()
        },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          objective: form.objective,
          briefing: form.briefing,
          due_at: form.dueAt,
          notes: form.notes
        })
      });

      const payload = (await response.json().catch(() => null)) as CreateCreativeRequestResponse | null;

      if (!response.ok || !payload?.request) {
        throw new Error(payload?.error ?? "Nao foi possivel salvar o pedido.");
      }

      const createdRequest = payload.request;

      setRequests((current) => [
        createdRequest,
        ...current.filter((item) => item.id !== createdRequest.id)
      ]);
      setSelectedRequestId(createdRequest.id);
      setTypeFilter("all");
      setStatusFilter("all");
      setForm(initialForm);
      setIsFormOpen(false);
      setCurrentListMode(payload.mode ?? currentListMode);
      setSuccessMessage(
        workspaceVariant === "validator"
          ? "Solicitação criada com sucesso e adicionada ao acompanhamento."
          : "Pedido criado com sucesso e adicionado a fila."
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Nao foi possivel salvar o pedido."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRefresh() {
    setError("");
    setSuccessMessage("");
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/creative-requests", {
        cache: "no-store"
      });
      const payload = (await response.json().catch(() => null)) as ListCreativeRequestsResponse | null;

      if (!response.ok || !payload?.requests) {
        throw new Error(payload?.error ?? "Nao foi possivel atualizar a lista de pedidos.");
      }

      setRequests(payload.requests);
      setCurrentListMode(payload.mode);
      setCurrentListMessage(payload.message ?? "");
      setSelectedRequestId((currentSelected) =>
        payload.requests.some((request) => request.id === currentSelected)
          ? currentSelected
          : (payload.requests[0]?.id ?? "")
      );
      setSuccessMessage(
        payload.requests.length === 0
          ? "Lista atualizada. Ainda nao ha pedidos criados."
          : "Lista atualizada com os pedidos mais recentes."
      );
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Nao foi possivel atualizar a lista de pedidos."
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  async function handleAttachmentUpload(requestId: string, file: File) {
    setError("");
    setSuccessMessage("");

    const validationError = validateCreativeRequestAttachment(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setUploadingRequestId(requestId);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch(`/api/creative-requests/${requestId}/attachments`, {
        method: "POST",
        body: formData
      });
      const payload =
        (await response.json().catch(() => null)) as AttachCreativeRequestFileResponse | null;

      if (!response.ok || !payload?.request) {
        throw new Error(payload?.error ?? "Nao foi possivel anexar o arquivo.");
      }

      setRequests((current) =>
        current.map((request) => (request.id === payload.request?.id ? payload.request : request))
      );
      setSelectedRequestId(payload.request.id);
      setSuccessMessage("Anexo enviado com sucesso.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Nao foi possivel anexar o arquivo."
      );
    } finally {
      setUploadingRequestId("");
    }
  }

  async function handleStatusUpdate(requestId: string, status: CreativeRequestStatus) {
    setError("");
    setSuccessMessage("");
    setUpdatingRequestId(requestId);

    try {
      const response = await fetch(`/api/creative-requests/${encodeURIComponent(requestId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      const payload =
        (await response.json().catch(() => null)) as UpdateCreativeRequestStatusResponse | null;

      if (!response.ok || !payload?.request) {
        throw new Error(payload?.error ?? "Nao foi possivel atualizar o status do pedido.");
      }

      setRequests((current) =>
        current.map((request) => (request.id === payload.request?.id ? payload.request : request))
      );
      setCurrentListMode(payload.mode ?? currentListMode);
      setSelectedRequestId(payload.request.id);
      setSuccessMessage(
        payload.mode === "not-configured"
          ? `Status atualizado para ${visibleStatusLabels[payload.request.status]} nesta visualizacao.`
          : `Status atualizado para ${visibleStatusLabels[payload.request.status]}.`
      );
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Nao foi possivel atualizar o status do pedido."
      );
    } finally {
      setUpdatingRequestId("");
    }
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
      const response = await fetch(`/api/creative-requests/${encodeURIComponent(requestId)}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ body: nextComment })
      });
      const payload =
        (await response.json().catch(() => null)) as CreateCreativeRequestCommentResponse | null;

      if (!response.ok || !payload?.request) {
        throw new Error(payload?.error ?? "Nao foi possivel salvar o comentario.");
      }

      setRequests((current) =>
        current.map((request) => (request.id === payload.request?.id ? payload.request : request))
      );
      setCurrentListMode(payload.mode ?? currentListMode);
      setSelectedRequestId(payload.request.id);
      setCommentBody("");
      setSuccessMessage("Comentario adicionado ao pedido.");
    } catch (commentError) {
      setError(
        commentError instanceof Error
          ? commentError.message
          : "Nao foi possivel salvar o comentario."
      );
    } finally {
      setCommentingRequestId("");
    }
  }

  function clearFilters() {
    setTypeFilter("all");
    setStatusFilter("all");
  }

  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow={workspaceVariant === "validator" ? "Criações" : "Pedidos"}
        title={workspaceVariant === "validator" ? "Validador de campanha" : "Pedidos criativos"}
        description={
          workspaceVariant === "validator"
            ? `Acompanhe o andamento das solicitações da conta ${workspaceName}, revise materiais e concentre o status comercial de cada campanha em um só lugar.`
            : `Acompanhe briefings e materiais de apoio do workspace ${workspaceName}, sempre preparados para revisão antes de qualquer publicação.`
        }
      >
        {showAdminLink ? (
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-white/72 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white"
            href="/dashboard/admin/pedidos"
          >
            Fila admin
          </Link>
        ) : null}
        <button
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canCreateRequests}
          onClick={() => {
            if (canCreateRequests) {
              setIsFormOpen((current) => !current);
            }
          }}
          type="button"
        >
          <FilePlus2 size={18} aria-hidden="true" />
          {isFormOpen
            ? workspaceVariant === "validator"
              ? "Fechar formulario"
              : "Fechar formulario"
            : workspaceVariant === "validator"
              ? "Nova solicitacao"
              : "Novo pedido"}
        </button>
      </PageHeading>

      {!createRequestAccess.allowed ? <SubscriptionAccessBanner notice={createRequestAccess} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          label={workspaceVariant === "validator" ? "Solicitações ativas" : "Pedidos ativos"}
          value={String(metrics.active)}
          note={metrics.activeNote}
          tone="dark"
        />
        <Metric label="Entregues" value={String(metrics.delivered)} note={metrics.deliveredNote} tone="teal" />
        <Metric label="Pendentes" value={String(metrics.pending)} note={metrics.pendingNote} tone="yellow" />
        <Metric label="Aprovados" value={String(metrics.approved)} note={metrics.approvedNote} tone="blue" />
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

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_380px] xl:items-start">
        <section className="glass-strong rounded-[34px] p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-ink/54">Fila</p>
              <h2 className="text-2xl font-semibold">
                {workspaceVariant === "validator" ? "Solicitações da conta" : "Pedidos da organizacao"}
              </h2>
            </div>
            <button
              className="icon-button disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isRefreshing}
              onClick={() => void handleRefresh()}
              title="Atualizar pedidos"
              type="button"
            >
              {isRefreshing ? (
                <Loader2 className="animate-spin" size={18} aria-hidden="true" />
              ) : (
                <RefreshCcw size={18} aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink/48">
                <SlidersHorizontal size={14} aria-hidden="true" />
                Tipo
              </span>
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
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink/48">
                <SlidersHorizontal size={14} aria-hidden="true" />
                Status
              </span>
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
              Mostrando {filteredRequests.length} de {requests.length}{" "}
              {workspaceVariant === "validator" ? "solicitacoes" : "pedidos"}
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
          </div>

          {requests.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/55 bg-white/24 p-6">
              <h3 className="text-lg font-semibold text-ink">
                {workspaceVariant === "validator"
                  ? "Nenhuma solicitacao criada ainda"
                  : "Nenhum pedido criado ainda"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink/62">
                {workspaceVariant === "validator"
                  ? "Abra o formulario para enviar a primeira solicitacao e acompanhar o andamento por aqui."
                  : "Abra o formulario para enviar o primeiro briefing e acompanhar os prazos por aqui."}
              </p>
              <button
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canCreateRequests}
                onClick={() => {
                  if (canCreateRequests) {
                    setIsFormOpen(true);
                  }
                }}
                type="button"
              >
                <FilePlus2 size={18} aria-hidden="true" />
                {workspaceVariant === "validator" ? "Criar primeira solicitacao" : "Criar primeiro pedido"}
              </button>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/55 bg-white/24 p-6">
              <h3 className="text-lg font-semibold text-ink">
                {workspaceVariant === "validator"
                  ? "Nenhuma solicitacao encontrada"
                  : "Nenhum pedido encontrado"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink/62">
                {workspaceVariant === "validator"
                  ? "Ajuste os filtros para voltar a ver a fila completa ou abra uma nova solicitacao."
                  : "Ajuste os filtros para voltar a ver a fila completa ou abra um novo pedido."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
                  onClick={clearFilters}
                  type="button"
                >
                  Limpar filtros
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-white/70 px-5 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!canCreateRequests}
                  onClick={() => {
                    if (canCreateRequests) {
                      setIsFormOpen(true);
                    }
                  }}
                  type="button"
                >
                  <FilePlus2 size={18} aria-hidden="true" />
                  {workspaceVariant === "validator" ? "Nova solicitacao" : "Novo pedido"}
                </button>
              </div>
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
                        {visibleStatusLabels[request.status]}
                      </span>
                      <span className="rounded-full bg-ink/6 px-3 py-1 text-xs font-semibold text-ink/62">
                        Prioridade {priorityLabels[request.priority]}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-semibold leading-tight text-ink">{request.title}</h3>
                    <p className="mt-2 text-sm font-medium text-ink/72">{request.objective}</p>
                    <p className="mt-3 text-sm leading-6 text-ink/62">
                      {summarizeText(request.briefing, 148)}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-ink/56">
                      <span className="rounded-full bg-white/62 px-3 py-1.5">
                        Criado em {formatDate(request.createdAt)}
                      </span>
                      <span className="rounded-full bg-white/62 px-3 py-1.5">
                        {request.dueAt ? `Prazo ${formatDate(request.dueAt)}` : "Sem prazo definido"}
                      </span>
                      <span className="rounded-full bg-white/62 px-3 py-1.5">
                        {getAttachmentSummary(request.files.length)}
                      </span>
                      <span className="rounded-full bg-white/62 px-3 py-1.5">
                        {getCommentSummary(request.comments.length)}
                      </span>
                    </div>

                    <div className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-cobalt/72">
                      {isSelected ? "Detalhe aberto" : "Abrir detalhe"}
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
                  <p className="text-sm text-ink/54">Detalhe</p>
                  <h2 className="text-xl font-semibold">{selectedRequest.title}</h2>
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClasses[selectedRequest.status]}`}
                >
                  {visibleStatusLabels[selectedRequest.status]}
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
                  {selectedRequest.dueAt
                    ? `Prazo ${formatDate(selectedRequest.dueAt)}`
                    : "Sem prazo definido"}
                </span>
                <span className="rounded-full bg-white/62 px-3 py-1.5">
                  Atualizado em {formatDateTime(selectedRequest.updatedAt)}
                </span>
              </div>

              <div className="mt-5 rounded-[24px] bg-white/52 p-4">
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
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink/74">Fluxo do pedido</p>
                    <p className="mt-1 text-xs text-ink/52">
                      Acompanhe a etapa atual e atualize quando o criativo avancar.
                    </p>
                  </div>
                  {updatingRequestId === selectedRequest.id ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/78 px-3 py-1.5 text-xs font-semibold text-ink/66">
                      <Loader2 className="animate-spin" size={14} aria-hidden="true" />
                      Atualizando
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {workflowStatusOptions.map((option) => {
                    const stepState = getWorkflowStepState(selectedRequest.status, option.value);

                    return (
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${stepClasses[stepState]}`}
                        key={option.value}
                      >
                        {option.label}
                      </span>
                    );
                  })}
                </div>

                {selectedRequest.status === "cancelled" ? (
                  <p className="mt-3 text-xs font-medium text-ink/58">
                    Este pedido esta fora do fluxo principal porque foi cancelado.
                  </p>
                ) : null}

                <label className="mt-4 block space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/48">
                    Atualizar status
                  </span>
                  <select
                    className={fieldClassName}
                    disabled={
                      uploadingRequestId === selectedRequest.id ||
                      updatingRequestId === selectedRequest.id ||
                      !canMutateRequests
                    }
                    onChange={(event) =>
                      void handleStatusUpdate(
                        selectedRequest.id,
                        event.target.value as CreativeRequestStatus
                      )
                    }
                    value={selectedRequest.status}
                  >
                    {workflowStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    {selectedRequest.status === "cancelled" ? (
                      <option value="cancelled">Cancelado</option>
                    ) : null}
                  </select>
                </label>
              </div>

              <div className="mt-4 rounded-[24px] bg-white/56 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Paperclip size={16} aria-hidden="true" />
                    <p className="text-sm font-semibold text-ink/74">Anexos</p>
                  </div>
                  <label
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${
                      currentListMode === "supabase"
                        ? "bg-ink text-white"
                        : "bg-white/70 text-ink/58"
                    } ${uploadingRequestId === selectedRequest.id ? "opacity-70" : ""}`}
                  >
                    {uploadingRequestId === selectedRequest.id ? (
                      <Loader2 className="animate-spin" size={14} aria-hidden="true" />
                    ) : (
                      <FilePlus2 size={14} aria-hidden="true" />
                    )}
                    {uploadingRequestId === selectedRequest.id ? "Enviando" : "Adicionar arquivo"}
                    <input
                      accept={CREATIVE_REQUEST_ATTACHMENT_ACCEPT}
                      className="sr-only"
                      disabled={currentListMode !== "supabase" || uploadingRequestId === selectedRequest.id}
                      onChange={async (event) => {
                        const selectedFile = event.currentTarget.files?.[0];

                        event.currentTarget.value = "";

                        if (!selectedFile) {
                          return;
                        }

                        await handleAttachmentUpload(selectedRequest.id, selectedFile);
                      }}
                      type="file"
                    />
                  </label>
                </div>

                {selectedRequest.files.length === 0 ? (
                  <p className="mt-3 text-sm text-ink/58">
                    {currentListMode === "supabase"
                      ? "Nenhum anexo enviado ainda."
                      : "Configure o Supabase para anexar arquivos reais a este pedido."}
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {selectedRequest.files.map((file) => (
                      <div
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/70 px-3 py-2"
                        key={file.id}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{file.name}</p>
                          <p className="text-xs text-ink/54">
                            {formatFileSize(file.sizeBytes)} • enviado em {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                        <a
                          className="inline-flex items-center gap-2 rounded-full bg-ink/8 px-3 py-2 text-xs font-semibold text-ink"
                          href={`/api/creative-requests/${selectedRequest.id}/attachments/${file.id}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <Download size={14} aria-hidden="true" />
                          Baixar
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                <p className="mt-3 text-xs text-ink/52">
                  Tipos aceitos: imagem, PDF, MP4, MOV, ZIP, DOC, DOCX, PPT ou PPTX ate 10 MB.
                </p>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/50 bg-white/48 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink/74">Comentarios internos</p>
                    <p className="mt-1 text-xs text-ink/52">
                      Registre alinhamentos curtos com a operacao sem sair do pedido.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/72 px-3 py-1.5 text-xs font-semibold text-ink/64">
                    <MessageSquareMore size={14} aria-hidden="true" />
                    {getCommentSummary(selectedRequest.comments.length)}
                  </span>
                </div>

                {selectedRequest.comments.length === 0 ? (
                  <p className="mt-4 text-sm text-ink/58">
                    Nenhum comentario interno ainda. Use este espaco para alinhar status, duvidas ou ajustes rapidos.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {selectedRequest.comments.map((comment) => (
                      <article className="rounded-[22px] bg-white/72 p-4" key={comment.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-ink">{comment.authorName}</p>
                            <p className="text-xs text-ink/52">{comment.authorEmail}</p>
                          </div>
                          <span className="text-xs font-medium text-ink/52">
                            {formatDateTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-ink/72">{comment.body}</p>
                      </article>
                    ))}
                  </div>
                )}

                <form className="mt-4" onSubmit={(event) => void handleCommentSubmit(event, selectedRequest.id)}>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-ink/72">Novo comentario</span>
                    <textarea
                      className={`${fieldClassName} min-h-[104px] resize-y`}
                      disabled={!canMutateRequests || commentingRequestId === selectedRequest.id}
                      onChange={(event) => setCommentBody(event.target.value)}
                      placeholder="Ex.: podemos aprovar a versao com CTA para WhatsApp e manter a segunda opcao como backup."
                      value={commentBody}
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-ink/52">
                      Este comentario fica visivel para a equipe do workspace e para a operacao.
                    </p>
                    <button
                      className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={!canMutateRequests || commentingRequestId === selectedRequest.id}
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
              <div className="flex items-start gap-3">
                <ClipboardList className="mt-0.5 text-cobalt" size={20} aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-semibold">
                    {workspaceVariant === "validator"
                      ? "Sem solicitacao selecionada"
                      : "Sem pedido selecionado"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink/62">
                    {workspaceVariant === "validator"
                      ? "Escolha uma solicitacao na fila para ver status, prazo, briefing e anexos em um unico lugar."
                      : "Escolha um pedido na fila para ver status, prazo, briefing e anexos em um unico lugar."}
                  </p>
                </div>
              </div>
            </section>
          )}

          {isFormOpen ? (
            <section className="glass rounded-[34px] p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-ink/54">Formulario</p>
                  <h2 className="text-xl font-semibold">
                    {workspaceVariant === "validator" ? "Nova solicitacao" : "Novo pedido"}
                  </h2>
                </div>
                <ClipboardList size={20} aria-hidden="true" />
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink/72">Tipo de pedido</span>
                  <select
                    className={fieldClassName}
                    onChange={(event) => updateField("type", event.target.value)}
                    value={form.type}
                  >
                    {requestTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink/72">Titulo</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => updateField("title", event.target.value)}
                    placeholder="Ex.: Carrossel para plano empresarial PME"
                    type="text"
                    value={form.title}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink/72">Objetivo</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => updateField("objective", event.target.value)}
                    placeholder="Ex.: gerar leads qualificados para empresas de 2 a 29 vidas"
                    type="text"
                    value={form.objective}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink/72">Briefing</span>
                  <textarea
                    className={`${fieldClassName} min-h-[132px] resize-y`}
                    onChange={(event) => updateField("briefing", event.target.value)}
                    placeholder="Descreva contexto, publico, formato, angulo criativo e referencias importantes."
                    value={form.briefing}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink/72">Prazo desejado</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => updateField("dueAt", event.target.value)}
                    type="date"
                    value={form.dueAt}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-ink/72">Observacoes</span>
                  <textarea
                    className={`${fieldClassName} min-h-[96px] resize-y`}
                    onChange={(event) => updateField("notes", event.target.value)}
                    placeholder="Ex.: evitar promessas, manter tom consultivo e incluir CTA para contato."
                    value={form.notes}
                  />
                </label>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isSubmitting || !canCreateRequests}
                    type="submit"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                    ) : (
                      <CheckCircle2 size={18} aria-hidden="true" />
                    )}
                    {isSubmitting ? "Salvando" : "Salvar pedido"}
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-white/64 px-5 py-3 text-sm font-semibold text-ink"
                    onClick={() => {
                      setForm(initialForm);
                      setError("");
                      setSuccessMessage("");
                    }}
                    type="button"
                  >
                    Limpar
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <section className="glass rounded-[34px] p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 text-lagoon" size={20} aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-semibold">Formulario pronto</h2>
                  <p className="mt-2 text-sm leading-6 text-ink/62">
                    {workspaceVariant === "validator"
                      ? "Abra outra solicitacao quando precisar de uma nova campanha, criativo ou ajuste para a operacao."
                      : "Abra outro pedido quando precisar de mais um criativo para a operacao."}
                  </p>
                </div>
              </div>
              <button
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canCreateRequests}
                onClick={() => {
                  if (canCreateRequests) {
                    setIsFormOpen(true);
                  }
                }}
                type="button"
              >
                <FilePlus2 size={18} aria-hidden="true" />
                {workspaceVariant === "validator" ? "Abrir outra solicitacao" : "Abrir outro pedido"}
                </button>
            </section>
          )}

          <section className="glass rounded-[34px] p-5">
            <h2 className="font-semibold">Checklist do briefing</h2>
            <div className="mt-4 space-y-3">
              {[
                "Objetivo comercial claro",
                "Formato esperado do material",
                "Prazo desejado",
                "Observacoes sensiveis ou restricoes"
              ].map((item) => (
                <div className="flex items-center gap-3 rounded-2xl bg-white/42 px-4 py-3" key={item}>
                  <CheckCircle2 size={18} className="text-lagoon" aria-hidden="true" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[24px] bg-white/48 p-4 text-sm text-ink/62">
              Pedidos com briefing mais completo entram na producao com menos retrabalho.
            </div>
          </section>

          {currentListMode === "error" || currentListMode === "unauthenticated" ? (
            <section className="rounded-[28px] border border-red-200/70 bg-red-50/80 p-5 text-sm text-red-800">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} aria-hidden="true" />
                <p>
                  {currentListMessage ||
                    "Os pedidos nao puderam ser carregados por completo. Recarregue a pagina apos revisar sua sessao."}
                </p>
              </div>
            </section>
          ) : null}
        </aside>
      </section>
    </div>
  );
}

function validateForm(form: FormState) {
  if (!form.title.trim()) {
    return "Informe o titulo do pedido.";
  }

  if (!form.objective.trim()) {
    return "Informe o objetivo do pedido.";
  }

  if (!form.briefing.trim()) {
    return "Informe o briefing do pedido.";
  }

  return "";
}

type WorkflowStepState = "active" | "complete" | "upcoming";

function buildMetrics(requests: CreativeRequestItem[]) {
  const active = requests.filter((request) =>
    !["approved", "cancelled", "delivered"].includes(request.status)
  ).length;
  const delivered = requests.filter((request) => request.status === "delivered").length;
  const pending = requests.filter((request) =>
    ["requested", "in_review"].includes(request.status)
  ).length;
  const approved = requests.filter((request) => request.status === "approved").length;

  return {
    active,
    activeNote: active === 1 ? "1 em andamento" : `${active} em andamento`,
    delivered,
    deliveredNote: delivered === 0 ? "sem entregas" : `${delivered} finalizados`,
    pending,
    pendingNote: pending === 0 ? "briefing em dia" : `${pending} aguardando`,
    approved,
    approvedNote: approved === 0 ? "sem aprovacoes" : `${approved} aprovados`
  };
}

function summarizeText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
}

function getAttachmentSummary(fileCount: number) {
  if (fileCount === 0) {
    return "Sem anexos";
  }

  if (fileCount === 1) {
    return "1 anexo";
  }

  return `${fileCount} anexos`;
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
  "w-full rounded-[22px] border border-white/54 bg-white/72 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/36 focus:border-cobalt/40 focus:ring-2 focus:ring-cobalt/15";

const stepClasses: Record<WorkflowStepState, string> = {
  active: "bg-ink text-white",
  complete: "bg-lagoon text-white",
  upcoming: "bg-white/72 text-ink/56"
};

function getWorkflowStepState(
  currentStatus: CreativeRequestStatus,
  stepStatus: (typeof creativeRequestWorkflowStatuses)[number]
): WorkflowStepState {
  const currentIndex = creativeRequestWorkflowStatuses.indexOf(
    currentStatus as (typeof creativeRequestWorkflowStatuses)[number]
  );
  const stepIndex = creativeRequestWorkflowStatuses.indexOf(stepStatus);

  if (currentIndex === -1) {
    return "upcoming";
  }

  if (currentIndex === stepIndex) {
    return "active";
  }

  return currentIndex > stepIndex ? "complete" : "upcoming";
}
