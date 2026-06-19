import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { systemTemplatesFallback } from "@/data/system-templates";
import { CampaignGenerator, RegionTagsInput } from "./campaign-generator";
import type { ConnectedAccountsState } from "@/lib/integrations/types";
import type { SystemTemplate } from "@/lib/templates/types";

const connectedAccounts: ConnectedAccountsState = {
  mode: "supabase",
  organizationId: "org-1",
  organizationName: "Aliança Corretora",
  canManageConnections: true,
  connectedAccounts: [],
  metaConnection: {
    id: "meta-1",
    organizationId: "org-1",
    provider: "meta",
    status: "connected",
    connectedAt: "2026-05-19T10:00:00.000Z",
    connectedByUserId: "user-1",
    expiresAt: null,
    lastSyncAt: null,
    scopes: [],
    accessTokenCiphertext: null,
    accessTokenReference: null,
    tokenLastFour: null,
    tokenPreview: null,
    metaUserId: "100",
    metaUserName: "Conta Meta",
    permissions: [],
    lastError: null,
    connectionStatusLabel: "Conectada"
  },
  openAIConnection: null,
  metaPages: [
    {
      id: "page-1",
      organizationId: "org-1",
      metaPageId: "page-meta-1",
      name: "Leadi Saúde",
      category: "Saúde",
      status: "connected",
      connectedAccountId: "meta-1",
      lastSyncAt: null
    }
  ],
  metaAdAccounts: [
    {
      id: "ad-1",
      organizationId: "org-1",
      metaAdAccountId: "act-1",
      name: "Conta de anúncio",
      currency: "BRL",
      timezone: "America/Sao_Paulo",
      status: "connected",
      connectedAccountId: "meta-1",
      lastSyncAt: null
    }
  ],
  metaLeadForms: [
    {
      id: "form-1",
      organizationId: "org-1",
      metaFormId: "lead-form-1",
      name: "Formulário consultivo",
      pageId: "page-meta-1",
      pageName: "Leadi Saúde",
      status: "connected",
      connectedAccountId: "meta-1",
      lastLeadSyncAt: null,
      lastSyncAt: null
    }
  ],
  syncLogs: []
};

const campaignSystemTemplates = systemTemplatesFallback.filter(
  (template): template is SystemTemplate => template.templateType === "campaign"
);

function renderGenerator(aiBalance = 20, templates: SystemTemplate[] = campaignSystemTemplates) {
  render(
    <CampaignGenerator
      aiBalance={aiBalance}
      connectedAccounts={connectedAccounts}
      historyMode="supabase"
      leadsCapturedCount={11}
      publishedAdsCount={4}
      totalSpentCredits={44}
      systemTemplates={templates}
    />
  );
}

