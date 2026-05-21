export type ClientCodeSecurityViolation = {
  line: number;
  message: string;
};

const FORBIDDEN_CLIENT_ENV_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "INTEGRATIONS_SECRET_KEY",
  "META_APP_SECRET",
  "META_VERIFY_TOKEN",
  "MERCADO_PAGO_ACCESS_TOKEN",
  "MERCADO_PAGO_WEBHOOK_SECRET",
  "META_WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_EXTERNAL_API_KEY"
] as const;

const FORBIDDEN_CLIENT_PATTERNS = [
  {
    pattern: /\bcreateSupabaseAdminClient\s*\(/,
    message: "Cliente nao pode chamar createSupabaseAdminClient."
  },
  {
    pattern: /\bgetServerEnv\s*\(/,
    message: "Cliente nao pode chamar getServerEnv."
  },
  {
    pattern: /^\s*import(?!\s+type\b).*from\s+["'][^"']*\.server(?:\.[^"']+)?["']/,
    message: 'Cliente nao pode importar modulos ".server".'
  },
  {
    pattern: /^\s*import(?!\s+type\b).*from\s+["']@\/lib\/supabase\/admin["']/,
    message: "Cliente nao pode importar o client admin do Supabase."
  },
  {
    pattern: /^\s*import(?!\s+type\b).*from\s+["']@\/lib\/env\/server["']/,
    message: "Cliente nao pode importar helpers de env server-side."
  }
] as const;

export function isUseClientModule(source: string) {
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    return line === '"use client";' || line === "'use client';";
  }

  return false;
}

export function findClientCodeSecurityViolations(source: string) {
  if (!isUseClientModule(source)) {
    return [] satisfies ClientCodeSecurityViolation[];
  }

  const violations: ClientCodeSecurityViolation[] = [];
  const seen = new Set<string>();
  const lines = source.split(/\r?\n/);

  const addViolation = (line: number, message: string) => {
    const key = `${line}:${message}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    violations.push({ line, message });
  };

  lines.forEach((line, index) => {
    for (const envKey of FORBIDDEN_CLIENT_ENV_KEYS) {
      if (line.includes(envKey)) {
        addViolation(index + 1, `Cliente nao pode referenciar ${envKey}.`);
      }
    }

    const processEnvMatches = line.matchAll(/process\.env\.([A-Z0-9_]+)/g);
    for (const match of processEnvMatches) {
      const envKey = match[1];
      if (envKey && !envKey.startsWith("NEXT_PUBLIC_")) {
        addViolation(index + 1, `Cliente nao pode acessar process.env.${envKey}.`);
      }
    }

    for (const entry of FORBIDDEN_CLIENT_PATTERNS) {
      if (entry.pattern.test(line)) {
        addViolation(index + 1, entry.message);
      }
    }
  });

  return violations;
}
