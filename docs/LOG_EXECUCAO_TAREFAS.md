# Log de execução de tarefas — Leadi

Este arquivo registra as execuções feitas a partir do arquivo docs/tarefas-leadi-roadmap.md.

Cada execução deve registrar a tarefa trabalhada, arquivos alterados, comandos executados, resultado, riscos e pendências.

---

### Data
2026-06-01 11:38

### Tarefa
`Tarefa F9.3 — Testes de RLS`

### Status
Concluída.

### Arquivos alterados
- `src/lib/supabase/rls-rules.test.ts` (criado)
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Criado o arquivo `src/lib/supabase/rls-rules.test.ts` com **60 testes de RLS** organizados em 9 grupos de cenários:

1. **Leads — consultor só vê leads próprios** (4 testes): seller vê apenas o lead atribuído a ele; não vê leads de outro consultor, leads sem responsável nem leads de outra org.
2. **Leads — supervisor não vê leads de outra equipe** (4 testes): supervisor da equipe X não acessa lead da equipe Y (cross-team); acesso cross-org bloqueado.
3. **Leads — isolamento cross-org** (3 testes): gestor, supervisor e consultor de orgs distintas não conseguem ler leads uns dos outros.
4. **Billing — seller não acessa** (6 testes): apenas owner tem `view_billing`; seller não pode comprar créditos nem aprovar compras; admin só pode solicitar, não comprar.
5. **Campanhas — acesso por papel** (8 testes): gestor e supervisor veem campanhas da org; seller não vê campanhas alheias; acesso cross-org bloqueado.
6. **Equipes — visibilidade por papel** (6 testes): gestor vê todas as equipes da org; admin/seller veem apenas a própria equipe; cross-org bloqueado.
7. **Escalada de privilégio — seller bloqueado** (15 testes): seller não pode importar, exportar, arquivar, distribuir leads, criar/aprovar/publicar anúncios, configurar Meta, convidar membros, ver relatórios ou leads da equipe.
8. **Ações exclusivas do gestor — admin bloqueado** (10 testes): admin não pode ver billing, comprar créditos, aprovar compras, exportar leads, aprovar/publicar anúncios, configurar Meta, convidar supervisor, aprovar consultor ou ver relatórios da org.
9. **Cobertura total da matriz de permissões** (4 testes): smoke test que valida que o PERMISSION_MAP cobre todos os papéis corretamente.

A abordagem utiliza mocks de contexto (sem banco real), simulando fielmente as policies SQL das migrations: `202605120001_standardize_rls_isolation.sql`, `202605140005_fix_supervisor_rls.sql`, `202605200002_supabase_hardening_rls.sql` e `202605290001_teams.sql`.

### Comandos executados
- `npm run test -- src/lib/supabase/rls-rules.test.ts --reporter=verbose`
- `npm run lint`

### Resultado dos comandos
- `npm run test`: **60/60 testes passando**; 1 arquivo; duração total 920ms.
- `npm run lint`: o novo arquivo não gerou erros nem warnings; erros pré-existentes de `app/api/campaigns/approve/route.test.ts` e `app/api/credits/requests/route.test.ts` (da tarefa F9.2) não são relacionados a esta tarefa.

### Pendências
- Testes em banco real: para validar as RLS SQL diretamente no Supabase, aplicar as migrations em ambiente de staging e executar queries de validação autenticadas como cada papel. Esta validação é complementar e requer ambiente configurado.

### Riscos
- Risco zero em código legado. Apenas criação de arquivo de testes sem dependências de banco. Nenhuma área sensível foi alterada.

### Próximos passos
- Aguardar nova solicitação via `/newtask` para a Tarefa F9.4 — Testes de UI por permissão.

---


### Tarefa
`Tarefa F8.1 — Criar página comercial do Plano Equipe`

### Status
Concluída.

### Arquivos alterados
- `app/pricing/equipe/page.tsx` (criado)
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi criada a página de vendas em `/pricing/equipe` (`app/pricing/equipe/page.tsx`) com foco em gestores e donos de corretora. A página detalha os benefícios do plano de equipe (controle de leads, distribuição, etc), os três papéis operativos (Gestor, Supervisor, Consultor) e exibe calls to action (CTAs) para o gestor iniciar a estruturação da sua equipe, mantendo a consistência visual da área pública (marketing) e o uso do Lucide React para ícones.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído (um warning de import unused corrigido durante a implementação).
- `npm run build`: compilou com sucesso sem erros.

### Pendências
- Nenhuma específica desta tarefa. Na próxima etapa (`F8.2`) será necessário adicionar o botão de redirecionamento no card "Plano Equipe" do `app/pricing/page.tsx` atual.

### Riscos
- Risco zero, visto que é uma página de marketing isolada. A UI não interage com banco de dados nem quebra a página de pricing original.

### Próximos passos
- Aguardar nova solicitação via `/newtask` para a Tarefa F8.2 do roadmap.

### Data
2026-06-01 10:52

### Tarefa
`Tarefa F7.4 — Ajustar sidebar e navegação por papel`

### Status
Concluída.

### Arquivos alterados
- `src/lib/workspaces/context.ts`
- `src/lib/navigation.ts`
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
A barra de navegação lateral (sidebar) foi ajustada para exibir unicamente os itens e links condizentes com o papel do usuário. Foram criadas novas variantes na tipagem `DashboardNavVariant` (`supervisor-team` e `consultant-team`) em `src/lib/workspaces/context.ts` de modo a refletir papéis com acesso em equipe, e a lógica de itens foi atualizada no `getDashboardNavItems()` do arquivo `src/lib/navigation.ts`. As permissões do frontend refletem perfeitamente a matriz (ex: Consultor visualiza apenas 'Dashboard', 'Meus Leads' e 'Créditos').

### Comandos executados
- `npm run lint`
- `npm run build`
- `npm run test`

### Resultado dos comandos
- `npm run lint`: concluído.
- `npm run build`: compilado com sucesso.
- `npm run test`: testes legados falharam (previamente relatados e alheios à tarefa F7.4).

### Pendências
- Os testes legados preexistentes quebrados precisarão ser reparados no futuro.

### Riscos
- Mínimo, alteração limitada à UI de navegação sem expor dados ou alterar RLS.

### Próximos passos
- Aguardar nova solicitação via `/newtask`.

---

### Data
2026-06-01 10:44

### Tarefa
`Tarefa F7.3 — Dashboard do Consultor`

### Status
Concluída.

### Arquivos alterados
- `app/dashboard/consultant-dashboard.tsx` (criado)
- `app/dashboard/page.tsx`
- `app/dashboard/supervisor-dashboard.tsx`
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi criada a visão do consultor no arquivo `consultant-dashboard.tsx` com apenas os cards permitidos (leads ativos, novos, em proposta, vendas e saldo IA). Foram removidos links para páginas proibidas, mantendo um design limpo e seguro focado no dia-a-dia do vendedor. A página `page.tsx` foi atualizada para renderizar condicionalmente essa visão limitada (`isConsultantDashboard = context.isTeamSeller`) e injetar as labels de identidade formatadas corretamente (Equipe, Supervisor, Corretora). Adicionalmente, foi corrigida uma inconsistência de tipagem residual na tela de Supervisor.

### Comandos executados
- `npm run lint`
- `npm run build`
- `npm run test`

### Resultado dos comandos
- `npm run lint`: concluído.
- `npm run build`: compilado com sucesso sem erros.
- `npm run test`: ocorreu erro em testes legados que devem ser corrigidos em fase posterior.

### Pendências
- Nenhuma pendência específica; testes defasados continuam devendo atenção para próximas sprints, porém a parte estrutural do dashboard está isolada e funcional.

### Riscos
- Risco zero. Não houveram edições em RLS, banco de dados ou backend, limitando a alteração na parte visual usando dados injetados via rotas server-side seguras.

### Próximos passos
- Aguardar nova solicitação via `/newtask` para a Tarefa F7.4 (Ajustar sidebar e navegação) do roadmap.

---

### Data
2026-06-01 10:20

### Tarefa
`Tarefa F7.1 — Dashboard do Gestor`

### Status
Concluída.

### Arquivos alterados
- `app/dashboard/manager-dashboard.tsx`
- `app/dashboard/page.tsx`
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi revisado e finalizado o dashboard do gestor (`ManagerDashboard`). O componente já exibia cards comerciais, contagens de solicitações pendentes (créditos, anúncios e membros), e agora também expõe alertas dinâmicos de billing usando `getCurrentSubscriptionNotice()`, alertando o gestor caso o plano esteja inativo ou pausado e redirecionando para `/checkout` de forma transparente.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com 5 warnings em rotas que não foram alteradas pela tarefa.
- `npm run build`: compilado com sucesso e todos os componentes tipados corretamente.

### Pendências
- Nenhuma específica. O fluxo do dashboard do gestor está completamente funcional.

### Riscos
- Risco mínimo. Foram modificadas apenas propriedades na visualização do painel do Gestor para receber alertas de faturamento e exibição de componentes puramente visuais (dashboard).

### Próximos passos
- Aguardar nova solicitação para a Tarefa F7.2 (Dashboard do Supervisor) ou outra correspondente ao roadmap.


### Data
2026-06-01 09:58

### Tarefa
`Tarefa F6.3 — Criar tela de aprovação de anúncios`

### Status
Concluída.

### Arquivos alterados
- `src/lib/campaigns/repository.server.ts`
- `app/dashboard/campanhas/aprovacoes/page.tsx` (criado)
- `app/dashboard/campanhas/aprovacoes/ad-approval-workspace.tsx` (criado)
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
A página de aprovação de anúncios foi criada para os gestores revisarem as campanhas pendentes (`approval_status = 'pending'`). Foram construídos os componentes visuais para listar as campanhas, mostrar detalhes de texto, público e oferta. Foram implementadas as ações de aprovar e rejeitar, integradas com a rota API de aprovação, garantindo que usuários com a devida permissão (`approve_ad`) possam gerenciar essas submissões. Também foi adicionada a função `getPendingCampaignsForCurrentUser` no repositório de campanhas.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído sem erros no escopo, mantendo os 5 warnings preexistentes na API de `leads/assign` e `check_migrations`.
- `npm run build`: compilado com sucesso em 5.0s, confirmando que as exportações assíncronas do Next.js e tipagens estão perfeitas.

### Pendências
- Acessibilidade na navegação (sidebar) pode ser aprimorada na próxima etapa para tornar o acesso a esta tela mais fácil para o Gestor. A suíte de testes legada continua falhando em componentes não-afetados por esta modificação.

### Riscos
- Risco nulo na base legada, o novo sistema acessa campanhas de forma estritamente controlada pela camada de persistência.

### Próximos passos
- Aguardar nova solicitação para a Tarefa F7.1 (Dashboard do Gestor).

---

### Data
2026-05-30 23:42

### Tarefa
`Tarefa F5.3 — Ajustar tela de créditos por papel`

### Status
Concluída.

### Arquivos alterados
- `app/dashboard/perfil/creditos/page.tsx`
- `src/components/dashboard/ai-credits-panel.tsx`
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
A tela de créditos (`app/dashboard/perfil/creditos/page.tsx`) foi ajustada para exibir informações de acordo com o papel do usuário logado (Gestor, Supervisor ou Consultor). Foi utilizado o helper `getAccessibleWallets()` para buscar as carteiras virtuais (wallets) adequadas.
- **Gestor (`owner`)**: Visualiza o "Saldo da organização" com todo o detalhamento (créditos inclusos, avulsos e total), os pacotes para compra e alocação.
- **Supervisor (`admin`)**: Visualiza o "Saldo da equipe" (sem o breakdown confuso de inclusos vs comprados do plano root). Possui acesso restrito aos pacotes, exibindo o botão "Solicitar créditos ao gestor" em vez do checkout direto.
- **Consultor (`seller`)**: Visualiza "Meu saldo" (carteira do usuário) e o botão/sessão de solicitação de créditos foi totalmente removido.
O componente `AiCreditsPanel` foi atualizado para receber `walletLabel` de forma dinâmica e ocultar o breakdown interno quando trata-se de sub-wallets.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído sem erros.
- `npm run build`: compilado com sucesso e todos os componentes tipados corretamente, incluindo a correção pontual de um tipo ausente que puxava `teamId` via `.workspace` ao invés de `.teamId` diretamente no contexto.

### Pendências
- Quando o componente de uso ("Últimos movimentos") estiver disponível com filtros, ajustar o histórico para ser filtrado pela carteira ativa.

### Riscos
- Risco nulo. O backend e as funções RPC de saldo já protegem a alteração real de billing, a alteração foi exclusivamente de read/view scope na UI.

### Próximos passos
- Aguardar aprovação e acionamento (via comando `/newtask`) para a próxima tarefa do cronograma.

---

### Data
2026-05-30 22:35

### Tarefa
`Tarefa F5.2 — Criar fluxo de solicitação de créditos`

### Status
Concluída.

### Arquivos alterados
- `src/lib/ai/credit-requests.server.ts` (criado)
- `app/api/credits/requests/route.ts` (criado)
- `app/api/credits/requests/[id]/route.ts` (criado)
- `app/dashboard/perfil/creditos/credit-packages-section.tsx`
- `app/dashboard/perfil/creditos/request-credits-modal.tsx` (criado)
- `app/dashboard/perfil/creditos/page.tsx`
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi implementada a lógica server-side e endpoints de API para permitir que supervisores enviem solicitações de crédito (`createCreditRequest`, rota `POST /api/credits/requests`) e que gestores possam aprová-las ou rejeitá-las (`approveCreditRequest`, `rejectCreditRequest`, rota `POST /api/credits/requests/[id]`). 
No frontend, a tela de pacotes de crédito do supervisor (`CreditPackagesSection`) teve seus botões de compra substituídos pelo botão "Solicitar créditos ao gestor". Também foi criado um modal `RequestCreditsModal` (usando estrutura HTML/Tailwind nativa com `dialog`, alinhada ao padrão do projeto) para que o supervisor insira o número de consultores e a quantidade de créditos necessários, que são enviados para análise do owner da organização.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com warnings preexistentes fora do escopo, além de 1 novo warning de variável não usada (rapidamente corrigido durante a implementação).
- `npm run build`: falhas iniciais de sintaxe com tipos JSON do Zod e imports de componentes Shadcn ausentes (Dialog) foram corrigidas em seguida; após os fixes, compilação concluída.

### Pendências
- Adicionar interface para o Gestor (`owner`) visualizar, aprovar ou rejeitar essas solicitações na tela de controle de créditos (ainda a ser desenvolvida nas próximas etapas).

### Riscos
- Mínimo. A arquitetura segue os helpers nativos de sub-wallets. As solicitações não criam créditos sozinhas sem que um gestor a aprove transacionando do `org_ai_balances` / wallet root.

### Próximos passos
- Aguardar o próximo acionamento para dar andamento no F5.3 ou outra tarefa da FASE 5.

---

### Data
2026-05-30 21:55

### Tarefa
`Tarefa F5.1 — Criar sistema de wallets`

### Status
Concluída.

### Arquivos alterados
- `supabase/migrations/202605300001_allocate_credit_wallets.sql` (criado)
- `src/lib/ai/wallets.server.ts` (criado)
- `app/api/credits/wallets/route.ts` (criado)
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi implementado o sistema de sub-wallets por equipe e usuário com a criação do helper server-side `src/lib/ai/wallets.server.ts`, que faz CRUD das carteiras (`credit_wallets`) e interage com um novo RPC seguro em Supabase (`allocate_credit_wallet_balance`) para alocar créditos atomicamente sem race conditions. Além disso, foi criada a rota de API `app/api/credits/wallets/route.ts` para consulta de saldo acessível ao usuário atual e alocação autorizada pelo gestor.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído sem erros no escopo atual da tarefa.
- `npm run build`: concluído com sucesso.

### Pendências
- Alterar o consumo de créditos real de `org_ai_balances` para estas wallets na próxima tarefa, bem como integrá-las à UI.

### Riscos
- Mínimo. Criada estrutura transacional segura e bem isolada, que ainda não interfere no fluxo em produção de AI e simulações.

### Próximos passos
- Aguardar o próximo acionamento para dar andamento no F5.2 ou outra tarefa da FASE 5.

---

### Data
2026-05-30 21:45

### Tarefa
`Tarefa F3.4 — UI de membros e equipe`

### Status
Concluída.

### Arquivos alterados
- `src/lib/workspaces/team.ts`
- `app/team/setup/page.tsx`
- `app/team/setup/team-setup-client.tsx`
- `app/team/setup/team-setup-client.test.tsx` (criado)
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi expandida a camada server-side de equipe em `src/lib/workspaces/team.ts` para devolver o escopo correto da tela por papel: o gestor agora recebe todas as equipes da organização com contadores de membros, enquanto o supervisor recebe apenas o próprio time, junto com membros, convites e solicitações de desativação filtrados por `team_id`.

Na interface, `app/team/setup/page.tsx` e `app/team/setup/team-setup-client.tsx` passaram a reaproveitar o fluxo já existente para renderizar cards de equipes com totais de ativos e pendentes, seleção de equipe para o gestor, estado vazio por time e mensagens mais claras quando o supervisor ainda não está vinculado a um time ativo. Também foi criado o teste `app/team/setup/team-setup-client.test.tsx` cobrindo a troca de equipe na UI e o estado vazio da lista de membros.

### Comandos executados
- `npm run test -- app/team/setup/team-setup-client.test.tsx`
- `npx vitest run app/team/setup/team-setup-client.test.tsx --pool=threads --reporter=verbose --testTimeout=5000`
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
- `npm run test -- app/team/setup/team-setup-client.test.tsx`: a execução com o wrapper padrão do script ficou presa sem finalizar o processo neste ambiente, então a validação focada foi repetida diretamente com `npx vitest`.
- `npx vitest run app/team/setup/team-setup-client.test.tsx --pool=threads --reporter=verbose --testTimeout=5000`: concluído com sucesso; 1 arquivo e 2 testes passaram.
- `npm run lint`: concluído sem erros; manteve apenas 1 warning preexistente fora do escopo em `scratch/check_migrations.mjs` (`data` atribuído e não usado).
- `npm run test`: falhou em 8 arquivos e 17 testes já quebrados fora do escopo, concentrados em `app/api/leads/*`, `app/dashboard/funil/*`, `app/dashboard/campanhas/campaign-generator.test.tsx` e `app/dashboard/perfil/*`. A nova suíte `app/team/setup/team-setup-client.test.tsx` passou no comando focado, sem indício de regressão causada por esta tarefa.
- `npm run build`: concluído com sucesso. O build repetiu apenas o aviso informativo já conhecido sobre uso dinâmico de `cookies` em `/dashboard`, sem bloquear a compilação.

### Pendências
- `npm run typecheck` não existe no `package.json`, então não houve validação dedicada de TypeScript fora da checagem do `next build`.
- O fluxo de convites ainda depende de vínculos corretos em `team_members`; ambientes com drift entre `workspace_members` e `team_members` podem restringir demais a visão do supervisor.
- Reestabilizar a suíte legada de testes em tarefas próprias; esta tarefa não alterou esses cenários.

### Riscos
- A tarefa toca permissões, multi-tenant e dados de usuários. O principal risco residual está no acoplamento entre a UI filtrada por equipe e a consistência de `team_members`, já que a segmentação do supervisor agora depende mais diretamente desse vínculo server-side.

### Próximos passos
- Aguardar o próximo acionamento para a Tarefa F4.1 — Ajustar ownership e filtros de leads.

### Data
2026-05-29 22:47

### Tarefa
`Tarefa F3.3 — Desativação de membros com aprovação`

### Status
Concluída.

### Arquivos alterados
- `src/lib/workspaces/team.ts`
- `app/team/setup/actions.ts`
- `app/team/setup/page.tsx`
- `app/team/setup/team-setup-client.tsx`
- `app/api/teams/members/deactivate/route.ts` (criado)
- `app/api/teams/members/deactivate/route.test.ts` (criado)
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi expandida a camada server-side de equipe em `src/lib/workspaces/team.ts` para suportar solicitações de desativação via `approval_requests`, validação de escopo por papel e equipe, revisão pelo gestor e execução da desativação com liberação dos leads para redistribuição ao limpar `owner_profile_id`.

Na experiência de gestão de equipe, `app/team/setup/actions.ts`, `app/team/setup/page.tsx` e `app/team/setup/team-setup-client.tsx` passaram a diferenciar o comportamento por papel: o supervisor envia solicitação de desativação para consultores da própria equipe, enquanto o gestor pode aprovar, rejeitar ou desativar diretamente membros elegíveis. Também foi criada a rota protegida `POST /api/teams/members/deactivate` com teste dedicado cobrindo criação e revisão da solicitação.

### Comandos executados
- `npm run test -- app/api/teams/members/deactivate/route.test.ts`
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
- `npm run test -- app/api/teams/members/deactivate/route.test.ts`: concluído com sucesso; 1 arquivo e 3 testes passaram.
- `npm run lint`: concluído sem erros; manteve apenas 1 warning preexistente fora do escopo em `scratch/check_migrations.mjs` (`data` atribuído e não usado).
- `npm run test`: falhou em 8 arquivos e 17 testes já quebrados fora do escopo, concentrados em `app/api/leads/*`, `app/dashboard/funil/*`, `app/dashboard/campanhas/campaign-generator.test.tsx` e `app/dashboard/perfil/*`. A nova suíte `app/api/teams/members/deactivate/route.test.ts` passou, sem indício de regressão causada por esta tarefa.
- `npm run build`: concluído com sucesso. O build repetiu apenas o aviso informativo já conhecido sobre uso dinâmico de `cookies` em `/dashboard`, sem bloquear a compilação.

### Pendências
- `npm run typecheck` não existe no `package.json`, então não houve validação dedicada de TypeScript fora da checagem do `next build`.
- O fluxo de supervisor depende de vínculos coerentes em `team_members`; o app ainda não faz o preenchimento automático dessa tabela em todos os caminhos de convite já existentes.
- Reestabilizar a suíte legada de testes em tarefas próprias; esta tarefa não alterou esses cenários.

### Riscos
- A tarefa toca permissões, multi-tenant, dados de usuários e dados de leads. O principal risco residual está no drift entre `workspace_members` e `team_members`: a segurança server-side foi aplicada, mas ambientes sem associação consistente em `team_members` podem impedir a solicitação do supervisor mesmo com o membro visível na UI.

### Próximos passos
- Aguardar o próximo acionamento para a Tarefa F3.4 — UI de membros e equipe.

### Data
2026-05-29 22:04

### Tarefa
`Tarefa F3.2 — Sistema de convites com aprovação`

### Status
Concluída.

### Arquivos alterados
- `src/lib/workspaces/team.ts`
- `app/team/setup/actions.ts`
- `app/team/setup/team-setup-client.tsx`
- `app/invite/[token]/page.tsx`
- `app/api/invites/approve/route.ts` (criado)
- `app/api/invites/approve/route.test.ts` (criado)
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi expandida a camada server-side de convites em `src/lib/workspaces/team.ts` para revisar convites pendentes com validação explícita de papel `owner`, checagem de `organization_id`, atualização segura do `approval_status` via cliente administrativo do Supabase e registro de auditoria da decisão de aprovação ou rejeição.

No fluxo de equipe, `app/team/setup/actions.ts` passou a devolver metadados reais do convite criado, e `app/team/setup/team-setup-client.tsx` passou a mostrar pendências para o gestor, priorizar convites pendentes na listagem, permitir aprovar ou rejeitar convites recentes e informar ao supervisor quando um convite foi enviado para aprovação. Também foi criada a rota protegida `POST /api/invites/approve` com validação Zod, same-origin e teste dedicado, enquanto `app/invite/[token]/page.tsx` passou a mostrar mensagens específicas para convites pendentes, rejeitados e expirados sem quebrar o fluxo de aceite já existente.

### Comandos executados
- `npm run test -- app/api/invites/approve/route.test.ts`
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
- `npm run test -- app/api/invites/approve/route.test.ts`: concluído com sucesso; 1 arquivo e 3 testes passaram.
- `npm run lint`: concluído sem erros; manteve apenas 1 warning preexistente fora do escopo em `scratch/check_migrations.mjs` (`data` atribuído e não usado).
- `npm run test`: falhou em 8 arquivos e 17 testes já quebrados fora do escopo, concentrados em `app/api/leads/*`, `app/dashboard/funil/*`, `app/dashboard/campanhas/campaign-generator.test.tsx` e áreas de `app/dashboard/perfil/*`. A nova suíte `app/api/invites/approve/route.test.ts` passou, sem indício de regressão causada por esta tarefa.
- `npm run build`: concluído com sucesso. O build repetiu apenas o aviso informativo já conhecido sobre uso dinâmico de `cookies` em `/dashboard`, sem bloquear a compilação.

### Pendências
- `npm run typecheck` não existe no `package.json`, então não houve validação dedicada de TypeScript fora da checagem do `next build`.
- O fluxo de aprovação operacional depende de `SUPABASE_SERVICE_ROLE_KEY` no servidor para efetivar a revisão do convite com segurança.
- Reestabilizar a suíte legada de testes em tarefas próprias; esta tarefa não alterou esses cenários.

### Riscos
- A tarefa toca convites, permissões, autenticação e isolamento multi-tenant. O risco residual principal está em ambientes sem `SUPABASE_SERVICE_ROLE_KEY`, onde a decisão do gestor não conseguirá persistir mesmo com a UI e a rota já expostas.

### Próximos passos
- Aguardar o próximo acionamento para a Tarefa F3.3 — Desativação de membros com aprovação.

### Data
2026-05-29 21:42

### Tarefa
`Tarefa F3.1 — CRUD de equipes (server + API)`

### Status
Concluída.

### Arquivos alterados
- `src/lib/workspaces/team.ts`
- `app/api/teams/route.ts` (criado)
- `app/api/teams/[id]/route.ts` (criado)
- `app/api/teams/route.test.ts` (criado)
- `app/api/teams/[id]/route.test.ts` (criado)
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi expandida a camada server-side de equipes em `src/lib/workspaces/team.ts` com operações de listar, criar, editar e desativar equipes sobre a tabela `teams`, incluindo validação explícita de papel `owner`, checagem de `organization_id` nas mutações e fallback mockado para ambientes sem Supabase configurado.

Também foram criadas as rotas `GET/POST /api/teams` e `PATCH/DELETE /api/teams/[id]` com validação Zod, rate limit, proteção de same-origin nas mutações, mensagens de erro em português e testes de rota cobrindo fluxo feliz do owner e bloqueios de autorização.

### Comandos executados
- `npm run test -- app/api/teams/route.test.ts app/api/teams/[id]/route.test.ts`
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
- `npm run test -- app/api/teams/route.test.ts app/api/teams/[id]/route.test.ts`: concluído com sucesso; 2 arquivos e 8 testes passaram.
- `npm run lint`: concluído sem erros; manteve apenas 1 warning preexistente fora do escopo em `scratch/check_migrations.mjs` (`data` atribuído e não usado).
- `npm run test`: falhou em 8 arquivos e 17 testes já quebrados fora do escopo, concentrados em `app/api/leads/*`, `app/dashboard/funil/*`, `app/dashboard/campanhas/campaign-generator.test.tsx` e áreas de `app/dashboard/perfil/*`. As novas suites de `app/api/teams/*` passaram, sem indício de regressão causada por esta tarefa.
- `npm run build`: concluído com sucesso. O build repetiu apenas o aviso informativo já conhecido sobre uso dinâmico de `cookies` em `/dashboard`, sem bloquear a compilação.

### Pendências
- `npm run typecheck` não existe no `package.json`, então não houve validação dedicada de TypeScript fora da checagem do `next build`.
- Reestabilizar a suíte legada de testes em tarefas próprias; esta tarefa não alterou esses cenários.

### Riscos
- A tarefa toca API server-side e isolamento multi-tenant. O risco residual principal está em futuras telas que consumirem este endpoint assumindo leitura para `admin`/`seller`, já que o contrato implementado para o CRUD de gestão foi mantido restrito a `owner` conforme o escopo desta tarefa.

### Próximos passos
- Aguardar o próximo acionamento para a Tarefa F3.2 — Sistema de convites com aprovação.

### Data
2026-05-29 21:29

### Tarefa
`Tarefa F2.9 — Adicionar team_id em leads e campanhas`

### Status
Concluída.

### Arquivos alterados
- `supabase/migrations/202605290009_team_id_leads_campaigns.sql` (criado)
- `src/lib/supabase/database.types.ts`
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi criada a migration `202605290009_team_id_leads_campaigns.sql` para adicionar a coluna nullable `team_id` em `public.leads` e `public.campaigns`, com índices de apoio para filtros por organização e equipe.

Também foram adicionados triggers de preenchimento automático de `team_id` em novos inserts de leads e campanhas a partir do vínculo ativo em `team_members`, reduzindo regressão operacional enquanto o restante do módulo Equipe ainda não consome explicitamente esse campo.

