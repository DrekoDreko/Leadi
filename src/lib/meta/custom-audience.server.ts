import "server-only";

import { createHash } from "node:crypto";

import { createSupabaseAdminClient, hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { getMetaGraphApiVersion } from "@/lib/meta/config";

// Mudanca 6: publicos personalizados a partir da carteira do corretor.
//
// A carteira de clientes e o ativo de targeting mais forte nesse nicho e estava
// sendo ignorada. Aqui fazemos o hashing local (SHA-256) dos identificadores,
// criamos um Custom Audience na Meta e derivamos um Lookalike. A carteira crua
// NUNCA e persistida — so os IDs retornados pela Meta.
//
// Atencao (Categoria Especial FINANCIAL_PRODUCTS_SERVICES): o Lookalike pode ser
// recusado. Nesse caso capturamos o erro, seguimos com o Custom Audience e a
// campanha cai no targeting aberto atual (fallback).

function sanitizeAdAccountId(adAccountId: string): string {
  return adAccountId.replace(/^act_/, "");
}

// Normalizacao exigida pela Meta antes do hash: e-mail em minusculas e sem espacos.
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Telefone: apenas digitos, com codigo do pais. Assumimos Brasil (55) quando o
// numero vem sem DDI (10 ou 11 digitos = fixo/celular com DDD).
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

type WalletIdentifier = { email?: string | null; phone?: string | null };

export type WalletAudienceResult = {
  customAudienceId: string;
  lookalikeId: string | null;
  status: "ready" | "lookalike_unavailable";
  sourceCount: number;
};

type MetaAudienceResponse = { id?: string; error?: { message?: string; error_user_msg?: string } };

async function metaPost(
  path: string,
  accessToken: string,
  params: Record<string, string>
): Promise<MetaAudienceResponse> {
  const url = new URL(`https://graph.facebook.com/${getMetaGraphApiVersion()}/${path}`);
  const body = new URLSearchParams(params);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body,
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => null)) as MetaAudienceResponse | null;
  if (!response.ok) {
    const detail = payload?.error?.error_user_msg || payload?.error?.message;
    const error = new Error(detail ?? `Falha na Meta: status ${response.status}.`);
    throw error;
  }
  return payload ?? {};
}

// Cria Custom Audience + Lookalike a partir da carteira e persiste os IDs.
export async function createWalletAudiences(input: {
  organizationId: string;
  createdByProfileId: string | null;
  adAccountId: string;
  accessToken: string;
  identifiers: WalletIdentifier[];
  audienceName?: string;
}): Promise<WalletAudienceResult> {
  if (!hasSupabaseServiceRole()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurada.");
  }

  const account = sanitizeAdAccountId(input.adAccountId);
  const baseName = input.audienceName?.trim() || "Carteira do corretor";

  // 1) Custom Audience (base).
  const custom = await metaPost(`act_${account}/customaudiences`, input.accessToken, {
    name: `${baseName} - Carteira`,
    subtype: "CUSTOM",
    description: "Base de clientes do corretor (hashing local).",
    customer_file_source: "USER_PROVIDED_ONLY"
  });

  if (!custom.id) {
    throw new Error("A Meta nao retornou o ID do Custom Audience.");
  }

  // 2) Envio dos usuarios com hashing (schema alinhado por posicao).
  const schema = ["EMAIL_SHA256", "PHONE_SHA256"];
  const data = input.identifiers
    .map((identifier) => {
      const email = identifier.email ? sha256(normalizeEmail(identifier.email)) : "";
      const phoneNormalized = identifier.phone ? normalizePhone(identifier.phone) : "";
      const phone = phoneNormalized ? sha256(phoneNormalized) : "";
      return [email, phone];
    })
    .filter((row) => row[0] || row[1]);

  if (data.length > 0) {
    await metaPost(`${custom.id}/users`, input.accessToken, {
      payload: JSON.stringify({ schema, data })
    });
  }

  // 3) Lookalike (best-effort — pode ser barrado pela Categoria Especial).
  let lookalikeId: string | null = null;
  let status: WalletAudienceResult["status"] = "ready";
  try {
    const lookalike = await metaPost(`act_${account}/customaudiences`, input.accessToken, {
      name: `${baseName} - Semelhante 1-3%`,
      subtype: "LOOKALIKE",
      origin_audience_id: custom.id,
      lookalike_spec: JSON.stringify({ type: "custom_ratio", ratio: 0.03, country: "BR" })
    });
    lookalikeId = lookalike.id ?? null;
  } catch {
    // Categoria Especial costuma recusar Lookalike. Seguimos sem ele.
    status = "lookalike_unavailable";
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("meta_custom_audiences").insert({
    organization_id: input.organizationId,
    created_by_profile_id: input.createdByProfileId,
    meta_ad_account_id: account,
    custom_audience_id: custom.id,
    lookalike_id: lookalikeId,
    source_count: data.length,
    status
  });

  return { customAudienceId: custom.id, lookalikeId, status, sourceCount: data.length };
}

export type WalletAudienceListItem = {
  id: string;
  metaAdAccountId: string;
  customAudienceId: string;
  lookalikeId: string | null;
  sourceCount: number;
  status: "ready" | "lookalike_unavailable" | "processing" | "failed";
  createdAt: string;
};

// Lista os publicos da carteira ja criados para a organizacao (para exibir na tela).
export async function listWalletAudiencesForOrg(
  organizationId: string
): Promise<WalletAudienceListItem[]> {
  if (!hasSupabaseServiceRole()) return [];
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("meta_custom_audiences")
    .select("id, meta_ad_account_id, custom_audience_id, lookalike_id, source_count, status, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return (
    data as Array<{
      id: string;
      meta_ad_account_id: string;
      custom_audience_id: string;
      lookalike_id: string | null;
      source_count: number;
      status: "ready" | "lookalike_unavailable" | "processing" | "failed";
      created_at: string;
    }>
  ).map((row) => ({
    id: row.id,
    metaAdAccountId: row.meta_ad_account_id,
    customAudienceId: row.custom_audience_id,
    lookalikeId: row.lookalike_id,
    sourceCount: row.source_count,
    status: row.status,
    createdAt: row.created_at
  }));
}

// Busca o Lookalike (ou, na falta, o Custom Audience) mais recente pronto para a
// conta, para usar no targeting da campanha (Mudanca 6). Retorna null se nao houver.
export async function getBestAudienceIdForAccount(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  adAccountId: string
): Promise<string | null> {
  const account = sanitizeAdAccountId(adAccountId);
  const { data, error } = await supabase
    .from("meta_custom_audiences")
    .select("custom_audience_id, lookalike_id")
    .eq("organization_id", organizationId)
    .eq("meta_ad_account_id", account)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data?.length) return null;
  const row = data[0] as { custom_audience_id: string; lookalike_id: string | null };
  // Preferimos o Lookalike (alcance frio semelhante à carteira); sem ele, o
  // Custom Audience serve para retargeting da própria base.
  return row.lookalike_id ?? row.custom_audience_id ?? null;
}
