import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeroSection } from "@/components/landing/hero-section";
import { HighlightCarousel } from "@/components/landing/highlight-carousel";
import { EssentialFeatures } from "@/components/landing/essential-features";
import { MetaAdsSection } from "@/components/landing/meta-ads-section";
import { PlansSection } from "@/components/landing/plans-section";
import { FAQSection } from "@/components/landing/faq-section";
import { CTASection } from "@/components/landing/cta-section";

export const metadata = {
  title: "Leadi — Anúncios com IA e CRM para leads do Meta",
  description:
    "Crie anúncios com IA, organize leads do Facebook e Instagram e acompanhe oportunidades em um CRM para venda de plano de saúde."
};

const navLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Recursos", href: "#recursos" },
  { label: "Planos", href: "/pricing" },
  { label: "FAQ", href: "#faq" }
];

export default function Home() {
  return (
    <>
      {/* ── Header ── */}
      <header className="section-shell fixed left-1/2 top-4 z-[120] -translate-x-1/2">
        <nav className="glass flex items-center justify-between rounded-full px-4 py-3">
          <BrandMark />
          <div className="hidden items-center gap-1 text-sm text-ink/68 md:flex">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                className="rounded-full px-3 py-2 transition hover:bg-white/36"
                href={l.href}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:bg-primary/92"
              href="/login"
            >
              Entrar
            </Link>
          </div>
        </nav>
      </header>

      <main className="min-h-screen overflow-hidden">
        {/* ── Hero ── */}
        <HeroSection />



      {/* ── Fluxo Principal ── */}
      <HighlightCarousel />

      {/* ── Funções Essenciais ── */}
      <EssentialFeatures />

      {/* ── Meta Ads + CRM ── */}
      <MetaAdsSection />

      {/* ── Planos ── */}
      <PlansSection />

      {/* ── FAQ ── */}
      <FAQSection />

      {/* ── CTA Final ── */}
      <CTASection />

      {/* ── Footer ── */}
      <footer className="px-4 pb-6">
        <div className="section-shell">
          <div className="glass-strong rounded-[28px] px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1 max-w-xl">
                <p className="text-xs text-ink/60">
                  O Leadi é uma solução em evolução para operações comerciais de planos de saúde.
                </p>
                <p className="text-[10px] text-ink/40 leading-relaxed mt-0.5">
                  Meta, Facebook e Instagram são marcas da Meta Platforms, Inc. O Leadi não é afiliado, patrocinado ou endossado pela Meta.
                </p>
                <p className="text-xs text-ink/50 mt-1">© 2025 Codeellow. Todos os direitos reservados.</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <Link className="font-medium text-ink/60 transition hover:text-cobalt" href="/privacy">
                  Privacidade
                </Link>
                <Link className="font-medium text-ink/60 transition hover:text-cobalt" href="/terms">
                  Termos
                </Link>
                <Link className="font-medium text-ink/60 transition hover:text-cobalt" href="/data-deletion">
                  Exclusão de dados
                </Link>
                <a
                  className="font-semibold text-ink transition hover:text-cobalt"
                  href="https://codeellow.com"
                  rel="noreferrer"
                  target="_blank"
                >
                  Desenvolvido pela Codeellow
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
    </>
  );
}
