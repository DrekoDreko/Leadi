# Auditoria da estrutura de usuarios e equipe

Data da auditoria: 2026-05-21
Tarefa: `TASK-005 -- Revisar estrutura de usuarios e equipe`
Escopo: auditoria tecnica documental da estrutura atual de papeis, convites, onboarding e acessos, sem alteracao funcional do SaaS.

## 1. Visao geral da estrutura atual

O Leadi trabalha hoje com tres papeis canonicos no schema:

- `owner`
- `admin`
- `seller`

Esses papeis aparecem tanto em `profiles.role` quanto em `workspace_members.role`.

O contexto real de acesso nao depende apenas do papel. Ele tambem depende de:

- `profiles.organization_id`
- `organizations.type` (`solo` ou `team`)
- `profiles.profile_setup_completed`
- guards de rota no `middleware.ts`
- helpers server-side em `src/lib/workspaces/context.ts`
- RPCs do Supabase para convite, promocao, remocao e setup inicial

Conclusao do desenho atual: a estrutura de equipe ja existe ponta a ponta, mas a regra de acesso esta distribuida entre middleware, helpers, UI e funcoes SQL. Isso funciona para o estado atual, porem aumenta o risco de drift quando o produto evoluir para distribuicao de leads e regras mais finas por equipe.

## 2. Arquivos relacionados analisados

Arquivos principais analisados:

- `src/lib/workspaces/context.ts`
- `src/lib/workspaces/permissions.ts`
- `src/lib/workspaces/team.ts`
- `app/team/setup/page.tsx`
- `app/team/setup/team-setup-client.tsx`
- `app/team/setup/actions.ts`
- `app/onboarding/profile-setup/page.tsx`
- `app/onboarding/profile-setup/actions.ts`
- `app/invite/[token]/page.tsx`
- `middleware.ts`
- `src/lib/supabase/database.types.ts`
- `supabase/migrations/202605070002_multiuser_owner_admin_seller.sql`
- `supabase/migrations/202605070004_invite_acceptance_fix.sql`
- `package.json`

## 3. Mapeamento atual de papeis

### 3.1 Owner

Capacidades identificadas:

- conclui o onboarding como responsavel inicial da organizacao;
- acessa rotas gerenciais protegidas por `requireWorkspaceManager()` e `isWorkspaceManagerRole()`;
- convida `admin` e `seller` em workspaces `team`;
- altera nome da corretora/equipe;
- promove e rebaixa membros entre `admin` e `seller`;
- remove membros da equipe, exceto o proprio owner;
- acessa a tela `/dashboard/criar-equipe` quando ainda esta em workspace `solo`.

Observacao importante:

- tanto no setup `solo` quanto no setup `team`, a RPC `complete_profile_setup` grava o usuario como `owner`.

### 3.2 Admin

Capacidades identificadas:

- e tratado como papel gerencial para acesso a `/team`, `/dashboard/importar` e paginas que usam `requireWorkspaceManager()`;
- pode alterar o nome da corretora/equipe;
- pode gerar convites apenas para `seller`;
- pode remover `seller` da equipe;
- aparece na UI como gestor operacional da equipe.

Limites identificados:

- nao pode convidar outro `admin`;
- nao pode alterar papeis de membros;
- nao pode remover `admin` nem `owner`;
- nao pode acessar o fluxo de criacao de equipe `solo -> team`, reservado ao owner.

### 3.3 Seller

Capacidades identificadas:

- trabalha apenas a carteira e os leads permitidos pelas regras atuais do CRM;
- aceita convite e passa a herdar `organization_id`, `role` e `profile_setup_completed` da equipe de destino.

Limites identificados:

- nao acessa `/team`;
- nao usa importacao de leads em workspace `team`;
- nao convida membros, nao altera nome da equipe e nao gerencia papeis.

Observacao importante:

- quando um `seller` e removido da equipe, a RPC `remove_workspace_member` cria automaticamente uma nova organizacao `solo` e transforma esse usuario em `owner` do novo workspace individual.

### 3.4 Drift de nomenclatura

O schema canonico nao contem mais o papel `supervisor`, mas o projeto ainda preserva vestigios desse nome:

- `normalizeWorkspaceRole()` converte `supervisor` para `admin`;
- existe alias `requireSupervisor()` apontando para `requireWorkspaceManager()`;
- a tela de onboarding oferece a opcao visual `Supervisor`, embora a gravacao final seja `owner` em workspace `team`.

Esse drift nao quebra o fluxo atual, mas torna mais dificil explicar papeis e limites para usuarios e para futuras implementacoes.

## 4. Fluxos principais encontrados

### 4.1 Onboarding inicial

Fonte principal:

- `app/onboarding/profile-setup/*`
- RPC `complete_profile_setup`

Comportamento atual:

- o usuario escolhe `solo` ou `team`;
- o workspace recebe `organizations.type` correspondente;
- o usuario vira `owner` nos dois casos;
- `profile_setup_completed` passa para `true`;
- uma linha `active` e criada em `workspace_members`;
- o redirect vai para `/dashboard` no modo `solo` e para `/team/setup` no modo `team`.

