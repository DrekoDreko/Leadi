"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="glass-strong w-full max-w-xl rounded-[34px] p-8 text-center">
        <p className="text-sm font-medium text-cobalt">Algo deu errado</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">A página encontrou um erro</h1>
        <p className="mt-4 leading-7 text-ink/64">
          Recarregue a tela para tentar de novo. Se o problema continuar, a gente
          trata pela rota do App Router sem depender de fallback legado.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 font-semibold text-cloud"
            onClick={reset}
            type="button"
          >
            Tentar novamente
          </button>
          <Link
            className="inline-flex items-center justify-center rounded-full bg-surface-elevated px-5 py-3 font-semibold text-ink"
            href="/"
          >
            Voltar para a home
          </Link>
        </div>
      </div>
    </main>
  );
}

