import { NextResponse } from "next/server";
import { z, type ZodType } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { logger } from "@/lib/logger";
import { assertDistributedRateLimit } from "@/lib/rate-limit";

export class ApiRouteError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiRouteError";
    this.status = status;
  }
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const body = await request
    .json()
    .catch(() => {
      throw new ApiRouteError(400, "Payload JSON invalido.");
    });

  return parseWithSchema(body, schema);
}

export async function parseFormData(request: Request) {
  return request.formData().catch(() => {
    throw new ApiRouteError(400, "Formulario invalido.");
  });
}

export function parseFormDataObject<T>(formData: FormData, schema: ZodType<T>): T {
  const record: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};

  for (const key of new Set(formData.keys())) {
    const allValues = formData.getAll(key);
    record[key] = allValues.length > 1 ? allValues : allValues[0] ?? "";
  }

  return parseWithSchema(record, schema);
}

export function parseSearchParams<T>(
  searchParams: URLSearchParams,
  schema: ZodType<T>
): T {
  const record: Record<string, string | string[]> = {};

  for (const key of new Set(searchParams.keys())) {
    const allValues = searchParams.getAll(key);
    record[key] = allValues.length > 1 ? allValues : (allValues[0] ?? "");
  }

  return parseWithSchema(record, schema);
}

export function normalizeReturnTo(value: string | null | undefined, fallback: string) {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return fallback;
  }

  return normalized;
}

function isLocalOrigin(originStr: string) {
  try {
    const url = new URL(originStr);
    const hostname = url.hostname;
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname === "::1"
    );
  } catch {
    return false;
  }
}

export function assertSameOrigin(request: Request) {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const targetOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  const checkMatch = (reqOrigin: string, target: string) => {
    if (reqOrigin === target) return true;
    if (isDevelopment && isLocalOrigin(reqOrigin) && isLocalOrigin(target)) {
      return true;
    }
    return false;
  };

  if (origin && !checkMatch(origin, targetOrigin)) {
    throw new ApiRouteError(403, "Origem invalida.");
  }

  if (!origin && referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (!checkMatch(refererOrigin, targetOrigin)) {
        throw new ApiRouteError(403, "Origem invalida.");
      }
    } catch (error) {
      if (error instanceof ApiRouteError) {
        throw error;
      }

      throw new ApiRouteError(403, "Origem invalida.");
    }
  }
}

export async function assertRouteRateLimit(input: {
  request: Request;
  keyPrefix: string;
  limit: number;
  windowMs: number;
  suffix?: string | null;
}) {
  const ip = getClientIp(input.request);
  const suffix = input.suffix ? `:${input.suffix}` : "";

  await assertDistributedRateLimit({
    key: `${input.keyPrefix}:${ip}${suffix}`,
    limit: input.limit,
    windowMs: input.windowMs
  });
}

export function logApiError(input: {
  route: string;
  operation: string;
  message: string;
  status: number;
  error: unknown;
  data?: Record<string, unknown>;
}) {
  logger.error(
    {
      route: input.route,
      operation: input.operation,
      message: input.message,
      status: input.status,
      data: input.data
    },
    input.error
  );
}

export function getErrorStatus(error: unknown, fallback = 400) {
  return error instanceof ApiRouteError ? error.status : fallback;
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function requiredTrimmedString(message: string) {
  return z
    .string({ error: message })
    .trim()
    .min(1, message);
}

export function optionalTrimmedString(maxLength?: number) {
  return z.preprocess((value) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed || undefined;
  }, maxLength ? z.string().max(maxLength).optional() : z.string().optional());
}

export function optionalNullableTrimmedString(maxLength?: number) {
  return z.preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();
    return trimmed || null;
  }, maxLength ? z.string().max(maxLength).nullable() : z.string().nullable());
}

function parseWithSchema<T>(value: unknown, schema: ZodType<T>): T {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new ApiRouteError(400, result.error.issues[0]?.message || "Payload invalido.");
  }

  return result.data;
}

export async function assertServerAuth() {
  if (!isSupabaseConfigured()) return null;

  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiRouteError(401, "Usuario nao autenticado.");
  }

  return user;
}
