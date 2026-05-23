import { getServerEnv } from "@/lib/env/server";
import { getSiteUrl } from "@/lib/site/config";

const DEFAULT_META_GRAPH_API_VERSION = "v22.0";
const DEFAULT_META_BUSINESS_LOGIN_CONFIG_ID = "967205742685129";
const META_OAUTH_SCOPE_DETAILS = [
  {
    scope: "business_management",
    useCase: "Compatibilidade com o fluxo atual de Meta Business Login e selecao da conta conectada.",
    evidence:
      "Escopo solicitado no OAuth; nao ha chamada isolada na Graph API que dependa somente dele no codigo atual."
  },
  {
    scope: "leads_retrieval",
    useCase: "Buscar o payload completo do lead recebido via webhook ou importacao manual.",
    evidence:
      "Usado em src/lib/meta/lead-retrieval.server.ts para consultar /{leadgenId} com field_data e metadados de origem."
  },
  {
    scope: "pages_show_list",
    useCase: "Sincronizar as paginas disponiveis para a organizacao conectada.",
    evidence:
      "Usado em src/lib/integrations/meta-graph.server.ts para consultar /me/accounts durante a sincronizacao."
  },
  {
    scope: "pages_read_engagement",
    useCase: "Listar formularios de leads vinculados a cada pagina sincronizada.",
    evidence:
      "Usado em src/lib/integrations/meta-graph.server.ts para consultar /{pageId}/leadgen_forms."
  },
  {
    scope: "pages_manage_metadata",
    useCase: "Escopo conservador para compatibilidade da integracao por pagina no setup atual.",
    evidence:
      "Nao encontramos chamada ativa que altere metadata de pagina no codigo atual; manter sob revisao antes do App Review."
  },
  {
    scope: "ads_read",
    useCase: "Sincronizar contas de anuncio disponiveis para selecao e operacao.",
    evidence:
      "Usado em src/lib/integrations/meta-graph.server.ts para consultar /me/adaccounts."
  },
  {
    scope: "ads_management",
    useCase: "Publicar campanhas pausadas e enviar criativos para a biblioteca de anuncios.",
    evidence:
      "Exigido em src/lib/meta/campaign-publication.server.ts e src/lib/meta/ad-image-upload.server.ts."
  }
] as const;

export type MetaOAuthScope = (typeof META_OAUTH_SCOPE_DETAILS)[number]["scope"];

export function getMetaVerifyToken() {
  return getServerEnv("META_VERIFY_TOKEN");
}

export function getMetaAppId() {
  return getServerEnv("META_APP_ID");
}

export function getMetaAppSecret() {
  return getServerEnv("META_APP_SECRET");
}

export function getMetaBusinessLoginConfigId() {
  return getServerEnv("META_BUSINESS_LOGIN_CONFIG_ID") || DEFAULT_META_BUSINESS_LOGIN_CONFIG_ID;
}

export function getMetaRedirectUri() {
  const configuredRedirect = getServerEnv("META_REDIRECT_URI");
  if (configuredRedirect) {
    return configuredRedirect;
  }

  const appUrl = getSiteUrl();
  return new URL("/api/integrations/meta/callback", appUrl).toString();
}

export function getMetaGraphApiVersion() {
  return getServerEnv("META_GRAPH_API_VERSION") || DEFAULT_META_GRAPH_API_VERSION;
}

export function getMetaOAuthScopes() {
  return META_OAUTH_SCOPE_DETAILS.map(({ scope }) => scope);
}

export function getMetaOAuthScopeDetails() {
  return META_OAUTH_SCOPE_DETAILS.map((detail) => ({ ...detail }));
}
