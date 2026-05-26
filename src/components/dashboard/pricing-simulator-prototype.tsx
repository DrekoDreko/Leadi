"use client";

import { useState } from "react";
import { 
  Calculator, 
  Plus, 
  Minus, 
  Building2, 
  Check, 
  Info, 
  Sparkles, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2
} from "lucide-react";
import { PageHeading } from "@/components/dashboard/widgets";
import type { 
  BeneficiaryRange, 
  HealthPlanAccommodation, 
  HealthPlanCoparticipation 
} from "@/data/pricing";

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

// Operadoras disponíveis no mock
const OPERATORS = [
  { id: "amil", name: "Amil Saúde", color: "from-blue-600 to-indigo-600", basePrice: 160 },
  { id: "bradesco", name: "Bradesco Saúde", color: "from-red-600 to-rose-600", basePrice: 190 },
  { id: "sulamerica", name: "SulAmérica", color: "from-sky-600 to-blue-700", basePrice: 175 },
  { id: "unimed", name: "Unimed Nacional", color: "from-emerald-600 to-teal-700", basePrice: 150 }
];

// Multiplicadores de faixa etária (ANS aproximados)
const RANGE_MULTIPLIERS: Record<BeneficiaryRange, number> = {
  "0-18": 1.0,
  "19-23": 1.25,
  "24-28": 1.45,
  "29-33": 1.68,
  "34-38": 1.88,
  "39-43": 2.15,
  "44-48": 2.65,
  "49-53": 3.25,
  "54-58": 4.10,
  "59+": 6.10
};

