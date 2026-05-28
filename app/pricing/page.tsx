import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { LeadAdvantagesCarousel } from "@/components/ui/profile-card-testimonial-carousel";
import { PricingSection } from "@/components/ui/pricing-section";

export default function PricingPage() {
  return (
    <main className="min-h-screen overflow-hidden px-4 py-4 md:py-6">
      <div className="section-shell pb-4">
        <header className="glass mb-8 flex items-center justify-between rounded-full px-4 py-3">
          <BrandMark />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-white/44 px-4 py-2 text-sm font-semibold transition hover:bg-white/60 dark:bg-white/10 dark:hover:bg-white/16"
              href="/"
            >
              <ArrowLeft size={17} aria-hidden="true" />
              Voltar
            </Link>
          </div>
        </header>
      </div>

      <PricingSection showComparisonDetails />
      <LeadAdvantagesCarousel />
    </main>
  );
}
