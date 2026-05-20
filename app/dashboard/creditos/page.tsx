import { redirect } from "next/navigation";

export default async function CreditsPage({
  searchParams
}: {
  searchParams?: Promise<{
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params?.status ? `?status=${encodeURIComponent(params.status)}` : "";

  redirect(`/dashboard/perfil/creditos${query}`);
}

