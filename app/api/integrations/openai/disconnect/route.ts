import { NextResponse } from "next/server";
import { resolveCurrentIdentity } from "@/lib/integrations/repository.server";
import {
  assertRouteRateLimit,
  assertSameOrigin,
  normalizeReturnTo
} from "@/lib/api/route-security";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  assertSameOrigin(request);
  await assertRouteRateLimit({
    request,
    keyPrefix: "api-openai-disconnect",
    limit: 10,
    windowMs: 60 * 1000
  });
  const formData = await request.formData().catch(() => null);
  const returnTo = getReturnTo(formData);
  const identity = await resolveCurrentIdentity();

  if (!identity) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(returnTo)}`, requestUrl));
  }

  if (!identity.canManageConnections) {
    return redirectBack(requestUrl, returnTo, "openai=forbidden");
  }

  return redirectBack(requestUrl, returnTo, "openai=coming_soon");
}

function getReturnTo(formData: FormData | null) {
  return normalizeReturnTo(
    typeof formData?.get("returnTo") === "string" ? (formData?.get("returnTo") as string) : null,
    "/dashboard/perfil?openai=coming_soon"
  );
}

function redirectBack(url: URL, returnTo: string, query: string) {
  const target = new URL(returnTo, url);
  const [key, value] = query.split("=");
  target.searchParams.set(key, value ?? "error");
  return NextResponse.redirect(target);
}
