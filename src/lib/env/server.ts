import "server-only";

import {
  type EnvVariableName,
  findMissingEnvKeys,
  readEnvValue
} from "./shared";

type EnvIntegrationDefinition = {
  message: string;
  required: readonly EnvVariableName[];
};

const ENV_INTEGRATIONS = {
  supabase_admin: {
    message:
      "Operacao administrativa indisponivel. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor.",
    required: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
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
  meta_oauth: {
    message:
      "OAuth da Meta indisponivel. Configure META_APP_ID e META_APP_SECRET no ambiente do servidor (sem o prefixo NEXT_PUBLIC_).",
    required: ["META_APP_ID", "META_APP_SECRET"]
  },
  meta_webhook: {
    message:
      "Webhook da Meta indisponivel. Configure META_APP_SECRET e META_VERIFY_TOKEN no ambiente do servidor (sem o prefixo NEXT_PUBLIC_).",
    required: ["META_APP_SECRET", "META_VERIFY_TOKEN"]
  },
  whatsapp_meta_send: {
    message:
      "Envio oficial de WhatsApp indisponivel. Configure META_WHATSAPP_ACCESS_TOKEN e META_WHATSAPP_PHONE_NUMBER_ID no ambiente do servidor.",
    required: ["META_WHATSAPP_ACCESS_TOKEN", "META_WHATSAPP_PHONE_NUMBER_ID"]
  },
  whatsapp_external_send: {
    message:
      "Envio por provedor externo indisponivel. Configure WHATSAPP_EXTERNAL_SEND_URL e WHATSAPP_EXTERNAL_API_KEY no ambiente do servidor.",
    required: ["WHATSAPP_EXTERNAL_SEND_URL", "WHATSAPP_EXTERNAL_API_KEY"]
  },
  meta_lead_sync: {
    message:
      "Sincronizacao de leads da Meta indisponivel. Conecte a conta Meta da empresa e configure o Supabase admin no servidor.",
    required: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
  },
  openai: {
    message:
      "IA da plataforma indisponivel. Configure OPENAI_API_KEY no ambiente do servidor.",
    required: ["OPENAI_API_KEY"]
  }
} as const satisfies Record<string, EnvIntegrationDefinition>;

export type EnvIntegrationName = keyof typeof ENV_INTEGRATIONS;

export class EnvValidationError extends Error {
  public readonly status = 500;
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
