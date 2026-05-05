import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { MockDashboardPreview } from "@/components/mock-dashboard-preview";

const pillars = [
  {
    title: "Campanhas com IA",
    description:
      "Briefings, textos e formulários enxutos para captar leads com nome, telefone, email e perfil ME.",
    icon: Sparkles
  },
  {
    title: "CRM de leads",
    description:
      "Organize contatos, acompanhe status e distribua oportunidades para vendedores.",
    icon: UsersRound
  },
  {
    title: "Compliance comercial",
    description:
      "Evite perguntas sensíveis e promessas arriscadas antes de subir anúncios.",
    icon: ShieldCheck
  }
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="section-shell fixed left-1/2 top-4 z-20 -translate-x-1/2">
        <nav className="glass flex items-center justify-between rounded-full px-4 py-3">
          <BrandMark />
          <div className="hidden items-center gap-2 text-sm text-ink/68 md:flex">
            <Link className="rounded-full px-4 py-2 hover:bg-white/36" href="#produto">
              Produto
            </Link>
            <Link className="rounded-full px-4 py-2 hover:bg-white/36" href="/pricing">
              Planos
            </Link>
            <Link className="rounded-full px-4 py-2 hover:bg-white/36" href="/preview">
              Preview
            </Link>
            <Link className="rounded-full px-4 py-2 hover:bg-white/36" href="/privacy">
              Privacidade
            </Link>
          </div>
          <Link
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5"
            href="/login"
          >
            Entrar
          </Link>
        </nav>
      </header>

      <section className="relative px-4 pb-16 pt-28 md:pt-32">
        <div className="section-shell">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-5 inline-flex rounded-full bg-white/52 px-4 py-2 text-sm font-medium text-ink/70 shadow-soft backdrop-blur-xl">
              CRM + IA para corretores de plano de saúde empresarial
            </p>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-normal text-ink md:text-7xl">
              LeadHealth
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-ink/68 md:text-xl">
              Gere campanhas consultivas, organize leads empresariais e conduza
              oportunidades até a venda com uma operação simples, bonita e segura.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-6 py-4 font-semibold text-white shadow-soft transition hover:-translate-y-0.5"
                href="/preview"
              >
                Ver CRM mockado
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/54 px-6 py-4 font-semibold text-ink shadow-soft backdrop-blur-2xl transition hover:-translate-y-0.5"
                href="/pricing"
              >
                Ver planos
              </Link>
            </div>
          </div>
          <div className="mt-10 md:mt-12">
            <MockDashboardPreview />
          </div>
        </div>
      </section>

      <section className="section-shell relative z-10 pb-24" id="produto">
        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => (
            <article className="glass-strong rounded-[30px] p-6" key={pillar.title}>
              <span className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white">
                <pillar.icon size={20} aria-hidden="true" />
              </span>
              <h2 className="text-xl font-semibold">{pillar.title}</h2>
              <p className="mt-3 leading-7 text-ink/64">{pillar.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="glass rounded-[34px] p-7">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-cobalt">Formulário seguro</p>
                <h2 className="mt-2 text-3xl font-semibold">
                  Captação pensada para Meta Lead Ads
                </h2>
              </div>
              <FileText className="hidden text-ink/42 sm:block" size={34} aria-hidden="true" />
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                "Nome completo",
                "Telefone",
                "Email",
                "ME"
              ].map((item) => (
                <div
                  className="flex items-center gap-3 rounded-2xl bg-white/42 px-4 py-3"
                  key={item}
                >
                  <CheckCircle2 size={18} className="text-lagoon" aria-hidden="true" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-dark rounded-[34px] p-7 text-white">
            <ShieldCheck size={34} className="text-signal" aria-hidden="true" />
            <h2 className="mt-7 text-3xl font-semibold">Linguagem consultiva</h2>
            <p className="mt-4 leading-7 text-white/68">
              A IA prioriza análise de alternativas empresariais e evita perguntas
              sobre saúde, tratamentos, medicamentos, operadora atual ou promessas
              garantidas de economia.
            </p>
            <div className="mt-7 rounded-[24px] bg-white/8 p-5">
              <p className="text-sm leading-6 text-white/78">
                “Compare possibilidades de contratação empresarial com especialistas.”
              </p>
            </div>
          </section>
        </div>
      </section>

      <section className="section-shell pb-20">
        <div className="glass-strong flex flex-col justify-between gap-8 rounded-[34px] p-8 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-cobalt">Próxima etapa</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-semibold">
              Primeiro validamos a experiência. Depois conectamos Supabase,
              autenticação, banco e IA real.
            </h2>
          </div>
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 font-semibold text-white"
            href="/preview"
          >
            Abrir dashboard
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="px-4 pb-4">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 px-4 py-3 text-xs text-ink/78 md:flex-row md:items-center md:justify-between md:text-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <p>© 2025 Codeellow. Todos os direitos reservados.</p>
            <div className="flex items-center gap-3">
              <Link className="font-semibold transition-colors hover:text-cobalt" href="/privacy">
                Privacidade
              </Link>
              <Link className="font-semibold transition-colors hover:text-cobalt" href="/terms">
                Termos
              </Link>
            </div>
          </div>
          <p>
            Desenvolvido pela{" "}
            <a
              className="font-semibold text-ink transition-colors hover:text-signal"
              href="https://codeellow.com"
              rel="noreferrer"
              target="_blank"
            >
              codeellow
            </a>
            .
          </p>
        </div>
      </footer>
    </main>
  );
}
