import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { CampaignGenerator, RegionTagsInput } from "./campaign-generator";
import type { ConnectedAccountsState } from "@/lib/integrations/types";

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

function renderGenerator(aiBalance = 20) {
  render(
    <CampaignGenerator
      aiBalance={aiBalance}
      connectedAccounts={connectedAccounts}
      historyMode="supabase"
      leadsCapturedCount={11}
      publishedAdsCount={4}
      totalSpentCredits={44}
      systemTemplates={[]}
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
    expect(screen.getByText("Anúncios publicados")).toBeInTheDocument();
    expect(screen.getByText("Leads captados")).toBeInTheDocument();
    expect(screen.getByText("Valor gasto por lead")).toBeInTheDocument();
    expect(screen.getByText("Créditos de geração de anúncio")).toBeInTheDocument();
  });

  it("mostra 6 templates seguros e aplica o template selecionado nos campos", () => {
    renderGenerator();

    expect(screen.getByRole("button", { name: /Migração para plano empresarial/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Plano de saúde para MEI/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Plano empresarial para pequenas empresas/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Comparativo entre operadoras/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Inclusão de sócios e equipe/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Revisão de contrato atual/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Plano de saúde para MEI/i }));
    fireEvent.click(screen.getByRole("button", { name: /Primeiro passo: exemplos de campanha/i }));

    const selectedTemplate = screen.getByRole("button", { name: /Plano de saúde para MEI/i });
    expect(within(selectedTemplate).getByText("Selecionado")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Público, oferta e região/i }));

    expect(screen.getByLabelText("Público")).toHaveValue(
      "Microempreendedores individuais que buscam entender opções de plano de saúde com CNPJ."
    );
    expect(screen.getByLabelText("Oferta")).toHaveValue(
      "Orientação sobre possibilidades de contratação para MEI, respeitando critérios das operadoras."
    );
    expect(screen.getByText("São Paulo")).toBeInTheDocument();
    expect(screen.getByText("ABC Paulista")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Observações e tom da mensagem/i }));
    expect(screen.getByRole("button", { name: "Humano e claro" })).toHaveClass("border-cobalt/70");
  });

  it("valida briefing quando o usuário escolhe solicitar criativo", () => {
    renderGenerator();

    fireEvent.click(screen.getByRole("button", { name: /Criativo/i }));
    fireEvent.click(screen.getByRole("button", { name: "Solicitar criativo" }));
    fireEvent.submit(document.getElementById("campaign-generator-form") as HTMLFormElement);

    expect(screen.getByText("Preencha o briefing ao solicitar criativo.")).toBeInTheDocument();
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
