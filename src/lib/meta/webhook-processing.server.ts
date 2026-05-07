import { requireIntegrationEnv } from "@/lib/env/server";
import {
  createLeadFromWebhook
} from "@/lib/leads/repository.server";
import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { fetchAndMapMetaLeadById } from "./lead-retrieval.server";
import type { MetaLeadgenEvent } from "./webhook";
import { resolveMetaAccessTokenForOrganization } from "@/lib/integrations/repository.server";

type MetaFormRow = Database["public"]["Tables"]["meta_forms"]["Row"];
type MetaPageRow = Database["public"]["Tables"]["meta_pages"]["Row"];
type MetaLeadConnection = {
  organizationId: string;
  integrationId: string;
  form: MetaFormRow | null;
  page: MetaPageRow | null;
};

export type ProcessMetaLeadgenEventResult = {
  leadId: string;
  metaLeadId: string;
  organizationId: string;
  integrationId: string;
  status: "created" | "duplicate";
  duplicateReason?: "meta_lead_id" | "phone_e164" | "email";
};

export async function processMetaLeadgenEvent(input: {
  event: MetaLeadgenEvent;
  rawPayload: unknown;
}): Promise<ProcessMetaLeadgenEventResult> {
  if (!hasSupabaseServiceRole()) {
    requireIntegrationEnv("supabase_admin");
  }
  requireIntegrationEnv("meta_lead_sync");

  const connection = await resolveMetaLeadConnection(input.event);
  const accessToken = await resolveMetaAccessTokenForOrganization(connection.organizationId);

  if (!accessToken) {
    throw new Error(
      `Nao foi possivel localizar um token Meta conectado para a organizacao ${connection.organizationId}.`
    );
  }

  const mappedLead = await fetchAndMapMetaLeadById({
    leadgenId: input.event.leadgenId,
    accessToken
  });
  const rawPayload = buildMetaLeadRawPayload({
    event: input.event,
    webhookPayload: input.rawPayload,
    metaLeadPayload: mappedLead.raw_payload
  });

  const result = await createLeadFromWebhook({
    organization_id: connection.organizationId,
    name: mappedLead.name,
    phone: mappedLead.phone,
    email: mappedLead.email,
    city: mappedLead.city,
    company_name: mappedLead.company_name,
    lives_count: mappedLead.lives_count,
    budget: mappedLead.budget,
    interest: mappedLead.interest,
    notes: mappedLead.notes,
    source_campaign: mappedLead.source_campaign,
    source_adset: mappedLead.source_adset,
    source_ad: mappedLead.source_ad,
    meta_lead_id: mappedLead.meta_lead_id,
    meta_form_id: mappedLead.meta_form_id ?? input.event.formId ?? undefined,
    meta_page_id: input.event.pageId ?? undefined,
    meta_campaign_id: mappedLead.meta_campaign_id,
    meta_adset_id: mappedLead.meta_adset_id,
    meta_ad_id: mappedLead.meta_ad_id,
    meta_connected_account_id: connection.integrationId,
    source: "meta_lead_ads",
    raw_payload: rawPayload
  });

  return {
    leadId: result.lead.id,
    metaLeadId: mappedLead.meta_lead_id,
    organizationId: connection.organizationId,
    integrationId: connection.integrationId,
    status: result.status,
    duplicateReason: result.duplicateReason
  };
}

async function resolveMetaLeadConnection(event: MetaLeadgenEvent): Promise<MetaLeadConnection> {
  const supabase = createSupabaseAdminClient();

  if (event.formId) {
    const { data, error } = await supabase
      .from("meta_forms")
      .select("*")
      .eq("form_id", event.formId)
      .eq("status", "active")
      .limit(2);

    if (error) {
      throw new Error(`Falha ao localizar formulario Meta: ${error.message}`);
    }

    if ((data?.length ?? 0) > 1) {
      throw new Error(`Formulario Meta ${event.formId} vinculado a mais de uma organizacao.`);
    }

    const form = data?.[0] ?? null;
    if (form) {
      const page = await getMetaPageByConnectionId(supabase, form.page_connection_id);
      return {
        organizationId: form.organization_id,
        integrationId: page?.integration_id ?? pageConnectionIntegrationFallback(form),
        form,
        page
      };
    }
  }

  if (event.pageId) {
    const { data, error } = await supabase
      .from("meta_pages")
      .select("*")
      .eq("page_id", event.pageId)
      .eq("status", "active")
      .limit(2);

    if (error) {
      throw new Error(`Falha ao localizar pagina Meta: ${error.message}`);
    }

    if ((data?.length ?? 0) > 1) {
      throw new Error(`Pagina Meta ${event.pageId} vinculada a mais de uma organizacao.`);
    }

    const page = data?.[0] ?? null;
    if (page) {
      return {
        organizationId: page.organization_id,
        integrationId: page.integration_id,
        form: null,
        page
      };
    }
  }

  throw new Error(
    `Nenhuma integracao Meta ativa encontrada para form_id ${event.formId ?? "n/d"} e page_id ${event.pageId ?? "n/d"}.`
  );
}

async function getMetaPageByConnectionId(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  pageConnectionId: string
) {
  const { data, error } = await supabase
    .from("meta_pages")
    .select("*")
    .eq("id", pageConnectionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao carregar pagina Meta do formulario: ${error.message}`);
  }

  return data;
}

function pageConnectionIntegrationFallback(form: MetaFormRow): never {
  throw new Error(
    `Formulario Meta ${form.form_id} encontrado sem pagina Meta vinculada para identificar a integracao.`
  );
}

function buildMetaLeadRawPayload(input: {
  event: MetaLeadgenEvent;
  webhookPayload: unknown;
  metaLeadPayload: unknown;
}) {
  return {
    source: "meta_lead_ads",
    meta_webhook_event: {
      leadgen_id: input.event.leadgenId,
      form_id: input.event.formId,
      page_id: input.event.pageId,
      ad_id: input.event.adId,
      adgroup_id: input.event.adgroupId,
      created_time: input.event.createdTime,
      entry_id: input.event.entryId,
      entry_index: input.event.entryIndex,
      raw_change: input.event.rawChange
    },
    meta_webhook_payload: input.webhookPayload,
    meta_lead_payload: input.metaLeadPayload
  };
}
