import { redirect } from "next/navigation";

type WhatsAppPageProps = {
  searchParams?: Promise<{
    lead?: string | string[];
  }>;
};

export default async function WhatsAppPage({ searchParams }: WhatsAppPageProps) {
  const resolvedSearchParams = await searchParams;
  const leadId = Array.isArray(resolvedSearchParams?.lead)
    ? resolvedSearchParams?.lead[0]
    : resolvedSearchParams?.lead;

  redirect(
    leadId
      ? `/dashboard/leads?lead=${encodeURIComponent(leadId)}&panel=message`
      : "/dashboard/leads?panel=message"
  );
}
