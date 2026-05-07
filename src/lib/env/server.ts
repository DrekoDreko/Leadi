import "server-only";

import {
  CORE_ENV_KEYS,
  type EnvVariableName,
  findMissingEnvKeys,
  readEnvValue
} from "./shared";

type EnvIntegrationDefinition = {
  message: string;
  required: readonly EnvVariableName[];
};

const ENV_INTEGRATIONS = {
  core: {
    message:
      "Ambiente principal incompleto. Configure as variaveis obrigatorias do core antes de subir o app em producao.",
    required: CORE_ENV_KEYS
  },
  supabase_admin: {
    message:
      "Operacao administrativa indisponivel. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor.",
    required: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
  },
  openai: {
    message:
      "Recurso de IA indisponivel. Conecte uma chave OpenAI na area Empresa ou configure OPENAI_API_KEY no ambiente do servidor.",
    required: ["OPENAI_API_KEY"]
  },
  billing: {
    message:
      "Billing indisponivel. Configure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e MERCADO_PAGO_ACCESS_TOKEN no servidor.",
    required: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "MERCADO_PAGO_ACCESS_TOKEN"
    ]
  },
  mercadopago_webhook: {
    message:
      "Webhook do Mercado Pago sem assinatura configurada. Defina MERCADO_PAGO_WEBHOOK_SECRET para validar notificacoes em producao.",
    required: ["MERCADO_PAGO_WEBHOOK_SECRET"]
  },
  meta_webhook: {
    message:
      "Webhook da Meta indisponivel. Configure META_APP_SECRET e META_VERIFY_TOKEN no ambiente do servidor.",
    required: ["META_APP_SECRET", "META_VERIFY_TOKEN"]
  },
  meta_lead_sync: {
    message:
      "Sincronizacao de leads da Meta indisponivel. Conecte a conta Meta da empresa e configure o Supabase admin no servidor.",
    required: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
  }
} as const satisfies Record<string, EnvIntegrationDefinition>;

export type EnvIntegrationName = keyof typeof ENV_INTEGRATIONS;

export class EnvValidationError extends Error {
  constructor(
    message: string,
    public readonly integration: EnvIntegrationName,
    public readonly missing: string[]
  ) {
    super(message);
    this.name = "EnvValidationError";
  }
}

export function getServerEnv(key: EnvVariableName) {
  return readEnvValue(key);
}

export function getMissingEnvForIntegration(name: EnvIntegrationName) {
  const definition = ENV_INTEGRATIONS[name];
  const missing: string[] = [...findMissingEnvKeys(definition.required)];

  return missing;
}

export function isIntegrationConfigured(name: EnvIntegrationName) {
  return getMissingEnvForIntegration(name).length === 0;
}

export function requireIntegrationEnv(name: EnvIntegrationName) {
  const definition = ENV_INTEGRATIONS[name];
  const missing = getMissingEnvForIntegration(name);

  if (missing.length > 0) {
    throw new EnvValidationError(definition.message, name, missing);
  }
}
