import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { LeadAdvantagesCarousel } from "@/components/ui/profile-card-testimonial-carousel";
import { PricingSection } from "@/components/ui/pricing-section";
import { pricingNotice } from "@/data/pricing";

export default function PricingPage() {
  return (
    <main className="min-h-screen px-4 py-4 md:py-6">
      <div className="section-shell pb-4">
        <header className="glass mb-8 flex items-center justify-between rounded-full px-4 py-3">
          <BrandMark />
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-white/44 px-4 py-2 text-sm font-semibold"
            href="/"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Voltar
          </Link>
        </header>
      </div>

      <PricingSection />
      <LeadAdvantagesCarousel />

      <div className="section-shell">
        <p className="mx-auto max-w-4xl pb-8 text-center text-sm leading-6 text-ink/58">
          {pricingNotice}
        </p>
      </div>
    </main>
  );
}
