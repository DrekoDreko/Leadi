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
    description: "Chave administrativa do Supabase para operacoes server-side e MCP.",
    public: false
  },
  OPENAI_API_KEY: {
    description: "Chave server-side de fallback para IA quando a empresa nao tiver chave conectada.",
    public: false
  },
  OPENAI_MODEL: {
    description: "Modelo padrao usado nas rotas de IA.",
    public: false
  },
  MERCADO_PAGO_ACCESS_TOKEN: {
    description: "Token server-side do Mercado Pago.",
    public: false
  },
  MERCADO_PAGO_WEBHOOK_SECRET: {
    description: "Segredo de assinatura do webhook do Mercado Pago.",
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
} as const satisfies Record<string, EnvVariableDefinition>;

export type EnvVariableName = keyof typeof ENV_VARIABLES;

export const CORE_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
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
  const missing = findMissingEnvKeys(CORE_ENV_KEYS, source);

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
