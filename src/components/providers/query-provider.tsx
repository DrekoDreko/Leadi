"use client";

import { QueryClient, QueryClientProvider, isServer } from "@tanstack/react-query";
import { useState } from "react";

// Idade maxima padrao do cache client-side: dentro dessa janela os dados sao
// considerados "frescos" e NAO ha nova requisicao ao navegar/remontar. Ao
// expirar, o React Query revalida em background (invisivel ao usuario).
const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 min
const DEFAULT_GC_TIME = 30 * 60 * 1000; // 30 min

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_GC_TIME,
        // Evita rajadas de refetch ao voltar o foco/reconectar; a revalidacao
        // por idade (staleTime) ja mantem os dados atualizados.
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1
      }
    }
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) {
    // No servidor, um client novo por request evita vazar cache entre usuarios.
    return makeQueryClient();
  }

  // No browser, um singleton persiste entre navegacoes client-side (o cache
  // sobrevive ao trocar de tela, tornando revisitas instantaneas).
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
