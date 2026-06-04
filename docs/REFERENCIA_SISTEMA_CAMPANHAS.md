# Referência do Sistema de Campanhas e Publicação

Este documento mapeia o fluxo atual de criação, publicação e integração de campanhas com a Meta Ads no Leadi, identificando os pontos de inserção para o futuro fluxo de aprovação de anúncios pelo Gestor.

## 1. Visão Geral do Fluxo de Campanhas

O ciclo de vida de uma campanha passa por três fases principais: **Geração**, **Preparação/Persistência** e **Publicação**.

### 1.1 Fase de Geração
**Componente principal:** `app/dashboard/campanhas/campaign-generator.tsx`
**Endpoint:** `POST /api/campaigns/generate`

- O usuário preenche o formulário guiado em `campaign-generator.tsx` (Público, Oferta, Tom, Conexões Meta, Criativo, Modo de Publicação).
- O formulário envia o payload para `POST /api/campaigns/generate`.
- A API valida o payload e as regras de negócio locais.
- A API invoca a OpenAI (`generateCampaignText`) descontando créditos de IA do workspace (`runAiActionWithCredits`).
- A campanha gerada é formatada e inserida na base de dados (através de `saveCampaignForCurrentUser` no `repository.server.ts`).
- Se houver pedido de criativo associado, a API também cria um pedido em `creative_requests` (`maybeCreateCreativeRequest`).

### 1.2 Fase de Preparação e Persistência
**Repositório:** `src/lib/campaigns/repository.server.ts`

- A função `saveCampaignForCurrentUser` consolida os dados de formulário e a resposta da IA.
- Grava um novo registro na tabela `campaigns` com o status de publicação dependendo do modo escolhido pelo usuário (`draft_created`, `pending_review`, `paused` ou `ready_to_prepare`).
- As campanhas são listadas no painel através de `getCampaignActivitySummaryForCurrentUser` e `getCampaignsForCurrentUser`.

### 1.3 Fase de Publicação (Meta Ads)
**Endpoint:** `POST /api/campaigns/publish`
**Serviço:** `src/lib/meta/campaign-publication.server.ts`

- O usuário aciona a publicação a partir da interface.
- A requisição chega em `POST /api/campaigns/publish`. Apenas usuários do tipo `owner` ou `admin` com permissões podem executar esta rota.
- O endpoint chama `publishPausedMetaCampaign`.
- Este serviço:
  1. Cria uma tentativa (`meta_campaign_publication_attempts`) como `pending`.
  2. Valida o access token da Meta e permissões de Ads Management (`ensureMetaMarketingPermission`).
  3. Dispara a requisição à Meta Graph API para criar a campanha como `PAUSED` (`createPausedMetaCampaign`).
  4. Atualiza a campanha na base com `meta_campaign_id` e muda o `publication_status` para `paused`.
  5. Atualiza a tentativa de publicação (`status: 'success'`).
  6. Em caso de falha, marca o erro (`status: 'failed'`).

---

## 2. Pontos de Inserção para Aprovação (Módulo Equipe)

O módulo de Equipes exige que Supervisores criem rascunhos de anúncios, mas **não possam publicá-los diretamente** sem a aprovação do Gestor (`owner`). 

Para implementar isso, os seguintes ajustes precisarão ser feitos na arquitetura mapeada acima:

### 2.1 Banco de Dados e Schemas
- Criar a tabela `ad_approval_requests` vinculada à campanha, ao autor (Supervisor) e ao gestor (Owner).
- Adicionar um estado de `approval_status` (ou adaptar o `publication_status` com `needs_approval`) na tabela de `campaigns`.

### 2.2 Alterações na Geração (`/api/campaigns/generate`)
- Ao gerar uma campanha, o backend deve verificar a role do usuário.
- Se for Gestor (`owner`), salva com `approval_status = not_required` (pode publicar).
- Se for Supervisor (`admin`), salva com `approval_status = pending_approval` e cria (ou exige a criação) de um registro em `ad_approval_requests`. O `publishMode` não pode ser acionado imediatamente na Meta.

### 2.3 Alterações na Publicação (`/api/campaigns/publish`)
- **Bloqueio Crítico:** O endpoint de publicação deve validar se a campanha tem `approval_status = approved` ou `not_required` antes de chamar `publishPausedMetaCampaign`.
- O Supervisor será bloqueado com um erro 403 se tentar chamar esta rota para uma campanha pendente ou se tentar disparar a publicação diretamente para a Meta sem o crivo do Gestor.

### 2.4 Fluxo do Gestor (Nova Rota/UI)
- O Gestor deverá possuir uma interface (Dashboard de Equipe) para visualizar solicitações em `ad_approval_requests`.
- Ao aprovar, o sistema muda o status da campanha para `approved`. O próprio Gestor (ou o Supervisor posteriormente) poderá então chamar o endpoint de `publish`.

### 2.5 Resumo das Entidades que Sofrerão Alteração Futura:
- `app/api/campaigns/generate/route.ts` (para criar/bloquear status no momento da geração)
- `app/api/campaigns/publish/route.ts` (para bloquear publicações não autorizadas)
- `src/lib/campaigns/repository.server.ts` (para lidar com novos campos no Insert da tabela `campaigns`)
- `src/components/dashboard/campanhas/campaign-generator.tsx` (para mudar os CTAs para "Solicitar Aprovação" se o usuário for Supervisor).
