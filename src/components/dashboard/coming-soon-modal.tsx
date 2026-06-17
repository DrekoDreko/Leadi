"use client";

import { useState, type ComponentType } from "react";
import { CheckCircle2, X, Zap, type LucideProps } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MeshGradient } from "@paper-design/shaders-react";

export type ComingSoonFeature = {
  icon: ComponentType<LucideProps>;
  title: string;
  description: string;
};

type ComingSoonModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Ícone exibido no topo do modal. */
  icon: ComponentType<LucideProps>;
  /** Texto introdutório (renderizado entre o título e a lista de recursos). */
  description: React.ReactNode;
  features: ComingSoonFeature[];
};

/**
 * Modal de "em breve / acesso antecipado" reutilizável, com o mesmo visual
 * (MeshGradient azul) do protótipo do Simulador de Preços.
 */
export function ComingSoonModal({
  open,
  onClose,
  title,
  icon: TopIcon,
  description,
  features
}: ComingSoonModalProps) {
  const [voted, setVoted] = useState(false);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md sm:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            style={{ borderRadius: "32px" }}
            className="relative flex w-full max-w-2xl flex-col overflow-hidden bg-blue-700 shadow-2xl"
          >
            {/* Mesh Gradient Background */}
            <div className="pointer-events-none absolute inset-0 opacity-90">
              <MeshGradient
                speed={0.6}
                colors={["#1d4ed8", "#1e40af", "#172554", "#1e3a8a"]}
                distortion={0.8}
                swirl={0.1}
                grainMixer={0.15}
                grainOverlay={0}
                style={{ height: "100%", width: "100%" }}
              />
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative z-10 flex w-full flex-col p-8 text-white sm:p-12">
              <div className="flex flex-col justify-center gap-8">
                <div className="space-y-4 text-center">
                  <span className="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-blue-200 shadow-lg shadow-blue-900/50 backdrop-blur-sm">
                    <TopIcon size={32} />
                  </span>
                  <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                    {title}
                  </h2>
                  <p className="mx-auto max-w-md text-lg text-blue-100">{description}</p>
                </div>

                <div className="mx-auto mt-4 w-full max-w-lg space-y-6">
                  {features.map((feature) => (
                    <div className="flex items-start gap-4" key={feature.title}>
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 shadow-inner backdrop-blur-sm">
                        <feature.icon className="h-6 w-6 text-blue-200" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{feature.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-blue-100/80">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mx-auto mt-8 w-full max-w-lg border-t border-white/20 pt-8 text-center">
                  <button
                    type="button"
                    onClick={() => setVoted(true)}
                    className={`flex w-full items-center justify-center gap-3 rounded-xl px-6 py-4 text-base font-bold transition ${
                      voted
                        ? "cursor-default border border-green-400/30 bg-green-500/20 text-green-100 backdrop-blur-md"
                        : "bg-white text-blue-700 shadow-xl hover:scale-[1.02] hover:bg-blue-50"
                    }`}
                  >
                    {voted ? (
                      <>
                        <CheckCircle2 size={20} className="text-green-300" />
                        Interesse registrado! Obrigado.
                      </>
                    ) : (
                      <>
                        <Zap size={20} className="text-blue-600" />
                        Quero acesso antecipado a este módulo
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
