import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { getSiteDomainLabel, getSiteLegalEmail } from "@/lib/site/config";

type LegalSection = {
  body: readonly string[];
  title: string;
};

type LegalPageProps = {
  effectiveDate: string;
  eyebrow: string;
  intro?: ReactNode;
  sections: readonly LegalSection[];
  summary: string;
  title: string;
};

export function LegalPage({
  effectiveDate,
  eyebrow,
  intro,
  sections,
  summary,
  title
}: LegalPageProps) {
  const legalEmail = getSiteLegalEmail();
  const domainLabel = getSiteDomainLabel();

  return (
    <main className="min-h-screen px-4 pb-8 pt-6">
      <header className="section-shell">
        <nav className="glass flex items-center justify-between rounded-full px-4 py-3">
          <BrandMark />
          <div className="flex items-center gap-2 text-sm text-ink/68">
            <Link className="rounded-full px-4 py-2 hover:bg-white/36" href="/">
              Inicio
            </Link>
            <Link className="rounded-full px-4 py-2 hover:bg-white/36" href="/privacy">
              Privacidade
            </Link>
            <Link className="rounded-full px-4 py-2 hover:bg-white/36" href="/terms">
              Termos
            </Link>
            <Link className="rounded-full px-4 py-2 hover:bg-white/36" href="/data-deletion">
              Exclusao de dados
            </Link>
          </div>
        </nav>
      </header>

      <section className="section-shell pt-10">
        <div className="glass-strong overflow-hidden rounded-[36px]">
          <div className="border-b border-white/40 px-6 py-8 md:px-10">
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-white/55 px-4 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
              href="/"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Voltar para o site
            </Link>
            <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-medium text-cobalt">{eyebrow}</p>
                <h1 className="mt-3 text-4xl font-semibold leading-tight text-ink md:text-5xl">
                  {title}
                </h1>
                <p className="mt-4 text-base leading-7 text-ink/68 md:text-lg">{summary}</p>
              </div>
              <div className="glass rounded-[28px] p-5 text-sm text-ink/70">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-cloud">
                    <ShieldCheck size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">Rascunho operacional</p>
                    <p>Vigencia base: {effectiveDate}</p>
                  </div>
                </div>
                <p className="mt-4 leading-6">
                  Esta pagina fica publica em {domainLabel} para atender URLs exigidas por
                  integracoes, cadastro de app e validacoes externas.
                </p>
                {legalEmail ? (
                  <p className="mt-3 leading-6">
                    Contato de privacidade e dados:{" "}
                    <a className="font-semibold text-cobalt" href={`mailto:${legalEmail}`}>
                      {legalEmail}
                    </a>
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {intro ? (
            <div className="border-b border-white/40 px-6 py-8 md:px-10">{intro}</div>
          ) : null}

          <div className="grid gap-6 px-6 py-8 md:px-10">
            {sections.map((section) => (
              <article className="glass rounded-[30px] p-6" key={section.title}>
                <h2 className="text-2xl font-semibold text-ink">{section.title}</h2>
                <div className="mt-4 space-y-4 text-sm leading-7 text-ink/72 md:text-base">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="section-shell pt-6">
        <div className="flex flex-col gap-3 px-2 text-sm text-ink/72 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <p>Leadi · Documento publico para operacao inicial do produto.</p>
            <div className="flex items-center gap-3">
              <Link className="font-semibold transition-colors hover:text-cobalt" href="/privacy">
                Privacidade
              </Link>
              <Link className="font-semibold transition-colors hover:text-cobalt" href="/terms">
                Termos
              </Link>
              <Link
                className="font-semibold transition-colors hover:text-cobalt"
                href="/data-deletion"
              >
                Exclusao de dados
              </Link>
            </div>
          </div>
          <a
            className="inline-flex items-center gap-2 font-semibold text-ink transition hover:text-cobalt"
            href="https://codeellow.com"
            rel="noreferrer"
            target="_blank"
          >
            codeellow
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </footer>
    </main>
  );
}