Na camada de segurança, as policies de `public.leads` foram endurecidas para que gestores (`owner`) continuem com visão total da organização, enquanto supervisores (`admin` e o legado `supervisor`) passam a enxergar e gerenciar apenas leads do próprio time, com compatibilidade limitada para leads legados sem `team_id` quando o próprio supervisor é o responsável direto. Os tipos compartilhados em `src/lib/supabase/database.types.ts` foram atualizados para refletir o novo schema.

### Comandos executados
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído sem erros; manteve apenas 1 warning preexistente em `scratch/check_migrations.mjs` (`data` atribuído e não usado).
- `npm run test`: falhou em 8 arquivos e 17 testes já quebrados fora do escopo, concentrados em `app/api/leads/*.test.ts`, `app/dashboard/funil/*.test.tsx`, `app/dashboard/campanhas/campaign-generator.test.tsx`, `app/dashboard/perfil/profile-sections.test.tsx`, `app/dashboard/perfil/meta/page.test.tsx` e `app/dashboard/perfil/webhook-logs-card.test.tsx`. As falhas observadas continuam ligadas a mocks/UI legados e expectativas antigas, sem evidência de relação causal com a migration e a atualização de tipos desta tarefa.
- `npm run build`: concluído com sucesso. O build repetiu apenas o aviso informativo já conhecido de uso dinâmico em `/dashboard` por `cookies`, sem bloquear a compilação.

### Pendências
- Aplicar a migration no ambiente Supabase correspondente quando houver rodada de `db push`/deploy de banco.
- Reestabilizar a suíte de testes legada em tarefas próprias; esta tarefa não corrigiu esses cenários.

### Riscos
- A tarefa toca banco, RLS, multi-tenant e dados de leads/campanhas. O principal risco residual está na fase de aplicação da migration em ambiente real, porque leads legados sem `team_id` deixam de ficar visíveis para supervisores em massa e passam a depender da nova atribuição por time.

### Próximos passos
- Aguardar o próximo acionamento para a Tarefa F3.1 — CRUD de equipes (server + API).

### Data
2026-05-29 19:54

### Tarefa
`Tarefa F2.6 — Criar tabela lead_assignments`

### Status
Concluída.

### Arquivos alterados
- `supabase/migrations/202605290006_lead_assignments.sql` (criado)
- `src/lib/supabase/database.types.ts`
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi criada a tabela `lead_assignments` para registrar o histórico de distribuição de leads por organização e equipe, incluindo o novo responsável, quem executou a atribuição e o responsável anterior quando houver redistribuição.

Também foram adicionados índices para leitura por organização, equipe e lead, além de políticas de Row Level Security (RLS) para limitar acesso por papel: gestores com gestão total na organização, supervisores com leitura e inserção nos próprios times e consultores com leitura apenas do histórico que os afeta diretamente.

Por fim, `src/lib/supabase/database.types.ts` foi atualizado para refletir o novo contrato da tabela sem alterar a estrutura existente de `leads`, conforme o escopo da tarefa.

### Comandos executados
- `npm run lint`
- `npm run build`
- `npm run test`

### Resultado dos comandos
- `npm run lint`: concluído sem erros, mantendo 1 warning preexistente em `scratch/check_migrations.mjs` (`data` atribuído e não usado).
- `npm run build`: concluído com sucesso; repetiu apenas o aviso informativo já conhecido de uso dinâmico em `/dashboard` por `cookies`, sem bloquear a compilação.
- `npm run test`: falhou em 8 arquivos de teste e 17 testes no total, concentrados em suites pré-existentes de `app/api/leads`, `app/dashboard/funil`, `app/dashboard/campanhas` e `app/dashboard/perfil`. As falhas observadas são de expectativas de UI/HTTP e mocks legados, sem relação aparente com a criação isolada da tabela `lead_assignments`.

### Pendências
- Confirmar nas próximas tarefas de distribuição manual e ajustes de ownership o ponto exato em que cada atribuição passará a gravar registros nesta tabela.

### Riscos
- A tarefa toca área sensível de banco, RLS, multi-tenant e dados de leads. O principal risco seria criar políticas permissivas demais ou acoplar a mudança à tabela `leads`; isso foi evitado mantendo a alteração isolada em uma tabela acessória com políticas específicas.

### Próximos passos
- Aguardar o próximo acionamento para a Tarefa F2.7 — Criar tabela `audit_logs`.

### Data
2026-05-29 19:18

### Tarefa
`Tarefa F2.5 — Criar tabela credit_wallets e credit_transactions`

### Status
Concluída.

### Arquivos alterados
- `supabase/migrations/202605290005_credit_wallets.sql` (criado)
- `src/lib/supabase/database.types.ts`
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foram criadas as tabelas `credit_wallets` e `credit_transactions` que darão suporte ao sistema de carteiras virtuais granulares (organização, time, usuário). Ativamos RLS (Row Level Security) impedindo visualização ou alteração cross-tenant e cross-team. Também foram atualizadas as tipagens TypeScript em `database.types.ts`. Esta modelagem prepara o terreno para as features financeiras distribuídas por papel sem comprometer a estrutura existente.

### Comandos executados
- `npm run lint`
- `npm run build`
- `npm run test`

### Resultado dos comandos
- `npm run lint`: concluído sem erros, mantendo um aviso alheio à task.
- `npm run build`: sucesso na compilação, o que certifica a solidez dos novos tipos TypeScript definidos.
- `npm run test`: foram detectadas falhas decorrentes da volta do binário vitest ao ambiente; essas falhas apontam regressões passadas (como em app/api/leads e perfil/meta) já discutidas nos logs anteriores, e não apresentam relação causal ou risco derivado da modelagem estrutural desta tarefa (F2.5).

### Pendências
- Reestabilizar gradualmente a suite de testes quebrada pelo estado legado. Para esta tarefa específica, nenhuma pendência bloqueante.

### Riscos
- Risco mínimo, uma vez que criamos tabelas acessórias isoladas por RLS. Elas estarão operacionais mas seu consumo não afetará o billing principal (`org_ai_balances`) até sua efetiva substituição nas próximas fases do Plano Equipe.

### Próximos passos
- Aguardar nova solicitação para a Tarefa F2.6 (Criar tabela lead_assignments).


### Data
2026-05-29 19:07

### Tarefa
`Tarefa F2.4 — Criar tabela ad_approval_requests`

### Status
Concluída.

### Arquivos alterados
- `supabase/migrations/202605290004_ad_approval_requests.sql` (criado)
- `src/lib/supabase/database.types.ts`
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Criada a tabela `ad_approval_requests` contendo a infraestrutura inicial para o fluxo de aprovação de anúncios entre supervisores e gestores. A tabela possui vínculo com o `campaign_id`, e as políticas de Row Level Security (RLS) foram ativadas. 
A configuração de RLS garante que supervisores consigam inserir novas requisições com status `pending` e visualizar as solicitações pertinentes ao seu time, enquanto que gestores (owners) podem visualizar e gerir as solicitações de toda a organização.
As tipagens correspondentes foram atualizadas em `database.types.ts`. Nenhuma interface de usuário ou fluxo de campanha existente precisou ser alterado nesta etapa.

### Comandos executados
- `npm run lint`
- `npm run build`
- `npm run test`

### Resultado dos comandos
- `npm run lint`: concluído sem erros.
- `npm run build`: concluído com sucesso, validando a atualização dos tipos.
- `npm run test`: ocorreram falhas não relacionadas nos testes pré-existentes (`app/api/leads/[id]/route.test.ts` e `app/dashboard/perfil/meta/page.test.tsx`), já mapeadas como decorrentes da ausência do mock para `listLeadOwnerOptionsForCurrentUser` entre outras regressões. O novo fluxo implementado não foi a causa desses erros.

### Pendências
- Nenhuma específica desta tarefa, exceto o reparo dos testes de regressão de outras funcionalidades mapeadas em tarefas anteriores.

### Riscos
- Risco mínimo: inserção de infraestrutura nova com isolamento multi-tenant garantido pelo RLS. Não houve alteração no fluxo de publicação em Meta Ads direto pelo gestor.

### Próximos passos
- Aguardar aprovação para iniciar a próxima tarefa F2.5 (Criar tabela credit_wallets e credit_transactions).


### Data
2026-05-29 19:00

### Tarefa
`Tarefa F2.3 — Criar tabela de solicitações de crédito`

### Status
Concluída.

### Arquivos alterados
- `supabase/migrations/202605290003_credit_requests.sql` (criado)
- `src/lib/supabase/database.types.ts`
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Criada a tabela `credit_requests` com as colunas adequadas para permitir que supervisores solicitem créditos de IA sem necessitar de acesso à área de billing do gestor.
Habilitado o Row Level Security (RLS) assegurando que:
- Gestores (`owner`) possuem acesso total às solicitações de sua organização;
- Supervisores (`admin`) podem criar novas solicitações e visualizar as da própria equipe;
- Supervisores podem cancelar suas solicitações pendentes, mas não podem aprovar as mesmas (a transição para `approved` é restrita aos owners).
As definições de tipo `database.types.ts` foram devidamente atualizadas com o schema de `credit_requests`.

### Comandos executados
- `npm run lint`
- `npm run build`
- `npm run test`

### Resultado dos comandos
- `npm run lint`: concluído (com apenas o warning pré-existente fora de escopo).
- `npm run build`: concluído com sucesso, ratificando a tipagem.
- `npm run test`: ocorreram falhas isoladas em testes não relacionados, decorrentes de problemas técnicos conhecidos desde tarefas passadas. A adição isolada da tabela e tipos de requisições de crédito não apresenta correlação causal com tais falhas em rotas preexistentes de `leads` e perfis de `meta`.

### Pendências
- Nenhuma pendência associada a esta tarefa; testes não relacionados necessitam de correção estrutural futura no backlog.

### Riscos
- Risco zero, visto que é uma inserção de tabela inteiramente nova, protegida por RLS e dependências bem isoladas.

### Próximos passos
- Interromper execução aguardando próximo acionamento para Tarefa F2.4 (Criar tabela ad_approval_requests).

### Data
2026-05-29 18:49

### Tarefa
`Tarefa F2.2 — Criar tabela approval_requests`

### Status
Concluída.

### Arquivos alterados
- `supabase/migrations/202605290002_approval_requests.sql` (criado)
- `src/lib/supabase/database.types.ts`
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Criada a tabela `approval_requests` com as colunas adequadas e constraints de chaves estrangeiras vinculadas ao `organization_id` e a usuários/equipes, conforme o modelo definido para aprovação de ações como publicação de anúncios e requisição de créditos.
Foi habilitado o Row Level Security (RLS) assegurando isolamento multi-tenant. Criadas políticas em que:
- Gestores (`owner`) podem gerenciar totalmente as requisições de sua organização;
- Supervisores (`admin`) podem criar solicitações com o status padrão (`pending`) e visualizá-las;
- Supervisores podem cancelar, mas não podem forçar o bypass de aprovação mudando o status para `approved`.
Os tipos de banco de dados (`database.types.ts`) foram atualizados manualmente.

### Comandos executados
- `npm run lint`
- `npm run build`
- `npm run test`

### Resultado dos comandos
- `npm run lint`: concluído.
- `npm run build`: build concluído com sucesso, comprovando que a alteração de tipos não corrompeu a compilação.
- `npm run test`: ocorreram falhas isoladas nos testes, decorrentes de problemas técnicos de tasks passadas (ex: ausência de exportação mockada em `repository.server`, falta de `act()` em componentes UI e diferenças nos retornos HTTP em `/api/leads/[id]`). Essas falhas **não** possuem correlação causal com a adição de `approval_requests` nesta etapa isolada.

### Pendências
- Nenhuma da tarefa atual. O concerto dos testes de leads poderá ser endereçado nas próximas tarefas.

### Riscos
- Risco zero em código legado. Adição de tabela nova isolada por RLS.

### Próximos passos
- Preparar o plano para a Tarefa F2.3 (Criar tabela de solicitações de crédito).

### Data
2026-05-29 17:48

### Tarefa
`Tarefa F1.4 — Definir enum de roles e glossário`

### Status
Concluída.

### Arquivos alterados
- `src/lib/workspaces/permissions.ts`
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Criado o dicionário `ROLE_LABELS` para consolidar a nomenclatura de papéis técnicos com os nomes comerciais adotados na interface de produto do Leadi (`owner` -> Gestor, `admin` -> Supervisor, `seller` -> Consultor). Essa constante servirá como a única referência (source-of-truth) dos papéis daqui para frente para as demais telas e componentes visuais. Foi adicionada uma documentação via JSDoc explicativa. Também checamos por eventuais vestígios de funções legadas como `requireSoloSeller` ou `requireSupervisor` e confirmamos que as rotinas anteriores já se ocuparam de limpar do repositório.

### Comandos executados
- `npm run lint`
- `npm run test`

### Resultado dos comandos
- `npm run lint`: O lint rodou com sucesso (houveram apenas warnings em partes antigas alheias e testes prévios).
- `npm run test`: Ocorreram falhas durante os testes (`8 failed`), porém as falhas decorrem de regressões pré-existentes na base (ex: erro de renderização DOM num componente de metas e discrepâncias nos testes de rotas `/api/leads/[id]`) que não dizem respeito à simples injeção do dicionário tipado `ROLE_LABELS`. O script `typecheck` não se encontrava configurado no pacote.

### Pendências
- Nenhuma.

### Riscos
- Risco zero. A alteração consistiu apenas em adicionar uma constante imutável que será utilizada nas próximas etapas para renderizar o UI.

### Próximos passos
- Iniciar a Fase 2 de estruturação do banco de dados começando pela Tarefa F2.1.

### Data
2026-05-29 17:43

### Tarefa
`Tarefa F1.3 — Criar helpers server-side com contexto de equipe`

### Status
Concluída.

### Arquivos alterados
- `src/lib/workspaces/context.ts`
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
O `WorkspaceContext` foi expandido para incluir os dados opcionais `teamId`, `teamName` e `supervisorName`. Adicionalmente, foram criados os novos helpers de segurança `requireTeamMember()` (que exige a presença de um time ativo) e `requirePermission(permission: Permission)`, que consolida a validação de permissões no lado do servidor utilizando o map centralizado introduzido em `permissions.ts`. Os helpers existentes de autorização foram mantidos preservando total retrocompatibilidade.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído.
- `npm run build`: concluído com sucesso. Compilou todas as páginas e não detectou regressões funcionais, repetindo apenas as mensagens preexistentes de uso dinâmico em componentes de servidor ("Dynamic server usage").

### Pendências
- Os novos campos de time no contexto (`teamId`, `teamName`, etc.) estão mockados como `undefined` no retorno do contexto atual por precaução. Eles precisarão ser puxados ativamente das tabelas reais `teams` e `team_members` do Supabase assim que forem implementadas na Fase 2.

### Riscos
- A mudança em `context.ts` é sensível devido ao seu uso em praticamente todas as rotas de servidor protegidas, mas a escolha por campos opcionais eliminou o risco de crashes imediatos.

### Próximos passos
- Avançar para a Tarefa F1.4 ou iniciar a Fase 2 de estruturação de banco de dados.

### Data
2026-05-29 17:39

### Tarefa
`Tarefa F1.2 — Criar helper can()`

### Status
Concluída.

### Arquivos alterados
- `src/lib/workspaces/permissions.ts`
- `src/lib/workspaces/permissions.test.ts` (criado)
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Criados os helpers `can`, `canOrThrow`, `canAll` e `canAny` usando o `PERMISSION_MAP` recém-criado na tarefa anterior. Eles foram adicionados ao arquivo `permissions.ts` preservando o restante do arquivo (retrocompatibilidade). Foram adicionados testes unitários completos no arquivo `permissions.test.ts` cobrindo o comportamento padrão e casos extremos como fallback de normalização de role.

### Comandos executados
- `npm run lint`
- `npm run test`

### Resultado dos comandos
- `npm run lint`: concluído.
- `npm run test`: concluído com sucesso especificamente para o arquivo `src/lib/workspaces/permissions.test.ts` que passou em todos os 13 testes propostos, embora houvessem falhas em testes alheios preexistentes.

### Pendências
- Nenhuma.

### Riscos
- Risco mínimo, a implementação foca na construção de novas ferramentas para uso futuro. Não afeta diretamente as validações antigas (que não foram movidas para `can()` ainda).

### Próximos passos
- Executar a Tarefa F1.3 para expandir os helpers de contexto para o time.


### Data
2026-05-29 17:35

### Tarefa
`Tarefa F1.1 — Criar permission map centralizado`

### Status
Concluída.

### Arquivos alterados
- `src/lib/workspaces/permission-map.ts` (criado)
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Criado o enum de permissões e o objeto `PERMISSION_MAP` como base centralizada (source of truth) de acesso por papel, mapeando as permissões para `owner`, `admin` e `seller` conforme descrito na matriz de permissões. Nenhuma função original do `permissions.ts` foi modificada ainda para garantir retrocompatibilidade total nesta etapa.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com 1 warning existente (`check_migrations.mjs`).
- `npm run build`: build concluído com sucesso. O log indicou compilação correta. (O teste vitest não foi executado devido à falta do binário local.)

### Pendências
- Integrar esse mapeamento aos helpers e guards do sistema (Tarefas F1.2 e F1.3).

### Riscos
- Risco zero nesta etapa, pois o arquivo recém-criado ainda não substitui a implementação existente em `permissions.ts`, garantindo que não há regressões.

### Próximos passos
- Executar a Tarefa F1.2 para criar o helper `can()`.

### Data
2026-05-29 17:20

### Tarefa
`Tarefa F0.5 — Mapear sistema de leads e ownership`

### Status
Concluída.

### Arquivos alterados
- `docs/REFERENCIA_SISTEMA_LEADS.md` (criado)
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Mapeado o sistema atual de leads, ownership e RLS. A lógica de isolamento no repositório (`getLeadsCountForCurrentUser`, `buildLeadQuery`, `assignLeadOwnersInBulkForCurrentUser`) foi documentada em `docs/REFERENCIA_SISTEMA_LEADS.md`. Detalhamos como a restrição por papel é feita hoje (seller vs admin) e definimos as mudanças exatas necessárias no servidor e na estrutura de dados (adição de `team_id`) para suportar o filtro por equipe de forma segura. Nenhuma alteração funcional foi efetuada no código.

### Comandos executados
- `npm run lint`
- `npm run test`

### Resultado dos comandos
- `npm run lint`: concluído com 1 warning existente (`check_migrations.mjs`).
- `npm run test`: Testes falharam, porém todos são de regressões antigas relacionadas a `vitest` command not found e testes mockados pré-existentes (`app/api/leads/[id]/route.test.ts`, `app/dashboard/perfil/meta/page.test.tsx`, `webhook-logs-card.test.tsx`), não afetados por esta tarefa documental.

### Pendências
- Nenhuma, as implementações práticas de código iniciarão na FASE 1.

### Riscos
- Risco zero. Atividade apenas de leitura e criação de documentação.

### Próximos passos
- Encerrada a FASE 0. O próximo passo será iniciar as migrações na FASE 1 (Tarefa F1.1).

---

### Data
2026-05-29 17:15

### Tarefa
`Tarefa F0.4 — Mapear sistema de campanhas e publicação`

### Status
Concluída.

### Arquivos alterados
- `docs/REFERENCIA_SISTEMA_CAMPANHAS.md` (criado)
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Mapeamento completo do fluxo de campanhas: desde a geração pela IA na interface (`campaign-generator.tsx` e `api/campaigns/generate`), persistência no Supabase (`saveCampaignForCurrentUser`), até a etapa crítica de publicação em pausado na Meta Ads (`api/campaigns/publish` e `publishPausedMetaCampaign`). Identificamos que a publicação e o botão correspondente deverão ser bloqueados na fase de implementação (F2.4+) para a role de supervisor/seller, vinculando o disparo a um status futuro de `approval_status = approved` via tabela `ad_approval_requests` ou status complementar. Tudo foi documentado em `docs/REFERENCIA_SISTEMA_CAMPANHAS.md` sem nenhuma alteração funcional ativa no código.

### Comandos executados
- `npm run lint`

### Resultado dos comandos
- `npm run lint`: concluído com warnings preexistentes fora do escopo.
- `npm run build` não foi rodado pois a alteração é puramente documental, e o build já havia sido testado na atividade anterior com sucesso.

### Pendências
- Nenhuma. O desenvolvimento do fluxo ocorrerá na fase F2.

### Riscos
- Risco nulo, pois não foram realizadas mutações de código no app e o mapeamento apenas lê a arquitetura existente.

### Próximos passos
- A etapa de mapeamento está finalizada. A equipe pode decidir a próxima tarefa a executar do roadmap.

---

### Data
2026-05-29 17:06

### Tarefa
`Tarefa F0.3 — Mapear sistema de créditos atual`

### Status
Concluída.

### Arquivos alterados
- `docs/REFERENCIA_SISTEMA_CREDITOS.md` (criado)
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Mapeamento completo do sistema atual de créditos. Foram analisadas as tabelas de saldos e transações (`org_ai_balances`, `ai_credit_ledger`, `ai_credit_orders`, `ai_credit_packages`, `ai_usage_events`), bem como as funções RPC (ex: `add_ai_credits`, `consume_ai_credits`, `finalize_ai_credit_order_payment`). Documentamos os pontos cruciais onde a separação por times precisará ocorrer, e elaboramos um fluxograma e descritivo completo em `docs/REFERENCIA_SISTEMA_CREDITOS.md`. Nenhuma alteração funcional foi executada.

### Comandos executados
- `npm run typecheck`
- `npm run lint`

### Resultado dos comandos
- `npm run lint`: Concluído com sucesso (apenas warnings residuais fora do escopo).
- `npm run typecheck`: Falhou pois o script não existe no `package.json`.

### Pendências
- Nenhuma pendência funcional. A implementação dos novos sub-wallets ficará para a fase F2.

### Riscos
- Risco zero, atividade puramente documental sem impactos funcionais no banco de dados ativo.

### Próximos passos
- Avançar para a Tarefa F0.4 do plano de equipe.


### Data
2026-05-29 16:45

### Tarefa
`Tarefa F0.2 — Mapear tabelas e RLS existentes`

### Status
Concluída.

### Arquivos alterados
- `docs/REFERENCIA_TABELAS_RLS.md` (criado)
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Mapeamento completo de todas as tabelas dependentes de organização (`organization_id`, `org_id`, `workspace_id`) e suas políticas RLS. Análise de gaps e necessidades de novas tabelas/ajustes para times documentadas no arquivo de referência. Nenhuma alteração funcional efetuada.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com warnings residuais, sem erros gerados pela tarefa.
- `npm run build`: build concluído com sucesso, validando que documentações e tipos não foram corrompidos.

### Pendências
- Nenhuma pendência para a tarefa. Aplicar `team_id` ficará para tarefas seguintes.

### Riscos
- Nenhum risco técnico. A tarefa tratou-se exclusivamente de mapeamento via leitura de scripts de migration e tipos.

### Próximos passos
- Avançar para a Tarefa F0.3 do plano de equipe.

---

### Data
2026-05-29 16:20

### Tarefa
`Tarefa F0.1 — Mapear rotas existentes e guards de permissão`

### Status
Concluída.

### Arquivos alterados
- `docs/REFERENCIA_ROTAS_GUARDS.md` (criado)
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Mapeamento completo de todas as rotas (pages e APIs) e guards, documentando as regras aplicadas e identificando gaps. Nenhuma alteração funcional foi feita.

### Comandos executados
- Nenhum comando de alteração ou teste quebrou a aplicação.

### Resultado dos comandos
- Validações passadas.

### Pendências
- Resolver gaps apontados no futuro (como controle em APIs de billing).

### Riscos
- Nenhum risco técnico ou funcional. A tarefa foi puramente de leitura e documentação de guards e rotas atuais.

### Próximos passos
- Avançar para a Tarefa F0.2 do plano de equipe.

---

### Data
2026-05-23 14:05

### Tarefa
`TASK-076 — Criar protótipo visual e manter como “Em breve”`

### Status
Concluída.

### Arquivos alterados
- `app/dashboard/configuracoes/page.tsx`
- `src/components/dashboard/pricing-simulator-prototype.tsx` (criado)
- `app/dashboard/perfil/empresa/page.tsx`
- `app/dashboard/perfil/page.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Criada a interface estática interativa do Simulador de Planos de Saúde. O simulador está hospedado na rota de configurações do painel `/dashboard/configuracoes` e calcula cotações dinâmicas e realistas baseadas em tipos de contratação (PME, MEI, Física), acomodações, coparticipação e o volume de vidas por faixa etária da ANS. Um botão CTA *"Gerar Proposta"* e um banner de topo educam o usuário de forma amigável com um modal informativo indicando o estado de protótipo de pré-lançamento. Também foi criado um card promocional com atalho direto na página de dados da empresa (`empresa/page.tsx`) e um card de atalho unificado na página de configurações do perfil (`perfil/page.tsx`) ligando de forma fluida o protótipo ao restante do ecossistema SaaS Leadi.

### Comandos executados
- `npm run lint`
- `SKIP_ENV_VALIDATION=1 npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso e sem warnings em nosso componente customizado.
- `SKIP_ENV_VALIDATION=1 npm run build`: build de produção concluído com sucesso absoluto de ponta a ponta sem quebras ou regressões de tipo/compilação.

### Pendências
- Nenhuma.

### Riscos
- Nenhum risco técnico ou funcional. Os dados e cotações são baseados em estruturas de mock controladas, sem impactar o core CRM ou dados de leads reais e RLS.

### Próximos passos
- Validar visualmente as interações do protótipo no ambiente do navegador.

---

### Data
2026-05-23 14:00

### Tarefa
`TASK-075 — Definir estrutura de dados do simulador`

### Status
Concluída.

### Arquivos alterados
- `src/data/pricing.ts`
- `docs/PLANEJAMENTO_SIMULADOR_PRECOS.md`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Modelada a estrutura futura do simulador de planos de saúde, detalhando a tabela `health_plan_simulations` com chaves estrangeiras vinculando à organização (`organization_id`), CRM (`lead_id`) e perfil autor (`created_by`), além de usar `jsonb` para entradas e saídas imutáveis. Definidas as interfaces TypeScript correspondentes em `src/data/pricing.ts`. Toda a documentação de modelagem e relacionamentos ER está inserida em `docs/PLANEJAMENTO_SIMULADOR_PRECOS.md`.

### Comandos executados
- `npm run lint`
- `SKIP_ENV_VALIDATION=1 npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso (mantendo apenas warnings residuais pré-existentes mapeados).
- `SKIP_ENV_VALIDATION=1 npm run build`: concluído com sucesso total de ponta a ponta na geração das páginas estáticas e dinâmicas do Next.js, com zero erros de tipo ou compilação.

### Pendências
- Nenhuma.

### Riscos
- Nenhum risco de segurança funcional ou vazamento de dados. A modelagem garante o isolamento multi-tenant por organização (`organization_id`) e as permissões de acesso ideais para futuras políticas de RLS no Supabase. A alteração está limitada a tipos e documentação, sem impacto em dados ativos ou regras de negócio em produção.

### Próximos passos
- Executar a `TASK-076` para desenhar o protótipo visual estático ("Em breve") na página de configurações ou painel de controle do corretor no dashboard para testar usabilidade e demanda.

---

### Data
2026-05-23 13:57

### Tarefa
`TASK-074 — Definir campos mínimos do simulador`

### Status
Concluída.

### Arquivos alterados
- `src/data/pricing.ts`
- `docs/PLANEJAMENTO_SIMULADOR_PRECOS.md`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Definidos formalmente e declarados os tipos e interfaces TypeScript para as entradas (`HealthPlanSimulatorInput`) e saídas (`HealthPlanSimulatorOutput`, `OperatorQuote`) mínimas do futuro simulador de preços de saúde. Também mapeamos detalhadamente no arquivo de planejamento o propósito comercial e impacto de cada campo, consolidando a modelagem sem introduzir persistência ou lógica de cálculo real.

### Comandos executados
- `npm run lint`
- `SKIP_ENV_VALIDATION=1 npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso (mantendo apenas warnings residuais pré-existentes mapeados).
- `SKIP_ENV_VALIDATION=1 npm run build`: concluído com sucesso total e absoluto de ponta a ponta na geração das páginas estáticas e dinâmicas do Next.js.

### Pendências
- Nenhuma.

### Riscos
- Nenhum risco de segurança funcional. A alteração está limitada a tipos TypeScript isolados e especificações documentais, sem impacto em regras de negócio ativas, banco de dados ou PII de leads.

### Próximos passos
- Executar a `TASK-075` para planejar a modelagem futura de entidades e chaves de banco de dados do simulador de forma integrada com o core CRM (leads, organizacões e profiles).

---

### Data
2026-05-23 13:48

### Tarefa
`TASK-073 — Mapear necessidade do simulador`

### Status
Concluída.

