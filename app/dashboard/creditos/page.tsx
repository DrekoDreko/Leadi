import { redirect } from "next/navigation";

export default async function CreditsPage({
  searchParams
}: {
  searchParams?: Promise<{
    purchase?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params?.status) {
    query.set("status", params.status);
  }

  if (params?.purchase) {
    query.set("purchase", params.purchase);
  }

  redirect(`/dashboard/perfil/creditos${query.size > 0 ? `?${query.toString()}` : ""}`);
}