describe("CampaignGenerator", () => {
  it("não marca etapas futuras como concluídas no primeiro carregamento", () => {
    renderGenerator();

    expect(screen.queryByText("Concluída")).not.toBeInTheDocument();
  });

  it("não exibe os cards de resumo do topo", () => {
    renderGenerator();

    expect(screen.queryByText("Etapa em foco")).not.toBeInTheDocument();
    expect(screen.queryByText("Fluxo concluído")).not.toBeInTheDocument();
    expect(screen.queryByText("Créditos disponíveis")).not.toBeInTheDocument();
    expect(screen.queryByText("Orquestração do fluxo")).not.toBeInTheDocument();
    expect(screen.queryByText(/etapa[s]? concluída[s]?/i)).not.toBeInTheDocument();
  });

  it("não exibe a lista detalhada dentro do card azul", () => {
    renderGenerator();

    expect(screen.queryByText("Conexões Meta")).not.toBeInTheDocument();
    expect(screen.queryByText("Público e oferta")).not.toBeInTheDocument();
    expect(screen.queryByText("Resumo final")).not.toBeInTheDocument();
  });

  it("mostra os cards de resumo abaixo do aviso quando faltam créditos", () => {
    renderGenerator(0);

    expect(screen.getByText("Créditos de IA insuficientes")).toBeInTheDocument();
    expect(screen.getAllByText("Anúncios publicados").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Leads captados")).toBeInTheDocument();
    expect(screen.getByText("Valor gasto por lead")).toBeInTheDocument();
    expect(screen.getByText("Créditos de geração de anúncio")).toBeInTheDocument();
  });

  it("mostra os 3 templates seguros, o atalho sem modelos e aplica o template selecionado nos campos", () => {
    renderGenerator();

    expect(screen.getByRole("button", { name: /No empresarial economiza até 40%/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Plano empresarial a partir de 2 vidas/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Quer um plano só para você ou sua família/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuar sem os modelos/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Plano empresarial a partir de 2 vidas/i }));
    fireEvent.click(screen.getByRole("button", { name: /Primeiro passo: exemplos de campanha/i }));

    const selectedTemplate = screen.getByRole("button", { name: /Plano empresarial a partir de 2 vidas/i });
    expect(within(selectedTemplate).getByText("Selecionado")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Público, oferta e região/i }));

    expect(screen.getByLabelText("Perfil do público-alvo")).toHaveValue(
      "Empresários, MEIs e sócios com CNPJ ativo nas capitais do Nordeste que querem plano de saúde com preço empresarial para si, sócios e dependentes."
    );
    expect(screen.getByLabelText("Oferta e benefícios")).toHaveValue(
      "Cotação de plano empresarial PME por número de vidas e rede, comparando operadoras e mostrando a economia frente ao plano individual."
    );
    expect(screen.getByText("Salvador")).toBeInTheDocument();
    expect(screen.getByText("Recife")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Observações e tom da mensagem/i }));
    expect(screen.getByRole("button", { name: "Humano e claro" })).toHaveClass("border-cobalt/70");
  });

  it("prioriza os templates vindos do repositório quando eles são fornecidos", () => {
    const customTemplate: SystemTemplate = {
      id: "custom-campaign-template",
      templateType: "campaign",
      category: "Rede hospitalar",
      title: "Campanha sob medida para rede premium",
      description: "Template vindo do repositório para validar uso do payload server-side.",
      content: {
        audience: "Empresas que priorizam hospitais premium na decisão.",
        offer: "Comparativo orientado por rede hospitalar prioritária.",
        region: "São Paulo, Alphaville",
        differentiator: "Traduz diferenças de rede em próximos passos comerciais.",
        tone: "Profissional e objetivo",
        notes: "Sem promessa de melhor preço."
      },
      isActive: true,
      createdAt: "2026-05-22T10:00:00.000Z",
      updatedAt: "2026-05-22T10:00:00.000Z"
    };

    renderGenerator(20, [customTemplate]);

    expect(screen.getByRole("button", { name: /Campanha sob medida para rede premium/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /No empresarial economiza até 40%/i })).not.toBeInTheDocument();
  });

  it("valida briefing quando o usuário escolhe solicitar criativo", () => {
    renderGenerator();

    fireEvent.click(screen.getByRole("button", { name: /Criativo/i }));
    fireEvent.click(screen.getByRole("button", { name: "Solicitar criativo" }));
    fireEvent.submit(document.getElementById("campaign-generator-form") as HTMLFormElement);

    expect(screen.getByText("Preencha o briefing ao solicitar criativo.")).toBeInTheDocument();
  });

  it("explica o modo pausado com os ativos preparados para a Meta", () => {
    renderGenerator();

    fireEvent.click(screen.getByRole("button", { name: /Modo de publicação/i }));
    fireEvent.click(screen.getByRole("button", { name: /Publicar pausada na Meta/i }));

    expect(screen.getByText("Categoria Especial de Anuncio")).toBeInTheDocument();
    expect(screen.getByText("Pronta para publicar pausada")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Resumo da campanha/i }));

    expect(screen.getAllByText("Leadi Saúde").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Conta de anúncio").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Formulário consultivo").length).toBeGreaterThanOrEqual(1);
  });
});

describe("RegionTagsInput", () => {
  it("cria tags com Enter, evita duplicadas e remove tags", () => {
    function Wrapper() {
      const [regions, setRegions] = useState<string[]>([]);
      return <RegionTagsInput regions={regions} onChange={setRegions} />;
    }

    render(<Wrapper />);

    const input = screen.getByLabelText("Adicionar região");
    fireEvent.change(input, { target: { value: "São Paulo" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("São Paulo")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "são paulo" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getAllByText("São Paulo")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Remover São Paulo" }));
    expect(screen.queryByText("São Paulo")).not.toBeInTheDocument();
  });

  it("cria tags com Tab e vírgula", () => {
    function Wrapper() {
      const [regions, setRegions] = useState<string[]>([]);
      return <RegionTagsInput regions={regions} onChange={setRegions} />;
    }

    render(<Wrapper />);

    const input = screen.getByLabelText("Adicionar região");
    fireEvent.change(input, { target: { value: "Campinas" } });
    fireEvent.keyDown(input, { key: "Tab" });
    fireEvent.change(input, { target: { value: "SP" } });
    fireEvent.keyDown(input, { key: "," });

    expect(screen.getByText("Campinas")).toBeInTheDocument();
    expect(screen.getByText("SP")).toBeInTheDocument();
  });
});