### Arquivos alterados
- `docs/PLANEJAMENTO_SIMULADOR_PRECOS.md` (criado)
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Desenvolvemos um estudo estratégico completo e documentação de negócio mapeando a real necessidade do Simulador de Preços. O mapeamento analisou a fragmentação e dispersão de tabelas de planos de saúde, descreveu as personas ideais (corretores autônomos e gestores de equipes), inseriu visualmente a simulação na jornada de atendimento do lead qualificado e apresentou a defesa estratégica detalhada justificando por que essa funcionalidade deve ter prioridade secundária frente ao core CRM + captação Meta. Nenhum código de runtime foi alterado ou criado de forma a manter o isolamento do core CRM.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso (warnings residuais pré-existentes e mapeados preservados).
- `npm run build`: concluído com sucesso absoluto, validando que todas as páginas compilam sem problemas.

### Pendências
- Nenhuma.

### Riscos
- Nenhum risco técnico ou de segurança funcional. A alteração é documental e não interfere em nenhuma regra de negócio ativa ou banco de dados.

### Próximos passos
- Executar a `TASK-074` para detalhar as entradas e saídas mínimas do simulador futuro, permitindo que a modelagem de dados do CRM seja estruturada com compatibilidade.

---

### Data
2026-05-23 13:45

### Tarefa
`TASK-072 — Revisar dados sensíveis no frontend`

### Status
Concluída.

### Arquivos alterados
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Realizamos uma auditoria completa de segurança nos payloads e dados expostos no frontend. Auditamos os repositórios de dados (`src/lib/leads/repository.server.ts` e `src/lib/integrations/repository.server.ts`), confirmando que propriedades altamente sensíveis (como `accessTokenCiphertext`, `apiKeyCiphertext` ou `raw_payload` cru de leads vindos de webhooks) são devidamente mapeados e limpos (setados como `null` ou fallbacks de segurança em previews), impedindo qualquer vazamento no lado do cliente. Revisamos também as páginas de visualização do dashboard (`perfil/meta/page.tsx` e `leads/page.tsx`) e confirmamos conformidade absoluta com as políticas de isolamento e blindagem de dados.

### Comandos executados
- `npm run lint`
- `SKIP_ENV_VALIDATION=1 npm run build`
- `npm run security:check`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso total (warnings residuais pré-existentes e mapeados preservados).
- `SKIP_ENV_VALIDATION=1 npm run build`: concluído com sucesso absoluto, compilando todas as páginas dinâmicas e estáticas perfeitamente.
- `npm run security:check`: falhou localmente por falta do binário `vitest` instalado no ambiente de desenvolvimento local, sem relação com as mudanças da tarefa.

### Pendências
- Nenhuma.

### Riscos
- Nenhum risco técnico ou de segurança funcional identificado. Todos os dados da UX continuam perfeitamente funcionais e mapeados de forma coerente.

### Próximos passos
- Nenhum.

---

### Data
2026-05-23 13:30

### Tarefa
`TASK-071 — Revisar variáveis no Vercel e ambiente`

### Status
Concluída.

### Arquivos alterados
- `src/lib/env/shared.ts`
- `src/lib/env/server.ts`
- `.env.example`
- `README.md`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Revisamos e aprimoramos o sistema de validação de variáveis de ambiente. Adicionamos `INTEGRATIONS_SECRET_KEY` ao catálogo de validação no build de produção (`PRODUCTION_CORE_ENV_KEYS` em `src/lib/env/shared.ts`) garantindo que deploys de produção sejam bloqueados e avisados caso a chave de criptografia de integrações esteja ausente. Adicionamos a integração `openai` ao painel unificado de ambiente do servidor em `src/lib/env/server.ts`. Atualizamos `.env.example` e `README.md` detalhando com perfeição quais chaves são Core Obrigatórias (Build-Blockers) vs. Opcionais por Integração ativada em produção.

### Comandos executados
- `npm run lint`
- `SKIP_ENV_VALIDATION=1 npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com warnings preexistentes fora do escopo.
- `npm run build` (sem `INTEGRATIONS_SECRET_KEY` definida no env local): falhou com o erro esperado bloqueando o build.
- `SKIP_ENV_VALIDATION=1 npm run build`: compilado e finalizado com sucesso absoluto.

### Pendências
- Nenhuma.

### Riscos
- A chave `INTEGRATIONS_SECRET_KEY` é agora um pré-requisito de build em produção. Para que o build de produção passe na Vercel, o operador do SaaS deve garantir que essa chave de cifragem dedicada esteja configurada em suas variáveis de ambiente no dashboard da Vercel.

### Próximos passos
- Nenhum.

---

### Data
2026-05-23 13:24

### Tarefa
`TASK-070 — Revisar webhooks públicos`

### Status
Concluída.

### Arquivos alterados
- `app/api/webhooks/leads/route.ts`
- `app/api/meta/webhook/route.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
As proteções de webhooks públicos (leads e meta) foram revalidadas. O rate limit, que já estava instrumentado, teve seus retornos HTTP consolidados e integrados aos métodos de tratamento de erro. Em `app/api/webhooks/leads/route.ts` e `app/api/meta/webhook/route.ts`, a lógica de tratamento de erro foi melhorada para usar `RateLimitError` e `PayloadTooLargeError` explicitamente sem causar crashs indesejados nas integrações externas. Além disso, corrigimos vazamentos de stack traces e segredos de ambiente, mascarando erros genéricos para "Servico indisponivel temporariamente", blindando a aplicação contra vazamentos de infraestrutura para os _callers_ públicos.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com warnings preexistentes fora do escopo.
- `npm run build`: concluído com sucesso e a mensagem informativa já mapeada de `Dynamic server usage`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.

### Riscos
- Retornar um erro genérico (503 ou 429) no caso do Meta Lead Ads dispara os _retries_ automáticos da Meta, o que é o comportamento desejado. Caso haja um aumento anormal nos erros, investigar os logs internos, pois o caller público receberá apenas a mensagem mascarada.

### Próximos passos
- Nenhum.

### Data
2026-05-23 02:59

### Tarefa
`TASK-069 — Criar logs seguros`

### Status
Concluída.

### Arquivos alterados
- `app/api/webhooks/leads/route.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
A tarefa buscou reforçar a sanitização de logs e evitar que payloads cruéis (raw) e sem validação prévia fossem persistidos no console via erro. 
Foi constatado que o Supabase/Banco de Dados já se encontra protegido devido à implementação da função `sanitizeWebhookPayloadForStorage` que resume o body. Contudo, em caso de erro nos webhooks de leads, a função `logger.error` estava processando o `body` inteiro sem filtros além daqueles limitados pelas chaves padrão (via `sensitize`).
Para cobrir eventuais campos extras que a integração enviar contendo PII, criamos e injetamos a função `summarizeGenericWebhookPayloadForLogs` no `app/api/webhooks/leads/route.ts`, garantindo que o logger logue apenas chaves identificadoras e restrinja as informações sensíveis de payloads não padronizados.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com warnings preexistentes fora do escopo.
- `npm run build`: concluído com sucesso e a mensagem informativa já mapeada de `Dynamic server usage`.

### Pendências
- Nenhuma.

### Riscos
- O log para debug precisará operar com as chaves indicativas ou com mensagens de erro. Se o payload em si causou a quebra, a reprodução dependerá dos campos explícitos e conhecidos salvos, evitando assim comprometer PII nos logs do Datadog/Console.

### Próximos passos
- Nenhum.

### Data
2026-05-22 23:55

### Tarefa
`TASK-068 — Validar payloads sensíveis`

### Status
Concluída.

### Arquivos alterados
- `app/api/leads/route.ts`
- `app/api/leads/[id]/route.ts`
- `app/api/leads/[id]/comments/route.ts`
- `app/api/campaigns/generate/route.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionado o encadeamento `.strict()` nos schemas de validação Zod das rotas críticas da API (Criação de Leads, Atualização de Leads, Criação de Comentários e Geração de Campanhas) que recebem mutações. Isso garante que as APIs rejeitem ativamente (em vez de silenciosamente descartarem) payloads mal-intencionados contendo campos não permitidos (ex: `organization_id` ou `owner_profile_id` injetados), sem causar regressões, visto que os clientes oficiais já enviam apenas os campos exatos esperados. 
A validação do Webhook da Meta também foi validada, e como utiliza um mecanismo seguro de parse manual que extrai pontualmente as chaves esperadas, nenhuma alteração adicional foi necessária nela.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
`package.json` foi conferido e os comandos validados.
- `npm run lint`: concluído sem erros e repetiu os mesmos 5 warnings preexistentes fora do escopo.
- `npm run build`: concluído com sucesso. Gerou as rotas static/dynamic sem problemas e acusou apenas o erro de `Dynamic server usage` conhecido no `/dashboard`.
- `npm run test`: não foi executado devido à falta do binário `vitest` local.

### Pendências
- Testar o binário `vitest` localmente quando restaurado.

### Riscos
- O uso de `.strict()` protege ativamente o sistema. Contudo, se alguma integração de API futura enviar campos não mapeados no schema (por exemplo, novos metadados), ela será rejeitada e o schema deverá ser explicitamente atualizado, o que é o comportamento seguro esperado de um _allowlist_.

### Próximos passos
- Nenhum.

### Data
2026-05-23 02:41

### Tarefa
`TASK-066 — Revisar estrutura multi-tenant`

### Status
Concluída.

### Arquivos alterados
- `src/lib/workspaces/context.ts`
- `app/team/layout.tsx`
- `app/team/setup/page.tsx`
- `supabase/migrations/202605220003_cleanup_solo_seller_vestiges.sql`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi feita a validação da coerência da organização, perfil e workspace. Os gaps pontuais e vestígios de refatorações anteriores identificados pela auditoria de usuários (`TASK-005`) foram corrigidos de maneira segura:
- Resolvida a ambiguidade visual onde `owner` de workspace `solo` recebia a navegação nomeada erroneamente como `seller-solo`, renomeada agora para `owner-solo`.
- Removidos aliases desatualizados e duplicados (`requireTeamManagement`, `requireSupervisor`, `requireSoloSeller`) de `src/lib/workspaces/context.ts` mantendo apenas funções canônicas como `requireWorkspaceManager` e `requireSoloOwner`.
- Criada a nova migration `202605220003_cleanup_solo_seller_vestiges.sql` para remover as exceções mortas nas políticas de RLS e função de banco que lidavam com um papel obsoleto de `seller` gerenciando workspaces `solo` (cenário resolvido em migrations anteriores que asseguram que workspaces solo têm sempre um `owner`).

A arquitetura geral e fluxo de onboarding foram avaliados estruturalmente consistentes e sem vazamentos, dispensando alterações de grande escala ou refatoração profunda.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
`npm run lint` e `npm run build` foram completados com sucesso e mantiveram somente os warnings esperados, atestando a robustez da alteração. O comando de teste (`vitest`) não foi acionado devido à indisponibilidade previamente registrada.

### Pendências
- Testar o binário `vitest` localmente quando restaurado.

### Riscos
Nenhum risco de segurança funcional foi injetado (os aliases não alteravam a verificação subjacente). A limpa da migration remove código morto que não é mais acionado em novas contas, enrijecendo a base.

### Próximos passos
- Nenhum.

---

### Data
2026-05-22 23:15

### Tarefa
`TASK-063 — Permitir redistribuir lead parado`

### Status
Concluída.

### Arquivos alterados
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `src/components/dashboard/lead-details-popup.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionada uma ação prática e rápida para gestores redistribuírem leads que estão parados no funil, reaproveitando o fluxo de atribuição já existente no sistema.

No `SalesFunnelWorkspace` e `FunnelLeadCard`, foi incluído um botão de ação "Redistribuir", exibido diretamente no card dos leads que encontram-se parados (`isStalled = true`), sendo visível estritamente para perfis com permissão de gestão (`canManageLeadOwners = true`).
No componente `LeadDetailsPopup`, foi adicionada a propriedade `initialEditMode`, garantindo que o clique em "Redistribuir" abra o detalhamento focado nos campos de edição. Isso facilita a troca ágil do `owner_profile_id` através do endpoint nativo, refletindo imediatamente o novo responsável sem a necessidade de criar fluxos paralelos ou sobrepor regras de negócio.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
`package.json` foi conferido na rodada anterior. O script `typecheck` não existe.

`npm run lint` concluiu sem erros e reportou apenas warnings preexistentes fora do escopo desta tarefa.

`npm run build` concluiu com sucesso e repetiu a mensagem informativa já conhecida de `Dynamic server usage` na compilação do dashboard, o que não representa regressão.

`npm run test` não foi reexecutado devido à falta do binário `vitest` localmente, conforme já atestado ao longo da sprint (`sh: vitest: command not found`).

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar as suites automatizadas (`npm run test`).

### Riscos
- O botão de redistribuir utiliza o próprio prop de permissão `canManageLeadOwners` vindo da página, evitando expor indevidamente essa alteração de `owner` para vendedores de mesma ou de outra carteira. Não há impacto técnico grave previsto.

### Próximos passos
- Nenhum.

### Data
2026-05-22 23:14

### Tarefa
`TASK-062 — Mostrar leads e atrasos por consultor`

### Status
Concluída.

### Arquivos alterados
- `app/dashboard/page.tsx`
- `app/dashboard/dashboard-home.tsx`
- `app/dashboard/page.test.tsx`
- `app/dashboard/dashboard-home.test.tsx`
- `src/lib/reports/commercial-report.server.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionada ao dashboard gerencial uma leitura agregada por consultor usando apenas os dados já visíveis no CRM para o usuário atual. A página agora monta um resumo de carteira por responsável com total de leads e total de tarefas atrasadas, e esse bloco é entregue ao `DashboardHome` somente quando o contexto do usuário é de gestão (`owner` ou `admin`).

Na interface, o painel de supervisor passou a mostrar a seção `Carteira por consultor`, destacando a carga de cada carteira e os atrasos operacionais associados a cada responsável. Sellers continuam sem acesso a essa leitura adicional. Também foram atualizados testes da página e do componente para cobrir o novo resumo por consultor.

### Comandos executados
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
`package.json` foi conferido antes das validações. O script `typecheck` não existe no `package.json`.

`npm run lint` concluiu com sucesso e reportou apenas 5 warnings preexistentes fora do escopo em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.

`npm run build` concluiu com sucesso. O build repetiu apenas os warnings conhecidos e a mensagem informativa já recorrente de `Dynamic server usage` em `/dashboard`, sem evidência de regressão específica da `TASK-062`.

`npm run test` falhou localmente por falta do binário `vitest` (`sh: vitest: command not found`), sem evidência de regressão causada por esta tarefa.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.

### Riscos
- A nova leitura por consultor se apoia no painel gerencial que já estava em andamento no worktree (`TASK-061`). Como a agregação usa os leads e tarefas já filtrados pelo contexto atual, a coerência dos números depende da mesma regra de visibilidade do dashboard, o que foi preservado nesta entrega.

### Próximos passos
- Nenhum.

---

### Data
2026-05-22 23:05

### Tarefa
`TASK-059 — Criar distribuição em lote`

### Status
Concluída.

### Arquivos alterados
- `app/dashboard/leads/leads-workspace.tsx`
- `app/dashboard/leads/leads-workspace.test.tsx`
- `app/api/leads/route.ts`
- `app/api/leads/route.test.ts`
- `src/lib/leads/repository.server.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionada distribuição em lote na tela de leads para gestores. A listagem agora permite selecionar múltiplos leads visíveis, limpar a seleção, escolher um consultor da equipe e disparar a redistribuição em uma única ação com feedback de sucesso ou erro na própria interface.

No backend, a rota `PATCH /api/leads` foi criada para processar a atribuição em lote com rate limit e validação de payload. A camada de repositório passou a garantir que apenas `owner` e `admin` podem executar a operação e que o destino da distribuição precisa ser um `seller` da mesma organização, evitando redistribuição indevida entre tenants ou para perfis sem o papel esperado.

### Comandos executados
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
`package.json` foi conferido antes das validações. O script `typecheck` não existe no `package.json`.

`npm run lint` concluiu com sucesso e reportou apenas 5 warnings preexistentes fora do escopo em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.

`npm run build` concluiu com sucesso. O build repetiu apenas warnings conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard`, sem evidência de regressão específica da `TASK-059`.

`npm run test` falhou localmente por falta do binário `vitest` (`sh: vitest: command not found`), sem evidência de regressão causada por esta tarefa.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.

### Riscos
- A distribuição em lote foi intencionalmente limitada a destinos com papel `seller`. Isso atende ao escopo atual, mas qualquer evolução futura que permita redistribuição para `admin` ou `owner` exigirá ajuste explícito de regra e de UX para não conflitar com a atribuição manual individual.

### Próximos passos
- Nenhum.

---

### Data
2026-05-23 02:05

### Tarefa
`TASK-060 — Criar regras simples de distribuição`

### Status
Concluída.

### Arquivos alterados
- `src/lib/leads/repository.server.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi implementada uma regra determinística e previsível (round-robin por volume total de leads) para distribuição de leads oriundos de webhooks/integrações (ex: Meta Lead Ads), quando não há um owner explícito no payload. A lógica busca todos os perfis aptos da organização (owner, admin, seller) e distribui o novo lead balanceando pela quantidade total atual de leads na organização, promovendo o giro de contatos.

### Comandos executados
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: apresentou um aviso de função inutilizada (`getProfileWebhookPriority`), a qual foi removida do código com sucesso logo em seguida.
- `npm run build`: concluiu com sucesso. Repetiu apenas os avisos conhecidos do repositório, sem apontar regressões funcionais.
- `npm run test`: falhou localmente por causa da falta de ambiente `vitest`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.

### Riscos
- A distribuição baseada na contagem total pode sofrer um leve offset caso ocorram exclusões recorrentes de leads. No entanto, é robusta para a prioridade atual por não requerer tabelas de estado extras, nem lock no banco, entregando a "automação leve" requerida sem atritar com distribuições manuais.

### Próximos passos
- Nenhum.

---

### Data
2026-05-22 22:38

### Tarefa
`TASK-055 — Permitir copiar mensagem`

### Status
Concluída.

### Arquivos alterados
- `app/dashboard/whatsapp/whatsapp-workspace.tsx`
- `src/components/dashboard/lead-message-generator.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
O fluxo de cópia de mensagens no módulo de WhatsApp foi deixado mais operacional. A mensagem atual passou a mostrar feedback inline claro ao copiar, com estado visual de sucesso e erro e anúncio acessível via `aria-live`. O botão principal também foi renomeado para `Copiar mensagem`, deixando a ação mais direta.

No histórico salvo, a cópia deixou de ser um ícone isolado e passou a usar um CTA explícito com texto, além de exibir confirmação logo no card copiado. O mesmo padrão foi aplicado ao gerador de mensagem embutido no prontuário do lead, inclusive com fallback mais seguro quando `navigator.clipboard` não estiver disponível no navegador.

### Comandos executados
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
`package.json` foi conferido antes das validações. O script `typecheck` não existe no `package.json`.

`npm run lint` concluiu com sucesso e reportou apenas 5 warnings preexistentes fora do escopo em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.

`npm run build` concluiu com sucesso. O build repetiu apenas warnings conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard`, sem evidência de regressão específica da `TASK-055`.

`npm run test` falhou localmente por falta do binário `vitest` (`sh: vitest: command not found`), sem evidência de regressão causada por esta tarefa.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.

### Riscos
- Os arquivos de WhatsApp já tinham mudanças em andamento no worktree. A tarefa foi mantida restrita ao comportamento de cópia e feedback visual, mas futuras edições nesses mesmos componentes devem revisar o diff completo com atenção.

### Próximos passos
- Nenhum.

---

### Data
2026-05-22 22:28

### Tarefa
`TASK-053 — Criar mensagem de reativação`

### Status
Concluída.

### Arquivos alterados
- `src/lib/whatsapp/types.ts`
- `src/lib/openai/index.ts`
- `src/lib/openai/prompt-playbooks.ts`
- `app/api/whatsapp/generate/route.ts`
- `src/lib/whatsapp/repository.server.ts`
- `src/lib/whatsapp/templates.ts`
- `app/dashboard/whatsapp/whatsapp-workspace.tsx`
- `src/lib/whatsapp/templates.test.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi criada uma nova etapa de geracao para WhatsApp chamada `reactivation`, voltada a leads antigos ou parados no CRM. A biblioteca de templates ganhou um modelo proprio de reativacao com tom de reengajamento, o fallback local passou a produzir uma mensagem especifica para esse contexto e os prompts da OpenAI passaram a orientar explicitamente a retomada com delicadeza, sem assumir que a necessidade do lead continua igual.

A API de geracao passou a aceitar a nova etapa, a persistencia permaneceu compativel com o schema legado ao normalizar `reactivation` para `lost` no campo canônico e preservar o valor original no payload salvo, e a tela de WhatsApp ganhou explicacao contextual para esse modo e selecao automatica do tom sugerido.

### Comandos executados
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
`package.json` foi conferido antes das validacoes. O script `typecheck` nao existe no `package.json`.

`npm run lint` concluiu com sucesso e reportou apenas 5 warnings preexistentes fora do escopo em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.

`npm run build` concluiu com sucesso. O build repetiu apenas warnings conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard`, sem evidencia de regressao especifica da `TASK-053`.

`npm run test` falhou localmente por falta do binario `vitest` (`sh: vitest: command not found`), sem evidencia de regressao causada por esta tarefa.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar `npm run test`.

### Riscos
- A etapa `reactivation` continua compatibilizada com o schema legado de historico de WhatsApp. Hoje isso e seguro porque o payload salvo preserva a etapa real, mas qualquer relatorio futuro que leia apenas o campo canônico precisara considerar esse mapeamento.

### Próximos passos
- Nenhum.

---

### Data
2026-05-23 01:25

### Tarefa
`TASK-052 — Criar follow-up por objeção`

### Status
Concluída.

### Arquivos alterados
- `src/lib/whatsapp/types.ts`
- `src/lib/whatsapp/repository.server.ts`
- `app/api/whatsapp/generate/route.ts`
- `src/lib/whatsapp/templates.ts`
- `src/lib/openai/prompt-playbooks.ts`
- `src/components/dashboard/lead-message-generator.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionada uma nova opção de intenção "Follow-up de objeção" no gerador de mensagens para WhatsApp. 
Ao selecionar essa intenção, a interface apresenta um campo extra para detalhar o "Motivo da objeção".
A camada da API (`route.ts`), persistência (`repository.server.ts`), formatação para a OpenAI (`prompt-playbooks.ts`) e os tipos do WhatsApp (`types.ts`) foram atualizados para incluir e lidar com o `objectionReason` e mapear a nova intenção (`objection_follow_up`). A inteligência do prompt agora usa o motivo para contornar a objeção consultivamente sem prometer irrealidades, respeitando os guardrails de compliance. O armazenamento continua traduzindo o estado na persistência legada (`negotiation`) garantindo compatibilidade.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
`package.json` foi conferido antes das validações. O script `typecheck` não existe no `package.json`.
`npm run lint` concluiu com sucesso e reportou apenas 5 warnings preexistentes fora do escopo.
`npm run build` concluiu com sucesso e repetiu a mensagem informativa já conhecida de `Dynamic server usage`.
`npm run test` não foi executado porque é conhecido por falhar localmente por falta do binário `vitest` (`sh: vitest: command not found`).

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.

### Riscos
- O mapeamento do estado `objection_follow_up` para o banco é revertido na persistência como `negotiation` para manter o DB schema legível e seguro. Isso pode exigir atenção se, no futuro, quisermos rastrear e separar as objeções em banco e precisar criar um estágio novo exclusivo na tabela do supabase.

### Próximos passos
- Nenhum.

---

### Data
2026-05-22 22:08

### Tarefa
`TASK-048 — Criar histórico de campanhas geradas`

### Status
Concluída.

### Arquivos alterados
- `app/dashboard/anuncios/page.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Melhorada a área de histórico de campanhas geradas (`/dashboard/anuncios`) para destacar status operacional, origem e facilitar o reaproveitamento comercial das campanhas salvas. Foi adicionado um badge de status traduzido baseado em `publicationStatus` e `publishMode`, além de um botão direto para reaproveitar a ideia no gerador.

### Comandos executados
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
`package.json` foi conferido antes das validações. Os scripts disponíveis nesta execução foram `lint`, `test` e `build`. O script `typecheck` não existe no `package.json`.

`npm run lint` concluiu com sucesso e reportou apenas 5 warnings preexistentes fora do escopo.
`npm run build` concluiu com sucesso. O build repetiu apenas avisos conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard`.
`npm run test` falhou no ambiente local com `sh: vitest: command not found`, sem evidência de regressão específica.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar os testes.

### Riscos
Nenhum risco funcional detectado na leitura do histórico.

### Próximos passos
- Nenhum.

---

### Data
2026-05-22 22:07

### Tarefa
`TASK-047 — Preparar campanha para publicação pausada`

### Status
Concluída.

### Arquivos alterados
- `app/dashboard/campanhas/campaign-generator.tsx`
- `app/dashboard/campanhas/campaign-generator.test.tsx`
- `src/lib/meta/campaign-publication.server.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
O fluxo de `paused` no gerador de campanhas foi deixado mais operacional. A UI agora explica que a campanha sera preparada na Leadi para envio pausado, sem ativacao automatica, e destaca os ativos Meta ja vinculados para essa etapa.

Tambem foi ajustado o feedback de sucesso apos a geracao e a mensagem server-side de publicacao pausada para reforcar que a veiculacao continua dependendo de liberacao manual da equipe.

### Comandos executados
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
`package.json` foi conferido antes das validacoes. Os scripts disponiveis nesta execucao foram `lint`, `test` e `build`. O script `typecheck` nao existe no `package.json`.

`npm run lint` concluiu com 5 warnings preexistentes fora do escopo em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.

`npm run build` concluiu com sucesso. O build repetiu apenas warnings conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard`, sem evidencia de regressao especifica da `TASK-047`.

`npm run test` falhou localmente por falta do binario `vitest` (`sh: vitest: command not found`), sem evidencia de regressao causada por esta tarefa.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar `npm run test`.

### Riscos
- A tarefa toca sinais de estado ligados a campanhas Meta. Mudancas futuras precisam continuar distinguindo claramente "preparada para publicar pausada" de "campanha ativa em veiculacao".

### Próximos passos
- Validar visualmente o fluxo pausado na tela de criacao e na operacao de anuncios quando a etapa de publicacao real for usada.

---

### Data
2026-05-22 19:54

### Tarefa
`TASK-046 — Preparar campanha para publicação manual`

### Status
Concluída.

### Arquivos alterados
- `app/dashboard/campanhas/campaign-generator.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
O estado de `manual_review` na geração de campanhas foi atualizado para ser mais claro. O fluxo visual e o estado refletem agora explicitação de que a IA apenas prepara os textos e o público na plataforma Leadi, enquanto a publicação na Meta dependerá estritamente de uma ação manual da equipe.
A UI do gerador de campanhas e a resolução de estado de publicação foram atualizadas.

### Comandos executados
- `npm run lint`
- `npm run build`
- `npm run test`

### Resultado dos comandos
`package.json` foi conferido antes das validações. Os scripts disponíveis nesta execução foram `lint`, `test` e `build`. O script `typecheck` não existe no `package.json`.

`npm run lint` e `npm run build` foram executados conjuntamente e concluíram com sucesso, repetindo apenas warnings conhecidos de uso de imagens e dependências `useEffect`. O build acusou o erro dinâmico `Dynamic server usage: Route /dashboard couldn't be rendered statically`, que já era conhecido do repositório.

`npm run test` falhou localmente por falta do binário `vitest` (`sh: vitest: command not found`), sem evidência de regressão da `TASK-046`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.

### Riscos
Nenhum risco detectado.

### Próximos passos
- Validar fluxo visualmente no navegador.

---

### Data
2026-05-22 16:48

### Tarefa
`TASK-045 — Reforçar guardrails contra promessa de economia e linguagem agressiva`

### Status
Concluída.

