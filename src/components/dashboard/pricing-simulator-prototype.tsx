"use client";

import { useState } from "react";
import { 
  Calculator, 
  Plus,
  Minus,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
  HeartPulse,
  Briefcase,
  X,
  BarChart3,
  Globe2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GodRays, MeshGradient } from "@paper-design/shaders-react";
import { PageHeading } from "@/components/dashboard/widgets";
import type { BeneficiaryRange } from "@/data/pricing";

// Faixas etárias ANS e labels amigáveis
const AGE_RANGES: { value: BeneficiaryRange; label: string }[] = [
  { value: "0-18", label: "0 a 18 anos" },
  { value: "19-23", label: "19 a 23 anos" },
  { value: "24-28", label: "24 a 28 anos" },
  { value: "29-33", label: "29 a 33 anos" },
  { value: "34-38", label: "34 a 38 anos" },
  { value: "39-43", label: "39 a 43 anos" },
  { value: "44-48", label: "44 a 48 anos" },
  { value: "49-53", label: "49 a 53 anos" },
  { value: "54-58", label: "54 a 58 anos" },
  { value: "59+", label: "59 anos ou mais" }
];

export function PricingSimulatorPrototype({
  workspaceName,
  brokerageName
}: {
  workspaceName: string;
  brokerageName?: string;
}) {
  // Estado das configurações do formulário baseadas no print
  const [location, setLocation] = useState("São Paulo - SP");
  const [productType, setProductType] = useState("Saúde");
  const [planType, setPlanType] = useState("PME");
  
  // Contagem de beneficiários por faixa etária
  const [beneficiaries, setBeneficiaries] = useState<Record<BeneficiaryRange, number>>({
    "0-18": 1,
    "19-23": 0,
    "24-28": 0,
    "29-33": 2,
    "34-38": 0,
    "39-43": 0,
    "44-48": 0,
    "49-53": 0,
    "54-58": 0,
    "59+": 0
  });

  // Estado do modal/toast de "Em breve"
  const [showNotification, setShowNotification] = useState(false);
  const [, setInterestedCount] = useState(0);
  const [voted, setVoted] = useState(false);

  // Manipuladores de quantidade de beneficiários
  const incrementAge = (range: BeneficiaryRange) => {
    setBeneficiaries(prev => ({ ...prev, [range]: prev[range] + 1 }));
  };

  const decrementAge = (range: BeneficiaryRange) => {
    setBeneficiaries(prev => ({ ...prev, [range]: Math.max(0, prev[range] - 1) }));
  };

  // Limpar todas as vidas e filtros
  const clearAll = () => {
    setBeneficiaries({
      "0-18": 0,
      "19-23": 0,
      "24-28": 0,
      "29-33": 0,
      "34-38": 0,
      "39-43": 0,
      "44-48": 0,
      "49-53": 0,
      "54-58": 0,
      "59+": 0
    });
    setLocation("São Paulo - SP");
    setProductType("Saúde");
    setPlanType("PME");
  };

  const totalVidas = Object.values(beneficiaries).reduce((acc, curr) => acc + curr, 0);

  const handleNotifyInterest = () => {
    if (!voted) {
      setInterestedCount(prev => prev + 1);
      setVoted(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <PageHeading
        eyebrow="Simulador / Módulos"
        title="Simulador de Preços"
        description="Mapeie os parâmetros de contratação, abrangências regionais e vidas da oportunidade."
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 dark:bg-yellow-500/20 border border-yellow-300 dark:border-yellow-500/30 px-4 py-2 text-xs font-bold text-yellow-800 dark:text-yellow-400 shadow-sm">
          <Sparkles size={14} className="animate-pulse text-yellow-600 dark:text-yellow-400" />
          Módulo em Fase de Testes
        </span>
      </PageHeading>

      {/* Alerta explicativo - Animated Hero Destaque */}
      <div className="relative overflow-hidden rounded-[30px] border border-blue-200 dark:border-blue-900 bg-white dark:bg-[#071328] p-6 md:p-8 shadow-xl transition-all w-full min-h-[160px] flex flex-col justify-center">
        
        {/* GodRays Background */}
        <div className="absolute inset-0 pointer-events-none rounded-[30px] overflow-hidden mix-blend-overlay opacity-80">
          <GodRays
            colorBack="#00000000"
            colors={["#3b82f640", "#60a5fa40", "#2563eb40", "#1d4ed840"]}
            colorBloom="#3b82f6"
            offsetX={0.85}
            offsetY={-1}
            intensity={0.6}
            spotty={0.45}
            midSize={10}
            midIntensity={0}
            density={0.38}
            bloom={0.3}
            speed={0.5}
            scale={1.6}
            frame={3332042.8159981333}
            style={{
              height: "100%",
              width: "100%",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-left">
          <div className="flex flex-col items-start gap-3">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-800 bg-white/50 dark:bg-blue-900/30 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 backdrop-blur-sm shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
              Fase de Testes: Sua Opinião Importa
            </motion.div>

            <motion.h3 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-2xl sm:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-300"
            >
              Simulador de Preços em Fase de Testes
            </motion.h3>

            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed font-medium"
            >
              Estamos testando nosso novo Simulador de Preços. É muito importante sabermos o seu interesse para priorizarmos o desenvolvimento. Clique no botão ao lado se você deseja usar essa funcionalidade!
            </motion.p>
          </div>

          <AnimatePresence initial={false}>
            {!showNotification && (
              <motion.div className="inline-block relative shrink-0 mt-4 md:mt-0">
                <motion.div
                  style={{ borderRadius: "100px" }}
                  layout
                  layoutId="cta-card"
                  className="absolute inset-0 bg-blue-600 shadow-xl shadow-blue-500/30"
                />
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  layout={false}
                  onClick={() => setShowNotification(true)}
                  className="relative flex items-center gap-2 h-12 px-8 text-sm font-bold text-white tracking-wide hover:opacity-90 transition-opacity"
                >
                  <Zap className="w-4 h-4" />
                  Tenho interesse neste módulo
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Grid Principal - Mantendo o Layout Original xl:grid-cols-[450px_1fr] */}
      <div className="grid gap-4 xl:grid-cols-[450px_1fr] xl:items-start">
        
        {/* Lado Esquerdo: Filtros e Configurações */}
        <section className="glass-strong rounded-[34px] p-5 md:p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-ink/8 pb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calculator size={20} className="text-cobalt" />
              Parâmetros de Cotação
            </h2>
            <button 
              onClick={clearAll}
              className="text-xs font-semibold text-ink/42 hover:text-red-500 transition"
            >
              Limpar tudo
            </button>
          </div>

          {/* Selecione: Parâmetros baseados no print */}
          <div className="space-y-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink/42 flex items-center gap-1.5">
              <MapPin size={13} />
              Praça / Região de Abrangência
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-2xl border border-border/70 bg-surface-elevated/88 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cobalt/45 focus:bg-surface-elevated focus:ring-0"
            >
              <option value="São Paulo - SP">São Paulo - SP</option>
              <option value="Rio de Janeiro - RJ">Rio de Janeiro - RJ</option>
              <option value="Belo Horizonte - MG">Belo Horizonte - MG</option>
              <option value="Curitiba - PR">Curitiba - PR</option>
              <option value="Boa Vista - RR">Boa Vista - RR</option>
              <option value="Porto Alegre - RS">Porto Alegre - RS</option>
              <option value="Florianópolis - SC">Florianópolis - SC</option>
              <option value="Aracaju - SE">Aracaju - SE</option>
              <option value="Palmas - TO">Palmas - TO</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink/42 flex items-center gap-1.5">
                <HeartPulse size={13} />
                Tipo de Produto
              </label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full rounded-2xl border border-border/70 bg-surface-elevated/88 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cobalt/45 focus:bg-surface-elevated focus:ring-0"
              >
                <option value="Saúde">Saúde</option>
                <option value="Odonto">Odonto</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink/42 flex items-center gap-1.5">
                <Briefcase size={13} />
                Tipo de Plano
              </label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                className="w-full rounded-2xl border border-border/70 bg-surface-elevated/88 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cobalt/45 focus:bg-surface-elevated focus:ring-0"
              >
                <option value="Individual">Individual</option>
                <option value="Familiar">Familiar</option>
                <option value="PME">PME</option>
                <option value="Adesão">Adesão</option>
              </select>
            </div>
          </div>

          {/* Adicionar Vidas por Faixa Etária (Layout original de listagem com +/-) */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink/42 flex items-center justify-between">
              <span>Faixas Etárias & Vidas</span>
              <span className="text-xs normal-case text-cobalt font-semibold">
                Total: {totalVidas} {totalVidas === 1 ? "vida" : "vidas"}
              </span>
            </label>
            <div className="border border-border bg-white/28 rounded-[26px] overflow-hidden max-h-[350px] overflow-y-auto p-2 space-y-1">
              {AGE_RANGES.map(({ value, label }) => {
                const count = beneficiaries[value];
                return (
                  <div 
                    key={value}
                    className={`flex items-center justify-between px-3 py-2 rounded-2xl transition ${
                      count > 0 ? "bg-white/60 dark:bg-white/10 shadow-sm" : "hover:bg-white/18"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold text-ink">{label}</span>
                      <p className="text-[10px] text-ink/42">Titulares e dependentes</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decrementAge(value)}
                        className={`h-7 w-7 flex items-center justify-center rounded-full transition ${
                          count > 0 
                            ? "bg-surface-elevated border border-ink/10 text-ink hover:bg-ink/5" 
                            : "opacity-30 pointer-events-none text-ink/38"
                        }`}
                        type="button"
                      >
                        <Minus size={12} />
                      </button>
                      <span className={`w-6 text-center text-xs font-bold ${count > 0 ? "text-ink" : "text-ink/38"}`}>
                        {count}
                      </span>
                      <button
                        onClick={() => incrementAge(value)}
                        className="h-7 w-7 flex items-center justify-center rounded-full bg-surface-elevated border border-ink/10 text-ink hover:bg-ink/5 transition"
                        type="button"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Lado Direito: Resumo e Detalhamento */}
        <section className="space-y-4">
          
          {totalVidas === 0 ? (
            <div className="glass-strong rounded-[34px] p-8 text-center flex flex-col items-center justify-center min-h-[450px]">
              <div className="h-16 w-16 rounded-full bg-cobalt/10 flex items-center justify-center text-cobalt mb-4 animate-bounce">
                <Calculator size={28} />
              </div>
              <h2 className="text-xl font-semibold">Aguardando inserção de vidas</h2>
              <p className="text-sm text-ink/54 max-w-sm mt-2 leading-relaxed">
                Adicione a quantidade de beneficiários por faixa etária no painel ao lado para gerar o mapeamento detalhado da demanda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Resumo da Busca */}
              <div className="surface-card-strong flex flex-col gap-4 rounded-[34px] p-5 md:flex-row md:items-center md:justify-between md:p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cobalt">Resumo da Seleção</span>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-sm font-semibold">{planType}</span>
                    <span className="text-ink/38">•</span>
                    <span className="text-sm text-ink/62">{productType}</span>
                    <span className="text-ink/38">•</span>
                    <span className="text-sm text-ink/62 font-medium">{location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-ink/42 font-medium block">Volume de Vidas</span>
                  <strong className="text-xl font-semibold text-ink">
                    {totalVidas} beneficiário{totalVidas > 1 ? "s" : ""}
                  </strong>
                </div>
              </div>



              {/* Botões de Ações Comerciais */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4">
                <span className="text-xs text-ink/42 flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Salvar mapeamento no prontuário do lead disponível em breve
                </span>
                <button
                  onClick={() => setShowNotification(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-8 py-3.5 text-sm font-semibold text-background shadow-soft hover:bg-foreground/90 transition duration-200"
                >
                  Salvar Mapeamento
                  <ArrowRight size={16} />
                </button>
              </div>

            </div>
          )}

        </section>

      </div>

      {/* Modal Promocional de Feedback de Interesse - Animated */}
      <AnimatePresence>
        {showNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              layoutId="cta-card"
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              style={{ borderRadius: "32px" }}
              className="relative flex w-full max-w-2xl flex-col overflow-hidden bg-blue-700 shadow-2xl"
            >
              {/* Mesh Gradient Background */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 pointer-events-none opacity-90"
              >
                <MeshGradient
                  speed={0.6}
                  colors={["#1d4ed8", "#1e40af", "#172554", "#1e3a8a"]}
                  distortion={0.8}
                  swirl={0.1}
                  grainMixer={0.15}
                  grainOverlay={0}
                  style={{ height: "100%", width: "100%" }}
                />
              </motion.div>

              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowNotification(false)}
                className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </motion.button>

              <div className="relative z-10 flex flex-col w-full p-8 sm:p-12 text-white">
                <div className="flex flex-col justify-center gap-8">
                  <div className="space-y-4 text-center">
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-blue-200 border border-white/20 shadow-lg shadow-blue-900/50 backdrop-blur-sm mb-2">
                      <Sparkles size={32} />
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
                      Simulador de Preços
                    </h2>
                    <p className="text-blue-100 text-lg mx-auto max-w-md">
                      Estamos validando o interesse nesta funcionalidade antes do lançamento oficial na <strong>{brokerageName || workspaceName}</strong>. Sua participação é fundamental!
                    </p>
                  </div>

                  <div className="space-y-6 max-w-lg mx-auto w-full mt-4">
                    <div className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-inner">
                        <BarChart3 className="w-6 h-6 text-blue-200" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Inteligência de Dados</h3>
                        <p className="text-blue-100/80 text-sm leading-relaxed mt-1">
                          Vincule a demanda da oportunidade aos algoritmos de cotação.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 shadow-inner">
                        <Globe2 className="w-6 h-6 text-blue-200" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Salvar no Prontuário</h3>
                        <p className="text-blue-100/80 text-sm leading-relaxed mt-1">
                          Todo o histórico mapeado fica salvo diretamente no lead.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/20 max-w-lg mx-auto w-full text-center">
                    <button
                      onClick={handleNotifyInterest}
                      className={`w-full py-4 px-6 rounded-xl text-base font-bold transition flex items-center justify-center gap-3 ${
                        voted 
                          ? "bg-green-500/20 text-green-100 border border-green-400/30 backdrop-blur-md cursor-default" 
                          : "bg-surface-elevated text-blue-700 hover:bg-blue-50 hover:scale-[1.02] shadow-xl"
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

    </div>
  );
}
