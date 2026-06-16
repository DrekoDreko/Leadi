export type EnvVariableDefinition = {
  description: string;
  public: boolean;
};

export const ENV_VARIABLES = {
  NEXT_PUBLIC_APP_URL: {
    description: "URL canonica publica do app.",
    public: true
  },
  NEXT_PUBLIC_SITE_NAME: {
    description: "Nome publico exibido na interface.",
    public: true
  },
  LEGAL_CONTACT_EMAIL: {
    description: "Email juridico e operacional do produto.",
    public: false
  },
  NEXT_PUBLIC_LEGAL_EMAIL: {
    description: "Email juridico exposto nas paginas publicas.",
    public: true
  },
  NEXT_PUBLIC_SUPABASE_URL: {
    description: "URL do projeto Supabase.",
    public: true
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    description: "Chave anonima do Supabase usada por auth e client SDK.",
    public: true
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    description: "Chave administrativa do Supabase para operacoes server-side e MCP local.",
    public: false
  },
  OPENAI_MODEL: {
    description: "Modelo padrao usado nas rotas de IA.",
    public: false
  },
  OPENAI_IMAGE_MODEL: {
    description: "Modelo de geracao de imagem usado na criacao de artes com IA.",
    public: false
  },
  OPENAI_API_KEY: {
    description: "Chave global da plataforma para chamadas server-side da OpenAI.",
    public: false
  },
  ABACATE_PAY_API_KEY: {
    description: "Chave server-side do AbacatePay para pagamentos e assinaturas.",
    public: false
  },
  INTEGRATIONS_SECRET_KEY: {
    description: "Chave opcional para cifrar tokens e API keys das contas conectadas.",
    public: false
  },
  META_APP_ID: {
    description: "Identificador do app da Meta.",
    public: false
  },
  META_APP_SECRET: {
    description: "Segredo do app da Meta para validar assinaturas.",
    public: false
  },
  META_VERIFY_TOKEN: {
    description: "Token de verificacao do webhook da Meta.",
    public: false
  },
  META_REDIRECT_URI: {
    description: "Redirect URI configurada na Meta.",
    public: false
  },
  META_GRAPH_API_VERSION: {
    description: "Versao da Graph API da Meta.",
    public: false
  },
  META_OAUTH_SCOPE_GROUPS: {
    description:
      "Grupos de scopes habilitados no OAuth da Meta (csv). Default base; adicione lead_forms,ads conforme aprovado no App Review.",
    public: false
  },
  META_WHATSAPP_ACCESS_TOKEN: {
    description: "Token de acesso server-side para envio oficial de WhatsApp via Meta.",
    public: false
  },
  META_WHATSAPP_PHONE_NUMBER_ID: {
    description: "Phone number id da conta oficial de WhatsApp da Meta.",
    public: false
  },
  META_WHATSAPP_API_VERSION: {
    description: "Versao opcional da Graph API usada no envio oficial de WhatsApp.",
    public: false
  },
  WHATSAPP_EXTERNAL_SEND_URL: {
    description: "Endpoint server-side do provedor externo de WhatsApp.",
    public: false
  },
  WHATSAPP_EXTERNAL_API_KEY: {
    description: "Chave server-side do provedor externo de WhatsApp.",
    public: false
  },
  WHATSAPP_EXTERNAL_SENDER_ID: {
    description: "Identificador de remetente usado pelo provedor externo de WhatsApp.",
    public: false
  },
  CRON_SECRET: {
    description:
      "Segredo compartilhado para autenticar chamadas das rotas internas agendadas (ex.: reconciliacao de veiculacao Meta).",
    public: false
  },
} as const satisfies Record<string, EnvVariableDefinition>;

export type EnvVariableName = keyof typeof ENV_VARIABLES;

export function isPublicEnvVariable(key: EnvVariableName) {
  return ENV_VARIABLES[key].public;
}

export function isServerOnlyEnvVariable(key: EnvVariableName) {
  return !isPublicEnvVariable(key);
}

export function listPublicEnvVariables() {
  return Object.keys(ENV_VARIABLES).filter((key) =>
    isPublicEnvVariable(key as EnvVariableName)
  ) as EnvVariableName[];
}

export function listServerOnlyEnvVariables() {
  return Object.keys(ENV_VARIABLES).filter((key) =>
    isServerOnlyEnvVariable(key as EnvVariableName)
  ) as EnvVariableName[];
}

export const PRODUCTION_CORE_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "INTEGRATIONS_SECRET_KEY"
] as const satisfies readonly EnvVariableName[];

export const MCP_SUPABASE_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY"
] as const satisfies readonly EnvVariableName[];

export function readEnvValue(key: EnvVariableName, source: NodeJS.ProcessEnv = process.env) {
  return source[key]?.trim() ?? "";
}

export function findMissingEnvKeys(
  keys: readonly EnvVariableName[],
  source: NodeJS.ProcessEnv = process.env
) {
  return keys.filter((key) => !readEnvValue(key, source));
}

export function validateProductionCoreEnv(source: NodeJS.ProcessEnv = process.env) {
  const missing = findMissingEnvKeys(PRODUCTION_CORE_ENV_KEYS, source);

  if (missing.length === 0) {
    return;
  }

  throw new Error(
    [
      "Build bloqueado: variaveis obrigatorias do core nao foram configuradas para producao.",
      `Ausentes: ${missing.join(", ")}.`
    ].join(" ")
  );
}

export function shouldValidateProductionCoreEnv(source: NodeJS.ProcessEnv = process.env) {
  if (source.SKIP_ENV_VALIDATION === "1") {
    return false;
  }

  // Ignorar validacao de segredos de producao durante o build na Vercel.
  // Evita falsos-negativos causados por tempo de propagacao ou escopo do container de build.
  if (source.VERCEL === "1") {
    return false;
  }

  // Vercel preview builds run with NODE_ENV=production too, but they should not
  // be blocked by production-only env checks.
  if (source.VERCEL_ENV === "preview") {
    return false;
  }

  return source.NODE_ENV === "production";
}