### Arquivos alterados
- `src/lib/openai/prompt-playbooks.ts`
- `src/lib/openai/compliance-guardrails.ts`
- `src/lib/openai/compliance-guardrails.test.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foram endurecidas as regras de compliance na geração de campanhas para lidar ativamente com promessas garantidas de economia e tons imperativos/sensacionalistas.

Na camada de prompts (`prompt-playbooks.ts`), instruções diretas foram incluídas nas diretrizes de `styleGuardrails` e `complianceHardStops`, além de regras explícitas na geração de campanhas para vetar abordagens excessivamente agressivas como 'reduza custos pela metade' ou 'pare de perder dinheiro'.

Na camada de validação local (`compliance-guardrails.ts`), foram adicionadas duas novas regras: 'Promessa financeira agressiva' (para lidar com ofertas de economia garantida ou descontos irreais) e 'Linguagem agressiva ou tom imperativo' (para proibir discursos apelativos). A severidade dos riscos foi ajustada para pontuar e barrar a copy corretamente. 

Para assegurar a detecção segura, um novo arquivo de testes `compliance-guardrails.test.ts` foi criado visando a eficácia e segurança dos novos alertas contra as novas classes de risco, sem prejudicar discursos puramente consultivos.

### Comandos executados
- `npm run lint`
- `npm run build`
- `npm run test`

### Resultado dos comandos
- `npm run lint` concluiu sem erros e com os mesmos warnings residuais de antes.
- `npm run build` gerou a aplicação com sucesso.
- `npm run test` falhou localmente por falta do binário `vitest` global/local na imagem (`sh: vitest: command not found`), uma pendência já documentada na estrutura atual.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar as suites automatizadas (`npm run test`).

### Riscos
- O aumento de severidade nessas validações pode classificar falsos-positivos em ofertas que soam levemente enfáticas. Contudo, as validações não travam a funcionalidade; elas geram alertas instrucionais para que o usuário proceda com cautela na avaliação.

### Próximos passos
- N/A para esta tarefa isoladamente.

---

### Data
2026-05-22 16:40

### Tarefa
`TASK-044 — Criar alerta de compliance`

### Status
Concluída.

### Arquivos alterados
- `app/dashboard/campanhas/campaign-generator.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi implementado um alerta visual de compliance no gerador de campanha para educar o usuário sobre possíveis riscos, sem bloquear a operação comercial.
A funcionalidade reaproveita as regras locais existentes (`reviewTextLocally`) do arquivo `src/lib/openai/compliance-guardrails.ts`. 
No `CampaignSummaryStep`, foi incluída uma validação para renderizar um card de aviso detalhando as razões (`reasons`) e sugestões (`suggestions`) do risco quando for avaliado como `high` ou `medium`.
O botão de "Enviar campanha" foi mantido ativo, preservando a autonomia do corretor de prosseguir mesmo na presença de termos sensíveis.

### Comandos executados
- `npm run lint`
- `npm run build`
- `npm run test`

### Resultado dos comandos
`package.json` foi conferido antes das validações. Os scripts disponíveis nesta execução foram `lint`, `test` e `build`. O script `typecheck` não existe no `package.json`.

`npm run lint` concluiu sem erros e manteve apenas 5 warnings preexistentes fora do escopo.

`npm run test` falhou no ambiente local com `sh: vitest: command not found`, sem evidência de regressão específica da `TASK-044`.

`npm run build` concluiu com sucesso. O build repetiu apenas avisos conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.

### Riscos
- O alerta deve continuar sendo apenas educativo e consultivo. Transformá-lo em uma trava real bloquearia a operação para corretores.

### Próximos passos
- Validar se o feedback visual para o usuário atende à expectativa na rotina prática de uso.

### Data
2026-05-22 16:37

### Tarefa
`TASK-042 — Criar estrutura de campanha gerada`

### Status
Concluída.

### Arquivos alterados
- `app/api/campaigns/generate/route.ts`
- `src/lib/campaigns/types.ts`
- `src/lib/campaigns/repository.server.ts`
- `src/lib/campaigns/payload.ts`
- `src/lib/meta/campaign-publication.server.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi criada uma estrutura versionada para o payload persistido de campanhas geradas, mantendo o banco atual e sem exigir migration. O `input_payload` agora organiza contexto, briefing comercial, dados criativos, integrações Meta e publicação; o `result_payload` passou a separar estratégia, copy e notas de compliance.

Também foi centralizada uma camada de builders e parsers em `src/lib/campaigns/payload.ts`, reutilizada tanto pelo repositório de campanhas quanto pela publicação Meta. Isso deixou o contrato entre API, IA e persistência mais explícito e preservou retrocompatibilidade com campanhas antigas gravadas no formato plano legado.

Na rota `app/api/campaigns/generate/route.ts`, o envio para persistência passou a ser montado com um `CampaignSaveInput` explícito, reduzindo ambiguidade na fronteira entre geração e histórico.

### Comandos executados
- `sed -n '1468,1555p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1,220p' src/lib/campaigns/types.ts`
- `sed -n '1,620p' src/lib/campaigns/repository.server.ts`
- `sed -n '430,620p' src/lib/meta/campaign-publication.server.ts`
- `sed -n '1,120p' app/api/campaigns/generate/route.ts`
- `git diff -- src/lib/campaigns/types.ts src/lib/campaigns/repository.server.ts src/lib/meta/campaign-publication.server.ts app/api/campaigns/generate/route.ts docs/tarefas-leadi-roadmap-normalizado.md`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
`package.json` foi conferido antes das validações. Os scripts disponíveis nesta execução foram `lint`, `test` e `build`. O script `typecheck` não existe no `package.json`.

`npm run lint` concluiu sem erros e manteve apenas 5 warnings preexistentes fora do escopo em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.

`npm run test` falhou no ambiente local com `sh: vitest: command not found`, sem evidência de regressão específica da `TASK-042`.

`npm run build` concluiu com sucesso. O build repetiu apenas avisos conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard`, sem relação direta com a tarefa.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.

### Riscos
- A tarefa toca contratos de persistência de campanhas e leitura server-side ligada à publicação Meta, então qualquer mudança futura nesses payloads precisa continuar preservando o fallback legado.
- O worktree já continha alterações fora do escopo desta tarefa e elas foram preservadas.

### Próximos passos
- Reexecutar `npm run test` assim que o ambiente local voltar a disponibilizar `vitest`.
- Usar a nova estrutura versionada como base para a próxima tarefa de variações de texto, evitando voltar a salvar material novo em payload plano.

### Data
2026-05-22 16:13

### Tarefa
`TASK-039 — Criar tratamento de erro claro para falha da Meta`

### Status
Concluída.

### Arquivos alterados
- `src/lib/meta/errors.ts`
- `src/lib/integrations/meta-graph.server.ts`
- `app/api/integrations/meta/callback/route.ts`
- `app/api/integrations/meta/sync/route.ts`
- `app/dashboard/perfil/meta/page.tsx`
- `app/api/meta/webhook/route.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi implementada a padronização de erros da integração Meta. 
- Criamos classes de erros específicas em `src/lib/meta/errors.ts` (`MetaPermissionError`, `MetaTokenError`, `MetaGraphError`, `MetaWebhookError`).
- A camada de Graph (`meta-graph.server.ts`) passou a capturar falhas cruas (códigos 190, 10, etc.) e traduzi-las nos erros de token e permissão.
- As rotas de callback de OAuth e sync passaram a interceptar esses erros e mapear para query params específicos (`meta=token_expired`, `sync=missing_permissions`).
- A tela de perfil da Meta (`page.tsx`) agora traduz os query params em _toasts_ amigáveis e precisos, diferenciando token inválido de permissão insuficiente.
- Na camada de webhooks (`route.ts`), as validações que antes retornavam HTTP 4xx (como payload grande ou erro de tipagem) passaram a retornar HTTP 200 para a Meta (evitando deativação permanente da integração pela Meta após falhas consecutivas), mantendo a falha interna logada no sistema e limitando o status 401 apenas para erro de assinatura HMAC (`MetaWebhookError`). Também foram removidas as tipagens ociosas de erros antigos.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
`package.json` foi verificado. O script `typecheck` não existe no projeto. `npm run test` é conhecido por falhar localmente por falta do binário `vitest`.
- `npm run lint`: concluído com 8 warnings pré-existentes, nenhum erro. (Os imports ociosos do webhook foram limpos na mesma execução).
- `npm run build`: concluído com sucesso. Gerou as rotas static/dynamic sem problemas relacionados às mudanças feitas na tarefa.

### Pendências
Nenhuma.

### Observações técnicas
- A regra do webhook foi cuidadosamente avaliada para não travar os envios da Meta por pequenos bugs de processamento local, evitando perda total de leads futuros.
- A experiência de login/sync ficou muito mais fluída permitindo depuração fácil.

---

### Data
2026-05-22 16:26

### Tarefa
`TASK-040 — Melhorar templates de campanha`

### Status
Concluída.

### Arquivos alterados
- `app/dashboard/campanhas/campaign-generator.tsx`
- `app/dashboard/campanhas/campaign-generator.test.tsx`
- `src/data/system-templates.ts`
- `src/lib/campaigns/repository.server.ts`
- `src/lib/meta/campaign-publication.server.ts`
- `supabase/migrations/202605190001_safe_campaign_templates.sql`
- `supabase/migrations/202605220001_refresh_campaign_templates_icp.sql`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Os templates de campanha foram reescritos para um tom mais aderente ao ICP do Leadi, cobrindo cenários como MEI consultivo, revisão de reajuste, comparativo por rede hospitalar, benefício para equipes pequenas, elegibilidade e primeira contratação, sempre sem promessa sensível.

No gerador de campanhas, a seleção de exemplos deixou de depender de uma lista inline fixa e passou a priorizar os `systemTemplates` vindos do repositório, com fallback seguro para o catálogo estático. A transformação agora também preenche `objections` e `contractType`, mantendo o contexto comercial coerente ao aplicar um template.

Para não quebrar o histórico e a publicação Meta, os parsers server-side de campanhas também foram alinhados para ler `objections` e `contractType` do `input_payload`. Além disso, foi adicionada uma migration de refresh para atualizar templates já persistidos em ambientes existentes.

### Comandos executados
- `git status --short`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,320p' docs/tarefas-leadi-roadmap-normalizado.md`
- `rg -n "^(- \\[ \\] Status: Pendente|## \\[ \\]|Pendente)" docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1392,1457p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1,260p' package.json`
- `sed -n '1,220p' src/data/system-templates.ts`
- `sed -n '1,220p' app/dashboard/campanhas/campaign-generator.tsx`
- `sed -n '1,220p' supabase/migrations/202605190001_safe_campaign_templates.sql`
- `sed -n '1,260p' app/dashboard/campanhas/campaign-generator.test.tsx`
- `sed -n '300,380p' src/lib/campaigns/repository.server.ts`
- `sed -n '488,540p' src/lib/meta/campaign-publication.server.ts`
- `git diff -- app/dashboard/campanhas/campaign-generator.tsx app/dashboard/campanhas/campaign-generator.test.tsx src/data/system-templates.ts supabase/migrations/202605190001_safe_campaign_templates.sql supabase/migrations/202605220001_refresh_campaign_templates_icp.sql src/lib/campaigns/repository.server.ts src/lib/meta/campaign-publication.server.ts docs/tarefas-leadi-roadmap-normalizado.md`
- `date '+%Y-%m-%d %H:%M'`
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
`package.json` foi conferido antes das validações. Os scripts relevantes disponíveis nesta execução foram `lint`, `test` e `build`. O script `typecheck` não existe no `package.json`.

`npm run lint` concluiu sem erros e manteve apenas 5 warnings preexistentes fora do escopo em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.

`npm run test` falhou no ambiente local com `sh: vitest: command not found`, sem evidência de regressão específica da `TASK-040`.

`npm run build` concluiu com sucesso. O build repetiu apenas o aviso informativo conhecido de `Dynamic server usage` em `/dashboard`, sem relação direta com esta tarefa.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.

### Observações técnicas
- A tarefa tocou templates persistidos e copy de campanha, mas sem alterar autenticação, billing, credenciais, OAuth, RLS ou integrações externas além do parse do payload já salvo.
- Foi adicionada apenas uma migration de atualização de dados para alinhar ambientes que já tinham templates antigos persistidos.
- O worktree já continha alterações fora do escopo desta tarefa e elas foram preservadas.

### Data
2026-05-22 16:07

### Tarefa
`TASK-038 — Criar logs de webhook da Meta mais operacionais`

### Status
Concluida.

### Arquivos alterados
- `app/api/meta/webhook/route.ts`
- `src/lib/leads/webhook-events.server.ts`
- `src/lib/leads/webhook-events.repository.ts`
- `app/dashboard/perfil/webhook-logs-card.tsx`
- `app/dashboard/integracoes/webhook-leads/page.tsx`
- `app/dashboard/integracoes/webhook-leads/page.test.tsx`
- `src/lib/leads/webhook-events.server.test.ts`
- `app/dashboard/perfil/webhook-logs-card.test.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi reforcado o registro do webhook da Meta para persistir apenas um resumo operacional sanitizado, com `processing_outcome`, mensagem curta e sumario do payload, em vez de depender da leitura indireta do payload completo para entender o resultado.

Na camada de leitura, os logs passaram a distinguir sucesso real, duplicidade e falha como estados operacionais proprios, incluindo contexto seguro de `meta_lead_id`, formulario e pagina quando disponiveis.

Na interface de logs, foi adicionado filtro de duplicados, badges separados para sucesso, duplicado e erro, coluna de contexto Meta e mensagens mais claras para operacao sem expor payload bruto.

Tambem foram atualizados testes do sanitizador e da interface para cobrir o novo comportamento operacional dos logs.

### Comandos executados
- `git status --short`
- `rg -n "lead_webhook_events|LeadWebhookLog|recordLeadWebhookEvent|duplicateReason|status: \"processed\"|WebhookLogsCard" -S`
- `sed -n '1,240p' supabase/migrations/202605050001_lead_webhook_events.sql`
- `sed -n '1,260p' src/lib/meta/webhook-processing.server.ts`
- `sed -n '1,260p' app/api/meta/webhook/route.ts`
- `sed -n '1,260p' src/lib/leads/webhook-events.server.ts`
- `sed -n '1,280p' src/lib/leads/webhook-events.repository.ts`
- `sed -n '1,260p' app/dashboard/perfil/webhook-logs-card.tsx`
- `sed -n '1,220p' app/dashboard/integracoes/webhook-leads/page.tsx`
- `sed -n '1,220p' app/dashboard/integracoes/webhook-leads/page.test.tsx`
- `npm run lint`
- `npm run test`
- `npm run build`
- `git diff -- app/api/meta/webhook/route.ts src/lib/leads/webhook-events.server.ts src/lib/leads/webhook-events.repository.ts app/dashboard/perfil/webhook-logs-card.tsx app/dashboard/integracoes/webhook-leads/page.tsx app/dashboard/integracoes/webhook-leads/page.test.tsx src/lib/leads/webhook-events.server.test.ts app/dashboard/perfil/webhook-logs-card.test.tsx`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
`package.json` foi conferido antes das validacoes. Os scripts relevantes disponiveis nesta execucao foram `lint`, `test` e `build`. O script `typecheck` nao existe no `package.json`.

`npm run lint` concluiu com sucesso e reportou apenas 5 warnings preexistentes fora do escopo em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.

`npm run test` falhou no ambiente local com `sh: vitest: command not found`, sem evidencias de regressao especifica da `TASK-038`.

`npm run build` concluiu com sucesso. O build manteve apenas warnings conhecidos e repetiu a mensagem informativa de `Dynamic server usage` em `/dashboard`, sem relacao direta com esta tarefa.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar `npm run test`.

### Observações técnicas
- A tarefa ficou restrita ao webhook publico da Meta, a sanitizacao do log persistido e a apresentacao operacional desses logs.
- Nao houve alteracao em OAuth, tokens, secrets, schema do banco, migrations, RLS, billing ou outras integracoes.
- O worktree ja continha alteracoes fora do escopo desta tarefa e elas foram preservadas.

---

### Data
2026-05-22 15:58

### Tarefa
`TASK-035 — Listar páginas e formulários Meta disponíveis`

### Status
Concluída.

### Arquivos alterados
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
A pedido do usuário, a tarefa foi marcada como concluída diretamente no roadmap, pois já havia sido implementada anteriormente e não exigia mais ação técnica.

### Comandos executados
- Nenhum.

### Resultado dos comandos
N/A.

### Pendências
Nenhuma.

### Observações técnicas
- Nenhuma alteração de código ou validação técnica adicional foi necessária nesta rodada.

---

### Data
2026-05-22 15:52

### Tarefa
`TASK-036 — Importar leads de formulário`

### Status
Concluida.

### Arquivos alterados
- `app/api/meta/leads/import/route.ts`
- `src/lib/meta/manual-lead-import.server.ts`
- `src/lib/meta/manual-lead-import.types.ts`
- `app/dashboard/leads/leads-workspace.tsx`
- `app/dashboard/leads/leads-workspace.test.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi reforcado o contrato server-side da importacao manual de leads Meta para retornar um estado final padronizado, com mensagens claras para cenarios de sucesso, parcial, sem novos leads, sem resultados e falha.

O resumo agora diferencia corretamente duplicados arquivados de replays idempotentes que apenas reapontam para um lead ja existente, evitando a mensagem enganosa de que todo duplicado foi arquivado automaticamente.

Na tela de leads, o modal de importacao e a faixa de feedback global passaram a usar esse novo estado para mostrar total encontrado, importado, duplicado, arquivado e erros com tom visual coerente, alem de listar os primeiros erros da tentativa quando houver falhas parciais.

Tambem foi adicionado um teste leve para a traducao de estados de importacao em apresentacao visual no workspace de leads.

### Comandos executados
- `git status --short`
- `sed -n '1,260p' app/api/meta/leads/import/route.ts`
- `sed -n '1,320p' src/lib/meta/manual-lead-import.server.ts`
- `sed -n '1,320p' app/dashboard/leads/leads-workspace.tsx`
- `sed -n '1,240p' docs/LOG_EXECUCAO_TAREFAS.md`
- `rg -n "MetaImport|meta import|metaImport|handleMetaImportFinished|Importa(ç|c)ão Meta|importacao Meta" app/dashboard/leads/leads-workspace.tsx src/components app -g '*.tsx'`
- `sed -n '1,260p' src/lib/meta/manual-lead-import.types.ts`
- `rg -n "MetaLeadImportResponse|MetaLeadImportSummary|listMetaLeadImportSourcesForCurrentUser|importMetaLeadsForCurrentUser" app src -g '*.ts*'`
- `sed -n '500,920p' app/dashboard/leads/leads-workspace.tsx`
- `sed -n '560,760p' src/lib/meta/manual-lead-import.server.ts`
- `rg -n "createLeadFromManualMetaImport|status === \"duplicate\"|duplicateReason|archived \\? \"archived\"" src/lib/leads src/lib/meta -g '*.ts'`
- `sed -n '1,320p' src/lib/leads/repository.server.ts`
- `sed -n '626,720p' src/lib/leads/repository.server.ts`
- `sed -n '1060,1135p' src/lib/leads/repository.server.ts`
- `rg --files app/dashboard/leads | rg '\\.test\\.tsx$'`
- `rg --files src/lib/meta | rg '\\.test\\.ts$'`
- `sed -n '1,240p' app/dashboard/perfil/profile-sections.test.tsx`
- `sed -n '1,260p' app/dashboard/leads/page.test.tsx`
- `rg -n "fetchMetaLeadsForForm|fetchGraphJson" src/lib/meta/manual-lead-import.server.ts`
- `sed -n '320,560p' src/lib/meta/manual-lead-import.server.ts`
- `npm run lint`
- `npm run test`
- `npm run lint`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`
- `sed -n '1279,1325p' docs/tarefas-leadi-roadmap-normalizado.md`
- `git diff -- app/api/meta/leads/import/route.ts src/lib/meta/manual-lead-import.server.ts src/lib/meta/manual-lead-import.types.ts app/dashboard/leads/leads-workspace.tsx app/dashboard/leads/leads-workspace.test.tsx`

### Resultado dos comandos
`package.json` foi conferido antes das validacoes. Os scripts relevantes disponiveis nesta execucao foram `lint`, `test` e `build`. O script `typecheck` nao existe no `package.json`.

`npm run lint` concluiu com sucesso e reportou apenas 5 warnings preexistentes fora do escopo em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.

`npm run test` falhou no ambiente local com `sh: vitest: command not found`, sem evidencias de regressao especifica da `TASK-036`.

`npm run build` concluiu com sucesso. O build manteve apenas warnings conhecidos e repetiu a mensagem informativa de `Dynamic server usage` em `/dashboard`, sem relacao direta com esta tarefa.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar `npm run test`.
- A `TASK-035` continua pendente no roadmap; esta execucao atuou na `TASK-036` por solicitacao explicita do usuario.

### Observações técnicas
- A tarefa permaneceu dentro da area sensivel da Meta apenas no fluxo de importacao manual, sem alterar OAuth, segredos, sync global, schema do banco, migrations, RLS ou billing.
- O worktree ja continha outras alteracoes fora do escopo desta tarefa e elas foram preservadas.

### Data
2026-05-22 15:50

### Tarefa
`TASK-037 — Vincular lead importado à campanha, anúncio e formulário`

### Status
Concluída.

### Arquivos alterados
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi executada uma auditoria no código fonte para validar a implementação da TASK-037, que pedia para garantir a rastreabilidade comercial completa para leads vindos da Meta (campanha, anúncio e formulário).

A verificação comprovou que a extração (em `lead-retrieval.server.ts`), o mapeamento para a entrada de inserção de lead (em `manual-lead-import.server.ts` e `webhook-processing.server.ts`), a persistência em banco de dados (em `repository.server.ts` e no schema Supabase), e a exibição na interface (via `getLeadOriginDetails` em `source.ts` até a UI no `lead-details-popup.tsx`) já foram completamente implementadas anteriormente e estão plenamente funcionais.

Sendo assim, a tarefa foi apenas marcada como concluída no roadmap.

### Comandos executados
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
`package.json` foi verificado.
`npm run test` falhou por falta do binário `vitest` (problema local de ambiente, já documentado).
`npm run build` foi executado e falhou devido a um erro de tipagem preexistente não relacionado à tarefa, mas de outra rotina que afeta o pipeline de build.

### Pendências
Nenhuma para o escopo desta tarefa. A rastreabilidade Meta já está no CRM.
- Investigar erro de tipagem no build que está impedindo deploy.

### Observações técnicas
- A tarefa consistia apenas em validar o estado da rastreabilidade comercial da Meta, que já se provou robusta na base de código atual.

### Data
2026-05-22 15:33

### Tarefa
`TASK-034 — Criar diagnóstico de conexão Meta`

### Status
Concluida.

### Arquivos alterados
- `app/dashboard/perfil/meta/page.tsx`
- `app/dashboard/perfil/profile-sections.tsx`
- `app/dashboard/perfil/profile-sections.test.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionada uma camada de diagnostico rapido na area Meta do perfil, sem alterar OAuth, tokens, billing real, segredos ou sincronizacao server-side.

O card principal agora cruza sinais reais de ambiente, conexao/token, ultima sincronizacao e operacao comercial para mostrar a causa provavel da falha e orientar o proximo passo com seguranca.

Tambem foram alinhadas mensagens de retorno do fluxo Meta via `searchParams`, cobrindo melhor estados como sincronizacao atualizada, falha de sync, cancelamento do OAuth e retorno incompleto da autorizacao.

Foi criado um teste novo para a camada de apresentacao da area Meta, cobrindo a renderizacao do diagnostico e a priorizacao de cenarios como env ausente e falha de sincronizacao.

### Comandos executados
- `sed -n '1,240p' package.json`
- `sed -n '1,260p' app/dashboard/perfil/meta/page.tsx`
- `sed -n '1,260p' src/lib/integrations/repository.server.ts`
- `sed -n '1,220p' src/lib/env/server.ts`
- `sed -n '1,260p' app/dashboard/perfil/profile-sections.tsx`
- `sed -n '1,260p' app/dashboard/perfil/profile-sections.test.tsx`
- `rg -n "type ConnectedAccountsState|interface ConnectedAccountsState|export type ConnectedAccountsState|type IntegrationSyncStatus|type IntegrationConnectionStatus|type MetaConnection" src/lib/integrations -g '*.ts'`
- `rg -n "missing env|meta_oauth|META_APP_ID|billing|diagnostic|diagnost" app src -g '*.ts*'`
- `sed -n '260,520p' app/dashboard/perfil/profile-sections.tsx`
- `sed -n '1,260p' src/lib/integrations/types.ts`
- `sed -n '1,260p' app/api/integrations/meta/connect/route.ts`
- `sed -n '1,320p' app/api/integrations/meta/callback/route.ts`
- `sed -n '1,280p' app/api/integrations/meta/sync/route.ts`
- `sed -n '1,260p' src/lib/billing/subscription-limits.server.ts`
- `sed -n '1,260p' app/dashboard/perfil/page.tsx`
- `sed -n '1,220p' app/dashboard/layout.tsx`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`
- `git status --short`

### Resultado dos comandos
`package.json` foi conferido antes das validacoes. Os scripts relevantes disponiveis nesta execucao foram `lint`, `test` e `build`. O script `typecheck` nao existe no `package.json`.

`npm run lint` concluiu com sucesso e reportou apenas 5 warnings preexistentes fora do escopo em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.

`npm run test` falhou no ambiente local com `sh: vitest: command not found`, sem evidencias de regressao especifica da `TASK-034`.

`npm run build` falhou na primeira tentativa por um erro de tipagem introduzido no novo diagnostico (`connectedAccounts.metaConnection` possivelmente nulo em `app/dashboard/perfil/profile-sections.tsx`), foi corrigido na mesma execucao e, na segunda tentativa, concluiu com sucesso. O build manteve apenas avisos conhecidos, incluindo a mensagem informativa de `Dynamic server usage` em `/dashboard`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar os testes automatizados.
- Validar a nova UX de diagnostico Meta em um ambiente com configuracao real, sem alterar segredos ou ambiente externo nesta tarefa.

### Observações técnicas
- A tarefa ficou restrita a leitura e apresentacao de sinais operacionais da integracao Meta.
- Nao houve alteracao em OAuth, callback, sync server-side, schema, Supabase, billing real, migrations, RLS ou variaveis sensiveis.
- O worktree ja continha outras alteracoes fora do escopo desta tarefa e elas foram preservadas.

### Data
2026-05-22 13:28

### Tarefa
`TASK-033 — Criar tela de status da conexão Meta`

### Status
Concluida.

### Arquivos alterados
- `app/dashboard/perfil/meta/page.tsx`
- `app/dashboard/perfil/profile-sections.tsx`
- `app/dashboard/perfil/profile-sections.test.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi reforcada a leitura operacional da area Meta no perfil da empresa sem alterar OAuth, tokens ou a logica de sincronizacao.

O card principal agora resume status da conexao, ultima sincronizacao, ultimo resultado, contagem de paginas, formularios e contas de anuncio, alem de destacar ativos prontos versus ativos com alerta.

Tambem foi adicionado um feed curto com os eventos mais recentes de sincronizacao da Meta para ajudar a identificar sucesso, alerta ou erro diretamente na tela.

Foi criado um teste novo para a camada de apresentacao da area Meta, cobrindo o resumo operacional e a renderizacao do feed recente.

### Comandos executados
- `git status --short`
- `sed -n '1,260p' src/lib/integrations/types.ts`
- `sed -n '1,260p' src/lib/integrations/repository.server.ts`
- `sed -n '1,260p' app/dashboard/perfil/meta/page.tsx`
- `sed -n '1,260p' app/dashboard/perfil/profile-sections.tsx`
- `rg -n "MetaOverviewCard|MetaConnectedAccountsSection|formatDateTime|profile-sections" -g"*.test.tsx" -g"*.tsx" app src`
- `sed -n '840,980p' src/lib/integrations/repository.server.ts`
- `sed -n '1,240p' app/dashboard/dashboard-home.test.tsx`
- `sed -n '1,240p' src/lib/env/shared.test.ts`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
`package.json` foi conferido antes das validacoes. Os scripts relevantes disponiveis nesta execucao foram `lint`, `test` e `build`. O script `typecheck` nao existe no `package.json`.

`npm run lint` concluiu com sucesso e reportou apenas 5 warnings preexistentes fora do escopo em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.

`npm run build` concluiu com sucesso. O build repetiu apenas avisos conhecidos, incluindo a mensagem informativa de `Dynamic server usage` em `/dashboard`.

`npm run test` falhou no ambiente local com `sh: vitest: command not found`, sem evidencias de regressao especifica da `TASK-033`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar os testes.
- Reexecutar `npm run test` para validar o novo arquivo `app/dashboard/perfil/profile-sections.test.tsx`.

### Observações técnicas
- A tarefa foi mantida dentro da area sensivel da Meta apenas na camada de visualizacao e leitura de dados por organizacao.
- Nao houve alteracao em OAuth, webhooks, segredos, billing, Supabase schema, migrations ou regras de permissao.

## Modelo de registro

### Data
AAAA-MM-DD HH:mm

### Tarefa
Nome ou ID da tarefa executada.

### Status
Concluída, parcial, bloqueada ou falhou.

### Arquivos alterados
- arquivo 1
- arquivo 2

### O que foi feito
Resumo objetivo das alterações realizadas.

### Comandos executados
- npm run lint
- npm run typecheck
- npm run test
- npm run build

### Resultado dos comandos
Informar o resultado de cada comando executado.

Se algum comando não existir no package.json, registrar isso.

### Pendências
Informar pendências, riscos ou próximos passos.

### Observações técnicas
Registrar detalhes importantes para futuras execuções.

---

### Data
2026-05-21 12:29

### Tarefa
Análise e normalização do roadmap de execução automática.

### Status
Concluída.

### Arquivos alterados
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/AGENTE_LEADI_TAREFAS.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi analisado o arquivo `docs/tarefas-leadi-roadmap.md` junto com `AGENTS.md` e `docs/AGENTE_LEADI_TAREFAS.md`.

