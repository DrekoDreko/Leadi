"use client";

import { useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Tabelas do board que devem disparar sincronização em tempo real.
const BOARD_TABLES = [
  "leads",
  "pipeline_stages",
  "lead_labels",
  "lead_label_assignments",
  "lead_members",
  "lead_checklists",
  "lead_checklist_items"
] as const;

/**
 * Assina mudanças (postgres_changes) nas tabelas do board para a organização e
 * chama `onRemoteChange` (debounced) quando algo muda no servidor — permitindo
 * que o quadro reflita ações de outros membros da equipe ao vivo.
 *
 * A reconciliação é feita pelo consumidor (tipicamente `router.refresh()`),
 * mantendo o servidor como fonte de verdade. Atualizações otimistas locais
 * dão o feedback imediato; o realtime concilia o estado entre usuários.
 */
export function useBoardRealtime(
  organizationId: string | null | undefined,
  onRemoteChange: () => void
) {
  const callbackRef = useRef(onRemoteChange);
  callbackRef.current = onRemoteChange;

  useEffect(() => {
    if (!organizationId || !isSupabaseConfigured()) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        callbackRef.current();
      }, 450);
    };

    const channel = supabase.channel(`board:${organizationId}`);

    for (const table of BOARD_TABLES) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `organization_id=eq.${organizationId}`
        },
        scheduleRefresh
      );
    }

    channel.subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      void supabase.removeChannel(channel);
    };
  }, [organizationId]);
}
