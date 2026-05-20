import { NextResponse } from "next/server";
import { resolveCurrentIdentity } from "@/lib/integrations/repository.server";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = await getReturnTo(request);
  const identity = await resolveCurrentIdentity();

  if (!identity) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(returnTo)}`, requestUrl));
  }

  return redirectBack(requestUrl, returnTo, "openai=coming_soon");
}

async function getReturnTo(request: Request) {
  const formData = await request.formData().catch(() => null);
  const returnTo = formData?.get("returnTo");

  if (typeof returnTo === "string" && returnTo.startsWith("/")) {
    return returnTo;
  }

  return "/dashboard/perfil?openai=coming_soon";
}

function redirectBack(url: URL, returnTo: string, query: string) {
  const target = new URL(returnTo, url);
  const [key, value] = query.split("=");
  target.searchParams.set(key, value ?? "error");
  return NextResponse.redirect(target);
}