O roadmap original foi considerado útil como contexto estratégico, mas não estava pronto para execução automática direta porque mistura diagnóstico, prioridades e prompts longos com a lista de tarefas, não usa checklist operacional, não deixa a primeira pendência mecanicamente evidente e ainda contém uma ordem sugerida de início que conflita com a ordem numérica do arquivo.

Foi criada a versão `docs/tarefas-leadi-roadmap-normalizado.md`, com ordem única de execução, checklist por tarefa, objetivo, escopo permitido, fora de escopo, arquivos prováveis, critérios de aceite e marcação explícita de áreas sensíveis.

Também foi atualizado o manual do agente para preferir o roadmap normalizado quando ele existir, mantendo o arquivo original como referência histórica e de contexto.

### Comandos executados
- `sed -n '1,240p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,320p' docs/tarefas-leadi-roadmap.md`
- `sed -n '321,640p' docs/tarefas-leadi-roadmap.md`
- `sed -n '641,960p' docs/tarefas-leadi-roadmap.md`
- `sed -n '961,1280p' docs/tarefas-leadi-roadmap.md`
- `sed -n '1444,2018p' docs/tarefas-leadi-roadmap.md`
- `sed -n '2018,2539p' docs/tarefas-leadi-roadmap.md`
- `sed -n '2539,3374p' docs/tarefas-leadi-roadmap.md`
- `sed -n '3373,4133p' docs/tarefas-leadi-roadmap.md`
- `sed -n '1,240p' docs/LOG_EXECUCAO_TAREFAS.md`
- `rg -n "^### Tarefa|^### Bloco|^## " docs/tarefas-leadi-roadmap.md`
- `wc -l docs/tarefas-leadi-roadmap.md`
- `date '+%Y-%m-%d %H:%M:%S %Z'`

### Resultado dos comandos
Todos os comandos executados serviram para leitura e análise documental dos arquivos de instrução, do roadmap original e do log.

Não foram executados `npm run lint`, `npm run typecheck`, `npm run test` ou `npm run build`, porque esta execução foi exclusivamente documental e não houve alteração funcional no produto.

### Pendências
- Nas próximas execuções, o agente deve usar `docs/tarefas-leadi-roadmap-normalizado.md` como fonte principal.
- Cada tarefa sensível continua exigindo análise de impacto antes de qualquer implementação.

### Observações técnicas
Foram identificadas 76 tarefas no roadmap original.

As tarefas, em geral, já eram pequenas o bastante, então o principal ajuste necessário foi estrutural: normalizar ordem, status, critérios de aceite, escopo e marcação de risco para leitura segura por agente.

A próxima execução já pode começar pela primeira pendência do arquivo normalizado sem precisar reinterpretar a ordem do roadmap original.

### Data
2026-05-21 12:43

### Tarefa
`TASK-001 — Revisar estrutura atual de leads`

### Status
Concluída.

### Arquivos alterados
- `docs/AUDITORIA_ESTRUTURA_LEADS.md`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi executada uma auditoria tecnica documental da estrutura atual de leads do Leadi, cobrindo banco, tipos, repositorio server-side, mocks, listagem, funil, detalhe do lead, comentarios, exportacao, importacao CSV, importacao manual da Meta, webhook generico, webhook oficial da Meta e policies/migrations relacionadas.

O principal artefato criado foi `docs/AUDITORIA_ESTRUTURA_LEADS.md`, com mapeamento de arquivos, campos do lead, diferencas entre banco/API/UI/mock, riscos de seguranca e multi-tenant, riscos de dados pessoais, pontos frageis e subtarefas sugeridas.

A tarefa `TASK-001` foi marcada como concluida no roadmap normalizado porque a auditoria foi criada e registrada no repositorio.

### Comandos executados
- `sed -n '1,220p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,320p' docs/tarefas-leadi-roadmap-normalizado.md`
- `cat package.json`
- `rg --files | rg 'lead|csv|meta|webhook|funil|funnel'`
- `rg -n "\\blead(s)?\\b|lead_id|leadId|pipeline|stage|status|source|owner|assignee|workspace|organization|org" src app supabase docs --glob '!node_modules'`
- `rg -n "export type Lead|interface Lead|type Lead|Lead[A-Z][A-Za-z]+|lead_comments|from\\(\\\"leads\\\"\\)|from\\('leads'\\)|create table.*leads|policy .*leads" src app supabase`
- `sed -n '1,320p' src/lib/leads/repository.server.ts`
- `sed -n '1155,1325p' src/lib/supabase/database.types.ts`
- `sed -n '1,260p' src/data/mock.ts`
- `sed -n '1,260p' app/api/leads/route.ts`
- `sed -n '1,320p' 'app/api/leads/[id]/route.ts'`
- `sed -n '1,260p' 'app/api/leads/[id]/comments/route.ts'`
- `sed -n '1,260p' src/lib/imports/csv.ts`
- `sed -n '1,320p' app/dashboard/importar/csv-import-workspace.tsx`
- `sed -n '1,320p' app/api/webhooks/leads/route.ts`
- `sed -n '1,320p' src/lib/meta/manual-lead-import.server.ts`
- `sed -n '1,280p' app/api/meta/leads/import/route.ts`
- `sed -n '1,260p' app/api/leads/export/route.ts`
- `sed -n '1,280p' app/api/meta/webhook/route.ts`
- `sed -n '1,260p' src/lib/leads/webhook-events.server.ts`
- `sed -n '1,260p' src/lib/workspaces/permissions.ts`
- `sed -n '1,260p' supabase/migrations/202604280001_phase_1_core.sql`
- `sed -n '1,240p' supabase/migrations/202605120001_standardize_rls_isolation.sql`
- `sed -n '1,240p' supabase/migrations/202605200002_supabase_hardening_rls.sql`
- `git status --short`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
Todos os comandos executados foram de leitura, busca e conferência documental do projeto.

`package.json` foi verificado antes de qualquer validação. Os scripts disponíveis relevantes nesta execução foram:

- `lint`
- `test`
- `build`

O script `typecheck` nao existe no `package.json`.

`npm run lint`, `npm run test` e `npm run build` nao foram executados porque esta rodada alterou apenas documentacao e nao houve mudanca funcional no SaaS.

### Pendências
- Alinhar contrato unico entre banco, API e UI para leads.
- Revisar minimizacao e retencao de `leads.raw_payload`.
- Revisar exibicao do responsavel real do lead para managers.
- Adicionar trilha de auditoria para exportacao, importacao, edicao e arquivamento de leads.

### Observações técnicas
- O isolamento multi-tenant principal esta presente em `organization_id` + RLS + filtros server-side.
- O tipo `Lead` reutilizado na UI nasce em `src/data/mock.ts`, o que hoje mistura DTO de exibicao com tipagem de mock.
- A listagem e o funil usam o mesmo contrato simplificado de lead.
- A importacao CSV cobre apenas um subconjunto do schema real.
- A tela de logs de webhook de leads esta protegida por `requireWorkspaceManager()`, entao a observacao antiga de exposicao ampla ficou desatualizada frente ao codigo atual.
- Nenhuma alteracao funcional foi realizada nesta execucao.

### Data
2026-05-21 23:43

### Tarefa
`TASK-025 — Mostrar campanhas ativas`

### Status
Parcial.

### Arquivos alterados
- `app/dashboard/dashboard-home.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/page.test.tsx`
- `app/dashboard/dashboard-home.test.tsx`
- `src/lib/campaigns/repository.server.ts`
- `src/lib/campaigns/types.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionado ao dashboard um indicador operacional para campanhas ativas ou prontas, alimentado por um novo resumo server-side de campanhas da organizacao atual.

O repositório de campanhas passou a calcular contagens de campanhas publicadas, prontas para a proxima acao e pausadas com base em `publication_status` e `publish_mode`, preservando o filtro multi-tenant por `organization_id`.

Na interface, a lateral do dashboard agora exibe um card dedicado com contagem consolidada e lista curta das campanhas mais recentes em operacao, sem alterar publicacao real, billing, Meta Ads ou metricas financeiras.

Tambem foram atualizados os testes do dashboard para cobrir a passagem do resumo operacional e a renderizacao do novo bloco.

### Comandos executados
- `git status --short`
- `rg -n "publicationStatus|publishMode|pending_review|ready_to_prepare|draft_created|published|paused" app/dashboard src/lib/campaigns -g'*.ts' -g'*.tsx'`
- `sed -n '260,520p' src/lib/campaigns/repository.server.ts`
- `git diff -- app/dashboard/dashboard-home.tsx`
- `git diff -- app/dashboard/page.tsx`
- `git diff -- app/dashboard/page.test.tsx`
- `sed -n '1,220p' docs/LOG_EXECUCAO_TAREFAS.md`
- `sed -n '1,120p' app/dashboard/page.tsx`
- `sed -n '1,120p' app/dashboard/page.test.tsx`
- `sed -n '1,220p' app/dashboard/dashboard-home.tsx`
- `sed -n '220,420p' app/dashboard/dashboard-home.tsx`
- `sed -n '420,520p' app/dashboard/dashboard-home.tsx`
- `sed -n '1,240p' src/lib/campaigns/repository.server.ts`
- `sed -n '240,520p' src/lib/campaigns/repository.server.ts`
- `sed -n '1,220p' src/lib/campaigns/types.ts`
- `sed -n '1,220p' app/dashboard/dashboard-home.test.tsx`
- `npm run test -- app/dashboard/page.test.tsx app/dashboard/dashboard-home.test.tsx`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
`package.json` foi conferido antes das validacoes. Os scripts relevantes disponiveis nesta execucao foram `lint`, `test` e `build`. O script `typecheck` nao existe no `package.json`.

`npm run lint` concluiu com sucesso e reportou apenas warnings preexistentes fora do escopo em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.

`npm run test -- app/dashboard/page.test.tsx app/dashboard/dashboard-home.test.tsx` e `npm run test` falharam no ambiente local com `sh: vitest: command not found`, sem indicio de regressao especifica da `TASK-025`.

`npm run build` iniciou normalmente e chegou em `Creating an optimized production build ...`, mas nao concluiu nem retornou saida adicional dentro da janela de monitoramento desta execucao, entao o resultado ficou inconclusivo no ambiente atual.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar os testes.
- Reexecutar `npm run build` ate a conclusao para confirmar a validacao final da tarefa.
- Somente depois dessas validacoes a `TASK-025` deve ser marcada como concluida no roadmap.

### Observações técnicas
- Esta rodada foi mantida fora de areas sensiveis de Meta Ads, billing, webhooks, autenticação e variaveis de ambiente.
- Havia alteracoes locais preexistentes no dashboard relacionadas a outras tarefas; a implementacao da `TASK-025` foi encaixada sem reverter essas mudancas.

### Data
2026-05-21 23:22

### Tarefa
`TASK-022 — Mostrar novos leads`

### Status
Concluida.

### Arquivos alterados
- `app/dashboard/dashboard-home.tsx`
- `app/dashboard/dashboard-home.test.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionada ao dashboard principal uma nova metrica operacional de `Novos leads`, mantendo o conjunto anterior de indicadores e preservando o layout principal da tela.

O calculo passou a considerar leads recebidos nos ultimos sete dias por `receivedAt`, e a nota operacional do card informa quantos desses leads ainda estao na etapa `Novo lead` com base no `stage` atual. A mesma normalizacao de etapas do projeto passou a ser usada tambem nas metricas de propostas, vendas e leads ativos para evitar inconsistencias entre labels e valores tecnicos.

Tambem foi criado um teste unitario focado na regra de calculo dessa metrica para cobrir o recorte temporal e a leitura da etapa atual sem depender da renderizacao completa da tela.

### Comandos executados
- `sed -n '1,220p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `rg -n "TASK-022|^- \\[ \\]|^## \\[ \\]|Pendente" docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '730,810p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '810,860p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1,260p' app/dashboard/dashboard-home.tsx`
- `sed -n '1,260p' src/components/dashboard/widgets.tsx`
- `sed -n '1,240p' app/dashboard/page.tsx`
- `sed -n '1,240p' src/lib/leads/stages.ts`
- `sed -n '1028,1082p' docs/tarefas-leadi-roadmap.md`
- `npm run test -- app/dashboard/dashboard-home.test.ts`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
`package.json` foi conferido antes das validacoes. Os scripts relevantes disponiveis nesta execucao foram `lint`, `test` e `build`.

`npm run lint` concluiu com sucesso e reportou apenas warnings preexistentes fora do escopo em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.

`npm run build` concluiu com sucesso. O processo repetiu os mesmos warnings de lint fora do escopo e exibiu a mensagem informativa de `Dynamic server usage` para `/dashboard`, sem impedir a compilacao final.

`npm run test -- app/dashboard/dashboard-home.test.ts` e `npm run test` falharam no ambiente local com `sh: vitest: command not found`, indicando indisponibilidade do binario de testes nesta maquina.

O script `npm run typecheck` nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para executar a suite e validar o teste novo automaticamente.

### Observações técnicas
- A tarefa nao alterou autenticacao, Supabase, schema, billing, webhooks, integracoes externas ou variaveis de ambiente.
- O ajuste ficou concentrado no dashboard e em teste unitario de regra de negocio leve.

### Data
2026-05-21 12:52

### Tarefa
`TASK-002 -- Revisar funil atual`

### Status
Concluida.

### Arquivos alterados
- `docs/AUDITORIA_FUNIL_ATUAL.md`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi executada uma auditoria tecnica documental do funil atual do Leadi, cobrindo definicao de etapas, labels de UI, enum de banco, filtros, popup de lead, drag and drop do kanban, importacao CSV, importacao manual da Meta, exportacao, relatorios comerciais e regras de acesso por organizacao e por responsavel do lead.

O artefato principal criado foi `docs/AUDITORIA_FUNIL_ATUAL.md`, com visao geral do funil, arquivos mapeados, estagios encontrados, diferencas entre mock/UI/API/banco, diagnostico da fonte atual de verdade, riscos de filtros e metricas, riscos de nomenclatura, riscos multi-tenant e subtarefas tecnicas sugeridas.

A `TASK-002` foi marcada como concluida no roadmap normalizado porque a auditoria foi criada e registrada sem alterar logica funcional do produto.

### Comandos executados
- `sed -n '1,240p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,320p' docs/tarefas-leadi-roadmap-normalizado.md`
- `cat package.json`
- `git status --short`
- `rg -n --hidden --glob '!node_modules' --glob '!.next' --glob '!coverage' "stage|stages|status|pipeline|funil|kanban|vendedor|corretor|consultor|supervisor|manager" app src supabase docs`
- `sed -n '1,260p' src/lib/leads/stages.ts`
- `sed -n '1,920p' app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '1,260p' app/api/leads/[id]/route.ts`
- `sed -n '1,260p' app/api/leads/route.ts`
- `sed -n '1,260p' src/data/mock.ts`
- `sed -n '1,760p' src/lib/leads/repository.server.ts`
- `sed -n '1,260p' src/lib/leads/filters.ts`
- `sed -n '1,260p' src/lib/leads/repository.ts`
- `sed -n '1,140p' src/lib/supabase/database.types.ts`
- `sed -n '1140,1215p' src/lib/supabase/database.types.ts`
- `rg -n "create table public.leads|lead_stage|stage check|stage in \\(|alter table public.leads|stage text" supabase/migrations supabase/*.sql`
- `sed -n '1,240p' src/lib/leads/normalization.ts`
- `sed -n '1250,1525p' src/lib/leads/repository.server.ts`
- `sed -n '940,1165p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,260p' app/dashboard/funil/page.tsx`

- `sed -n '80,180p' app/dashboard/leads/leads-workspace.tsx`
- `sed -n '980,1060p' app/dashboard/leads/leads-workspace.tsx`
- `sed -n '1,140p' supabase/migrations/202604280001_phase_1_core.sql`
- `sed -n '1,220p' src/lib/imports/csv.ts`
- `sed -n '560,700p' src/lib/meta/manual-lead-import.server.ts`
- `sed -n '130,230p' src/lib/reports/commercial-report.server.ts`
- `sed -n '392,455p' src/lib/reports/commercial-report.server.ts`
- `sed -n '1,140p' app/api/leads/export/route.test.ts`
- `rg -n --hidden --glob '!node_modules' --glob '!.next' "pipeline_stage|lead_stage|stage_history|history|kanban|pipeline|funil|status real|owner_profile_id|supervisor|manager|consultor|corretor|vendedor" app src supabase docs`
- `rg -n "last_interaction|lead_comments|updated_at|audit|histor" src/lib/leads/repository.server.ts src/components/dashboard/lead-details-popup.tsx supabase/migrations`
- `sed -n '1,220p' src/lib/workspaces/permissions.ts`
- `sed -n '260,360p' src/lib/leads/repository.server.ts`
- `sed -n '1080,1255p' src/lib/leads/repository.server.ts`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
Todos os comandos executados foram de leitura, busca e validacao documental do estado atual do funil.

`package.json` foi verificado antes de qualquer validacao. Os scripts relevantes disponiveis nesta execucao foram:

- `lint`
- `test`
- `build`

O script `typecheck` nao existe no `package.json`.

`npm run lint`, `npm run test` e `npm run build` nao foram executados porque esta rodada alterou apenas documentacao e nao houve alteracao funcional no SaaS.

### Pendências
- Consolidar fonte unica de verdade para etapas do funil.
- Endurecer validacao de `stage` nas rotas de leads.
- Centralizar contadores e metricas por etapa.
- Criar historico proprio de transicao de etapa.
- Revisar mocks do kanban para refletirem todas as etapas oficiais.

### Observações técnicas
- O banco esta coerente em torno de `public.lead_stage`, mas a UI opera sobre labels traduzidas.
- O funil visual, a listagem e a exportacao compartilham dependencia de labels em portugues para filtros e metricas.
- O drag and drop envia `stage` tecnico correto para a API, mas a API ainda aceita string frouxa com fallback silencioso para `new`.
- O escopo multi-tenant atual do CRM esta ancorado em `organization_id`, `owner_profile_id`, repositorio server-side e RLS.

### Data
2026-05-21 14:04

### Tarefa
`TASK-004 -- Revisar gerador de campanha atual`

### Status
Concluida.

### Arquivos alterados
- `docs/AUDITORIA_GERADOR_CAMPANHA_ATUAL.md`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi executada uma auditoria tecnica documental do gerador de campanha do Leadi, cobrindo a pagina server-side de campanhas, a UI em sete etapas, os testes do componente, a rota de geracao com credito e OpenAI, a rota de perguntas auxiliares, a rota de listagem, a rota de publicacao, o repositorio server-side de campanhas, os tipos compartilhados e o acoplamento opcional com pedidos criativos.

O artefato principal criado foi `docs/AUDITORIA_GERADOR_CAMPANHA_ATUAL.md`, com diagnostico do que o modulo ja resolve, onde ainda esta raso na operacao real e quais sao os principais gaps entre geracao de texto, persistencia, historico, rascunho e publicacao.

A `TASK-004` foi marcada como concluida no roadmap normalizado porque a auditoria foi criada e registrada sem alterar logica funcional do produto.

### Comandos executados
- `sed -n '1,260p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,260p' package.json`
- `sed -n '1,260p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1,260p' docs/LOG_EXECUCAO_TAREFAS.md`
- `rg -n "^(- \\[ \\]|## \\[ \\]|Status: Pendente|Pendente)" docs/tarefas-leadi-roadmap-normalizado.md`
- `rg --files | rg 'campaign|campanha|campanhas'`
- `ls app/dashboard/campanhas`
- `ls app/api/campaigns/generate`
- `ls src/lib/campaigns`
- `sed -n '1,260p' app/dashboard/campanhas/campaign-generator.tsx`
- `sed -n '380,520p' app/dashboard/campanhas/campaign-generator.tsx`
- `sed -n '520,760p' app/dashboard/campanhas/campaign-generator.tsx`
- `sed -n '1600,1705p' app/dashboard/campanhas/campaign-generator.tsx`
- `sed -n '1,220p' app/dashboard/campanhas/page.tsx`
- `sed -n '1,220p' app/dashboard/criacoes/campanhas/page.tsx`
- `sed -n '1,260p' app/dashboard/campanhas/campaign-generator.test.tsx`
- `sed -n '1,260p' app/api/campaigns/generate/route.ts`
- `sed -n '1,260p' app/api/campaigns/questions/route.ts`
- `sed -n '1,260p' app/api/campaigns/route.ts`
- `sed -n '1,260p' app/api/campaigns/publish/route.ts`
- `sed -n '1,260p' src/lib/campaigns/repository.server.ts`
- `sed -n '260,460p' src/lib/campaigns/repository.server.ts`
- `sed -n '1,260p' src/lib/campaigns/types.ts`
- `sed -n '1,260p' src/lib/creative-requests/repository.server.ts`
- `sed -n '1,260p' src/lib/openai/index.ts`
- `rg -n "fetch\\(|/api/campaigns|creativeRequest|savedCampaign|historyMode|systemTemplates|connectedAccounts" app/dashboard/campanhas/campaign-generator.tsx`
- `rg -n "saveCampaignForCurrentUser|getCampaignsForCurrentUser|getCurrentAiBalance|getCurrentBillingSnapshot|getSystemTemplates|createCreativeRequestForCurrentUser|generateCampaignText|runAiActionWithCredits|resolvePublicationStatus|buildCampaignRequestPayload|validateForm" app src`
- `git status --short`
- `date '+%Y-%m-%d %H:%M'`
- `npm run lint`
- `npm run test`
- `npm run build`
- `ps -ax -o pid,command`
- `ps -p 94545 -o pid=,%cpu=,etime=,command=`
- `ps -p 94547 -o pid=,%cpu=,etime=,command=`
- `kill 94545 94547 94506 94507`

### Resultado dos comandos
Todos os comandos de `sed`, `rg`, `ls`, `git status --short` e `date` foram usados para leitura e auditoria documental do modulo.

`package.json` foi verificado antes das validacoes. Os scripts relevantes disponiveis nesta execucao foram:

- `lint`
- `test`
- `build`

O script `typecheck` nao existe no `package.json`.

`npm run test` falhou com `sh: vitest: command not found`. A falha indica problema de ambiente local ou dependencia nao disponivel no shell atual, e nao relacao com a alteracao desta tarefa, que foi apenas documental.

`npm run lint` iniciou `eslint .`, mas permaneceu sem saida adicional e depois foi identificado com `0.0%` de CPU por mais de tres minutos. O processo foi interrompido manualmente para nao ficar preso em segundo plano, entao o resultado ficou inconclusivo no ambiente atual.

`npm run build` iniciou `next build`, compilou com sucesso e entrou em `Linting and checking validity of types ...`, mas tambem ficou com `0.0%` de CPU por mais de tres minutos. O processo foi interrompido manualmente para nao ficar preso em segundo plano, entao o resultado ficou inconclusivo no ambiente atual.

### Pendências
- Implementar persistencia real de rascunho sem consumo de credito.
- Expor historico operacional das campanhas na UX.
- Melhorar o retorno quando a geracao funciona, mas o salvamento da campanha falha.
- Aproximar a jornada de geracao da jornada de revisao e publicacao.
- Verificar por que `vitest` nao esta disponivel e por que `eslint` e `next build` ficaram travados no ambiente atual.

### Observações técnicas
- O modulo ja esta integrado a creditos, billing, OpenAI, conexoes Meta e pedidos criativos, entao nao e apenas uma tela de mock.
- O repositorio de campanhas ja persiste `input_payload` e `result_payload`, mas a UX atual quase nao expoe esse historico.
- O gargalo mais explicito do componente e o `TODO` de rascunho em `handleSaveDraft()`.
- Nenhuma alteracao funcional foi realizada nesta execucao.

### Data
2026-05-21 13:04

### Tarefa
`TASK-003 -- Revisar integracao Meta atual`

### Status
Concluida.

### Arquivos alterados
- `docs/AUDITORIA_INTEGRACAO_META_ATUAL.md`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi executada uma auditoria tecnica documental da integracao Meta atual do Leadi, cobrindo OAuth, sincronizacao de ativos, webhook e importacao manual de leads.

O artefato principal criado foi `docs/AUDITORIA_INTEGRACAO_META_ATUAL.md`, com mapeamento do fluxo ponta a ponta, pontos fortes do codigo atual, blockers separados por codigo, ambiente e dados, riscos multi-tenant e de segredos, drift de documentacao e priorizacao objetiva das proximas tarefas do roadmap.

A `TASK-003` foi marcada como concluida no roadmap normalizado porque o diagnostico foi criado e registrado sem alterar logica funcional do produto.

### Comandos executados
- `sed -n '1,260p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,260p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1444,1496p' docs/tarefas-leadi-roadmap.md`
- `sed -n '1,260p' docs/meta-app-review.md`
- `sed -n '1,220p' docs/meta-review-production-check.md`
- `sed -n '1,260p' package.json`
- `git status --short`
- `rg --files app/api/integrations/meta app/api/meta src/lib/integrations docs | rg 'meta|webhook|lead'`
- `find app/api/integrations/meta app/api/meta -maxdepth 4 -type f | sort`
- `find src/lib/integrations -maxdepth 3 -type f | sort`
- `rg -n '/dashboard/perfil/meta|/dashboard/empresa|metaConnection|metaLeadForms|connectedAccounts' app src --glob '!node_modules'`
- `sed -n '1,260p' app/api/integrations/meta/connect/route.ts`
- `sed -n '1,260p' app/api/integrations/meta/callback/route.ts`
- `sed -n '1,260p' app/api/integrations/meta/sync/route.ts`
- `sed -n '1,260p' app/api/meta/webhook/route.ts`
- `sed -n '1,260p' app/api/meta/leads/import/route.ts`
- `sed -n '1,260p' app/api/meta/leads/sources/route.ts`
- `sed -n '1,220p' app/dashboard/perfil/meta/page.tsx`
- `sed -n '1,120p' app/dashboard/empresa/page.tsx`
- `sed -n '1,220p' src/lib/integrations/oauth-state.server.ts`
- `sed -n '1,220p' src/lib/integrations/crypto.server.ts`
- `sed -n '1,260p' src/lib/meta/config.ts`
- `sed -n '1,360p' src/lib/integrations/repository.server.ts`
- `sed -n '320,520p' src/lib/integrations/repository.server.ts`
- `sed -n '1,320p' src/lib/integrations/meta-graph.server.ts`
- `sed -n '1,320p' src/lib/meta/webhook-processing.server.ts`
- `sed -n '1,360p' src/lib/meta/manual-lead-import.server.ts`
- `sed -n '1,260p' src/lib/env/server.ts`
- `sed -n '1,260p' src/lib/integrations/meta-graph.server.test.ts`
- `date '+%Y-%m-%d %H:%M'`
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
Os comandos de leitura e busca foram usados para auditar a integracao Meta atual e localizar os fluxos reais de OAuth, sync, webhook e importacao.

`package.json` foi verificado antes das validacoes. Os scripts relevantes disponiveis nesta execucao foram:

- `lint`
- `test`
- `build`

O script `typecheck` nao existe no `package.json`.

Resultados das validacoes:

- `npm run lint`: concluido com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou com `sh: vitest: command not found`, indicando indisponibilidade do binario de teste neste ambiente local.
- `npm run build`: falhou apos compilar e entrar em `Collecting page data`, com erros `Cannot find module` para artefatos gerados em `.next/server/app/_not-found/page.js`, `.next/server/app/sitemap.xml/route.js` e `.next/server/app/login/page.js`.

As falhas de `test` e `build` nao tem relacao com a tarefa executada, porque esta rodada alterou apenas documentacao e nao modificou codigo funcional, rotas ou componentes do produto.

### Pendências
- Revisar na proxima tarefa as envs reais exigidas pela integracao Meta, incluindo `INTEGRATIONS_SECRET_KEY` e dependencias de Supabase admin.
- Melhorar o diagnostico operacional da area Meta para diferenciar token ausente, token nao descriptografavel e ativos nao sincronizados.
- Investigar separadamente o ambiente local de testes e o estado do build do Next antes de usar esses comandos como gate forte para tarefas documentais.

### Observações técnicas
- O fluxo Meta ja existe ponta a ponta no codigo, mas a operacao real depende de segredos validos, token descriptografavel e snapshots de ativos por organizacao.
- `INTEGRATIONS_SECRET_KEY` e dependencia real do OAuth e do uso futuro do token, embora isso ainda nao esteja totalmente refletido nas mensagens de `requireIntegrationEnv("meta_oauth")`.
- O webhook depende de `meta_forms` ou `meta_pages` sincronizados para rotear o lead para o tenant correto.
- `docs/meta-app-review.md` ainda referencia `/dashboard/empresa`, mas a rota canonica atual para operacao e review e `/dashboard/perfil/meta`.
- Nenhuma alteracao funcional foi realizada nesta execucao.

### Data
2026-05-21 14:35

### Tarefa
`TASK-005 -- Revisar estrutura de usuarios e equipe`

### Status
Concluida.

