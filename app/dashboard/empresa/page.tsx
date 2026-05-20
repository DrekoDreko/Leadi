import { redirect } from "next/navigation";

export default async function EmpresaPage({
  searchParams
}: {
  searchParams?: Promise<{
    meta?: string;
    openai?: string;
    sync?: string;
  }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params?.meta) query.set("meta", params.meta);
  if (params?.openai) query.set("openai", params.openai);
  if (params?.sync) query.set("sync", params.sync);

  const serialized = query.toString();
  redirect(`/dashboard/perfil/meta${serialized ? `?${serialized}` : ""}`);
}