export function PricingSimulatorPrototype({
  workspaceName,
  brokerageName
}: {
  workspaceName: string;
  brokerageName?: string;
}) {
  // Estado das configurações do formulário
  const [cnpjType, setCnpjType] = useState<"MEI" | "PME" | "Física">("PME");
  const [region, setRegion] = useState("SP - Capital e Região Metropolitana");
  const [accommodation, setAccommodation] = useState<HealthPlanAccommodation>("Apartamento");
  const [coparticipation, setCoparticipation] = useState<HealthPlanCoparticipation>("Com Coparticipação");
  const [selectedOperators, setSelectedOperators] = useState<string[]>(["amil", "bradesco", "sulamerica"]);
  
  // Contagem de beneficiários por faixa etária (inicializado com exemplo comum)
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
  const [interestedCount, setInterestedCount] = useState(0);
  const [voted, setVoted] = useState(false);

  // Manipuladores de quantidade de beneficiários
  const incrementAge = (range: BeneficiaryRange) => {
    setBeneficiaries(prev => ({ ...prev, [range]: prev[range] + 1 }));
  };

  const decrementAge = (range: BeneficiaryRange) => {
    setBeneficiaries(prev => ({ ...prev, [range]: Math.max(0, prev[range] - 1) }));
  };

  // Limpar todas as vidas
  const clearAllVidas = () => {
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
  };

  // Alternar operadora
  const toggleOperator = (id: string) => {
    setSelectedOperators(prev => 
      prev.includes(id) 
        ? prev.filter(op => op !== id) 
        : [...prev, id]
    );
  };

  // Total de vidas adicionadas
  const totalVidas = Object.values(beneficiaries).reduce((acc, curr) => acc + curr, 0);

  // Cálculo da cotação mock baseada nos inputs atuais
  const calculateQuote = (operatorBasePrice: number) => {
    let total = 0;
    const pricePerRange: Record<string, number> = {};

    Object.entries(beneficiaries).forEach(([range, count]) => {
      if (count > 0) {
        // Cálculo base do preço por vida nesta operadora
        let pricePerLife = operatorBasePrice * RANGE_MULTIPLIERS[range as BeneficiaryRange];
        
        // Ajuste CNPJ (Descontos corporativos)
        if (cnpjType === "PME") {
          pricePerLife *= 0.70; // 30% desconto PME
        } else if (cnpjType === "MEI") {
          pricePerLife *= 0.80; // 20% desconto MEI
        }

        // Ajuste Internação
        if (accommodation === "Apartamento") {
          pricePerLife *= 1.15; // 15% mais caro
        }

        // Ajuste Coparticipação
        if (coparticipation === "Com Coparticipação") {
          pricePerLife *= 0.85; // 15% de desconto na mensalidade fixa
        }

        const roundPrice = Math.round(pricePerLife * 100) / 100;
        pricePerRange[range] = roundPrice;
        total += roundPrice * count;
      }
    });

    return {
      total: Math.round(total * 100) / 100,
      pricePerRange
    };
  };

  // Gerar resultados
  const quotes = OPERATORS
    .filter(op => selectedOperators.includes(op.id))
    .map(op => {
      const calculation = calculateQuote(op.basePrice);
      return {
        ...op,
        total: calculation.total,
        pricePerRange: calculation.pricePerRange
      };
    })
    .sort((a, b) => a.total - b.total);

  const cheapest = quotes[0];
  const premiumOption = quotes[quotes.length - 1];

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
        eyebrow="Configurações / Módulos"
        title="Simulador de Planos de Saúde"
        description="Mapeie hospitais, combine faixas etárias, operadoras e gere propostas visuais instantâneas para seus leads."
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-signal/15 border border-signal/28 px-4 py-2 text-xs font-semibold text-signal">
          <Sparkles size={14} className="animate-pulse" />
          Módulo em Pré-lançamento
        </span>
      </PageHeading>

      {/* Alerta explicativo de Protótipo e "Em breve" */}
      <div className="glass border border-white/50 rounded-[30px] p-5 md:p-6 bg-gradient-to-r from-blue-50/40 via-indigo-50/30 to-transparent dark:from-blue-950/20 dark:via-indigo-950/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cobalt/10 text-cobalt dark:bg-cobalt/20">
              <Info size={20} />
            </span>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Mapeamento de Demanda Comercial</h3>
              <p className="text-sm text-ink/62 leading-relaxed">
                Este simulador está na fase de **Protótipo de Interface**. As tabelas de preços, abrangências regionais e regras de vidas por CNPJ refletem valores e descontos comerciais médios do mercado para demonstração rápida.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNotification(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white shadow-soft hover:bg-cobalt/90 transition shrink-0"
          >
            <Zap size={16} />
            Tenho interesse neste módulo
          </button>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid gap-4 xl:grid-cols-[450px_1fr] xl:items-start">
        
        {/* Lado Esquerdo: Filtros e Configurações */}
        <section className="glass-strong rounded-[34px] p-5 md:p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-ink/8 pb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calculator size={20} className="text-cobalt" />
              Parâmetros de Cotação
            </h2>
            {totalVidas > 0 && (
              <button 
                onClick={clearAllVidas}
                className="text-xs font-semibold text-ink/42 hover:text-red-500 transition"
              >
                Limpar vidas ({totalVidas})
              </button>
            )}
          </div>

          {/* Tipo de Contratação */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink/42 flex items-center gap-1.5">
              <Building2 size={13} />
              Tipo de Contratação (CNPJ)
            </label>
            <div className="grid grid-cols-3 gap-2 bg-white/28 border border-white/40 p-1.5 rounded-full">
              {(["PME", "MEI", "Física"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setCnpjType(type)}
                  className={`py-2 px-3 text-xs font-semibold rounded-full transition-all ${
                    cnpjType === type 
                      ? "bg-white text-ink shadow-soft dark:bg-ink dark:text-cloud" 
                      : "text-ink/62 hover:bg-white/34"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-ink/48 px-1">
              {cnpjType === "PME" && "✓ Desconto corporativo de 30% (mínimo de 3 vidas)."}
              {cnpjType === "MEI" && "✓ Desconto MEI de 20% (CNPJ ativo há mais de 6 meses)."}
              {cnpjType === "Física" && "Tabelas de referência individual familiar sem CNPJ."}
            </p>
          </div>

          {/* Região Comercial */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink/42">
              Praça / Região de Abrangência
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-2xl border border-border/70 bg-surface-elevated/88 px-4 py-3 text-sm text-foreground outline-none transition focus:border-cobalt/45 focus:bg-surface-elevated focus:ring-0"
            >
              <option value="SP - Capital e Região Metropolitana">São Paulo - Capital e Região Metropolitana</option>
              <option value="RJ - Rio de Janeiro e Baixada">Rio de Janeiro - Capital e Baixada Fluminense</option>
              <option value="MG - Belo Horizonte e Grande BH">Belo Horizonte - Região Metropolitana</option>
              <option value="SUL - Curitiba, POA e Floripa">Sul - Curitiba, Porto Alegre e Florianópolis</option>
            </select>
          </div>

          {/* Acomodação e Coparticipação */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink/42">
                Acomodação
              </label>
              <div className="flex flex-col gap-2">
                {(["Apartamento", "Enfermaria"] as HealthPlanAccommodation[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAccommodation(opt)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left text-xs font-semibold transition ${
                      accommodation === opt
                        ? "bg-white/80 border-cobalt/38 text-ink shadow-soft dark:bg-white/10"
                        : "bg-white/28 border-white/30 text-ink/62 hover:bg-white/44"
                    }`}
                  >
                    <span>{opt}</span>
                    {accommodation === opt && <Check size={14} className="text-cobalt" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink/42">
                Coparticipação
              </label>
              <div className="flex flex-col gap-2">
                {(["Com Coparticipação", "Sem Coparticipação"] as HealthPlanCoparticipation[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setCoparticipation(opt)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left text-xs font-semibold transition ${
                      coparticipation === opt
                        ? "bg-white/80 border-cobalt/38 text-ink shadow-soft dark:bg-white/10"
                        : "bg-white/28 border-white/30 text-ink/62 hover:bg-white/44"
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {coparticipation === opt && <Check size={14} className="text-cobalt" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Adicionar Vidas por Faixa Etária */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink/42 flex items-center justify-between">
              <span>Faixas Etárias & Vidas</span>
              <span className="text-xs normal-case text-cobalt font-semibold">
                Total: {totalVidas} {totalVidas === 1 ? "vida" : "vidas"}
              </span>
            </label>
            <div className="border border-white/45 bg-white/28 rounded-[26px] overflow-hidden max-h-[300px] overflow-y-auto p-2 space-y-1">
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
                      <p className="text-[10px] text-ink/42">ANS {value}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decrementAge(value)}
                        className={`h-7 w-7 flex items-center justify-center rounded-full transition ${
                          count > 0 
                            ? "bg-white border border-ink/10 text-ink hover:bg-ink/5" 
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
                        className="h-7 w-7 flex items-center justify-center rounded-full bg-white border border-ink/10 text-ink hover:bg-ink/5 transition"
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

          {/* Selecionar Operadoras */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink/42">
              Selecione as Operadoras
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OPERATORS.map((op) => {
                const active = selectedOperators.includes(op.id);
                return (
                  <button
                    key={op.id}
                    onClick={() => toggleOperator(op.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                      active
                        ? "bg-white/80 border-cobalt/38 text-ink shadow-sm dark:bg-white/10"
                        : "bg-white/28 border-white/30 text-ink/42 hover:bg-white/44"
                    }`}
                  >
                    <span className={`h-4.5 w-4.5 rounded-md flex items-center justify-center border transition ${
                      active 
                        ? "bg-cobalt border-cobalt text-white" 
                        : "border-ink/20 bg-white/50"
                    }`}>
                      {active && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="text-xs font-semibold">{op.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Lado Direito: Resultados da Comparação e Mock Quotes */}
        <section className="space-y-4">
          
          {totalVidas === 0 ? (
            <div className="glass-strong rounded-[34px] p-8 text-center flex flex-col items-center justify-center min-h-[450px]">
              <div className="h-16 w-16 rounded-full bg-cobalt/10 flex items-center justify-center text-cobalt mb-4 animate-bounce">
                <Calculator size={28} />
              </div>
              <h2 className="text-xl font-semibold">Aguardando inserção de vidas</h2>
              <p className="text-sm text-ink/54 max-w-sm mt-2 leading-relaxed">
                Adicione a quantidade de beneficiários por faixa etária no painel ao lado para gerar o comparativo de preços em tempo real.
              </p>
            </div>
          ) : quotes.length === 0 ? (
            <div className="glass-strong rounded-[34px] p-8 text-center flex flex-col items-center justify-center min-h-[450px]">
              <div className="h-16 w-16 rounded-full bg-signal/15 flex items-center justify-center text-signal mb-4">
                <AlertTriangle size={28} />
              </div>
              <h2 className="text-xl font-semibold">Nenhuma operadora selecionada</h2>
              <p className="text-sm text-ink/54 max-w-sm mt-2 leading-relaxed">
                Selecione pelo menos uma das operadoras no painel ao lado para visualizar os preços comparativos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Resumo da Cotação */}
              <div className="surface-card-strong flex flex-col gap-4 rounded-[34px] p-5 md:flex-row md:items-center md:justify-between md:p-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-cobalt">Resumo da Busca</span>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-sm font-semibold">{cnpjType}</span>
                    <span className="text-ink/38">•</span>
                    <span className="text-sm text-ink/62">{accommodation}</span>
                    <span className="text-ink/38">•</span>
                    <span className="text-sm text-ink/62">{coparticipation}</span>
                    <span className="text-ink/38">•</span>
                    <span className="text-sm text-ink/62 font-medium">{region}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-ink/42 font-medium block">Volume de Vidas</span>
                  <strong className="text-xl font-semibold text-ink">
                    {totalVidas} beneficiário{totalVidas > 1 ? "s" : ""}
                  </strong>
                </div>
              </div>

              {/* Lista de Cotações Comparativas */}
              <div className="space-y-3">
                {quotes.map((q) => {
                  const isCheapest = cheapest && q.id === cheapest.id;
                  const isPremium = premiumOption && q.id === premiumOption.id && quotes.length > 1;
                  
                  return (
                    <div 
                      key={q.id}
                      className={`glass rounded-[34px] border transition-all duration-200 overflow-hidden ${
                        isCheapest 
                          ? "border-emerald-500/40 bg-gradient-to-r from-emerald-50/20 to-transparent shadow-sm dark:border-emerald-500/20"
                          : "border-border/60 bg-surface-elevated/88"
                      }`}
                    >
                      {/* Destaque do topo do card */}
                      <div className="px-5 py-3.5 border-b border-ink/8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${q.color}`} />
                          <h3 className="font-semibold text-ink">{q.name}</h3>
                          <span className="text-xs text-ink/42 font-medium">Plano PME Referência</span>
                        </div>
                        {isCheapest && (
                          <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-[11px] font-semibold flex items-center gap-1 border border-emerald-200/40 dark:bg-emerald-500/12 dark:text-emerald-200 dark:border-0">
                            <Zap size={11} />
                            Mais Econômico
                          </span>
                        )}
                        {!isCheapest && isPremium && (
                          <span className="rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-[11px] font-semibold border border-blue-200/40 dark:bg-blue-500/12 dark:text-blue-200 dark:border-0">
                            Linha Executiva
                          </span>
                        )}
                      </div>

                      {/* Conteúdo da Cotação */}
                      <div className="p-5 md:p-6 grid gap-4 md:grid-cols-[1fr_200px] md:items-center">
                        
                        {/* Detalhes de faixa etária */}
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-ink/42">Detalhamento por Faixas Cotadas</span>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(beneficiaries).map(([range, count]) => {
                              if (count === 0) return null;
                              const price = q.pricePerRange[range] || 0;
                              return (
                                <div key={range} className="rounded-2xl bg-white/48 border border-white/60 p-2 text-xs flex items-center gap-2">
                                  <span className="font-semibold text-ink">{range}:</span>
                                  <span className="text-ink/62">{count}x R$ {Math.round(price).toLocaleString("pt-BR")}</span>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-ink/42 mt-1 font-medium">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              Rede Credenciada Básica
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              Taxa de implantação isenta
                            </span>
                          </div>
                        </div>

                        {/* Preço e Botão */}
                        <div className="text-left md:text-right border-t border-ink/4 pt-4 md:border-t-0 md:pt-0 md:pl-4 md:border-l md:border-ink/8 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4">
                          <div>
                            <span className="text-xs text-ink/42 font-medium block">Preço Mensal Total</span>
                            <strong className="text-2xl font-bold text-ink whitespace-nowrap">
                              R$ {q.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </strong>
                            <span className="text-[10px] text-ink/42 block">Preços simulados</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botões de Ações Comerciais */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <span className="text-xs text-ink/42 flex items-center gap-1 font-medium">
                  <ShieldCheck size={14} className="text-cobalt" />
                  Salvar orçamento no prontuário do lead disponível em breve
                </span>
                <button
                  onClick={() => setShowNotification(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cloud shadow-soft hover:bg-ink/90 transition duration-200"
                >
                  Gerar Proposta Comercial
                  <ArrowRight size={16} />
                </button>
              </div>

            </div>
          )}

        </section>

      </div>

      {/* Modal Promocional de Feedback de Interesse */}
      {showNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45 backdrop-blur-sm animate-fade-in">
          <div className="glass-strong border border-white/60 rounded-[38px] p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl relative animate-scale-up text-ink">
            
            <div className="text-center space-y-3">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-cobalt/10 text-cobalt dark:bg-cobalt/20 mb-2">
                <Sparkles size={26} />
              </span>
              <h3 className="text-2xl font-semibold">Simulador de Preços Comercial</h3>
              <p className="text-sm text-ink/62 leading-relaxed">
                Estamos homologando os motores de cálculo automático e centralizando as tabelas regionais das operadoras para a corretora **{brokerageName || workspaceName}**.
              </p>
            </div>

            <div className="bg-white/44 border border-white/60 p-4 rounded-3xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cobalt">O que o módulo completo trará:</h4>
              <ul className="space-y-2 text-xs text-ink/80">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>**Cálculo Real 100% Atualizado**: Tabelas de preços atualizadas mensalmente de forma direta com as operadoras.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>**Integração com Lead do CRM**: Puxar idades e CNPJ diretamente do prontuário comercial em um clique.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>**Propostas em PDF & WhatsApp**: Gerar link de proposta interativa para o cliente com templates de WhatsApp IA.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleNotifyInterest}
                className={`w-full py-3.5 px-5 rounded-full text-sm font-semibold transition flex items-center justify-center gap-2 ${
                  voted 
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" 
                    : "bg-cobalt text-white hover:bg-cobalt/90 shadow-soft"
                }`}
              >
                {voted ? (
                  <>
                    <CheckCircle2 size={16} />
                    Interesse registrado! Obrigado pelo feedback.
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Quero acesso antecipado a este módulo
                  </>
                )}
              </button>

              {voted && (
                <p className="text-[11px] text-center text-ink/42 font-medium">
                  {interestedCount > 0 
                    ? `✓ Você e outros corretores da organização já demonstraram interesse.` 
                    : "Sua opinião é vital para acelerarmos este lançamento!"}
                </p>
              )}

              <button
                onClick={() => setShowNotification(false)}
                className="w-full py-3 px-5 rounded-full text-xs font-semibold text-ink/56 hover:bg-white/34 transition"
              >
                Voltar ao protótipo
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
