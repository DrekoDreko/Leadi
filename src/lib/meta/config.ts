import { getServerEnv } from "@/lib/env/server";
import { getSiteUrl } from "@/lib/site/config";

const DEFAULT_META_GRAPH_API_VERSION = "v22.0";

// Scopes organizados em grupos mapeados a features e a fases de App Review.
// O grupo `base` cobre as permissoes ja aprovadas e e sempre solicitado.
// Os demais grupos sao habilitados via env META_OAUTH_SCOPE_GROUPS conforme
// forem aprovados, sem necessidade de mudanca de codigo.
const META_OAUTH_SCOPE_GROUP_DETAILS = {
  base: [
    {
      scope: "pages_show_list",
      useCase: "Sincronizar as paginas disponiveis para a organizacao conectada.",
      evidence:
        "Usado em src/lib/integrations/meta-graph.server.ts para consultar /me/accounts durante a sincronizacao."
    },
    {
      scope: "leads_retrieval",
      useCase: "Buscar o payload completo do lead recebido via webhook ou importacao manual.",
      evidence:
        "Usado em src/lib/meta/lead-retrieval.server.ts para consultar /{leadgenId} com field_data e metadados de origem."
    }
  ],
  lead_forms: [
    {
      scope: "pages_read_engagement",
      useCase: "Listar formularios de leads vinculados a cada pagina sincronizada.",
      evidence:
        "Usado em src/lib/integrations/meta-graph.server.ts para consultar /{pageId}/leadgen_forms."
    }
  ],
  webhook: [
    {
      scope: "pages_manage_metadata",
      useCase:
        "Inscrever cada pagina conectada no app para receber os eventos leadgen em tempo real.",
      evidence:
        "Usado em src/lib/integrations/meta-graph.server.ts para POST /{pageId}/subscribed_apps com subscribed_fields=leadgen."
    }
  ],
  ads: [
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
    },
    {
      scope: "business_management",
      useCase: "Selecionar a conta de negocio conectada e operar ativos de anuncio.",
      evidence:
        "Necessario junto com ads_management para resolver a Business Manager da conta conectada."
    },
    {
      scope: "pages_manage_ads",
      useCase: "Criar ad creatives vinculados a uma Page para publicacao de anuncios.",
      evidence:
        "Necessario em src/lib/meta/campaign-publication.server.ts para criar anuncios com object_story_spec referenciando a Page."
    }
  ]
} as const;

// `webhook` entra no default para que cada pagina conectada se inscreva
// sozinha no app (subscribed_apps). Para usuarios sem a permissao aprovada,
// a Meta omite o scope no consentimento e a inscricao degrada com aviso.
const DEFAULT_META_OAUTH_SCOPE_GROUPS = ["base", "webhook"] as const;

export type MetaOAuthScopeGroup = keyof typeof META_OAUTH_SCOPE_GROUP_DETAILS;
export type MetaOAuthScope =
  (typeof META_OAUTH_SCOPE_GROUP_DETAILS)[MetaOAuthScopeGroup][number]["scope"];

function isMetaOAuthScopeGroup(value: string): value is MetaOAuthScopeGroup {
  return value in META_OAUTH_SCOPE_GROUP_DETAILS;
}

// Resolve os grupos habilitados a partir da env, sempre incluindo `base`.
// Grupos invalidos sao ignorados para nunca quebrar o fluxo aprovado.
function getEnabledMetaOAuthScopeGroups(): MetaOAuthScopeGroup[] {
  const configured = getServerEnv("META_OAUTH_SCOPE_GROUPS")
    .split(",")
    .map((group) => group.trim().toLowerCase())
    .filter((group): group is MetaOAuthScopeGroup => isMetaOAuthScopeGroup(group));

  const enabled = new Set<MetaOAuthScopeGroup>(DEFAULT_META_OAUTH_SCOPE_GROUPS);
  for (const group of configured) {
    enabled.add(group);
  }

  return [...enabled];
}

export function getMetaVerifyToken() {
  return getServerEnv("META_VERIFY_TOKEN");
}

export function getMetaAppId() {
  return getServerEnv("META_APP_ID");
}

export function getMetaAppSecret() {
  return getServerEnv("META_APP_SECRET");
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
  const groups = getEnabledMetaOAuthScopeGroups();
  const scopes = new Set<MetaOAuthScope>();

  for (const group of groups) {
    for (const detail of META_OAUTH_SCOPE_GROUP_DETAILS[group]) {
      scopes.add(detail.scope);
    }
  }

  return [...scopes];
}

export function getMetaOAuthScopeDetails() {
  const enabled = new Set(getEnabledMetaOAuthScopeGroups());

  return (Object.keys(META_OAUTH_SCOPE_GROUP_DETAILS) as MetaOAuthScopeGroup[]).flatMap(
    (group) =>
      META_OAUTH_SCOPE_GROUP_DETAILS[group].map((detail) => ({
        ...detail,
        group,
        enabled: enabled.has(group)
      }))
  );
}
