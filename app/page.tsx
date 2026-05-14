import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { MockDashboardPreview } from "@/components/mock-dashboard-preview";
import { HeroSection } from "@/components/landing/hero-section";
import { PainSection } from "@/components/landing/pain-section";
import { SolutionSection } from "@/components/landing/solution-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { MetaAdsSection } from "@/components/landing/meta-ads-section";
import { AISection } from "@/components/landing/ai-section";
import { ComplianceSection } from "@/components/landing/compliance-section";
import { BenefitsSection } from "@/components/landing/benefits-section";
import { PlansSection } from "@/components/landing/plans-section";
import { LGPDSection } from "@/components/landing/lgpd-section";
import { FAQSection } from "@/components/landing/faq-section";
import { CTASection } from "@/components/landing/cta-section";

export const metadata = {
  title: "LeadHealth — CRM para plano de saúde empresarial",
  description:
    "Organize leads do Meta Lead Ads, acompanhe oportunidades no funil, gere campanhas com IA e conduza o processo comercial com mais controle. Feito para corretores e equipes de plano de saúde empresarial."
};

const navLinks = [
  { label: "Produto", href: "#produto" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Recursos", href: "#recursos" },
  { label: "Planos", href: "#planos" },
  { label: "Segurança", href: "#seguranca" },
  { label: "FAQ", href: "#faq" }
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      {/* ── Header ── */}
      <header className="section-shell fixed left-1/2 top-4 z-20 -translate-x-1/2">
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
          <Link
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5"
            href="/login"
          >
            Entrar
          </Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <HeroSection />

      {/* ── Dashboard Preview ── */}
      <section className="section-shell relative z-10 pb-24">
        <MockDashboardPreview />
      </section>

      {/* ── Pain ── */}
      <PainSection />

      {/* ── Solution ── */}
      <SolutionSection />

      {/* ── How it works ── */}
      <HowItWorksSection />

      {/* ── Features Grid ── */}
      <FeaturesSection />

      {/* ── Meta Ads ── */}
      <MetaAdsSection />

      {/* ── AI ── */}
      <AISection />

      {/* ── Compliance ── */}
      <ComplianceSection />

      {/* ── Benefits ── */}
      <BenefitsSection />

      {/* ── Plans ── */}
      <PlansSection />

      {/* ── LGPD ── */}
      <LGPDSection />

      {/* ── FAQ ── */}
      <FAQSection />

      {/* ── CTA Final ── */}
      <CTASection />

      {/* ── Footer ── */}
      <footer className="px-4 pb-6">
        <div className="section-shell">
          <div className="glass-strong rounded-[28px] px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-ink/60">
                  LeadHealth é uma solução em evolução para operações comerciais de planos de saúde empresariais.
                </p>
                <p className="text-xs text-ink/50">© 2025 Codeellow. Todos os direitos reservados.</p>
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
  );
}