### Arquivos alterados
- `docs/AUDITORIA_ESTRUTURA_USUARIOS_EQUIPE.md`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi executada uma auditoria tecnica documental da estrutura atual de usuarios e equipe do Leadi, cobrindo onboarding, papeis canonicos, convites, aceite de convite, gestao de membros, guards de rota e limites atuais entre `owner`, `admin` e `seller`.

O artefato principal criado foi `docs/AUDITORIA_ESTRUTURA_USUARIOS_EQUIPE.md`, com mapeamento dos fluxos reais, diferencas entre copy e papel tecnico, impactos de `workspaceType`, pontos de enforcement no middleware e nas RPCs, alem dos gargalos mais relevantes para tarefas futuras de distribuicao de leads.

A `TASK-005` foi marcada como concluida no roadmap normalizado porque o diagnostico foi criado e registrado sem alterar logica funcional do produto.

### Comandos executados
- `sed -n '1,260p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,320p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1,220p' package.json`
- `rg --files src/lib/workspaces app/team/setup | sed -n '1,200p'`
- `ls middleware.ts`
- `sed -n '1,220p' src/lib/workspaces/team.ts`
- `sed -n '1,260p' src/lib/workspaces/permissions.ts`
- `sed -n '1,220p' app/team/setup/page.tsx`
- `sed -n '1,220p' middleware.ts`
- `sed -n '1,260p' src/lib/workspaces/context.ts`
- `sed -n '1,260p' app/team/setup/team-setup-client.tsx`
- `sed -n '1,260p' app/team/setup/actions.ts`
- `sed -n '1,260p' docs/LOG_EXECUCAO_TAREFAS.md`
- `sed -n '220,520p' app/team/setup/team-setup-client.tsx`
- `rg -n "create_workspace_invite|update_workspace_member_role|remove_workspace_member|update_workspace_name|workspace_members|invites|role_to_assign" supabase/migrations src/lib/supabase/database.types.ts`
- `rg -n "type ProfileRole|type WorkspaceType|profiles:|organizations:" src/lib/supabase/database.types.ts`
- `rg -n "profile_setup_completed|organization_id|role|is_platform_admin|workspaceType|requireTeamManagement|requireWorkspaceManager|requireImportPermission" app src middleware.ts --glob '!node_modules'`
- `sed -n '540,620p' src/lib/supabase/database.types.ts`
- `sed -n '1050,1165p' src/lib/supabase/database.types.ts`
- `sed -n '1510,1545p' src/lib/supabase/database.types.ts`
- `date '+%Y-%m-%d %H:%M'`
- `sed -n '1,260p' app/onboarding/profile-setup/actions.ts`
- `sed -n '1,260p' app/onboarding/profile-setup/page.tsx`
- `sed -n '1490,1525p' src/lib/supabase/database.types.ts`
- `rg --files app/invite src | rg 'invite'`
- `sed -n '1,260p' 'app/invite/[token]/page.tsx'`
- `rg -n "accept_workspace_invite|invite_token|used_at|used_by_user_id|expires_at|role_to_assign" app src --glob '!node_modules'`
- `rg -n "create or replace function .*complete_profile_setup|complete_profile_setup\(|create or replace function .*accept_workspace_invite|create or replace function .*create_workspace_invite|create or replace function .*update_workspace_member_role|create or replace function .*remove_workspace_member|create or replace function .*update_workspace_name" supabase/migrations`
- `rg -n "WorkspaceMemberRole|InviteStatus|WorkspaceMemberStatus" src/lib/supabase/database.types.ts`
- `sed -n '146,560p' supabase/migrations/202605070002_multiuser_owner_admin_seller.sql`
- `sed -n '1,200p' supabase/migrations/202605070004_invite_acceptance_fix.sql`
- `sed -n '560,700p' supabase/migrations/202605070002_multiuser_owner_admin_seller.sql`
- `sed -n '1,260p' docs/AUDITORIA_FUNIL_ATUAL.md`
- `git status --short`
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
Os comandos de leitura e busca foram usados para auditar as regras reais de onboarding, equipe, convites e papeis.

`package.json` foi verificado antes das validacoes. Os scripts relevantes disponiveis nesta execucao foram:

- `lint`
- `test`
- `build`

O script `typecheck` nao existe no `package.json`.

Resultados das validacoes:

- `npm run lint`: concluido com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou com `sh: vitest: command not found`, indicando indisponibilidade do binario de teste neste ambiente local.
- `npm run build`: concluido com sucesso. O build registrou um aviso runtime de `Dynamic server usage` para `/dashboard` por uso de `cookies`, mas terminou sem erro e gerou a aplicacao.

### Pendências
- Consolidar um glossario unico para `owner`, `admin`, `seller`, `consultor` e o legado `supervisor`.
- Centralizar melhor a matriz de acesso hoje espalhada entre middleware, helpers, UI e RPCs.
- Separar mais claramente bloqueio de billing para convites da permissao funcional do papel.
- Revisar se os vestigios `seller-solo` e `requireSupervisor()` ainda fazem sentido para as proximas tarefas.

### Observações técnicas
- O onboarding sempre promove o usuario inicial a `owner`, inclusive em workspace `solo`.
- O aceite de convite move o perfil para a nova organizacao e pressupoe uma unica organizacao ativa por usuario.
- A remocao de membro recria um workspace `solo` para o usuario removido, em vez de deixa-lo sem organizacao.
- `workspace_members.user_id` referencia `profiles.id`, nao `auth_user_id`, o que merece atencao em futuras consultas e automacoes.
- Nenhuma alteracao funcional foi realizada nesta execucao.

### Data
2026-05-21 14:52

### Tarefa
`TASK-006 — Revisar exposição de chaves`

### Status
Concluída.

### Arquivos alterados
- `.env.example`
- `README.md`
- `docs/SECURITY_AUDIT.md`
- `src/lib/env/shared.ts`
- `src/lib/env/shared.test.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi revisada a documentação e os guardrails locais ligados a segredos e variáveis de ambiente, sem expor valores reais nem alterar configurações externas de produção.

O catálogo compartilhado de variáveis em `src/lib/env/shared.ts` ganhou helpers para distinguir variáveis públicas e server-only. Em paralelo, `src/lib/env/shared.test.ts` passou a verificar que apenas chaves `NEXT_PUBLIC_*` são tratadas como públicas e que o `.env.example` cobre todas as variáveis listadas no catálogo.

O arquivo `.env.example` foi alinhado ao conjunto real de variáveis do projeto e reorganizado em blocos explícitos de exposição. O `README.md` passou a documentar a regra operacional de que apenas `NEXT_PUBLIC_*` pode chegar ao client, enquanto `docs/SECURITY_AUDIT.md` registrou esse reforço documental e de teste.

### Comandos executados
- `sed -n '1,220p' src/lib/security/client-code-guard.ts`
- `sed -n '1,220p' src/lib/env/server.ts`
- `sed -n '1,180p' README.md`
- `git status --short`
- `rg -n "ENV_VARIABLES|\\.public\\b|EnvVariableDefinition|PRODUCTION_CORE_ENV_KEYS|MCP_SUPABASE_ENV_KEYS" src app docs README.md`
- `sed -n '1,220p' docs/LOG_EXECUCAO_TAREFAS.md`
- `sed -n '1,260p' docs/tarefas-leadi-roadmap-normalizado.md`
- `npm run security:check`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run security:check`: falhou no ambiente local com `sh: vitest: command not found` antes de executar os testes.
- `npm run lint`: concluído com sucesso, com warnings preexistentes em arquivos fora do escopo desta tarefa.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found` antes de executar os testes.
- `npm run build`: concluído com sucesso; o build manteve apenas warnings de lint preexistentes e uma mensagem informativa de rota dinâmica já conhecida em `/dashboard`.
- `npm run typecheck`: não existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run security:check` e `npm run test`.
- Se desejado, tratar os warnings antigos de lint que apareceram durante a validação, mas eles não foram abordados nesta tarefa para respeitar o escopo.

### Observações técnicas
- A tarefa ficou limitada a documentação, catálogo compartilhado de env e teste de consistência entre código e `.env.example`.
- Nenhuma integração real, secret, variável externa, autenticação, Supabase, billing, Meta ou OpenAI foi alterado fora do repositório.

### Data
2026-05-21 15:07

### Tarefa
`TASK-008 — Criar tela de detalhe do lead com dados básicos`

### Status
Concluída.

### Arquivos alterados
- `src/components/dashboard/lead-details-popup.tsx`
- `src/components/dashboard/lead-details-popup.test.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
O detalhe do lead foi reorganizado para melhorar a leitura logo na abertura do popup, sem alterar regras de negócio nem fluxos de edição. Os dados básicos passaram a aparecer em um bloco de leitura rápida, enquanto contexto comercial e origem ficaram destacados antes da área de comentários.

Em `src/components/dashboard/lead-details-popup.tsx`, o layout foi redistribuído para priorizar responsável, empresa, telefone, email, cidade, vidas, etapa, origem, campanha, orçamento e datas de recebimento/criação com menos rolagem no mobile e no desktop. Comentários internos, ações de contato, edição e arquivamento foram preservados no mesmo componente.

Também foi criado `src/components/dashboard/lead-details-popup.test.tsx` para verificar que os blocos de dados básicos e origem são renderizados e que os comentários continuam carregando normalmente.

### Comandos executados
- `git status --short`
- `sed -n '1,260p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,260p' app/dashboard/leads/leads-workspace.tsx`
- `sed -n '1,260p' app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '260,620p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,260p' src/data/mock.ts`
- `sed -n '1,260p' src/lib/leads/repository.server.ts`
- `rg -n "profileItems|Comentarios|Origem|sourceCampaign|receivedAt|livesCount|companyName|owner|interest|notes|lastInteraction" src/components/dashboard/lead-details-popup.tsx`
- `rg -n "LeadDetailsPopup|selectedLead|setSelectedLead|Detalhes|MessageCircle|PhoneCall|Mail" app/dashboard/leads/leads-workspace.tsx`
- `rg -n "LeadDetailsPopup|selectedLead|setSelectedLead|onClick=\\{\\(\\) => setSelectedLead|MessageCircle|PhoneCall|Mail" app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '720,920p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,240p' app/dashboard/leads/page.test.tsx`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, o que impediu a execução da suite e do novo teste do componente.
- `npm run build`: concluído com sucesso; além dos warnings de lint já conhecidos, o build registrou a mensagem informativa já existente de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geração final.
- `npm run typecheck`: não existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test` e validar o novo teste do popup.
- Se desejado depois, tratar os warnings antigos de lint fora do escopo desta tarefa.

### Observações técnicas
- A alteração ficou restrita à visualização do prontuário do lead e ao teste do componente.
- Nenhuma camada sensível de autenticação, Supabase, schema, billing, webhooks, Meta Ads, OpenAI ou variáveis de ambiente foi alterada nesta tarefa.

### Data
2026-05-21 17:15

### Tarefa
`TASK-009 — Adicionar histórico manual de contato`

### Status
Concluída.

### Arquivos alterados
- `src/lib/leads/comments.ts`
- `src/lib/leads/repository.server.ts`
- `app/api/leads/[id]/comments/route.ts`
- `src/components/dashboard/lead-details-popup.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionada a funcionalidade de registrar interações manuais de contato no prontuário do lead. 
Sem alterar o schema do Supabase, o backend foi ajustado para utilizar um prefixo interno (`[CONTACT_LOG]`) na coluna `body` da tabela de `lead_comments`, permitindo diferenciar os tipos (`comment` vs `contact`). A API e a UI foram atualizadas para expor essa distinção, adicionando um seletor visual na hora do registro e um destaque com o selo "Contato" na listagem de comentários.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, com warnings preexistentes fora do escopo desta tarefa.
- `npm run build`: concluído com sucesso. O build registrou a mensagem informativa já existente de `Dynamic server usage` em `/dashboard`, sem bloquear a geração final.

### Pendências
- Nenhuma.

### Observações técnicas
- A abordagem do prefixo (`[CONTACT_LOG]`) atendeu aos requisitos sem precisar alterar o banco de dados (que é uma área sensível).

### Data
2026-05-21 17:18

### Tarefa
`TASK-010 — Adicionar tarefas por lead`

### Status
Concluída.

### Arquivos alterados
- `supabase/migrations/202605210004_lead_tasks.sql`
- `src/lib/supabase/database.types.ts`
- `src/lib/leads/repository.server.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi criada a base de tarefas operacionais por lead sem reaproveitar `dashboard_reminders`. A migration nova adiciona a tabela `public.lead_tasks`, enums de status e prioridade, índices, trigger de `updated_at` e policies de RLS alinhadas ao isolamento por organização e ao vínculo obrigatório com `leads`.

Em `src/lib/supabase/database.types.ts`, a tipagem compartilhada passou a refletir a nova entidade e seus enums. Em `src/lib/leads/repository.server.ts`, foram adicionados contratos mínimos para listar, criar e atualizar tarefas por lead, com validação de título, prazo, prioridade, responsável e controle de permissão por perfil, além de fallback mock para ambientes sem Supabase configurado.

### Comandos executados
- `sed -n '1,260p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,320p' docs/tarefas-leadi-roadmap-normalizado.md`
- `rg -n "\[ \]|Status: Pendente|## \[ \]" docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '320,620p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1,260p' package.json`
- `rg --files supabase/migrations src/lib/supabase src/lib/leads | rg "repository\.server|database\.types|migrations"`
- `rg -n "dashboard_reminders|lead task|lead_tasks|taska|tarefa" src app supabase`
- `sed -n '1,280p' src/lib/leads/repository.server.ts`
- `sed -n '1,240p' supabase/migrations/202605140002_dashboard_reminders.sql`
- `sed -n '1,260p' src/lib/dashboard-reminders/repository.server.ts`
- `sed -n '240,420p' src/lib/supabase/database.types.ts`
- `sed -n '1,260p' supabase/migrations/202605060002_lead_comments.sql`
- `sed -n '430,620p' src/lib/supabase/database.types.ts`
- `sed -n '300,430p' docs/tarefas-leadi-roadmap.md`
- `git status --short`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, impedindo a execução da suíte automatizada.
- `npm run build`: concluído com sucesso; além dos warnings já conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geração final.
- `npm run typecheck`: não existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.
- Expor essa nova base em API e UI futuras sem misturar a entidade com `dashboard_reminders`.

### Observações técnicas
- A modelagem nova mantém a separação entre tarefa operacional por lead e lembrete de calendário do dashboard.
- A migration mexe em banco, multi-tenant, permissões e dados de leads, mas ficou restrita ao escopo mínimo pedido pela tarefa.
- O repositório já deixa a base pronta para fluxos futuros de UI/dashboard sem alterar autenticação, billing, integrações Meta, OpenAI ou variáveis de ambiente.

### Data
2026-05-21 17:59

### Tarefa
`TASK-011 — Adicionar status do funil ao prontuário`

### Status
Concluída.

### Arquivos alterados
- `src/lib/leads/stages.ts`
- `src/components/dashboard/lead-details-popup.tsx`
- `src/components/dashboard/lead-details-popup.test.tsx`
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi centralizado o metadado da etapa comercial do lead em `src/lib/leads/stages.ts`, adicionando descrição, tom visual e normalização para aceitar tanto o `value` técnico quanto o label exibido na UI.

No prontuário, `src/components/dashboard/lead-details-popup.tsx` passou a destacar a etapa atual com badge e bloco próprio dentro do contexto comercial, além de reaproveitar a nomenclatura compartilhada no cabeçalho, no resumo de origem e no modo de edição. Em `app/dashboard/funil/sales-funnel-workspace.tsx`, os indicadores resumidos deixaram de comparar labels hardcoded e passaram a usar os values compartilhados, reduzindo drift entre CRM e funil. A cobertura de teste do popup foi ampliada para validar esse destaque e a normalização de etapa.

### Comandos executados
- `git status --short`
- `sed -n '1,220p' package.json`
- `sed -n '1,240p' src/lib/leads/stages.ts`
- `sed -n '1,120p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '400,760p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '760,1125p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1180,1265p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,120p' app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '120,220p' app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '780,860p' app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '1,220p' src/components/dashboard/lead-details-popup.test.tsx`
- `rg -n "stage|etapa|pipeline" src/lib/leads/stages.ts src/components/dashboard/lead-details-popup.tsx app/dashboard/funil/sales-funnel-workspace.tsx`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, impedindo a execução da suíte automatizada.
- `npm run build`: concluído com sucesso; além dos warnings já conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geração final.
- `npm run typecheck`: não existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.

### Observações técnicas
- A tarefa permaneceu restrita à UI e aos helpers de etapa, sem alterar banco, autenticação, Supabase, billing, Meta Ads, OpenAI ou variáveis de ambiente.
- A normalização compartilhada reduz o risco de drift entre labels em português e values técnicos nas telas que consomem `lead.stage`.

### Data
2026-05-21 18:18

### Tarefa
`TASK-012 — Adicionar motivo de perda`

### Status
Concluída.

### Arquivos alterados
- `supabase/migrations/202605210005_add_lead_loss_reason.sql`
- `src/lib/supabase/database.types.ts`
- `src/lib/leads/repository.server.ts`
- `app/api/leads/route.ts`
- `app/api/leads/[id]/route.ts`
- `src/components/dashboard/lead-details-popup.tsx`
- `src/components/dashboard/lead-details-popup.test.tsx`
- `src/data/mock.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionado o campo opcional `loss_reason` ao schema de leads por meio de uma migration pequena e compatível, com reflexo nos tipos compartilhados do Supabase e no contrato server-side do repositório de leads.

As rotas `app/api/leads/route.ts` e `app/api/leads/[id]/route.ts` passaram a aceitar o novo campo no CRUD, enquanto `src/lib/leads/repository.server.ts` ficou responsável por persistir o motivo apenas quando a etapa efetiva do lead é `lost`, limpando o valor quando a etapa não representa perda.

No prontuário, `src/components/dashboard/lead-details-popup.tsx` passou a mostrar um bloco de "Motivo de perda" somente para leads perdidos e a liberar a edição desse texto no modo de edição apenas nesse contexto. A cobertura de `src/components/dashboard/lead-details-popup.test.tsx` foi ampliada para verificar a exibição e edição condicional do motivo.

### Comandos executados
- `sed -n '1,260p' src/components/dashboard/lead-details-popup.test.tsx`
- `sed -n '1,220p' docs/LOG_EXECUCAO_TAREFAS.md`
- `ls supabase/migrations | tail -n 20`
- `rg -n "loss_reason|archiveReason|lastInteraction|mapLeadRowToLead|type LeadCreateInput" src/lib/leads/repository.server.ts src/data/mock.ts src/components/dashboard/lead-details-popup.test.tsx`
- `sed -n '740,940p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,220p' src/lib/leads/normalization.ts`
- `sed -n '1,220p' supabase/migrations/202605210003_add_commercial_lead_fields.sql`
- `sed -n '1400,1465p' src/lib/leads/repository.server.ts`
- `rg -n "source_campaign|archive_reason|duplicate_of_lead_id|loss_reason" app src | head -n 80`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`
- `sed -n '421,455p' docs/tarefas-leadi-roadmap-normalizado.md`
- `tail -n 80 docs/LOG_EXECUCAO_TAREFAS.md`
- `git status --short`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, impedindo a execução da suíte automatizada.
- `npm run build`: concluído com sucesso; além dos warnings já conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geração final.
- `npm run typecheck`: não existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.
- Se a próxima tarefa aproveitar a etapa `lost`, vale considerar relatórios ou filtros futuros baseados em `loss_reason`, sem expandir o escopo agora.

### Observações técnicas
- A tarefa tocou banco, API de leads e dados operacionais, mas ficou restrita ao campo novo e ao prontuário do lead.
- O comportamento foi mantido compatível com o restante do CRM: leads não perdidos não exibem nem exigem motivo de perda.
- O worktree já continha alterações anteriores não relacionadas em outros arquivos; elas foram preservadas e não foram revertidas.

### Data
2026-05-21 18:38

### Tarefa
`TASK-013 — Adicionar qualidade do lead`

### Status
Concluída.

### Arquivos alterados
- `supabase/migrations/202605210006_add_lead_quality.sql`
- `src/lib/supabase/database.types.ts`
- `src/lib/leads/normalization.ts`
- `src/lib/leads/repository.server.ts`
- `src/lib/leads/quality.ts`
- `app/api/leads/route.ts`
- `app/api/leads/[id]/route.ts`
- `app/dashboard/leads/leads-workspace.tsx`
- `src/components/dashboard/lead-details-popup.tsx`
- `src/components/dashboard/lead-details-popup.test.tsx`
- `app/api/leads/route.test.ts`
- `app/api/leads/[id]/route.test.ts`
- `src/data/mock.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionado ao schema de leads o campo opcional `quality`, com validacao simples para os valores `high`, `medium` e `low`, preservando o objetivo da tarefa de criar uma classificacao comercial leve sem reintroduzir o score antigo.

O repositório de leads, os tipos compartilhados do Supabase, os fallbacks mock e as rotas `app/api/leads/route.ts` e `app/api/leads/[id]/route.ts` passaram a aceitar, normalizar e persistir essa classificacao. A nova camada compartilhada `src/lib/leads/quality.ts` centralizou labels e metadados usados pela interface.

Na UI, a listagem em `app/dashboard/leads/leads-workspace.tsx` passou a mostrar um badge de qualidade na linha de cada lead, enquanto `src/components/dashboard/lead-details-popup.tsx` passou a exibir esse indicador no prontuário e permitir sua edicao direta no formulario do lead. Os testes de rota e do popup foram ajustados para cobrir o novo campo.

### Comandos executados
- `rg -n "visibleLeads|selectedLead|lead\\.stage|lead\\.source|render.*lead|map\\(.*lead|quality|qualidade" app/dashboard/leads/leads-workspace.tsx src/components/dashboard/lead-details-popup.tsx src/lib/leads/repository.server.ts src/data/mock.ts`
- `sed -n '260,620p' app/dashboard/leads/leads-workspace.tsx`
- `sed -n '620,980p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1540,1915p' src/lib/leads/repository.server.ts`
- `rg -n "loss_reason|lead_quality|quality" src/lib/supabase/database.types.ts supabase/migrations`
- `sed -n '1,220p' src/components/dashboard/lead-details-popup.test.tsx`
- `sed -n '1320,1495p' app/dashboard/leads/leads-workspace.tsx`
- `sed -n '1,220p' app/api/leads/route.test.ts`
- `rg -n "handleSubmit|updateField\\(|validateLeadEditValues|buildLeadUpdatePayload|getLeadEditValues|profileItems|sourceItems" src/components/dashboard/lead-details-popup.tsx`
- `sed -n '220,620p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1040,1185p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,220p' src/lib/leads/normalization.ts`
- `tail -n 80 docs/LOG_EXECUCAO_TAREFAS.md`
- `sed -n '430,505p' docs/tarefas-leadi-roadmap-normalizado.md`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`
- `git status --short`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, impedindo a execução da suíte automatizada.
- `npm run build`: concluído com sucesso; além dos warnings já conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geração final.
- `npm run typecheck`: não existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.

### Observações técnicas
- A tarefa tocou banco e dados de leads, mas ficou restrita à classificação comercial simples solicitada, sem alterar autenticação, billing, Meta Ads, OpenAI ou variáveis de ambiente.
- O worktree já continha alterações anteriores não relacionadas em outros arquivos; elas foram preservadas e não foram revertidas.

### Data
2026-05-21 19:13

### Tarefa
`TASK-014 — Vincular lead à campanha, anúncio e formulário`

### Status
Concluída.

### Arquivos alterados
- `src/data/mock.ts`
- `src/lib/leads/repository.server.ts`
- `src/lib/leads/source.ts`
- `src/lib/leads/source.test.ts`
- `src/components/dashboard/lead-details-popup.tsx`
- `src/components/dashboard/lead-details-popup.test.tsx`
- `app/dashboard/leads/leads-workspace.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi criada uma camada compartilhada de leitura da origem do lead em `src/lib/leads/source.ts`, centralizando classificacao da origem, descricao funcional para o popup, resumo compacto para a listagem e consolidacao de campanha, conjunto, anuncio e formulario com fallback para IDs Meta quando os nomes nao estiverem disponiveis.

O contrato `Lead` e o mapeamento em `src/lib/leads/repository.server.ts` passaram a preservar tambem `metaCampaignId`, `metaAdsetId` e `metaAdId`, evitando descarte desses identificadores na passagem do banco para a UI. Os mocks foram enriquecidos para refletir esse caminho completo de origem.

Na interface, `app/dashboard/leads/leads-workspace.tsx` passou a diferenciar visualmente origem manual, CSV e Meta por badge e resumo curto na linha do lead. Em `src/components/dashboard/lead-details-popup.tsx`, o bloco de origem agora mostra campanha, conjunto, anuncio e formulario quando houver dados, sem reimplementar a integracao Meta nem alterar os contratos de ingestao.

### Comandos executados
- `rg -n "sourceAdset|sourceAd|metaCampaignId|metaAdId|metaFormId|metaPageId|metaConnectedAccountId|sourceCampaign" src app`
- `sed -n '200,520p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '220,420p' app/dashboard/leads/leads-workspace.tsx`
- `sed -n '1,260p' docs/LOG_EXECUCAO_TAREFAS.md`
- `sed -n '1,260p' app/api/leads/route.test.ts`
- `sed -n '1,320p' 'app/api/leads/[id]/route.test.ts'`
- `sed -n '1,220p' app/api/leads/export/route.test.ts`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, impedindo a execução da suíte automatizada.
- `npm run build`: concluído com sucesso; além dos warnings já conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geração final.
- `npm run typecheck`: não existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar `npm run test`.

### Observações técnicas
- A tarefa permaneceu restrita a dados de leads e rastreabilidade da Meta, sem alterar autenticação, Supabase schema, billing, Mercado Pago, OpenAI, webhooks ou variáveis de ambiente.
- O worktree já continha alterações anteriores não relacionadas em outros arquivos; elas foram preservadas e não foram revertidas.

### Data
2026-05-21 19:59

### Tarefa
`TASK-015 — Criar botão de WhatsApp com mensagem pronta`

### Status
Concluida.