Implicacao:

- o papel tecnico de um consultor individual nao e `seller`, e sim `owner` de um workspace `solo`.

### 4.2 Convites e entrada na equipe

Fonte principal:

- `app/team/setup/actions.ts`
- `app/invite/[token]/page.tsx`
- RPCs `create_workspace_invite` e `accept_workspace_invite`

Comportamento atual:

- apenas `owner` e `admin` podem criar convite em workspace `team`;
- `admin` so pode convidar `seller`;
- a UI ainda depende de `team_invites` em billing para liberar geracao de convite;
- o aceite do convite move o perfil para a organizacao da equipe;
- ao aceitar, memberships ativos em outras organizacoes sao marcados como `removed`;
- o convite passa para `used` e grava `used_by_user_id` e `used_at`.

Implicacao estrutural:

- o sistema assume um usuario ativo em uma unica organizacao por vez.

### 4.3 Gestao de membros

Fonte principal:

- `app/team/setup/team-setup-client.tsx`
- RPCs `update_workspace_member_role` e `remove_workspace_member`

Comportamento atual:

- apenas o owner altera papeis;
- owner promove `seller -> admin` e rebaixa `admin -> seller`;
- owner e admin podem remover `seller`;
- admin nao remove `admin` nem `owner`;
- a remocao nao deixa o usuario sem workspace: o sistema cria um novo workspace `solo` para ele.

Ponto positivo:

- a regra server-side nas RPCs reforca os limites mostrados na UI.

### 4.4 Guards de rota e contexto

Fonte principal:

- `middleware.ts`
- `src/lib/workspaces/context.ts`

Regras centrais encontradas:

- `/team` exige papel gerencial;
- `/dashboard/importar` exige papel gerencial quando o workspace e `team`;
- `/dashboard/criar-equipe` exige `owner` em workspace `solo`;
- onboarding pendente bloqueia rotas protegidas e redireciona para `/onboarding/profile-setup`;
- o contexto usa `workspaceType`, `role`, `isManager`, `isSoloOwner` e `navVariant` para derivar o comportamento.

Observacao importante:

- `requireTeamManagement()` hoje e apenas um alias para `requireWorkspaceManager()`, sem regra adicional propria.

## 5. Gargalos e riscos tecnicos

### 5.1 Regra espalhada em muitas camadas

As permissoes aparecem em:

- middleware;
- helpers server-side;
- UI client-side;
- RPCs do banco;
- texto explicativo da interface.

Risco:

- ajustes futuros podem atualizar uma camada e esquecer outra.

### 5.2 Mistura entre permissao e plano comercial

A tela de equipe combina:

- permissao do papel;
- tipo do workspace;
- limite de billing `team_invites`.

Risco:

- o usuario pode interpretar um bloqueio comercial como bloqueio de papel, ou vice-versa.

### 5.3 Drift entre papel tecnico e copy de produto

O produto fala em `Consultor`, `Supervisor`, `Admin` e `Owner`, mas o comportamento tecnico real e:

- `solo` -> `owner`
- `team` inicial -> `owner`
- papel legado `supervisor` -> normalizado para `admin`

Risco:

- ambiguidade em documentacao, suporte, analytics e futuras regras de distribuicao.

### 5.4 Organizacao unica por usuario

O aceite de convite remove memberships ativos em outras organizacoes e realoca o perfil para a nova equipe.

Risco:

- essa regra simplifica o isolamento multi-tenant, mas limita cenarios futuros de multi-equipe, operacao compartilhada ou transicao controlada entre carteiras.

### 5.5 `workspace_members.user_id` aponta para perfil, nao para auth user

Em `workspace_members`, o campo `user_id` armazena `profiles.id`, nao `auth_user_id`.

Risco:

- o nome do campo pode induzir leitura errada em consultas futuras, integracoes e manutencao de regras de acesso.

### 5.6 Vestigios de regra legado/nao canonicamente usados

Existem sinais de drift historico:

- branch para `seller` em workspace `solo` em funcoes de permissao e rename;
- alias `requireSoloSeller()` retornando `requireSoloOwner()`;
- navegacao `seller-solo` para um usuario que tecnicamente e `owner`.

Risco:

- a semantica de acesso fica mais dificil de entender e testar.

## 6. Conclusao

A estrutura atual de usuarios e equipe ja suporta o basico de onboarding multiusuario, convites por link e gestao simples de membros, com enforcement importante no banco e no middleware.

Os principais gargalos reais para as proximas tarefas sao:

- consolidar um glossario unico de papeis;
- centralizar a matriz de acesso em menos pontos;
- deixar explicito que o sistema trabalha com uma unica organizacao ativa por usuario;
- separar melhor restricao comercial de restricao de permissao;
- reduzir o drift entre copy de produto, helpers e contratos tecnicos.

Esses pontos impactam diretamente futuras tarefas de distribuicao de leads, ownership comercial e operacao de equipe.
