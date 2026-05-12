/**
 * Sensitized fields that should be masked in logs to avoid leaking PII or secrets.
 */
const SENSITIVE_FIELDS = [
  "token",
  "key",
  "password",
  "secret",
  "cookie",
  "authorization",
  "auth",
  "email",
  "phone",
  "telephone",
  "cpf",
  "cnpj",
  "address",
  "street",
  "full_name",
  "name",
  "whatsapp",
  "celular",
  "mobile",
];

/**
 * Recursively masks sensitive fields in an object.
 */
export function sensitize<T>(data: T): T {
  if (!data || typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sensitize) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      result[key] = "[MASKED]";
    } else if (typeof value === "object") {
      result[key] = sensitize(value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

export type LogContext = {
  route: string;
  operation: string;
  status?: number;
  message: string;
  data?: unknown;
};

const isServer = typeof window === "undefined";

export const logger = {
  error: (context: LogContext, error?: unknown) => {
    if (!isServer) return;

    const safeData = context.data ? sensitize(context.data) : undefined;
    const errorMessage = error instanceof Error ? error.message : String(error || "");
    const errorStack = error instanceof Error ? error.stack : undefined;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: "ERROR",
      ...context,
      data: safeData,
      error: errorMessage,
      stack: errorStack,
    };

    // Standardized server-side logging
    console.error(JSON.stringify(logEntry));
  },

  info: (context: LogContext) => {
    if (!isServer) return;

    const safeData = context.data ? sensitize(context.data) : undefined;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: "INFO",
      ...context,
      data: safeData,
    };

    console.log(JSON.stringify(logEntry));
  },
};
