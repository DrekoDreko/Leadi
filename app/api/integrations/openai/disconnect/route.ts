import { NextResponse } from "next/server";
import { resolveCurrentIdentity } from "@/lib/integrations/repository.server";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const formData = await request.formData().catch(() => null);
  const returnTo = getReturnTo(formData);
  const identity = await resolveCurrentIdentity();

  if (!identity) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(returnTo)}`, requestUrl));
  }

  return redirectBack(requestUrl, returnTo, "openai=coming_soon");
}

function getReturnTo(formData: FormData | null) {
  const returnTo = formData?.get("returnTo");

  if (typeof returnTo === "string" && returnTo.startsWith("/")) {
    return returnTo;
  }

  return "/dashboard/perfil?section=empresa";
}

function redirectBack(url: URL, returnTo: string, query: string) {
  const target = new URL(returnTo, url);
  const [key, value] = query.split("=");
  target.searchParams.set(key, value ?? "error");
  return NextResponse.redirect(target);
}