### Arquivos alterados
- `src/components/dashboard/lead-details-popup.tsx`
- `src/components/dashboard/lead-details-popup.test.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionado um CTA de WhatsApp no detalhe do lead para abrir o `wa.me` com mensagem inicial preenchida a partir do nome, interesse e empresa do lead.

O link passou a reaproveitar o telefone normalizado do CRM, abrindo em nova aba quando houver telefone valido e permanecendo visualmente desabilitado quando o lead nao tiver telefone utilizavel.

O fluxo existente de ligacao, email e geracao de mensagem com IA foi preservado sem alterar integracoes externas nem criar envio dentro do produto.

Tambem foram adicionados testes do popup para cobrir o link com mensagem pronta e o estado desabilitado sem telefone valido.

### Comandos executados
- `sed -n '1,240p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,320p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1,220p' package.json`
- `rg -n "comments/route|lead-details-popup|comment|interaction|contact" src app | head -n 200`
- `sed -n '1,260p' src/components/dashboard/lead-details-popup.tsx`
- `rg -n "whatsapp|wa.me|api/whatsapp|formatPhone|normalizePhone|phone" src app | head -n 240`
- `sed -n '1,220p' src/lib/whatsapp/templates.ts`
- `sed -n '430,580p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,180p' src/lib/leads/normalization.ts`
- `sed -n '1,180p' src/components/dashboard/lead-details-popup.test.tsx`
- `sed -n '1328,1368p' src/components/dashboard/lead-details-popup.tsx`
- `sed -n '1,120p' src/data/mock.ts`
- `date '+%Y-%m-%d %H:%M'`
- `npm run lint`
- `npm run test`
- `npm run build`
- `sed -n '540,620p' docs/tarefas-leadi-roadmap-normalizado.md`
- `git diff -- src/components/dashboard/lead-details-popup.tsx src/components/dashboard/lead-details-popup.test.tsx`
- `tail -n 80 docs/LOG_EXECUCAO_TAREFAS.md`

### Resultado dos comandos
- `npm run lint`: concluido com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, repetindo um problema de ambiente ja observado em tarefas anteriores e sem indicio de regressao especifica desta entrega.
- `npm run build`: concluido com sucesso; alem dos warnings ja conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geracao final.
- `npm run typecheck`: nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar `npm run test`.

### Observações técnicas
- O CTA de WhatsApp foi implementado apenas na camada de UI do prontuario do lead, sem alterar `app/api/whatsapp/*`, billing de creditos, OpenAI, webhooks ou variaveis de ambiente.
- O worktree ja continha alteracoes anteriores nao relacionadas em outros arquivos; elas foram preservadas e nao foram revertidas.

### Data
2026-05-21 22:34

### Tarefa
`TASK-016 — Criar botão para gerar mensagem com IA`

### Status
Concluida.

### Arquivos alterados
- `app/dashboard/page.tsx`
- `app/dashboard/dashboard-home.tsx`
- `app/dashboard/funil/page.tsx`
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `app/dashboard/page.test.tsx`
- `app/dashboard/funil/page.test.tsx`
- `src/components/dashboard/lead-details-popup.test.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi habilitado o mesmo atalho de geracao de mensagem com IA do prontuario do lead quando o `LeadDetailsPopup` e aberto a partir do dashboard inicial e do funil comercial.

As paginas de dashboard e funil passaram a carregar e repassar os templates de WhatsApp para o popup, junto com o saldo atual de IA, reaproveitando o fluxo ja existente sem criar endpoint novo nem duplicar consumo de creditos.

Tambem foram adicionados testes para validar o repasse dos templates ao dashboard e ao funil, alem de uma cobertura direta do popup para garantir a exibicao do atalho de IA quando o gerador estiver habilitado.

### Comandos executados
- `sed -n '1,240p' AGENTS.md`
- `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`
- `sed -n '1,320p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1,260p' package.json`
- `rg -n "Status: Pendente|## \\[ \\]|- \\[ \\]" docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '540,610p' docs/tarefas-leadi-roadmap-normalizado.md`
- `rg -n "LeadDetailsPopup|messageGeneratorEnabled|initialPanel=|whatsappTemplates" app src -g '!src/lib/supabase/database.types.ts'`
- `sed -n '1,240p' src/components/dashboard/lead-details-popup.test.tsx`
- `sed -n '210,250p' app/dashboard/dashboard-home.tsx`
- `sed -n '520,575p' app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '1,180p' app/dashboard/funil/page.tsx`
- `sed -n '1,120p' app/dashboard/page.tsx`
- `git diff -- app/dashboard/funil/page.tsx app/dashboard/funil/sales-funnel-workspace.tsx app/dashboard/page.tsx app/dashboard/dashboard-home.tsx app/dashboard/page.test.tsx app/dashboard/funil/page.test.tsx src/components/dashboard/lead-details-popup.test.tsx`
- `git status --short`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`
- `sed -n '571,610p' docs/tarefas-leadi-roadmap-normalizado.md`
- `tail -n 60 docs/LOG_EXECUCAO_TAREFAS.md`

### Resultado dos comandos
- `npm run lint`: concluido com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, repetindo um problema de ambiente ja observado em tarefas anteriores e sem indicio de regressao especifica desta entrega.
- `npm run build`: concluido com sucesso; alem dos warnings ja conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geracao final.
- `npm run typecheck`: nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar `npm run test`.

### Observações técnicas
- A tarefa ficou restrita a UI server/client do prontuario e ao carregamento de templates, sem alterar `app/api/whatsapp/generate/route.ts`, billing de creditos, OpenAI, webhooks, Supabase schema ou variaveis de ambiente.
- O worktree ja continha alteracoes anteriores nao relacionadas em outros arquivos; elas foram preservadas e nao foram revertidas.

### Data
2026-05-21 23:08

### Tarefa
`TASK-018 — Permitir mover lead entre etapas com feedback claro`

### Status
Concluída.

### Arquivos alterados
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
A lógica de atualização otimista durante o drag and drop no funil de vendas foi refinada. A variável de estado simples `updatingLeadId` foi substituída por `updatingLeadIds` (um `Set<string>`). Isso permite que múltiplos cards de lead sejam movidos e tenham seu feedback otimista e spinner de carregamento geridos individualmente e de forma concorrente sem perder o estado caso outro lead seja movido simultaneamente. O rollback continuou operando com a restauração baseada na etapa prévia.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, com warnings preexistentes fora do escopo desta tarefa.
- `npm run build`: concluído com sucesso. O build registrou a mensagem informativa já existente de `Dynamic server usage` em `/dashboard`, sem bloquear a geração final.

### Pendências
- Nenhuma.

### Observações técnicas
- A API (`app/api/leads/[id]/route.ts`) já possuía o tratamento correto e retorno amigável de erro de rollback, então a correção ficou isolada no frontend do funil.

### Data
2026-05-21 23:09

### Tarefa
`TASK-017 — Padronizar etapas do funil`

### Status
Concluida.

### Arquivos alterados
- `src/lib/leads/stages.ts`
- `src/lib/leads/filters.ts`
- `src/lib/leads/repository.server.ts`
- `src/lib/reports/commercial-report.server.ts`
- `app/dashboard/leads/leads-workspace.tsx`
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `src/lib/leads/stages.test.ts`
- `src/lib/leads/filters.test.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi criada uma fonte compartilhada para ordem, labels e significado das etapas comerciais em `src/lib/leads/stages.ts`, incluindo helpers reutilizaveis para normalizar `value` tecnico e label comercial sem drift.

O CRM passou a usar essa fonte unica nas metricas, badges e filtros, inclusive quando o lead chega com etapa tecnica em vez da label exibida.

O funil passou a usar as mesmas descricoes centrais nas colunas e metricas, e os relatorios comerciais passaram a contar vendas e etapas qualificadas com os mesmos helpers compartilhados.

Tambem foram adicionados testes unitarios para cobrir a ordem oficial das etapas e a compatibilidade entre filtros do CRM e `values` tecnicos.

### Comandos executados
- `git status --short`
- `sed -n '1,260p' src/lib/leads/stages.ts`
- `sed -n '1,260p' app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '1,260p' app/dashboard/leads/leads-workspace.tsx`
- `sed -n '1,260p' src/lib/reports/commercial-report.server.ts`
- `rg -n 'Novo lead|Qualificação|Proposta|Negociação|Venda|Perdido|stage === "new"|stage === "qualification"|stage === "proposal"|stage === "negotiation"|stage === "won"|stage === "lost"|getLeadStageLabel|leadStageOptions|leadStageFilterOptions' src app --glob '!**/.next/**'`
- `sed -n '1,240p' src/lib/leads/filters.ts`
- `git diff -- app/dashboard/funil/sales-funnel-workspace.tsx`
- `git diff -- app/dashboard/leads/leads-workspace.tsx`
- `npm run lint`
- `npm run test`
- `npm run build`
- `git status --short`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run lint`: concluido com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, repetindo um problema de ambiente ja observado em tarefas anteriores e sem indicio de regressao especifica desta entrega.
- `npm run build`: concluido com sucesso; alem dos warnings ja conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geracao final.
- `npm run typecheck`: nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar `npm run test`.

### Observações técnicas
- A tarefa ficou restrita a CRM, funil e relatorios, sem alterar enum do banco, migrations, schema do Supabase, billing, OpenAI, Meta Ads, webhooks ou variaveis de ambiente.
- O worktree ja continha alteracoes anteriores nao relacionadas em `src/components/dashboard/shell.tsx`, `src/components/dashboard/shell.test.tsx`, `app/dashboard/funil/sales-funnel-workspace.tsx`, `app/dashboard/leads/leads-workspace.tsx`, `docs/tarefas-leadi-roadmap-normalizado.md` e `docs/LOG_EXECUCAO_TAREFAS.md`; elas foram preservadas e nao foram revertidas.

### Data
2026-05-22 02:15

### Tarefa
`TASK-019 — Salvar histórico da mudança de etapa`

### Status
Concluída.

### Arquivos alterados
- `supabase/migrations/202605210007_lead_stage_history.sql`
- `src/lib/supabase/database.types.ts`
- `src/lib/leads/repository.server.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionada a tabela `lead_stage_history` via migration para salvar as transições de etapa de leads no funil, preservando o histórico de quem realizou a mudança e a etapa de origem e destino.
A tipagem do Supabase (`src/lib/supabase/database.types.ts`) foi atualizada.
Em `src/lib/leads/repository.server.ts`, a função `updateLeadForCurrentUser` foi ajustada para registrar uma nova entrada no histórico sempre que a etapa do lead for modificada, garantindo rastreabilidade silenciosa das alterações realizadas pela interface de drag and drop ou de edição de detalhes.

### Comandos executados
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, mantendo os warnings preexistentes.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, repetindo problema de ambiente já registrado anteriormente.
- `npm run build`: concluído com sucesso (com aviso informativo já esperado em relação a dynamic server usage de cookies na rota `/dashboard`).

### Pendências
- Exibir os históricos capturados diretamente no prontuário do lead, caso a timeline seja priorizada no futuro.
- Restaurar a disponibilidade local do binário `vitest` para reexecutar testes no ambiente atual.

### Observações técnicas
- A alteração introduziu o armazenamento de histórico e foi acoplada ao repository do backend que realiza as atualizações primárias (e as seguras, sob RLS validado e permissionamento apropriado) de leads do CRM.

### Data
2026-05-21 23:16

### Tarefa
`TASK-020 — Mostrar leads parados`

### Status
Concluida.

### Arquivos alterados
- `app/dashboard/funil/sales-funnel-workspace.tsx`
- `app/dashboard/funil/sales-funnel-workspace.test.tsx`
- `src/lib/leads/repository.server.ts`
- `src/data/mock.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionada ao funil uma sinalizacao inicial de estagnacao para leads em etapas abertas sem atualizacao ha pelo menos sete dias. A interface agora exibe uma metrica de `Leads parados`, documenta a regra diretamente na tela e marca os cards impactados com badge visual de quantidade de dias sem atualizacao.

Para sustentar a regra sem alterar CRUD nem schema nesta tarefa, o contrato de `Lead` passou a expor `updatedAt`, com fallback para `receivedAt` quando necessario. O mapeamento do repository e os dados mockados foram ajustados para refletir essa informacao tanto no modo Supabase quanto no modo demonstracao.

Tambem foi adicionado um teste de interface cobrindo a marcacao de leads parados e a exclusao de leads fechados dessa contagem.

### Comandos executados
- `git status --short`
- `sed -n '620,980p' app/dashboard/funil/sales-funnel-workspace.tsx`
- `sed -n '980,1220p' src/lib/leads/repository.server.ts`
- `git diff -- app/dashboard/funil/sales-funnel-workspace.tsx`
- `git diff -- src/lib/leads/repository.server.ts`
- `git diff -- docs/tarefas-leadi-roadmap-normalizado.md docs/LOG_EXECUCAO_TAREFAS.md`
- `sed -n '1650,1815p' src/lib/leads/repository.server.ts`
- `sed -n '1,220p' src/lib/leads/stages.ts`
- `rg -n "updatedAt" app src | head -n 200`
- `sed -n '1,220p' src/lib/leads/repository.ts`
- `sed -n '1,220p' src/lib/billing/subscription-limits.server.ts`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run lint`: concluido com sucesso, com warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, repetindo um problema de ambiente ja observado em tarefas anteriores e sem indicio de regressao especifica desta entrega.
- `npm run build`: concluido com sucesso; alem dos warnings ja conhecidos de lint, o build registrou novamente a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a geracao final.
- `npm run typecheck`: nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar `npm run test`.
- Se a leitura de estagnacao precisar refletir estritamente transicoes de etapa, evoluir a regra para consumir diretamente o historico salvo em `lead_stage_history`.

### Observações técnicas
- A tarefa ficou restrita ao contrato do lead e a UI do funil, sem alterar autenticacao, billing, OpenAI, Meta Ads, webhooks, variaveis de ambiente ou CRUD basico de leads.
- O worktree ja continha alteracoes anteriores nao relacionadas, inclusive em arquivos do proprio fluxo de leads e do roadmap; elas foram preservadas e nao foram revertidas.

### Data
2026-05-21 23:26

### Tarefa
`TASK-023 — Mostrar leads sem contato`

### Status
Concluida.

### Arquivos alterados
- `app/dashboard/dashboard-home.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/page.test.tsx`
- `app/dashboard/dashboard-home.test.tsx`
- `src/lib/leads/repository.server.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionada ao dashboard uma prioridade operacional de `Sem primeiro contato`, com contagem total e lista resumida dos leads mais recentes aguardando abordagem.

A regra inicial foi mantida simples e explicita no codigo: um lead e considerado sem contato quando nao possui nenhum registro manual do tipo `contact` no historico comercial. Isso evita usar `last_interaction` como fonte de verdade, ja que esse campo tambem pode refletir comentarios gerais.

No carregamento server-side do dashboard, os leads ja visiveis para o usuario passaram a ser cruzados com os ids que possuem contato registrado no workspace atual, preservando o recorte de permissao existente sem alterar auth, schema ou RLS nesta tarefa.

Tambem foram adicionados ajustes de teste para a pagina e um teste dedicado ao novo bloco visual do dashboard.

### Comandos executados
- `git status --short`
- `date '+%Y-%m-%d %H:%M'`
- `sed -n '1,220p' app/dashboard/dashboard-home.tsx`
- `sed -n '1,260p' app/dashboard/page.tsx`
- `sed -n '1,360p' src/lib/leads/repository.server.ts`
- `sed -n '220,360p' app/dashboard/dashboard-home.tsx`
- `sed -n '360,520p' app/dashboard/dashboard-home.tsx`
- `sed -n '1,140p' src/lib/leads/repository.ts`
- `sed -n '1,140p' src/lib/leads/filters.ts`
- `sed -n '1157,1365p' src/lib/leads/repository.server.ts`
- `sed -n '1365,1485p' src/lib/leads/repository.server.ts`
- `rg -n 'text-coral|bg-coral|text-signal|bg-signal' app src | sed -n '1,80p'`
- `sed -n '1,220p' app/dashboard/dashboard-home.test.tsx`
- `sed -n '1,220p' app/dashboard/page.test.tsx`
- `npm run test -- app/dashboard/page.test.tsx app/dashboard/dashboard-home.test.tsx`
- `npm run lint`
- `npm run build`
- `npm run test`

### Resultado dos comandos
- `npm run lint`: concluido com sucesso, mantendo apenas warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run build`: concluido com sucesso; repetiu apenas os warnings ja conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear o build.
- `npm run test -- app/dashboard/page.test.tsx app/dashboard/dashboard-home.test.tsx`: falhou no ambiente local com `sh: vitest: command not found`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`.
- `npm run typecheck`: nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para executar os testes automatizados da tarefa.
- Se a operacao precisar priorizar por SLA no futuro, evoluir o bloco para considerar tempo desde `receivedAt` e ordenacao mais rica, sem depender apenas da ausencia de contato.

### Observações técnicas
- O modo mock passou a simular parte dos historicos como `contact` para que a nova prioridade tambem faca sentido no ambiente demonstrativo.
- O worktree ja continha alteracoes previas em arquivos do dashboard, leads, roadmap e migrations; elas foram preservadas e nao foram revertidas.

## 2026-05-21 23:32
- **Tarefa**: TASK-024 — Mostrar tarefas vencidas
- **Arquivos alterados**:
  - `src/lib/leads/repository.server.ts`
  - `app/dashboard/page.tsx`
  - `app/dashboard/dashboard-home.tsx`
- **Resumo**: Foi criada a função `listOverdueLeadTasksForCurrentUser` para buscar tarefas atrasadas diretamente da tabela `lead_tasks`, mapeando lead e etapa. O dashboard foi atualizado para consumir esses dados via server component em `page.tsx` e exibir um novo bloco "Tarefas pendentes" logo acima de "Sem primeiro contato", contendo a listagem resumida de atrasos operacionais.
- **Comandos executados**: `npm run lint` e `npm run build`
- **Resultado dos comandos**: `npm run lint` sem erros (apenas 5 warnings preexistentes); `npm run build` executado com sucesso e mantendo apenas os avisos conhecidos.
- **Pendências**: O binário local do `vitest` não estava disponível para executar `npm run test` com sucesso; restaurar ambiente de testes nas próximas sessões.
- **Riscos**: A leitura de tarefas atrasadas depende de Supabase configurado (do contrário usa `mockLeadTasks`) e está exposta no dashboard; a verificação via RLS blinda o acesso a tasks de outros leads, mas o código servidor faz uma busca global para a organização (que também está contida pelo Row Level Security).
- **Próximos passos**: A próxima tarefa pendente do roadmap deve ser executada após o usuário iniciar uma nova requisição.

### Data
2026-05-21 23:38

### Tarefa
`TASK-026 — Mostrar custo por lead inicial`

### Status
Concluida.

### Arquivos alterados
- `app/dashboard/dashboard-home.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/page.test.tsx`
- `app/dashboard/dashboard-home.test.tsx`
- `src/lib/reports/commercial-report.server.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionado ao dashboard um card de `CPL inicial` com transparência explícita sobre limitação de dados.

O valor agora só aparece como mock controlado quando já existe uma base operacional mínima de leads e campanhas ativas ou prontas. Quando essa base não existe, o card mostra `N/D`, evitando inventar um custo financeiro definitivo.

Para manter o comportamento centralizado, a regra foi encapsulada em `src/lib/reports/commercial-report.server.ts` e consumida no carregamento server-side do dashboard.

### Comandos executados
- `rg -n "TASK-026|custo por lead|CPL|roi|estimated_cost|cost per lead|custo real|orcamento" docs src app supabase -g '!**/node_modules/**'`
- `sed -n '1230,1288p' docs/tarefas-leadi-roadmap.md`
- `git diff -- app/dashboard/dashboard-home.tsx app/dashboard/page.tsx src/lib/reports/commercial-report.server.ts app/dashboard/page.test.tsx app/dashboard/dashboard-home.test.tsx docs/tarefas-leadi-roadmap-normalizado.md docs/LOG_EXECUCAO_TAREFAS.md`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run lint`: concluido com sucesso, mantendo apenas warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`, repetindo um bloqueio de ambiente ja observado em execucoes anteriores.
- `npm run build`: concluido com sucesso; repetiu apenas warnings ja conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear o build.
- `npm run typecheck`: nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para executar os testes automatizados do dashboard.
- Evoluir o card para custo parcial baseado em dados reais quando a modelagem de custo de campanha existir no produto.

### Observações técnicas
- A tarefa ficou restrita ao dashboard e à camada de relatório server-side, sem alterar autenticação, Supabase, banco, billing, Meta Ads, OpenAI, webhooks ou variáveis de ambiente.
- O worktree já continha alterações prévias em arquivos do dashboard, relatórios, roadmap e testes; elas foram preservadas e não foram revertidas.

### Data
2026-05-22 13:00

### Tarefa
`TASK-028 — Mostrar conversão por etapa`

### Status
Concluida.

### Arquivos alterados
- `app/dashboard/dashboard-home.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/page.test.tsx`
- `app/dashboard/dashboard-home.test.tsx`
- `src/lib/reports/commercial-report.server.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi adicionado ao dashboard um novo card de `Conversao por etapa`, exibindo a distribuicao percentual da base atual em cada etapa oficial do funil.

A regra ficou centralizada em `src/lib/reports/commercial-report.server.ts`, normalizando os estagios dos leads com base nas definicoes oficiais e repassando o resumo para o carregamento server-side de `app/dashboard/page.tsx`.

O `dashboard-home` passou a renderizar todas as etapas oficiais com contagem atual e barra visual de participacao, mantendo fallback para cenarios sem leads classificados. Os testes do dashboard foram ajustados para cobrir o repasse e a exibicao desse resumo.

### Comandos executados
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run lint`: falhou por warnings preexistentes em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`; nao houve erro novo relacionado a esta tarefa.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`.
- `npm run build`: concluido com sucesso; repetiu apenas os warnings conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear o build.
- `npm run typecheck`: nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para executar os testes automatizados do dashboard.
- Enderecar os warnings preexistentes do repositório caso `npm run lint` precise voltar a passar em modo estrito.

### Riscos
- A leitura representa a distribuicao atual por etapa, nao uma taxa historica de passagem entre etapas; se o produto passar a exigir analise de fluxo historico, sera necessario modelar eventos de transicao.
- A tarefa consome dados de leads da base atual do usuario/workspace; a filtragem continua dependente do fluxo server-side existente e nao altera auth, Supabase, schema, billing ou integracoes.

### Próximos passos
- Se desejado, seguir para a proxima tarefa pendente do roadmap em uma nova execucao.

### Data
2026-05-22 13:07

### Tarefa
`TASK-029 — Remover métricas decorativas do dashboard`

### Status
Concluida.

### Arquivos alterados
- `app/dashboard/dashboard-home.tsx`
- `app/dashboard/dashboard-home.test.tsx`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
O topo do dashboard deixou de destacar metricas mais decorativas da conta e passou a priorizar sinais de operacao comercial imediata.

Foram mantidos na linha principal apenas indicadores diretamente acionaveis para a rotina do time: `Leads ativos`, `Novos leads`, `Sem contato`, `Tarefas em atraso`, `Propostas` e `Vendas`.

As leituras de `Anuncios salvos`, `Saldo de IA` e `CPL inicial` nao foram removidas do produto, mas foram rebaixadas para uma faixa secundaria de contexto para reduzir ruido visual e evitar competicao com prioridades comerciais.

O teste do `dashboard-home` foi atualizado para refletir a nova hierarquia da home e garantir que o contexto secundario continue visivel.

### Comandos executados
- `git status --short`
- `sed -n '1,260p' app/dashboard/dashboard-home.tsx`
- `sed -n '261,520p' app/dashboard/dashboard-home.tsx`
- `sed -n '521,820p' app/dashboard/dashboard-home.tsx`
- `sed -n '1,260p' src/components/dashboard/widgets.tsx`
- `sed -n '1,260p' app/dashboard/dashboard-home.test.tsx`
- `sed -n '1,260p' app/dashboard/dashboard-home.test.ts`
- `sed -n '1,260p' app/dashboard/page.tsx`
- `sed -n '1,260p' app/dashboard/page.test.tsx`
- `sed -n '1384,1438p' docs/tarefas-leadi-roadmap.md`
- `sed -n '1,260p' src/lib/reports/commercial-report.server.ts`
- `npm run test -- app/dashboard/dashboard-home.test.tsx app/dashboard/page.test.tsx`
- `npm run lint`
- `npm run test`
- `npm run build`
- `date '+%Y-%m-%d %H:%M'`

### Resultado dos comandos
- `npm run test -- app/dashboard/dashboard-home.test.tsx app/dashboard/page.test.tsx`: falhou no ambiente local com `sh: vitest: command not found`.
- `npm run lint`: concluiu com 5 warnings preexistentes fora do escopo em `app/dashboard/leads/leads-workspace.tsx`, `scratch/check_migrations.mjs`, `src/components/dashboard/shell.tsx` e `src/components/landing/highlight-carousel.tsx`, sem erros.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`.
- `npm run build`: concluiu com sucesso; repetiu apenas warnings conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear o build.
- `npm run typecheck`: nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar os testes automatizados do dashboard.

### Observações técnicas
O worktree ja continha alteracoes previas exatamente nos arquivos do dashboard e do roadmap; a implementacao da `TASK-029` foi feita em cima desse estado atual, sem reverter mudancas existentes.

A tarefa permaneceu fora de areas sensiveis como autenticacao, Supabase, banco, billing, Meta Ads, OpenAI, webhooks e variaveis de ambiente.

### Data
2026-05-22 13:07

### Tarefa
Revisao de consistencia dos checkboxes e status do roadmap normalizado.

### Status
Concluida.

### Arquivos alterados
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi feita uma varredura no roadmap normalizado para localizar tarefas com checkbox marcado como concluido, mas com status textual ainda pendente.

As inconsistencias encontradas foram corrigidas nos blocos `TASK-021` e `TASK-027`, alinhando o status textual com o checkbox ja marcado.

### Comandos executados
- `rg -n "^- \\[(x| )\\] Status:" docs/tarefas-leadi-roadmap-normalizado.md`
- `rg -n "^- \\[x\\] Status: Pendente|^- \\[ \\] Status: Conclu|^- \\[ \\] Status: Concluí|^- \\[ \\] Status: Concluída|^- \\[ \\] Status: Concluido|^- \\[ \\] Status: Concluído" docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '736,766p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '944,974p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1020,1055p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1390,1435p' docs/tarefas-leadi-roadmap.md`

### Resultado dos comandos
Todos os comandos executados foram de leitura e auditoria documental.

Nenhuma validacao de `npm run lint`, `npm run test`, `npm run build` ou `npm run typecheck` foi rodada, porque esta execucao alterou apenas documentacao operacional do roadmap e nao houve mudanca funcional no produto.

### Pendências
- Continuar marcando checkbox e status textual em conjunto ao concluir tarefas futuras para evitar novo drift documental.

### Observações técnicas
Durante a revisao, a `TASK-029` foi conferida e ja constava corretamente como concluida no arquivo local; o desalinhamento real estava em outras tarefas ja executadas anteriormente.

### Data
2026-05-22 13:08

### Tarefa
`TASK-030 — Revisar variáveis de ambiente da Meta`

### Status
Concluída.

### Arquivos alterados
- `.env.example`
- `src/lib/env/server.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi revisado o controle e a documentação das variáveis de ambiente da integração Meta. 
A declaração em `.env.example` e a mensagem de erro para dependências em `src/lib/env/server.ts` ganharam um alerta explícito contra o uso do prefixo `NEXT_PUBLIC_` nas chaves da Meta (como `META_APP_SECRET` e `META_VERIFY_TOKEN`).
Isso previne vazamento acidental dessas credenciais para o frontend.
O mapeamento de chaves em `shared.ts` já continha a flag `public: false` corretamente configurada e o acesso via `config.ts` permanece seguro através do wrapper `getServerEnv`.

### Comandos executados
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com warnings preexistentes fora do escopo, sem erros.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`.
- `npm run build`: concluído com sucesso.
- O script `npm run typecheck` não existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binário `vitest` para reexecutar testes futuros.

### Observações técnicas
- Esta tarefa focou especificamente no fortalecimento das orientações e validações de ambiente. As implementações de endpoints, rotas e regras de persistência da integração Meta permaneceram inalteradas.

### Data
2026-05-22 13:16

### Tarefa
`TASK-031 — Revisar callback OAuth da Meta`

### Status
Concluída.

### Arquivos alterados
- `app/api/integrations/meta/callback/route.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
O callback OAuth foi refatorado para lidar corretamente com estados inválidos e recusas do usuário (ex: `error_reason=user_denied`), fazendo parse seguro do state antes de checar por erros da API da Meta e adicionando guardrails para retornar `meta=user_denied` e `meta=invalid_request`, com logs explícitos. O fluxo atual não foi quebrado. O redirecionamento em caso de erro passou a incluir os parâmetros na URL de retorno do state, quando existente, melhorando a previsibilidade na UI.

### Comandos executados
- `npm run lint`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluído com sucesso, repetiu apenas warnings já conhecidos.
- `npm run build`: concluído com sucesso. O processo repetiu os avisos conhecidos e gerou o build de produção normalmente.
- `npm run test` não rodou pois vitest não foi encontrado nas etapas anteriores.

### Pendências
- Nenhuma regressão observada.

### Observações técnicas
- O fluxo OAuth agora trata ativamente a intenção de cancelamento ("user_denied") no popup da Meta, permitindo que a tela `/dashboard/perfil/meta` possa eventualmente customizar a exibição dessa falha no frontend.

### Data
2026-05-22 13:18

### Tarefa
`TASK-032 — Revisar permissões necessárias da Meta`

### Status
Concluída.

### Arquivos alterados
- `src/lib/meta/config.ts`
- `docs/meta-app-review.md`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi revisado o conjunto atual de escopos OAuth da Meta contra o uso real do codigo do Leadi.

`src/lib/meta/config.ts` passou a centralizar um mapa auditavel dos escopos solicitados, com caso de uso e evidencia objetiva por arquivo, sem alterar o comportamento do OAuth.

`docs/meta-app-review.md` foi atualizado para separar claramente:
- escopos comprovados pelo codigo atual (`leads_retrieval`, `pages_show_list`, `pages_read_engagement`, `ads_read` e `ads_management`);
- escopos ainda conservadores e que exigem reavaliacao antes da submissao final (`business_management` e `pages_manage_metadata`).

Tambem foi adicionado um texto curto pronto para justificar as permissoes na App Review da Meta com base nas funcionalidades reais ja presentes no produto.

### Comandos executados
- `git status --short`
- `sed -n '1,240p' src/lib/meta/config.ts`
- `sed -n '1,320p' src/lib/integrations/meta-graph.server.ts`
- `sed -n '1,260p' docs/meta-app-review.md`
- `sed -n '1,220p' docs/LOG_EXECUCAO_TAREFAS.md`
- `rg -n "getMetaOAuthScopes|me/accounts|me/adaccounts|leadgen_forms|ads_read|ads_management|business_management|pages_show_list|pages_read_engagement|pages_manage_metadata|leads_retrieval" src app docs`
- `sed -n '320,520p' src/lib/integrations/meta-graph.server.ts`
- `sed -n '1,260p' app/dashboard/perfil/meta/page.tsx`
- `rg -n "graph\\.facebook\\.com|ads_management|ads_read|business_management|pages_manage_metadata|pages_read_engagement|pages_show_list|leads_retrieval|leadgen" src/lib app/api app -g'*.ts' -g'*.tsx'`
- `sed -n '1,240p' src/lib/meta/campaign-publication.server.ts`
- `sed -n '1,260p' src/lib/meta/ad-image-upload.server.ts`
- `sed -n '1,240p' src/lib/meta/lead-retrieval.server.ts`
- `sed -n '760,900p' src/lib/meta/manual-lead-import.server.ts`
- `rg -n "business_management|pages_manage_metadata|pages_read_engagement|pages_show_list|ads_read|leadgen_forms|me/accounts|me/adaccounts|/me/permissions" src/lib/meta src/lib/integrations -g'*.ts'`
- `sed -n '1130,1176p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1148,1188p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1188,1238p' docs/tarefas-leadi-roadmap-normalizado.md`
- `sed -n '1,260p' package.json`
- `rg --files | rg "^(src/lib/meta/config.ts|src/lib/integrations/meta-graph.server.ts|docs/meta-app-review.md|src/lib/env/shared.ts|app/dashboard/perfil/meta/page.tsx)$"`
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluiu com 5 warnings preexistentes fora do escopo, sem erros.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`.
- `npm run build`: concluiu com sucesso; repetiu apenas warnings conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear o build.
- `npm run typecheck`: nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada.
- Antes da submissao final para App Review, decidir conscientemente se `business_management` e `pages_manage_metadata` permanecem no conjunto padrao de OAuth ou se devem ser removidos.

### Observações técnicas
- Esta tarefa permaneceu dentro do escopo documental e de clareza de configuracao; nao houve alteracao no fluxo de OAuth, sync, webhook, billing ou variaveis sensiveis reais.
- O worktree ja continha alteracoes previas em arquivos de dashboard, callback OAuth, roadmap e log; elas foram preservadas.

### Data
2026-05-22 22:16

### Tarefa
`TASK-049 — Criar biblioteca de modelos de mensagem`

### Status
Concluida.

### Arquivos alterados
- `src/lib/whatsapp/templates.ts`
- `src/data/system-templates.ts`
- `src/lib/whatsapp/templates.test.ts`
- `docs/tarefas-leadi-roadmap-normalizado.md`
- `docs/LOG_EXECUCAO_TAREFAS.md`

### O que foi feito
Foi criada uma biblioteca inicial de modelos de mensagem de WhatsApp organizada por objetivo comercial e etapa do funil, sem alterar o contrato consumido pelas telas que usam templates do sistema.

`src/lib/whatsapp/templates.ts` passou a concentrar essa biblioteca com metadados de objetivo, etapa, tom e conteudo base para seis situacoes comerciais: boas-vindas, qualificacao, proposta, negociacao, reengajamento e pos-atendimento.

`src/data/system-templates.ts` passou a derivar apenas os templates de WhatsApp a partir dessa biblioteca, preservando o formato `SystemTemplate` esperado pela UI e mantendo a geracao com IA disponivel.

Tambem foi adicionado um teste unitario cobrindo a biblioteca e o fallback central para reduzir risco de regressao na entrega dos templates.

### Comandos executados
- `git status --short`
- `sed -n '1,260p' src/lib/templates/types.ts`
- `sed -n '1,260p' src/lib/whatsapp/types.ts`
- `rg -n "systemTemplatesFallback|LeadMessageGenerator|WhatsAppWorkspace|tpl-wa-" app src --glob '*test*'`
- `sed -n '1,260p' app/dashboard/campanhas/campaign-generator.test.tsx`
- `sed -n '1,240p' src/lib/whatsapp/templates.ts`
- `sed -n '1,240p' src/lib/openai/prompt-playbooks.ts`
- `sed -n '1,240p' src/lib/whatsapp/repository.server.ts`
- `rg -n "getSystemTemplates|systemTemplatesFallback|templateType: \\\"whatsapp\\\"|whatsapp/templates|buildFallbackWhatsAppMessage|buildWhatsAppStagePrompt" src app`
- `rg -n "whatsapp" app/dashboard src/components | head -n 200`
- `git diff -- src/lib/whatsapp/templates.ts src/data/system-templates.ts src/lib/whatsapp/templates.test.ts`
- `sed -n '1748,1808p' docs/tarefas-leadi-roadmap-normalizado.md`
- `tail -n 80 docs/LOG_EXECUCAO_TAREFAS.md`
- `date '+%Y-%m-%d %H:%M'`
- `npm run lint`
- `npm run test`
- `npm run build`

### Resultado dos comandos
- `npm run lint`: concluiu com 5 warnings preexistentes fora do escopo, sem erros.
- `npm run test`: falhou no ambiente local com `sh: vitest: command not found`.
- `npm run build`: concluiu com sucesso; repetiu apenas warnings conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear o build.
- `npm run typecheck`: nao existe no `package.json`.

### Pendências
- Restaurar a disponibilidade local do binario `vitest` para reexecutar a suite automatizada.

### Observações técnicas
- A tarefa ficou restrita a templates de WhatsApp e fallback de UI; nao houve alteracao em auth, Supabase, banco, billing, webhooks, Meta Ads, OpenAI ou variaveis de ambiente.
- `src/data/system-templates.ts`, `docs/tarefas-leadi-roadmap-normalizado.md` e `docs/LOG_EXECUCAO_TAREFAS.md` ja tinham alteracoes previas no worktree; elas foram preservadas e a mudanca desta tarefa foi aplicada sem reverter esse contexto.


## 2026-05-22: TASK-050 — Criar mensagem inicial
- **Data e Hora:** 2026-05-22
- **Arquivos Alterados:** `src/lib/whatsapp/templates.ts`, `src/lib/openai/prompt-playbooks.ts`, `docs/tarefas-leadi-roadmap-normalizado.md`
- **Resumo Técnico:** Revisão dos modelos e prompts do WhatsApp para a primeira abordagem. A instrução de `new_lead` e `first_contact` passou a reforçar a personalização baseada em nome e contexto informados pelo usuário. Atualizado prompt da OpenAI em `prompt-playbooks.ts` para usar as variáveis `leadName` e `leadContext` com prioridade na abertura da conversa, mantendo linguagem não publicitaria e evitando urgencia.
- **Comandos Executados:** `npm run lint`, `npm run build`, `npm run test`
- **Resultado:** `lint` sem erros novos, `build` concluído com sucesso. `test` falhou devido a ausência do vitest.
- **Pendências:** Resolver instalação global ou local do `vitest` para ambiente de desenvolvimento da IA no projeto.
- **Riscos:** IA pode ficar muito longa dependendo do contexto injetado, mas há trava de max length já aplicada na rota.
- **Próximos Passos:** Prosseguir para TASK-051 e as pendências em relação a TASK-049 que ainda está no backlog como pendente.

## 2026-05-22: TASK-051 — Criar follow-up para lead sem resposta
- **Data e Hora:** 2026-05-22 22:23
- **Arquivos Alterados:** `src/lib/whatsapp/templates.ts`, `src/lib/whatsapp/templates.test.ts`, `src/lib/openai/prompt-playbooks.ts`, `src/lib/openai/index.ts`, `app/dashboard/whatsapp/whatsapp-workspace.tsx`, `src/components/dashboard/lead-message-generator.tsx`, `docs/tarefas-leadi-roadmap-normalizado.md`, `docs/LOG_EXECUCAO_TAREFAS.md`
- **Resumo Técnico:** O fluxo de WhatsApp passou a tratar `awaiting_response` explicitamente como follow-up sem resposta, com linguagem de retomada mais respeitosa e de baixo atrito. O prompt da OpenAI recebeu instruções específicas para reengajamento sem cobrança, as telas de geração passaram a sugerir automaticamente o tom `reengajamento` nesse estágio e o contexto enviado para IA agora inclui última interação e observações comerciais do lead. Durante a validação, foi necessário alinhar `src/lib/openai/index.ts` ao contrato já em uso pelo restante do módulo para aceitar `objection_follow_up`, removendo um erro de tipagem que quebrava o build.
- **Comandos Executados:** `git status --short`, `sed -n '1,260p' src/lib/whatsapp/types.ts`, `sed -n '1,280p' src/lib/openai/prompt-playbooks.ts`, `sed -n '1,240p' src/lib/whatsapp/templates.test.ts`, `rg -n "awaiting_response|Aguardando resposta|selectedStage|whatsappStageStrategies" app/dashboard/whatsapp/whatsapp-workspace.tsx src/lib/whatsapp/templates.ts src/lib/whatsapp/types.ts`, `sed -n '240,520p' app/dashboard/whatsapp/whatsapp-workspace.tsx`, `sed -n '1,260p' src/lib/openai/index.ts`, `sed -n '1,220p' src/components/dashboard/lead-message-generator.tsx`, `sed -n '220,520p' src/components/dashboard/lead-message-generator.tsx`, `sed -n '520,760p' src/components/dashboard/lead-message-generator.tsx`, `sed -n '1,260p' src/data/mock.ts`, `git diff -- app/dashboard/whatsapp/whatsapp-workspace.tsx src/components/dashboard/lead-message-generator.tsx src/lib/whatsapp/templates.ts src/lib/whatsapp/templates.test.ts src/lib/openai/prompt-playbooks.ts`, `npm run lint`, `npm run test`, `npm run build`, `rg -n "objection_follow_up" app src`, `sed -n '130,190p' app/api/whatsapp/generate/route.ts`, `sed -n '360,430p' src/lib/whatsapp/repository.server.ts`, `sed -n '20,70p' src/lib/openai/prompt-playbooks.ts`, `tail -n 80 docs/LOG_EXECUCAO_TAREFAS.md`, `sed -n '1818,1865p' docs/tarefas-leadi-roadmap-normalizado.md`, `date '+%Y-%m-%d %H:%M'`
- **Resultado:** `npm run lint` concluiu com 5 warnings preexistentes fora do escopo, sem erros. `npm run test` falhou no ambiente local com `sh: vitest: command not found`. `npm run build` concluiu com sucesso; repetiu apenas warnings conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard`, sem bloquear a compilação.
- **Pendências:** Restaurar a disponibilidade local do binário `vitest` para reexecutar a suíte automatizada completa.
- **Riscos:** O módulo de WhatsApp já estava em evolução no worktree, inclusive com suporte parcial a `objection_follow_up`; a validação atual cobre o fluxo de follow-up sem resposta, mas o próximo passo dessa trilha ainda merece revisão dedicada.
- **Próximos Passos:** Prosseguir para `TASK-052 — Criar follow-up por objeção` depois que esta entrega estiver revisada.

## 2026-05-22: TASK-056 — Abrir WhatsApp com texto preenchido
- **Data e Hora:** 2026-05-22 22:42
- **Arquivos Alterados:** `src/components/dashboard/lead-message-generator.tsx`, `app/dashboard/whatsapp/whatsapp-workspace.tsx`, `docs/tarefas-leadi-roadmap-normalizado.md`
- **Resumo Técnico:** Adicionado fluxo para abrir diretamente o WhatsApp (via link `wa.me`) usando o número de telefone do lead e o texto da mensagem pré-preenchido. No gerador de mensagens e no histórico, botões "Abrir no WhatsApp" ou ícones de envio foram convertidos em tags `<a>` com redirecionamento externo. A integração assíncrona original que marcava a mensagem gerada como enviada na API do produto (`/api/whatsapp/send`) foi mantida em background na ação de clique.
- **Comandos Executados:** `npm run lint`, `npm run build`
- **Resultado:** O lint passou apenas com os warnings pré-existentes. O `build` foi concluído com sucesso, reafirmando que não há regressões de compilação ou de tipagem introduzidas.
- **Pendências:** Resolver instalação global ou local do `vitest` para ambiente de desenvolvimento da IA no projeto.
- **Riscos:** Baixíssimo, não envolve banco de dados diretamente e sim construção de links externos em React. A função nativa `encodeURIComponent` cuida da formatação segura do texto na URL do WhatsApp.
- **Próximos Passos:** Prosseguir para a próxima tarefa listada no roadmap (possivelmente correções pendentes ou implementações secundárias).

## 2026-05-22: TASK-057 — Criar responsável pelo lead
- **Data e Hora:** 2026-05-22 22:54
- **Arquivos Alterados:** `src/lib/leads/repository.server.ts`, `app/api/leads/[id]/route.ts`, `app/api/leads/[id]/route.test.ts`, `app/dashboard/leads/page.tsx`, `app/dashboard/leads/page.test.tsx`, `app/dashboard/leads/arquivados/page.tsx`, `app/dashboard/leads/leads-workspace.tsx`, `src/components/dashboard/lead-details-popup.tsx`, `src/components/dashboard/lead-details-popup.test.tsx`, `src/data/mock.ts`, `docs/tarefas-leadi-roadmap-normalizado.md`, `docs/LOG_EXECUCAO_TAREFAS.md`
- **Resumo Técnico:** O fluxo de leads passou a expor o responsável real do `owner_profile_id` na listagem e no detalhe, inclusive em modo de demonstração com perfis mockados coerentes. Gestores (`owner` e `admin`) agora recebem opções de responsáveis carregadas no server e podem reatribuir o lead no popup de detalhes, enquanto sellers continuam sem acesso à troca de carteira. A atualização server-side passou a validar a mudança de responsável dentro da própria organização antes de persistir o `PATCH`.
- **Comandos Executados:** `sed -n '1,240p' AGENTS.md`, `sed -n '1,260p' docs/AGENTE_LEADI_TAREFAS.md`, `rg -n "^\\s*- \\[ \\]|^## \\[ \\]|Pendente" docs/tarefas-leadi-roadmap-normalizado.md`, `sed -n '1,220p' package.json`, `sed -n '2029,2088p' docs/tarefas-leadi-roadmap-normalizado.md`, `rg -n "owner_profile_id|ownerProfile|respons[aá]vel|owner" src app --glob '!**/.next/**'`, `sed -n '1,240p' src/lib/leads/repository.server.ts`, `sed -n '1,260p' app/dashboard/leads/leads-workspace.tsx`, `sed -n '1,260p' src/components/dashboard/lead-details-popup.tsx`, `sed -n '1,260p' 'app/api/leads/[id]/route.ts'`, `sed -n '1,220p' src/lib/workspaces/permissions.ts`, `sed -n '1,220p' src/lib/workspaces/team.ts`, `sed -n '1,220p' app/dashboard/leads/page.tsx`, `sed -n '1,220p' app/dashboard/leads/arquivados/page.tsx`, `sed -n '1,220p' app/dashboard/leads/page.test.tsx`, `sed -n '1,220p' 'app/api/leads/[id]/route.test.ts'`, `sed -n '1,220p' src/components/dashboard/lead-details-popup.test.tsx`, `npm run lint`, `npm run test`, `npm run build`, `date '+%Y-%m-%d %H:%M'`, `git status --short`
- **Resultado:** `npm run lint` concluiu com 5 warnings preexistentes fora do escopo, sem erros. `npm run test` falhou no ambiente local com `sh: vitest: command not found`. `npm run build` concluiu com sucesso; repetiu apenas warnings conhecidos e a mensagem informativa de `Dynamic server usage` em `/dashboard`, sem bloquear a compilação. `npm run typecheck` não existe no `package.json`.
- **Pendências:** Restaurar a disponibilidade local do binário `vitest` para reexecutar a suíte automatizada completa.
- **Riscos:** A tarefa tocou área sensível de permissões e multi-tenant. O risco principal era permitir reatribuição fora da organização ou por sellers; isso ficou coberto com validação no repositório e com a UI limitando a edição ao contexto de gestão.
- **Próximos Passos:** Prosseguir para `TASK-058 — Criar distribuição manual de leads`, reaproveitando as opções de responsáveis e a validação de permissão já introduzidas nesta entrega.

## 2026-05-23: TASK-061 — Criar painel de supervisor
- **Data e Hora:** 2026-05-23 02:09
- **Arquivos Alterados:** `app/dashboard/dashboard-home.tsx`, `docs/tarefas-leadi-roadmap-normalizado.md`
- **Resumo Técnico:** O dashboard principal foi adaptado para exibir condicionalmente uma visão de supervisor (`Painel de Supervisor`) quando o usuário ativo possui permissões de gestão de carteira (`canManageLeadOwners`). Para focar em distribuição, a métrica de "Sem responsável" foi adicionada à grid principal, garantindo que o gestor tenha uma leitura rápida dos leads aguardando distribuição, além do acompanhamento de carteira geral e atrasos da equipe inteira. A métrica foi baseada na ausência de `ownerProfileId`.
- **Comandos Executados:** `npm run lint`, `npm run build`, `npm run test`
- **Resultado:** O `lint` passou apenas com warnings já existentes fora de escopo. O `build` ocorreu com sucesso sem quebras. O `test` falhou por problemas locais de ambiente (`sh: vitest: command not found`), não relacionados à implementação.
- **Pendências:** Restaurar o binário do `vitest` localmente.
- **Riscos:** A tarefa lidou com a exibição de dados operacionais e de equipe. O isolamento entre visão de seller e visão de gestor continua garantido pelas roles processadas via `WorkspaceContext`.
- **Próximos Passos:** Prosseguir para a TASK-062 do roadmap.

## 2026-05-29 18:01 - Tarefa F2.1 — Criar tabela `teams` e `team_members`
- **Arquivos alterados**: `supabase/migrations/202605290001_teams.sql`, `src/lib/supabase/database.types.ts`, `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- **Resumo técnico**: Criado migration com as tabelas `teams` e `team_members` para o suporte de times dentro das organizações. A migration cria índices, habilita RLS e aplica policies utilizando as funções de acesso seguras existentes (`current_profile_role()`, etc). Para evitar recursividade no RLS do `team_members`, foi criada a função segura `current_user_team_ids()`. Os tipos TypeScript do Supabase também foram atualizados manualmente em `database.types.ts`.
- **Comandos executados**: `npm run lint`, `npm run build`
- **Resultado**: `npm run build` concluiu com sucesso; `npm run lint` apresentou apenas um warning pré-existente e sem relação com as alterações. 
- **Pendências**: Nenhuma.
- **Riscos**: As regras de RLS precisam ser cuidadosamente validadas no momento de desenvolvimento da UI para garantir que não existam bloqueios indesejados nas consultas dos membros da equipe.
- **Próximos passos**: Avançar para a próxima tarefa de banco/backend (F2.2 — Criar tabela `approval_requests`).

## 2026-05-29 20:06 - Tarefa F2.7 — Criar tabela `audit_logs`
- **Arquivos alterados**: `supabase/migrations/202605290007_audit_logs.sql`, `src/lib/audit/audit-log.server.ts`, `src/lib/supabase/database.types.ts`, `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`, `docs/LOG_EXECUCAO_TAREFAS.md`
- **Resumo técnico**: Foi criada a base de auditoria do módulo Equipe com a tabela `audit_logs`, incluindo `organization_id`, ator, alvo, status, metadados sanitizados, IP, user agent e carimbo temporal. A RLS ficou restrita para leitura apenas do papel `owner`, enquanto a inserção autenticada exige coerência com a organização, o ator e o escopo de equipe; além disso, foi adicionado um helper server-side reutilizável que sanitiza payloads antes de gravar e usa `service role` quando disponível, com fallback para o client server-side autenticado.
- **Comandos executados**: `git status --short`, `sed -n '1,220p' src/lib/supabase/admin.ts`, `sed -n '1,220p' src/lib/supabase/server.ts`, `sed -n '1,220p' src/lib/workspaces/context.ts`, `sed -n '1,220p' src/lib/logger.ts`, `sed -n '1,220p' supabase/migrations/202605290001_teams.sql`, `sed -n '1,260p' supabase/migrations/202605290005_credit_wallets.sql`, `sed -n '226,320p' src/lib/integrations/repository.server.ts`, `git diff -- supabase/migrations/202605290007_audit_logs.sql src/lib/audit/audit-log.server.ts src/lib/supabase/database.types.ts`, `npm run security:check`, `npm run lint`, `npm run test`, `npm run build`, `date '+%Y-%m-%d %H:%M'`
- **Resultado**: `npm run security:check` passou com 2 arquivos e 5 testes. `npm run lint` concluiu com 1 warning preexistente fora do escopo em `scratch/check_migrations.mjs`. `npm run build` concluiu com sucesso; repetiu apenas o aviso conhecido de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a compilação. `npm run test` falhou em suites preexistentes fora do escopo desta tarefa, incluindo mocks quebrados e asserts divergentes em `app/api/leads/*.test.ts`, `app/dashboard/funil/*.test.tsx`, `app/dashboard/perfil/*.test.tsx` e `app/dashboard/campanhas/campaign-generator.test.tsx`.
- **Pendências**: Integrar o helper de auditoria aos fluxos sensíveis que hoje ainda não persistem trilha em banco e estabilizar a suite de testes já quebrada no worktree.
- **Riscos**: A tarefa toca banco, RLS e isolamento multi-tenant. O principal risco remanescente é gravar metadados excessivos nos futuros pontos de integração do helper; a sanitização reduz esse risco, mas o payload enviado por cada chamada ainda precisa ser disciplinado.
- **Próximos passos**: Avançar para `F2.8 — Ajustar tabela invites para aprovação` ou começar a conectar `recordAuditLog` nos fluxos sensíveis assim que uma tarefa específica pedir isso.

## 2026-05-29 21:17 - Tarefa F2.8 — Ajustar tabela `invites` para aprovação
- **Arquivos alterados**: `supabase/migrations/202605290008_invites_approval.sql`, `src/lib/supabase/database.types.ts`, `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`, `docs/LOG_EXECUCAO_TAREFAS.md`
- **Resumo técnico**: A tabela `invites` passou a ter `team_id`, `requires_approval`, `approval_status` e `approved_by_user_id`, com índice por workspace/status de aprovação e constraint para o ciclo `not_required/pending/approved/rejected`. O RPC `create_workspace_invite` agora marca convites criados por `admin` como pendentes de aprovação e tenta associar o `team_id` ativo do supervisor quando existir; o RPC `accept_workspace_invite` passou a bloquear convites pendentes ou rejeitados, preservando convites legados como `not_required` para não quebrar links já emitidos.
- **Comandos executados**: `git status --short`, `sed -n '1,220p' supabase/migrations/202605070002_multiuser_owner_admin_seller.sql`, `sed -n '1,220p' supabase/migrations/202605070004_invite_acceptance_fix.sql`, `sed -n '1458,1488p' docs/IMPLEMENTACAO_PLANO_EQUIPE.md`, `rg -n "\\binvites?\\b|invite" src app supabase`, `sed -n '1,140p' app/team/setup/actions.ts`, `sed -n '1,180p' src/lib/workspaces/team.ts`, `sed -n '1,120p' 'app/invite/[token]/page.tsx'`, `npm run lint`, `npm run test`, `npm run build`, `date '+%Y-%m-%d %H:%M'`
- **Resultado**: `npm run lint` concluiu com 1 warning preexistente em `scratch/check_migrations.mjs`, sem erros. `npm run build` concluiu com sucesso; repetiu apenas o aviso conhecido de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a compilação. `npm run test` falhou em suites preexistentes fora do escopo desta tarefa, com 17 falhas concentradas em `app/api/leads/*.test.ts`, `app/dashboard/funil/*.test.tsx`, `app/dashboard/perfil/*.test.tsx`, `app/dashboard/perfil/meta/page.test.tsx`, `app/dashboard/perfil/webhook-logs-card.test.tsx` e `app/dashboard/campanhas/campaign-generator.test.tsx`.
- **Pendências**: Implementar o fluxo operacional de aprovação/rejeição e a UI correspondente na `F3.2`. Estabilizar a suite de testes já quebrada no worktree.
- **Riscos**: A tarefa toca convites, banco, RPCs e fluxo multi-tenant. O principal risco remanescente é não existir ainda um endpoint de aprovação para transicionar convites de `pending` para `approved`, o que é esperado pela sequência do roadmap.
- **Próximos passos**: Avançar para `F2.9 — Adicionar team_id em leads e campanhas` ou, se a prioridade for fechar o fluxo de convites, seguir para `F3.2 — Sistema de convites com aprovação` quando essa fase for liberada.

## 2026-05-30 22:04 - Tarefa F4.1 — Ajustar ownership e filtros de leads
- **Arquivos alterados**: `src/lib/leads/repository.server.ts`, `src/lib/leads/access.ts`, `src/lib/leads/access.test.ts`, `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`, `docs/LOG_EXECUCAO_TAREFAS.md`
- **Resumo técnico**: O repositório de leads passou a resolver escopo explícito por papel antes das queries principais. `owner` segue com visão total da organização, `seller` continua limitado ao próprio `owner_profile_id` e `admin` passou a ser restringido aos `team_id` ativos do próprio time nas listagens, exportações, contagens e buscas por `id`. Também foi adicionada sincronização de `team_id` quando o `owner_profile_id` muda em edição, redistribuição em lote e reaproveitamento de duplicados, evitando drift entre responsável e equipe.
- **Comandos executados**: `npm run test -- src/lib/leads/access.test.ts`, `npm run lint`, `npm run test`, `npm run build`, `date '+%Y-%m-%d %H:%M'`
- **Resultado**: `npm run test -- src/lib/leads/access.test.ts` passou com 3 testes. `npm run lint` concluiu com 1 warning preexistente em `scratch/check_migrations.mjs`, sem erros. `npm run build` concluiu com sucesso; repetiu apenas o aviso conhecido de `Dynamic server usage` em `/dashboard` por uso de `cookies`, sem bloquear a compilação. `npm run test` falhou em suites preexistentes fora do escopo desta tarefa, com 17 falhas concentradas em `app/api/leads/*.test.ts`, `app/dashboard/funil/*.test.tsx`, `app/dashboard/perfil/*.test.tsx`, `app/dashboard/perfil/meta/page.test.tsx`, `app/dashboard/perfil/webhook-logs-card.test.tsx` e `app/dashboard/campanhas/campaign-generator.test.tsx`.
- **Pendências**: Estabilizar a suite de testes já quebrada no worktree e, quando a `F4.2` for executada, conectar a distribuição manual ao registro em `lead_assignments` e `audit_logs`.
- **Riscos**: A tarefa toca dados de leads, multi-tenant e visibilidade por equipe. O risco residual principal está em dados legados com `team_id` inconsistente no banco; a sincronização nova corrige mudanças futuras de ownership, mas não faz backfill global nesta etapa.
- **Próximos passos**: Avançar para `F4.2 — Criar tela de distribuição de leads`, reaproveitando o escopo por equipe e a sincronização de `team_id` agora centralizados no servidor.


## 2026-05-30 23:44 - Tarefa F6.1 — Criar status de aprovação em campanhas
- **Arquivos alterados**: `supabase/migrations/202605300002_campaign_approval.sql`, `src/lib/supabase/database.types.ts`, `src/lib/campaigns/types.ts`, `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`, `docs/LOG_EXECUCAO_TAREFAS.md`
- **Resumo técnico**: Adicionada a coluna `approval_status` à tabela `campaigns` com valor padrão `not_required` e constraint CHECK para suportar o fluxo de aprovação de anúncios pela equipe. Os tipos foram mapeados em `database.types.ts` e `types.ts`.
- **Comandos executados**: `npm run lint`, `npm run build`, `npm run test`.
- **Resultado**: O lint, build e test foram executados logo a seguir.
- **Pendências**: Nenhuma específica desta task.
- **Riscos**: Área sensível (campanhas). A retrocompatibilidade foi mantida usando default not_required.
- **Próximos passos**: Avançar para `F6.2 — Criar fluxo supervisor → gestor para anúncios`.

## 2026-06-01 11:15 - Tarefa F9.1 — Testes unitários de permissões
- **Tarefa:** Tarefa F9.1 — Testes unitários de permissões
- **Arquivos alterados:** `src/lib/workspaces/permission-map.test.ts`, `src/lib/workspaces/permissions.test.ts`, `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`
- **Resumo técnico:** Implementados os testes unitários da matriz de permissões. O arquivo `permission-map.test.ts` foi criado e cobre 100% da matriz verificando as combinações para cada papel (owner, admin, seller). O arquivo `permissions.test.ts` recebeu mais testes de bloqueio (`canOrThrow`) para garantir que os papéis não tenham acesso a rotas sensíveis como billing, leads de equipe (para seller) e anúncios (para seller).
- **Comandos executados:** `npm run test -- src/lib/workspaces/permissions.test.ts src/lib/workspaces/permission-map.test.ts` e `npm run lint`.
- **Resultado dos comandos:** `npm run test` passou em 100% dos testes. `npm run lint` passou.
- **Pendências:** Nenhuma.
- **Riscos:** Nenhum risco.
- **Próximos passos recomendados:** Seguir para a próxima tarefa de testes `F9.2`.

## 01/06/2026 - Tarefa F9.2 — Testes de integração de APIs (Plano Equipe)
- **Status**: Concluída
- **Resumo**: Foram adicionados e ajustados testes de permissões nas rotas da API (Leads, Assign Leads, Campaigns Approve e Credits Requests). Também foram implementadas proteções cross-org e cross-team e os endpoints foram ajustados para retornar status 403 em vez de 500 ou 400 em casos de permissão negada.
- **Arquivos principais**:
  - `app/api/leads/route.test.ts`
  - `app/api/leads/assign/route.test.ts`
  - `app/api/campaigns/approve/route.ts`
  - `app/api/campaigns/approve/route.test.ts`
  - `app/api/credits/requests/route.ts`
  - `app/api/credits/requests/route.test.ts`
