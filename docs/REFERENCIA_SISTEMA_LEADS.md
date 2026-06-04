# Referência do Sistema de Leads e Ownership

> Documentação técnica sobre como o Leadi trata ownership, filtros de permissão e visibilidade de leads, gerada durante a análise da Tarefa F0.5.

## 1. Visão Geral

O módulo de Leads no Leadi funciona com base no isolamento por `organization_id` para garantir o multi-tenant básico. Dentro de uma organização, a visibilidade e as permissões de interação com os leads dependem do **papel do usuário (role)** e do campo `owner_profile_id` na tabela `leads`.

### Arquivos Principais

- **Repositório**: `src/lib/leads/repository.server.ts`
- **Filtros**: `src/lib/leads/filters.ts`
- **API (Lista e Criação)**: `app/api/leads/route.ts`
- **API (Exportação)**: `app/api/leads/export/route.ts`
- **UI (Workspace)**: `app/dashboard/leads/leads-workspace.tsx`

---

## 2. Regras de Filtragem por Papel

A visibilidade dos leads é controlada em duas camadas: RLS (banco) e API/Repositório (servidor). No código analisado, os filtros do servidor aplicam as seguintes regras na função `buildLeadQuery` e `getLeadsCountForCurrentUser`:

### Consultor (`seller`)
- **Visibilidade**: Apenas os leads que lhe foram atribuídos.
- **Implementação**: O servidor adiciona `query.eq("owner_profile_id", profile.id)` quando a role é `seller` ou não é considerada `WorkspaceManagerRole`.
- **Exportação**: Teoricamente pode exportar apenas os seus próprios leads (a query base de exportação também chama `buildLeadQuery`), embora a interface no Plano Equipe não deva mostrar o botão de exportação para esse papel.

### Gestor / Supervisor (`owner` / `admin`)
- **Visibilidade**: Todos os leads da organização.
- **Implementação**: Como eles são `isWorkspaceManagerRole(profile.role)`, o filtro explícito de `owner_profile_id` não é aplicado por padrão, retornando todos os registros com o `organization_id` correspondente.

---

## 3. Ownership e Atribuição de Leads

O vínculo de um lead com seu responsável é feito por meio do campo `owner_profile_id`.

- **Criação / Importação**: O lead pode receber um `owner_profile_id` na criação. Leads criados pelo webhook (`createLeadFromWebhook`) ou por importação sem destino explícito podem ficar "sem responsável" (null) ou com o dono da conta que importou.
- **Distribuição em Lote (`assignLeadOwnersInBulkForCurrentUser`)**: 
  - Apenas papéis de gestão (`owner` ou `admin`) têm permissão para redistribuir leads.
  - O sistema exige que o usuário alvo para receber o lead seja, necessariamente, do papel `seller` (verificado via `resolveBulkLeadOwnerProfile`).

---

## 4. Ajustes Necessários para o Filtro por Equipe (Plano Equipe)

O módulo Equipe introduzirá o conceito de `teams` e `team_members`. Para que o Supervisor veja apenas os leads de sua equipe e não os de toda a corretora, os seguintes ajustes precisarão ser feitos nos fluxos documentados:

### A. Tabela `leads`
- Adicionar a coluna `team_id` (nullable).

### B. Funções `buildLeadQuery` e `getLeadsCountForCurrentUser`
- Atualmente: `admin` vê todos os leads da organização.
- **Novo Fluxo Necessário**:
  - Se role for `owner`: continua vendo tudo da organização.
  - Se role for `admin` (Supervisor):
    - Obter os times dos quais esse admin é supervisor.
    - Aplicar `query.in("team_id", teamsDoAdmin)` ao invés de buscar toda a organização de forma irrestrita.
  - Se role for `seller`: continua com `query.eq("owner_profile_id", profile.id)`.

### C. Fluxo de Criação e Atribuição
- Toda vez que um lead for atribuído a um consultor em `assignLeadOwnersInBulkForCurrentUser`, o `team_id` do lead também deve ser atualizado para refletir a equipe daquele consultor (ou, alternativamente, o supervisor define o time caso seja uma estrutura de times matriciais).
- `lead_assignments` (futura tabela de histórico) deverá registrar essa movimentação incluindo o `team_id`.

### D. Exportação
- `getLeadExportRowsForCurrentUser` vai herdar a nova regra de `buildLeadQuery`, garantindo que o supervisor exporte apenas dados da sua própria equipe. Se for proibido que o supervisor exporte leads, deve-se adicionar um bloqueio explícito em `/api/leads/export/route.ts` para recusar acesso a `role === "admin"`.
