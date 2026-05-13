import { NextResponse } from "next/server";
import { buildCsv } from "@/lib/exports/csv";
import { parseLeadUrlFilters } from "@/lib/leads/filters";
import { getLeadExportRowsForCurrentUser } from "@/lib/leads/repository.server";

type ExportLeadSearchParams = URLSearchParams;

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams as ExportLeadSearchParams;
    const filters = parseLeadUrlFilters(searchParams);
    const sellerProfileId = normalizeSellerProfileId(searchParams.get("seller"));
    const leads = await getLeadExportRowsForCurrentUser(filters, sellerProfileId);
    const csv = buildCsv(leads, leadExportColumns);
    const filename = buildFilename(filters, sellerProfileId);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel exportar os leads.";
    const status = message.includes("Usuario nao autenticado") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

const leadExportColumns = [
  { header: "id", value: (lead: { id: string }) => lead.id },
  { header: "nome", value: (lead: { name: string }) => lead.name },
  { header: "responsavel", value: (lead: { owner: string }) => lead.owner },
  { header: "etapa", value: (lead: { stage: string }) => lead.stage },
  { header: "origem", value: (lead: { source: string }) => lead.source },
  { header: "telefone", value: (lead: { phone: string }) => lead.phone },
  { header: "email", value: (lead: { email: string }) => lead.email },
  { header: "cidade", value: (lead: { city?: string | null }) => lead.city ?? "" },
  { header: "empresa", value: (lead: { companyName?: string | null }) => lead.companyName ?? "" },
  { header: "vidas", value: (lead: { livesCount?: number | null }) => lead.livesCount ?? "" },
  { header: "score", value: (lead: { score: number }) => lead.score },
  { header: "recebido_em", value: (lead: { receivedAt?: string | null }) => lead.receivedAt ?? "" },
  { header: "proximo_contato_em", value: (lead: { nextContactAt?: string | null }) => lead.nextContactAt ?? "" },
  { header: "proximo_contato", value: (lead: { nextContact: string }) => lead.nextContact },
  { header: "criado_em", value: (lead: { createdAt: string }) => lead.createdAt },
  { header: "orcamento", value: (lead: { budget: string }) => lead.budget },
  { header: "interesse", value: (lead: { interest: string }) => lead.interest },
  { header: "ultima_interacao", value: (lead: { lastInteraction: string }) => lead.lastInteraction },
  { header: "observacoes", value: (lead: { notes: string }) => lead.notes },
  { header: "campanha_origem", value: (lead: { sourceCampaign?: string | null }) => lead.sourceCampaign ?? "" },
  { header: "adset_origem", value: (lead: { sourceAdset?: string | null }) => lead.sourceAdset ?? "" },
  { header: "anuncio_origem", value: (lead: { sourceAd?: string | null }) => lead.sourceAd ?? "" },
  { header: "meta_lead_id", value: (lead: { metaLeadId?: string | null }) => lead.metaLeadId ?? "" },
  { header: "meta_form_id", value: (lead: { metaFormId?: string | null }) => lead.metaFormId ?? "" },
  { header: "meta_page_id", value: (lead: { metaPageId?: string | null }) => lead.metaPageId ?? "" },
  {
    header: "meta_conta_conectada_id",
    value: (lead: { metaConnectedAccountId?: string | null }) => lead.metaConnectedAccountId ?? ""
  }
] as const;

function normalizeSellerProfileId(value: string | null) {
  if (!value || value === "all") {
    return null;
  }

  return value;
}

function buildFilename(filters: ReturnType<typeof parseLeadUrlFilters>, sellerProfileId: string | null) {
  const parts = ["leads-export"];

  if (filters.stage !== "all") parts.push(`etapa-${slugify(filters.stage)}`);
  if (filters.source !== "all") parts.push(`origem-${slugify(filters.source)}`);
  if (filters.period !== "all") parts.push(`periodo-${filters.period}`);
  if (filters.score !== "all") parts.push(`score-${slugify(filters.score)}`);
  if (filters.city) parts.push(`cidade-${slugify(filters.city)}`);
  if (filters.search) parts.push(`busca-${slugify(filters.search)}`);
  if (sellerProfileId) parts.push(`seller-${slugify(sellerProfileId)}`);

  parts.push(new Date().toISOString().slice(0, 10));

  return `${parts.join("-")}.csv`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
