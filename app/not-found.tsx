import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="glass-strong w-full max-w-xl rounded-[34px] p-8 text-center">
        <p className="text-sm font-medium text-cobalt">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">Página não encontrada</h1>
        <p className="mt-4 leading-7 text-ink/64">
          Esse caminho não existe no painel. Você pode voltar para a home e seguir
          por lá.
        </p>
        <div className="mt-8">
          <Link
            className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 font-semibold text-cloud"
            href="/"
          >
            Ir para a home
          </Link>
        </div>
      </div>
    </main>
  );
}
