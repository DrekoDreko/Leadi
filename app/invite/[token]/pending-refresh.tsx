"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Reexecuta o server component periodicamente enquanto o convite esta pendente.
// Assim que o gestor aprovar, o accept_workspace_invite passa e a pagina
// redireciona sozinha para o dashboard (ou para o setup do perfil).
export function PendingApprovalRefresh({ intervalMs = 8000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
