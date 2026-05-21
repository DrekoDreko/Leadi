# Roadmap Leadi

Documento de planejamento baseado na leitura do código atual do SaaS Leadi em `2026-05-21`.

## 1. Diagnóstico geral do SaaS atual

### O que já existe de forma real

- O núcleo de autenticação e proteção de rotas já é real e está espalhado entre `middleware.ts`, `app/auth/callback/route.ts`, `src/lib/supabase/server.ts` e `src/lib/workspaces/context.ts`. O produto já usa Supabase Auth, redireciona usuários sem sessão, força setup de perfil e diferencia permissões por tipo de workspace e papel.
- A estrutura multi-tenant existe de forma concreta em `public.organizations`, `public.profiles`, `public.workspace_members` e `public.invites`, com reforços recentes em `supabase/migrations/202605120001_standardize_rls_isolation.sql` e `supabase/migrations/202605200002_supabase_hardening_rls.sql`.
- O CRM já tem base funcional real: `src/lib/leads/repository.server.ts` implementa listagem, criação, atualização, arquivamento, exportação, comentários e ingestão por webhook. As rotas `app/api/leads/route.ts`, `app/api/leads/[id]/route.ts`, `app/api/leads/[id]/comments/route.ts`, `app/api/leads/export/route.ts` e `app/api/webhooks/leads/route.ts` mostram que o fluxo não está só no frontend.
- A integração com Meta existe além do layout: `app/api/integrations/meta/connect/route.ts`, `app/api/integrations/meta/callback/route.ts`, `app/api/integrations/meta/sync/route.ts`, `app/api/meta/webhook/route.ts`, `app/api/meta/leads/import/route.ts`, `app/api/meta/leads/sources/route.ts`, `src/lib/integrations/meta-graph.server.ts`, `src/lib/meta/webhook-processing.server.ts` e `src/lib/meta/manual-lead-import.server.ts` cobrem OAuth, sincronização de ativos, webhook e importação manual de leads.
- A geração de campanhas com IA já está integrada a créditos, persistência e compliance em `app/api/campaigns/generate/route.ts`, `src/lib/openai/index.ts`, `src/lib/openai/compliance-guardrails.ts`, `src/lib/ai/credits.ts` e `src/lib/campaigns/repository.server.ts`.
- O módulo de WhatsApp já gera mensagens reais com IA e persiste histórico em `app/api/whatsapp/generate/route.ts`, `src/lib/whatsapp/repository.server.ts`, `src/lib/whatsapp/templates.ts` e `supabase/migrations/202604290005_whatsapp_messages_history.sql`.
- Billing e créditos já existem de verdade em `src/lib/billing/*`, `app/api/billing/mercadopago/*`, `supabase/migrations/202605060001_billing_subscriptions.sql`, `supabase/migrations/202604290004_billing_credits_mercadopago.sql` e `supabase/migrations/202605140003_ai_credits.sql`.

### O que parece incompleto, raso ou ainda dependente de mock

- Vários repositórios entram em modo demonstração quando o Supabase não está pronto ou quando o fluxo ainda não foi consolidado. Isso aparece claramente em `src/lib/leads/repository.server.ts`, `src/lib/campaigns/repository.server.ts`, `src/lib/whatsapp/repository.server.ts`, `src/lib/creative-requests/repository.server.ts`, `src/lib/dashboard-reminders/repository.server.ts` e `src/lib/integrations/repository.server.ts`.
- A camada de OpenAI por organização ainda está só sinalizada. As rotas `app/api/integrations/openai/save/route.ts`, `app/api/integrations/openai/test/route.ts`, `app/api/integrations/openai/connect/route.ts` e `app/api/integrations/openai/disconnect/route.ts` devolvem `coming_soon`, e a própria observação aparece em `app/dashboard/perfil/page.tsx`.
- As páginas de perfil e empresa existem, mas ainda são leves demais para uma operação comercial forte. `app/dashboard/perfil/empresa/page.tsx` é mais um resumo de dados do que uma área completa de gestão da empresa.
- O funil funciona visualmente em `app/dashboard/funil/sales-funnel-workspace.tsx`, mas hoje só mexe no campo `stage` do lead; não há histórico estruturado de transição nem tarefas comerciais vinculadas ao avanço.
- O dashboard principal em `app/dashboard/dashboard-home.tsx` já entrega visão geral, mas ainda privilegia volume básico e atalhos. Não há cards operacionais fortes para SLA de contato, backlog de follow-up ou leads parados por consultor.

### O que já está pronto para produção e o que ainda não está

- Pronto para produção com ressalvas: autenticação, isolamento base por organização, CRUD essencial de leads, exportação CSV, geração de campanha por IA, histórico de campanhas, geração de mensagens por IA, cobrança por créditos, rotas públicas legais e webhook técnico autenticado.
- Em produção, mas ainda sensível: a integração Meta depende fortemente de segredos válidos, token descriptografável e ativos sincronizados. `docs/meta-review-production-check.md` deixa claro que o fluxo de review ainda pode travar mesmo com a base existente.
- Ainda não pronto como produto maduro de CRM comercial: prontuário completo do lead, distribuição de leads para equipe, tarefas comerciais por lead, histórico de etapa, qualidade do lead, motivo de perda e leitura forte de operação por consultor.

### O que exige segurança ou revisão de produção

- O projeto tem endurecimento recente de segurança, mas ainda em evolução. Isso aparece em `docs/SECURITY_AUDIT.md`, `supabase/migrations/202605200001_security_high_fixes.sql`, `supabase/migrations/202605200002_supabase_hardening_rls.sql`, `src/lib/api/route-security.ts`, `src/lib/rate-limit.ts` e `src/lib/logger.ts`.
- O arquivo `.env.production` existe no workspace e o próprio `README.md` alerta para não manter segredos reais ali. Isso é um ponto direto de revisão operacional antes de qualquer escala.
- A leitura sanitizada de segredos foi reforçada nas tabelas de integração, mas o diagnóstico de segurança ainda aponta risco residual em logs, webhooks, billing e exposição excessiva de dados operacionais.
- A review da Meta continua bloqueada por ambiente, billing e sincronização real de ativos, conforme `docs/meta-review-production-check.md`.

### O que está confuso ou desconectado na arquitetura atual

- Há rotas que parecem “atalhos de menu” e não módulos próprios. `app/dashboard/empresa/page.tsx` redireciona para `/dashboard/perfil/meta`, `app/dashboard/campanhas/page.tsx` redireciona para `/dashboard/criacoes/campanhas`, `app/dashboard/whatsapp/page.tsx` redireciona para leads com painel de mensagem e `app/dashboard/pedidos/page.tsx` redireciona para `/dashboard/criacoes/validador`.
- O CRM, o funil, o dashboard e o WhatsApp compartilham o mesmo `Lead`, mas ainda não compartilham uma linha operacional mais profunda. O lead tem `stage`, comentários e origem, mas não tem entidade própria de tarefa comercial, SLA, histórico de etapa ou agenda por oportunidade.
- O módulo `dashboard_reminders` funciona como lembrete mensal da área principal, não como tarefa do processo comercial. Isso aparece em `supabase/migrations/202605140002_dashboard_reminders.sql`, `app/api/dashboard-reminders/route.ts` e `src/components/dashboard/reminders-calendar-card.tsx`.
- O relatório comercial em `src/lib/reports/commercial-report.server.ts` é honesto ao assumir o limite do schema atual: ele já calcula distribuição, conversão e cobertura, mas não consegue medir ROI financeiro real porque custo e receita por lead/campanha não existem de forma ligada.

### Gap central do CRM hoje

- O gap mais importante para transformar o produto em plataforma forte de operação comercial está no prontuário e no workflow do lead. O banco atual de `leads` já tem campos de origem e Meta, mas não tem:
  - tarefa por lead;
  - histórico estruturado de mudança de etapa;
  - motivo de perda;
  - qualidade do lead;
  - SLA de primeiro contato;
  - distribuição operacional de carteira.
- Esse vácuo fica ainda mais claro porque `lead_follow_up_events` chegou a existir em `supabase/migrations/20260507160221_lead_follow_up_events.sql`, mas foi removido em `supabase/migrations/202605140001_remove_lead_score_agenda.sql`. Ou seja: o produto já ensaiou uma camada de agenda comercial e depois voltou para um modelo mais simples.

## 2. Prioridades estratégicas do produto

### 1. Meta OAuth + importação real de leads

- **Estado atual no código:** existe fluxo completo de OAuth, sync e importação em `app/api/integrations/meta/*`, `app/api/meta/*`, `src/lib/integrations/meta-graph.server.ts`, `src/lib/meta/manual-lead-import.server.ts` e `src/lib/meta/webhook-processing.server.ts`.
- **O que falta:** consolidar o status da conexão, diagnosticar blockers reais de ambiente, tornar o fluxo demonstrável para produção e deixar páginas/formulários/campanhas mais legíveis para operação.
- **Dependências técnicas:** `meta_integrations`, `meta_pages`, `meta_forms`, `meta_ad_accounts`, `lead_webhook_events`, `INTEGRATIONS_SECRET_KEY`, `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN`.
- **Risco principal:** o código existe, mas o fluxo quebra sem segredos, billing ativo e ativos sincronizados; isso já foi apontado em `docs/meta-review-production-check.md`.
- **Arquivos prováveis a alterar:** `app/dashboard/perfil/meta/page.tsx`, `app/api/integrations/meta/*`, `app/api/meta/*`, `src/lib/integrations/meta-graph.server.ts`, `src/lib/meta/manual-lead-import.server.ts`, `src/lib/meta/webhook-processing.server.ts`.

### 2. Prontuário completo do lead

- **Estado atual no código:** o lead já tem CRUD, comentários, estágio, origem, campanha e IDs da Meta em `src/lib/leads/repository.server.ts`, `app/dashboard/leads/*` e `src/components/dashboard/lead-details-popup.tsx`.
- **O que falta:** tela mais forte de detalhe, histórico de contato estruturado, tarefas por lead, motivo de perda, qualidade, vínculo claro com campanha/anúncio/formulário e CTAs comerciais úteis.
- **Dependências técnicas:** `public.leads`, `public.lead_comments`, novas tabelas ou colunas para tarefas, qualidade, perda e histórico.
- **Risco principal:** mexer no coração do CRM sem quebrar o contrato atual das rotas `/api/leads` e o uso compartilhado do tipo `Lead`.
- **Arquivos prováveis a alterar:** `src/lib/leads/repository.server.ts`, `app/api/leads/*`, `app/dashboard/leads/*`, `src/components/dashboard/lead-details-popup.tsx`, `src/lib/supabase/database.types.ts`, `supabase/migrations/*`.

### 3. Funil com tarefas e histórico

- **Estado atual no código:** o funil move leads entre etapas em `app/dashboard/funil/sales-funnel-workspace.tsx` usando `PATCH /api/leads/[id]`.
- **O que falta:** padronização de etapas, histórico de transição, tarefas comerciais associadas, detecção de leads parados e filtros operacionais úteis.
- **Dependências técnicas:** `leads.stage`, nova tabela de histórico, nova tabela de tarefas ou reaproveitamento de uma entidade própria de follow-up.
- **Risco principal:** hoje o estágio é um único campo no lead; qualquer melhoria precisa preservar compatibilidade com dashboard, CRM, WhatsApp e relatórios.
- **Arquivos prováveis a alterar:** `app/dashboard/funil/*`, `src/lib/leads/stages.ts`, `app/api/leads/[id]/route.ts`, `src/lib/leads/repository.server.ts`, `supabase/migrations/*`.

### 4. Dashboard com custo por lead e leads sem contato

- **Estado atual no código:** `app/dashboard/dashboard-home.tsx` mostra métricas básicas, onboarding e lembretes; `src/lib/reports/commercial-report.server.ts` já assume a limitação de custo/receita.
- **O que falta:** trocar parte do foco de “resumo da conta” por “painel da operação”, incluindo novos leads, sem contato, tarefas vencidas, campanhas ativas, SLA de primeiro contato e conversão por etapa.
- **Dependências técnicas:** prontuário do lead, tarefas por lead, custos por campanha mesmo que mockados na primeira fase.
- **Risco principal:** sem modelo de tarefa e sem custo por campanha, parte do dashboard terá de nascer com cálculo parcial ou mock controlado.
- **Arquivos prováveis a alterar:** `app/dashboard/dashboard-home.tsx`, `src/components/dashboard/widgets.tsx`, `src/lib/reports/commercial-report.server.ts`, `src/lib/dashboard-reminders/*`.

### 5. Distribuição de leads para equipe

- **Estado atual no código:** já existe workspace multiusuário com papéis e convites em `src/lib/workspaces/*` e `app/team/setup/*`, mas a operação de distribuição de leads ainda não foi criada.
- **O que falta:** responsável no lead, redistribuição manual, lote, regras simples e painel de supervisor.
- **Dependências técnicas:** `owner_profile_id` em `leads`, leitura de `profiles`, `workspace_members` e permissões por role.
- **Risco principal:** sellers têm visão limitada por RLS e os fluxos precisam respeitar esse isolamento sem esconder dados de owners/admins.
- **Arquivos prováveis a alterar:** `src/lib/leads/repository.server.ts`, `app/api/leads/*`, `app/dashboard/leads/*`, `app/team/setup/*`, `src/lib/workspaces/team.ts`.

### 6. Cadência de WhatsApp com IA

- **Estado atual no código:** a geração já existe em `app/api/whatsapp/generate/route.ts` e `src/lib/whatsapp/*`; o acesso público da rota de página redireciona para o painel de mensagem do lead.
- **O que falta:** estruturar biblioteca de mensagens, mensagens por momento do funil, reaproveitar histórico no lead e melhorar o CTA de abertura no WhatsApp.
- **Dependências técnicas:** histórico do lead mais rico, tarefas por lead, campo de objeção ou contexto comercial reutilizável.
- **Risco principal:** se continuar solto do prontuário do lead, o módulo vira um gerador de texto isolado e não uma cadência comercial.
- **Arquivos prováveis a alterar:** `src/lib/whatsapp/templates.ts`, `src/lib/whatsapp/repository.server.ts`, `app/api/whatsapp/generate/route.ts`, `src/components/dashboard/lead-message-generator.tsx`, `src/components/dashboard/lead-details-popup.tsx`.

### 7. Controle de campanha: pausar, turbinar, cancelar

- **Estado atual no código:** já existe preparação e publicação pausada/manual em `app/api/campaigns/publish/route.ts` e `src/lib/meta/campaign-publication.server.ts`.
- **O que falta:** UX melhor para status de publicação, reprocessamento, cancelamento controlado, visual de tentativa e vínculo entre campanha gerada e operação de captação.
- **Dependências técnicas:** `campaigns`, `meta_campaign_publication_attempts`, `meta_ad_accounts`, `meta_integrations`.
- **Risco principal:** a integração já usa `ads_management`, então qualquer erro de permissão ou status precisa ficar muito claro para não parecer falha genérica do produto.
- **Arquivos prováveis a alterar:** `app/dashboard/campanhas/campaign-generator.tsx`, `app/api/campaigns/publish/route.ts`, `src/lib/meta/campaign-publication.server.ts`, `src/lib/campaigns/repository.server.ts`.

### 8. Simulador de preços

- **Estado atual no código:** não existe módulo próprio; só há pricing público em `src/data/pricing.ts` e `app/pricing/page.tsx`.
- **O que falta:** levantamento de necessidades, campos mínimos, modelo de dados e protótipo “Em breve”.
- **Dependências técnicas:** estabilização do core CRM + Meta antes de virar prioridade de produto.
- **Risco principal:** abrir frente nova antes de consolidar a cadeia captação > atendimento > operação comercial.
- **Arquivos prováveis a alterar:** `app/dashboard/leads/*`, `app/dashboard/criacoes/*`, possível nova rota futura e `src/lib/supabase/database.types.ts` quando o momento chegar.

### 9. Pedidos de design/vídeo

- **Estado atual no código:** já existe módulo real em `src/lib/creative-requests/repository.server.ts`, `app/api/creative-requests/*` e `app/dashboard/criacoes/validador/page.tsx`.
- **O que falta:** amarrar melhor com campanha gerada, priorização operacional e visibilidade do impacto comercial do criativo.
- **Dependências técnicas:** campanha gerada mais estruturada, histórico de campanha e vínculo de peça com campanha/briefing.
- **Risco principal:** virar trilha paralela desconectada do produto principal se continuar operando como fila separada.
- **Arquivos prováveis a alterar:** `app/dashboard/criacoes/validador/page.tsx`, `app/dashboard/pedidos/pedidos-workspace.tsx`, `src/lib/creative-requests/repository.server.ts`.

### 10. Financeiro/comissões somente no futuro

- **Estado atual no código:** há billing do SaaS e créditos, mas não há financeiro comercial da corretora nem comissionamento de equipe.
- **O que falta:** esse tema ainda deve ficar fora do core de execução até o CRM, Meta e prontuário estarem sólidos.
- **Dependências técnicas:** vendas fechadas confiáveis, owner por lead, histórico de etapa e receita ligada à oportunidade.
- **Risco principal:** confundir billing da plataforma com financeiro comercial do cliente.
- **Arquivos prováveis a alterar no futuro:** `src/lib/reports/commercial-report.server.ts`, novas tabelas de receita/comissão e possivelmente dashboards novos.

## 3. Lista de tarefas pequenas para implementação

### Bloco A — CRM e prontuário do lead

### Tarefa 01 — Revisar estrutura atual de leads

**Objetivo:**  
Mapear o modelo atual de lead, os campos disponíveis, as limitações do prontuário e os pontos em que o tipo `Lead` diverge do schema real do Supabase.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: revisar a estrutura atual de leads e documentar campos, gaps e divergências entre frontend, API e banco.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- produzir um diagnóstico curto e versionado no repositório sobre o modelo atual de leads;
- listar campos reais, campos mockados e gaps do prontuário;
- não implementar novas features.

Arquivos prováveis:
- src/lib/leads/repository.server.ts
- src/data/mock.ts
- src/lib/supabase/database.types.ts
- src/components/dashboard/lead-details-popup.tsx

Critérios de aceite:
- o diagnóstico diferencia banco, API e UI;
- o material aponta gaps do prontuário do lead;
- nenhuma funcionalidade do produto é alterada.
```

**Escopo da implementação:** revisar somente a camada de leads e produzir diagnóstico utilizável.  
**Arquivos prováveis:** `src/lib/leads/repository.server.ts`, `src/lib/supabase/database.types.ts`, `src/data/mock.ts`, `src/components/dashboard/lead-details-popup.tsx`.  
**Critérios de aceite:**  
- existe um diagnóstico objetivo sobre o modelo de lead;  
- o documento aponta campos ausentes para operação comercial;  
- o código do produto continua intacto.  
**Dependências:** nenhuma.  
**Risco técnico:** baixo; risco maior é deixar o diagnóstico superficial.

### Tarefa 02 — Ajustar modelo de lead com campos comerciais

**Objetivo:**  
Criar a base de schema para prontuário comercial, sem ainda redesenhar toda a interface.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: ajustar o modelo de lead com campos comerciais mínimos para operação de CRM.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- criar migration para adicionar campos comerciais ao lead;
- incluir somente campos necessários para prontuário e operação;
- manter compatibilidade com o CRUD atual.

Arquivos prováveis:
- supabase/migrations/*
- src/lib/supabase/database.types.ts
- src/lib/leads/repository.server.ts

Critérios de aceite:
- os novos campos ficam tipados no projeto;
- a migration é compatível com o modelo atual de leads;
- o CRUD atual continua funcionando com fallback seguro.
```

**Escopo da implementação:** migration + tipos + adaptação mínima do repositório.  
**Arquivos prováveis:** `supabase/migrations/*`, `src/lib/supabase/database.types.ts`, `src/lib/leads/repository.server.ts`.  
**Critérios de aceite:**  
- novos campos comerciais existem no schema;  
- `database.types.ts` reflete o schema;  
- o CRUD atual não quebra.  
**Dependências:** Tarefa 01.  
**Risco técnico:** médio; pode afetar serialização do lead em várias telas.

### Tarefa 03 — Criar tela de detalhe do lead com dados básicos

**Objetivo:**  
Transformar o popup atual do lead em uma tela mais forte de prontuário básico, ainda sem adicionar módulos pesados.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar ou ajustar a tela de detalhe do lead para exibir dados básicos do prontuário comercial.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- melhorar a visualização do detalhe do lead;
- destacar dados comerciais básicos e origem;
- preservar edição, comentários e ações existentes.

Arquivos prováveis:
- src/components/dashboard/lead-details-popup.tsx
- app/dashboard/leads/leads-workspace.tsx
- app/dashboard/funil/sales-funnel-workspace.tsx

Critérios de aceite:
- o detalhe do lead fica mais legível;
- dados básicos e origem ficam visíveis sem rolagem excessiva;
- ações atuais continuam funcionando.
```

**Escopo da implementação:** interface do detalhe e integração com pontos já existentes.  
**Arquivos prováveis:** `src/components/dashboard/lead-details-popup.tsx`, `app/dashboard/leads/leads-workspace.tsx`, `app/dashboard/funil/sales-funnel-workspace.tsx`.  
**Critérios de aceite:**  
- a visualização do lead melhora claramente;  
- a origem do lead fica fácil de entender;  
- comentários e edição continuam operando.  
**Dependências:** Tarefas 01 e 02.  
**Risco técnico:** médio; o popup é usado por CRM, funil e dashboard.

### Tarefa 04 — Adicionar histórico manual de contato

**Objetivo:**  
Fazer o lead registrar interações de forma mais operacional do que o campo solto `last_interaction`.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: adicionar histórico manual de contato no lead aproveitando a base de comentários ou uma estrutura equivalente simples.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- melhorar o registro manual de contatos no lead;
- diferenciar melhor comentário geral de contato comercial;
- não criar ainda uma agenda completa.

Arquivos prováveis:
- src/lib/leads/repository.server.ts
- app/api/leads/[id]/comments/route.ts
- src/components/dashboard/lead-details-popup.tsx

Critérios de aceite:
- o usuário consegue registrar contato manual no lead;
- o histórico fica visível no detalhe do lead;
- o fluxo atual de comentários não é quebrado.
```

**Escopo da implementação:** API e UI do histórico manual, sem agenda completa.  
**Arquivos prováveis:** `src/lib/leads/repository.server.ts`, `app/api/leads/[id]/comments/route.ts`, `src/components/dashboard/lead-details-popup.tsx`.  
**Critérios de aceite:**  
- registro manual de contato funciona;  
- histórico aparece no lead;  
- compatibilidade com comentários existentes.  
**Dependências:** Tarefa 03.  
**Risco técnico:** médio; o comentário atual é usado como fallback de histórico.

### Tarefa 05 — Adicionar tarefas por lead

**Objetivo:**  
Criar a base de tarefa operacional por lead, separada de `dashboard_reminders`.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: adicionar estrutura de tarefas por lead no banco e na camada server.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- criar tabela e tipos para tarefas por lead;
- preparar repository e contratos mínimos;
- não montar ainda o dashboard operacional completo.

Arquivos prováveis:
- supabase/migrations/*
- src/lib/supabase/database.types.ts
- src/lib/leads/repository.server.ts

Critérios de aceite:
- existe estrutura própria de tarefa por lead;
- a modelagem respeita organização e responsável;
- a base fica pronta para uso futuro em UI e dashboard.
```

**Escopo da implementação:** modelagem inicial de tarefas por lead.  
**Arquivos prováveis:** `supabase/migrations/*`, `src/lib/supabase/database.types.ts`, `src/lib/leads/repository.server.ts`.  
**Critérios de aceite:**  
- tarefa por lead existe como entidade própria;  
- isolamento por organização é preservado;  
- tipagem pronta para API/UI.  
**Dependências:** Tarefas 01 e 02.  
**Risco técnico:** médio; exige desenhar bem uma nova entidade sem repetir `dashboard_reminders`.

### Tarefa 06 — Adicionar status do funil ao prontuário

**Objetivo:**  
Melhorar o uso do campo `stage` dentro do prontuário do lead para deixar a etapa comercial mais explícita.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: destacar e padronizar o status do funil dentro do prontuário do lead.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- melhorar a exibição da etapa atual do lead;
- usar nomenclatura única entre CRM e funil;
- preservar a atualização já existente da etapa.

Arquivos prováveis:
- src/lib/leads/stages.ts
- src/components/dashboard/lead-details-popup.tsx
- app/dashboard/funil/sales-funnel-workspace.tsx

Critérios de aceite:
- a etapa atual do lead fica clara no prontuário;
- labels e valores ficam consistentes entre telas;
- o update de etapa existente continua funcionando.
```

**Escopo da implementação:** padronização visual e semântica de etapa.  
**Arquivos prováveis:** `src/lib/leads/stages.ts`, `src/components/dashboard/lead-details-popup.tsx`, `app/dashboard/funil/sales-funnel-workspace.tsx`.  
**Critérios de aceite:**  
- etapa visível e consistente;  
- labels iguais entre CRM e funil;  
- sem regressão no `PATCH` do lead.  
**Dependências:** Tarefa 03.  
**Risco técnico:** baixo.

### Tarefa 07 — Adicionar motivo de perda

**Objetivo:**  
Permitir que leads perdidos sejam fechados com uma razão comercial útil para gestão.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: adicionar motivo de perda ao lead.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- criar campo para motivo de perda;
- expor o campo no CRUD do lead;
- mostrar o motivo no detalhe quando a etapa for perdida.

Arquivos prováveis:
- supabase/migrations/*
- src/lib/leads/repository.server.ts
- app/api/leads/route.ts
- src/components/dashboard/lead-details-popup.tsx

Critérios de aceite:
- leads perdidos aceitam motivo de perda;
- o motivo aparece no prontuário;
- leads não perdidos não exigem esse campo.
```

**Escopo da implementação:** schema, API e UI mínima do motivo de perda.  
**Arquivos prováveis:** `supabase/migrations/*`, `src/lib/leads/repository.server.ts`, `app/api/leads/route.ts`, `src/components/dashboard/lead-details-popup.tsx`.  
**Critérios de aceite:**  
- o campo existe e é persistido;  
- aparece no prontuário;  
- não força uso fora do contexto de perda.  
**Dependências:** Tarefas 02 e 06.  
**Risco técnico:** médio; precisa evitar regras rígidas demais na primeira versão.

### Tarefa 08 — Adicionar qualidade do lead

**Objetivo:**  
Criar um marcador simples de qualidade do lead para priorização comercial.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: adicionar qualidade do lead ao modelo e à visualização do CRM.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- incluir classificação simples de qualidade do lead;
- mostrar esse sinal no detalhe e na listagem;
- não recriar o score antigo removido do schema.

Arquivos prováveis:
- supabase/migrations/*
- src/lib/leads/repository.server.ts
- app/dashboard/leads/leads-workspace.tsx
- src/components/dashboard/lead-details-popup.tsx

Critérios de aceite:
- qualidade do lead pode ser salva e exibida;
- a solução não reintroduz score complexo;
- a listagem mostra o indicador de forma útil.
```

**Escopo da implementação:** classificação simples de qualidade, sem score numérico.  
**Arquivos prováveis:** `supabase/migrations/*`, `src/lib/leads/repository.server.ts`, `app/dashboard/leads/leads-workspace.tsx`, `src/components/dashboard/lead-details-popup.tsx`.  
**Critérios de aceite:**  
- qualidade persiste;  
- indicador visível no CRM;  
- sem reabrir o modelo antigo de score.  
**Dependências:** Tarefa 02.  
**Risco técnico:** baixo.

### Tarefa 09 — Vincular lead à campanha, anúncio e formulário

**Objetivo:**  
Melhorar a leitura da origem do lead usando os campos Meta já existentes no schema.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: exibir e consolidar o vínculo do lead com campanha, anúncio e formulário de origem.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- aproveitar os campos Meta já existentes no lead;
- mostrar origem de forma mais clara no prontuário;
- padronizar o mapeamento da origem nas telas.

Arquivos prováveis:
- src/lib/leads/repository.server.ts
- src/components/dashboard/lead-details-popup.tsx
- src/lib/supabase/database.types.ts

Critérios de aceite:
- o lead exibe campanha, anúncio e formulário quando houver dados;
- a UI diferencia origem manual, CSV e Meta;
- nenhum dado de origem existente é perdido.
```

**Escopo da implementação:** usar melhor campos existentes de origem Meta.  
**Arquivos prováveis:** `src/lib/leads/repository.server.ts`, `src/components/dashboard/lead-details-popup.tsx`, `src/lib/supabase/database.types.ts`.  
**Critérios de aceite:**  
- vínculos de origem aparecem no lead;  
- origem fica clara na interface;  
- compatibilidade com dados antigos.  
**Dependências:** Tarefa 03.  
**Risco técnico:** baixo.

### Tarefa 10 — Criar botão de WhatsApp com mensagem pronta

**Objetivo:**  
Permitir que o consultor abra o WhatsApp já com uma mensagem inicial preenchida a partir do lead.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar botão para abrir WhatsApp com mensagem pronta a partir do lead.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- montar CTA direto no detalhe do lead;
- usar telefone já normalizado quando existir;
- cair em fallback claro quando o lead não tiver número válido.

Arquivos prováveis:
- src/components/dashboard/lead-details-popup.tsx
- src/lib/leads/repository.server.ts

Critérios de aceite:
- o botão abre WhatsApp com texto preenchido;
- o CTA só aparece ou habilita quando houver telefone;
- a ação não interfere no gerador de mensagens com IA.
```

**Escopo da implementação:** CTA simples com fallback seguro.  
**Arquivos prováveis:** `src/components/dashboard/lead-details-popup.tsx`, `src/lib/leads/repository.server.ts`.  
**Critérios de aceite:**  
- abre WhatsApp com texto;  
- respeita ausência de telefone;  
- não afeta o gerador com IA.  
**Dependências:** Tarefa 03.  
**Risco técnico:** baixo.

### Tarefa 11 — Criar botão para gerar mensagem com IA

**Objetivo:**  
Trazer o atalho de IA para dentro do prontuário do lead e aproximar CRM e WhatsApp.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar botão para gerar mensagem com IA diretamente no detalhe do lead.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- integrar o detalhe do lead com o fluxo existente de geração de mensagem;
- reaproveitar saldo de IA e templates atuais;
- evitar duplicar o módulo já existente de WhatsApp.

Arquivos prováveis:
- src/components/dashboard/lead-details-popup.tsx
- src/components/dashboard/lead-message-generator.tsx
- app/api/whatsapp/generate/route.ts

Critérios de aceite:
- o lead pode disparar geração de mensagem com IA pelo detalhe;
- o fluxo usa o endpoint atual;
- o histórico atual de mensagens não é quebrado.
```

**Escopo da implementação:** integração de UI com endpoint já existente.  
**Arquivos prováveis:** `src/components/dashboard/lead-details-popup.tsx`, `src/components/dashboard/lead-message-generator.tsx`, `app/api/whatsapp/generate/route.ts`.  
**Critérios de aceite:**  
- geração acionável no detalhe do lead;  
- saldo de IA respeitado;  
- sem duplicar lógica do módulo de WhatsApp.  
**Dependências:** Tarefas 03 e 10.  
**Risco técnico:** médio; precisa compartilhar bem estado e UX.

### Bloco B — Funil comercial

### Tarefa 12 — Revisar funil atual

**Objetivo:**  
Mapear o comportamento atual do funil, incluindo limitações de etapa, drag and drop e atualização em API.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: revisar o funil atual e documentar gaps de produto e de implementação.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- produzir um diagnóstico curto do funil atual;
- listar limitações técnicas e de operação;
- não redesenhar o módulo inteiro nesta tarefa.

Arquivos prováveis:
- app/dashboard/funil/sales-funnel-workspace.tsx
- src/lib/leads/stages.ts
- app/api/leads/[id]/route.ts

Critérios de aceite:
- o diagnóstico aponta gaps reais do funil;
- o material diferencia UI, API e banco;
- nenhuma feature é alterada além do necessário para documentar.
```

**Escopo da implementação:** leitura e diagnóstico do funil atual.  
**Arquivos prováveis:** `app/dashboard/funil/sales-funnel-workspace.tsx`, `src/lib/leads/stages.ts`, `app/api/leads/[id]/route.ts`.  
**Critérios de aceite:**  
- diagnóstico curto e útil;  
- gaps reais do funil documentados;  
- sem mudança funcional desnecessária.  
**Dependências:** nenhuma.  
**Risco técnico:** baixo.

### Tarefa 13 — Padronizar etapas do funil

**Objetivo:**  
Consolidar nomes, ordem e significado das etapas para não haver diferença entre CRM, funil e relatórios.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: padronizar etapas do funil comercial no projeto.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar labels e valores das etapas;
- aplicar padrão único em CRM, funil e relatórios;
- preservar compatibilidade com o enum atual do banco.

Arquivos prováveis:
- src/lib/leads/stages.ts
- app/dashboard/funil/sales-funnel-workspace.tsx
- app/dashboard/leads/leads-workspace.tsx
- src/lib/reports/commercial-report.server.ts

Critérios de aceite:
- o produto usa uma nomenclatura única de etapas;
- a ordenação do funil fica consistente;
- relatórios e listagens não divergem mais nas labels.
```

**Escopo da implementação:** padronização de labels e ordenação.  
**Arquivos prováveis:** `src/lib/leads/stages.ts`, `app/dashboard/funil/sales-funnel-workspace.tsx`, `app/dashboard/leads/leads-workspace.tsx`, `src/lib/reports/commercial-report.server.ts`.  
**Critérios de aceite:**  
- etapas padronizadas;  
- ordem coerente;  
- labels consistentes no produto.  
**Dependências:** Tarefa 12.  
**Risco técnico:** baixo.

### Tarefa 14 — Permitir mover lead entre etapas

**Objetivo:**  
Fortalecer o fluxo de movimentação do lead entre colunas do funil com regras mais claras.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: melhorar o fluxo de mover lead entre etapas no funil.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- melhorar feedback do drag and drop;
- reforçar atualização otimista e rollback;
- manter integração com PATCH do lead.

Arquivos prováveis:
- app/dashboard/funil/sales-funnel-workspace.tsx
- app/api/leads/[id]/route.ts

Critérios de aceite:
- mover lead entre etapas fica mais confiável;
- erros de atualização ficam claros;
- rollback visual funciona quando a API falha.
```

**Escopo da implementação:** UX e robustez do movimento entre etapas.  
**Arquivos prováveis:** `app/dashboard/funil/sales-funnel-workspace.tsx`, `app/api/leads/[id]/route.ts`.  
**Critérios de aceite:**  
- movimento mais confiável;  
- erro visível;  
- rollback funcional.  
**Dependências:** Tarefa 13.  
**Risco técnico:** médio.

### Tarefa 15 — Salvar histórico da mudança de etapa

**Objetivo:**  
Registrar a evolução do lead no funil para análise comercial posterior.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: salvar histórico estruturado de mudança de etapa do lead.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- criar estrutura de histórico de etapa;
- registrar transição com data e autor;
- não transformar a tarefa em dashboard analítico ainda.

Arquivos prováveis:
- supabase/migrations/*
- src/lib/supabase/database.types.ts
- src/lib/leads/repository.server.ts
- app/api/leads/[id]/route.ts

Critérios de aceite:
- cada mudança de etapa gera histórico;
- o histórico registra origem mínima da alteração;
- o update de etapa atual continua compatível.
```

**Escopo da implementação:** schema e persistência de histórico de etapa.  
**Arquivos prováveis:** `supabase/migrations/*`, `src/lib/supabase/database.types.ts`, `src/lib/leads/repository.server.ts`, `app/api/leads/[id]/route.ts`.  
**Critérios de aceite:**  
- transições ficam registradas;  
- data e autor são salvos;  
- sem quebrar movimento atual de etapa.  
**Dependências:** Tarefas 13 e 14.  
**Risco técnico:** médio.

### Tarefa 16 — Mostrar leads parados

**Objetivo:**  
Evidenciar leads sem avanço recente para cobrança de operação comercial.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: mostrar leads parados no funil com regra simples de estagnação.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- definir regra inicial de lead parado;
- sinalizar isso no funil;
- usar dados já existentes antes de criar lógica avançada.

Arquivos prováveis:
- app/dashboard/funil/sales-funnel-workspace.tsx
- src/lib/leads/repository.server.ts

Critérios de aceite:
- leads parados ficam identificáveis no funil;
- a regra é simples e documentada;
- não há impacto no CRUD básico do lead.
```

**Escopo da implementação:** sinalização de estagnação com regra inicial simples.  
**Arquivos prováveis:** `app/dashboard/funil/sales-funnel-workspace.tsx`, `src/lib/leads/repository.server.ts`.  
**Critérios de aceite:**  
- leads parados são destacados;  
- regra inicial documentada;  
- nenhuma regressão no funil.  
**Dependências:** Tarefas 04 e 15.  
**Risco técnico:** baixo.

### Tarefa 17 — Criar filtros por responsável, origem, status e campanha

**Objetivo:**  
Dar leitura mais operacional ao funil, sem depender só da busca textual.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar filtros do funil por responsável, origem, status e campanha.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- expandir os filtros do funil;
- reaproveitar parsing e contratos de filtros já usados em leads;
- incluir campanha quando houver dado disponível.

Arquivos prováveis:
- app/dashboard/funil/sales-funnel-workspace.tsx
- src/lib/leads/filters.ts
- src/lib/leads/repository.server.ts

Critérios de aceite:
- o funil filtra por responsável, origem, status e campanha;
- os filtros não quebram a visualização atual;
- o comportamento fica consistente com a tela de leads.
```

**Escopo da implementação:** filtros do funil reaproveitando estrutura atual.  
**Arquivos prováveis:** `app/dashboard/funil/sales-funnel-workspace.tsx`, `src/lib/leads/filters.ts`, `src/lib/leads/repository.server.ts`.  
**Critérios de aceite:**  
- filtros novos funcionam;  
- consistência com CRM;  
- sem quebrar busca atual.  
**Dependências:** Tarefas 09 e 13.  
**Risco técnico:** médio.

### Bloco C — Dashboard operacional

### Tarefa 18 — Mostrar novos leads

**Objetivo:**  
Criar um card operacional focado em entrada recente de leads no dashboard.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: mostrar novos leads no dashboard principal.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- criar métrica ou card de novos leads;
- usar received_at e stage atuais;
- manter a tela leve.

Arquivos prováveis:
- app/dashboard/dashboard-home.tsx
- src/components/dashboard/widgets.tsx

Critérios de aceite:
- o dashboard mostra novos leads de forma objetiva;
- o cálculo usa dados reais quando houver Supabase;
- a métrica não substitui dados já essenciais.
```

**Escopo da implementação:** card simples de novos leads.  
**Arquivos prováveis:** `app/dashboard/dashboard-home.tsx`, `src/components/dashboard/widgets.tsx`.  
**Critérios de aceite:**  
- novos leads visíveis;  
- cálculo consistente;  
- layout preservado.  
**Dependências:** nenhuma.  
**Risco técnico:** baixo.

### Tarefa 19 — Mostrar leads sem contato

**Objetivo:**  
Dar visibilidade para leads que entraram e ainda não receberam abordagem.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: mostrar leads sem contato no dashboard operacional.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- definir regra inicial de lead sem contato;
- exibir contagem ou lista resumida no dashboard;
- usar dados já existentes antes de criar SLA completo.

Arquivos prováveis:
- app/dashboard/dashboard-home.tsx
- src/lib/leads/repository.server.ts

Critérios de aceite:
- o dashboard mostra leads sem contato;
- a regra inicial fica clara no código;
- o indicador conversa com a operação comercial.
```

**Escopo da implementação:** indicador inicial de lead sem contato.  
**Arquivos prováveis:** `app/dashboard/dashboard-home.tsx`, `src/lib/leads/repository.server.ts`.  
**Critérios de aceite:**  
- indicador visível;  
- regra clara;  
- valor útil para operação.  
**Dependências:** Tarefa 04.  
**Risco técnico:** baixo.

### Tarefa 20 — Mostrar tarefas vencidas

**Objetivo:**  
Levar tarefas por lead para o dashboard principal com foco em atraso.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: mostrar tarefas vencidas no dashboard principal.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- usar a entidade de tarefa por lead;
- destacar somente atraso operacional;
- não misturar com dashboard_reminders pessoais.

Arquivos prováveis:
- app/dashboard/dashboard-home.tsx
- src/lib/leads/repository.server.ts
- src/lib/supabase/database.types.ts

Critérios de aceite:
- tarefas vencidas aparecem em destaque;
- o cálculo não usa dashboard_reminders como substituto;
- o card aponta para ação prática.
```

**Escopo da implementação:** card de atraso operacional por tarefa de lead.  
**Arquivos prováveis:** `app/dashboard/dashboard-home.tsx`, `src/lib/leads/repository.server.ts`, `src/lib/supabase/database.types.ts`.  
**Critérios de aceite:**  
- tarefas vencidas destacadas;  
- sem misturar lembrete pessoal com tarefa do CRM;  
- ação prática visível.  
**Dependências:** Tarefa 05.  
**Risco técnico:** médio.

### Tarefa 21 — Mostrar campanhas ativas

**Objetivo:**  
Trazer para o dashboard um indicador útil das campanhas que já estão em execução ou prontas para execução.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: mostrar campanhas ativas no dashboard.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- exibir campanhas ativas ou preparadas;
- usar publication_status e publish_mode existentes;
- não criar monitor completo de mídia nesta tarefa.

Arquivos prováveis:
- app/dashboard/dashboard-home.tsx
- src/lib/campaigns/repository.server.ts

Critérios de aceite:
- o dashboard mostra campanhas ativas ou prontas;
- o indicador usa o estado real das campanhas;
- a leitura é útil para operação.
```

**Escopo da implementação:** indicador operacional de campanhas ativas/prontas.  
**Arquivos prováveis:** `app/dashboard/dashboard-home.tsx`, `src/lib/campaigns/repository.server.ts`.  
**Critérios de aceite:**  
- indicador funcional;  
- usa estados reais;  
- sem inventar dados financeiros.  
**Dependências:** nenhuma.  
**Risco técnico:** baixo.

### Tarefa 22 — Mostrar custo por lead inicial

**Objetivo:**  
Criar o primeiro card de CPL, mesmo que usando um valor controlado/mockado até o custo real existir.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: mostrar custo por lead no dashboard, aceitando fase inicial mockada ou parcial.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- criar card de CPL com fallback explícito;
- não inventar custo real quando não houver dado;
- deixar o estado mockado claramente sinalizado.

Arquivos prováveis:
- app/dashboard/dashboard-home.tsx
- src/lib/reports/commercial-report.server.ts

Critérios de aceite:
- o dashboard mostra CPL inicial;
- o usuário entende quando o valor é parcial ou mockado;
- a métrica não se apresenta como dado financeiro definitivo.
```

**Escopo da implementação:** card de CPL com transparência sobre limitação.  
**Arquivos prováveis:** `app/dashboard/dashboard-home.tsx`, `src/lib/reports/commercial-report.server.ts`.  
**Critérios de aceite:**  
- CPL aparece;  
- estado parcial/mockado é explícito;  
- sem falso dado financeiro.  
**Dependências:** Tarefa 21.  
**Risco técnico:** médio.

### Tarefa 23 — Mostrar tempo médio até primeiro contato

**Objetivo:**  
Dar ao dashboard uma métrica de velocidade comercial usando dados já presentes ou recém-modelados.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: mostrar tempo médio até primeiro contato no dashboard.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- calcular tempo médio até o primeiro contato;
- usar regra simples e transparente;
- preparar a base para evolução posterior.

Arquivos prováveis:
- app/dashboard/dashboard-home.tsx
- src/lib/leads/repository.server.ts
- src/lib/reports/commercial-report.server.ts

Critérios de aceite:
- o dashboard mostra tempo médio até primeiro contato;
- a regra usada fica clara no código;
- a métrica usa dados reais quando disponíveis.
```

**Escopo da implementação:** métrica simples de SLA de primeiro contato.  
**Arquivos prováveis:** `app/dashboard/dashboard-home.tsx`, `src/lib/leads/repository.server.ts`, `src/lib/reports/commercial-report.server.ts`.  
**Critérios de aceite:**  
- métrica aparece;  
- regra documentada;  
- usa dados reais quando houver.  
**Dependências:** Tarefa 04.  
**Risco técnico:** médio.

### Tarefa 24 — Mostrar conversão por etapa

**Objetivo:**  
Levar para o dashboard principal uma leitura resumida de conversão do funil.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: mostrar conversão por etapa no dashboard principal.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- resumir conversão por etapa no dashboard;
- reaproveitar cálculos já existentes em relatórios quando possível;
- manter leitura simples.

Arquivos prováveis:
- app/dashboard/dashboard-home.tsx
- src/lib/reports/commercial-report.server.ts

Critérios de aceite:
- o dashboard mostra conversão por etapa;
- o cálculo é coerente com o funil;
- a visualização é clara para operação.
```

**Escopo da implementação:** resumo de conversão usando base já existente.  
**Arquivos prováveis:** `app/dashboard/dashboard-home.tsx`, `src/lib/reports/commercial-report.server.ts`.  
**Critérios de aceite:**  
- conversão por etapa visível;  
- coerência com funil;  
- leitura simples.  
**Dependências:** Tarefas 13 e 15.  
**Risco técnico:** baixo.

### Tarefa 25 — Remover métricas decorativas do dashboard

**Objetivo:**  
Substituir indicadores bonitos mas pouco acionáveis por leitura realmente operacional.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: remover ou reduzir métricas decorativas do dashboard que não ajudam a operação comercial.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar os cards atuais do dashboard;
- priorizar métricas de operação comercial;
- não piorar a navegação geral da home.

Arquivos prováveis:
- app/dashboard/dashboard-home.tsx
- src/components/dashboard/widgets.tsx

Critérios de aceite:
- métricas decorativas são removidas ou rebaixadas;
- o dashboard fica mais orientado à operação;
- a home continua equilibrada visualmente.
```

**Escopo da implementação:** limpeza de métricas pouco úteis na home.  
**Arquivos prováveis:** `app/dashboard/dashboard-home.tsx`, `src/components/dashboard/widgets.tsx`.  
**Critérios de aceite:**  
- dashboard mais operacional;  
- menos ruído visual;  
- sem perda de navegação.  
**Dependências:** Tarefas 18 a 24.  
**Risco técnico:** baixo.

### Bloco D — Meta Ads e captação de leads

### Tarefa 26 — Revisar integração Meta atual

**Objetivo:**  
Fechar um diagnóstico objetivo do estado real da integração Meta, com foco em OAuth, sync, webhook e importação.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: revisar a integração Meta atual e mapear blockers reais de OAuth, sync, webhook e importação.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- produzir diagnóstico curto e acionável da integração Meta;
- diferenciar problemas de código, ambiente e dados;
- não reimplementar o fluxo inteiro nesta tarefa.

Arquivos prováveis:
- app/api/integrations/meta/*
- app/api/meta/*
- src/lib/integrations/meta-graph.server.ts
- docs/meta-review-production-check.md

Critérios de aceite:
- o diagnóstico aponta blockers reais;
- OAuth, sync, webhook e importação são cobertos;
- o resultado ajuda a priorizar as próximas correções.
```

**Escopo da implementação:** auditoria prática da integração Meta.  
**Arquivos prováveis:** `app/api/integrations/meta/*`, `app/api/meta/*`, `src/lib/integrations/meta-graph.server.ts`, `docs/meta-review-production-check.md`.  
**Critérios de aceite:**  
- blockers reais identificados;  
- diagnóstico acionável;  
- visão separada por código, ambiente e dados.  
**Dependências:** nenhuma.  
**Risco técnico:** baixo.

### Tarefa 27 — Revisar variáveis de ambiente da Meta

**Objetivo:**  
Checar se o produto trata corretamente falta, uso e mensagem de erro das envs da Meta.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: revisar as variáveis de ambiente da Meta e melhorar mensagens, validações ou documentação se necessário.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar envs exigidas pela Meta;
- alinhar documentação, mensagens e fallback;
- não expor segredos no frontend.

Arquivos prováveis:
- .env.example
- src/lib/env/shared.ts
- src/lib/env/server.ts
- src/lib/meta/config.ts

Critérios de aceite:
- as envs Meta ficam claras no projeto;
- mensagens de falha ajudam operação e suporte;
- nenhum segredo passa para o client.
```

**Escopo da implementação:** validação, documentação e mensagens de ambiente.  
**Arquivos prováveis:** `.env.example`, `src/lib/env/shared.ts`, `src/lib/env/server.ts`, `src/lib/meta/config.ts`.  
**Critérios de aceite:**  
- envs Meta documentadas e validadas;  
- mensagens melhores;  
- segredos continuam server-side.  
**Dependências:** Tarefa 26.  
**Risco técnico:** baixo.

### Tarefa 28 — Revisar callback OAuth da Meta

**Objetivo:**  
Fortalecer o callback OAuth para reduzir erros silenciosos e tornar o retorno mais previsível.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: revisar e endurecer o callback OAuth da Meta.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar tratamento de erro, retorno e estado OAuth;
- melhorar clareza do resultado após callback;
- manter compatibilidade com o fluxo atual.

Arquivos prováveis:
- app/api/integrations/meta/callback/route.ts
- src/lib/integrations/oauth-state.server.ts
- src/lib/integrations/meta-graph.server.ts

Critérios de aceite:
- o callback trata melhor falhas e estados inválidos;
- o redirecionamento final fica previsível;
- o fluxo atual de conexão não é quebrado.
```

**Escopo da implementação:** endurecimento do callback OAuth.  
**Arquivos prováveis:** `app/api/integrations/meta/callback/route.ts`, `src/lib/integrations/oauth-state.server.ts`, `src/lib/integrations/meta-graph.server.ts`.  
**Critérios de aceite:**  
- callback mais robusto;  
- erros mais claros;  
- compatibilidade mantida.  
**Dependências:** Tarefas 26 e 27.  
**Risco técnico:** médio.

### Tarefa 29 — Revisar permissões necessárias da Meta

**Objetivo:**  
Garantir que o produto deixa explícito quais escopos realmente precisa e por quê.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: revisar permissões necessárias da Meta e explicitar o uso de cada uma no produto.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar scopes e permissões Meta usados hoje;
- mapear relação entre permissão e funcionalidade;
- melhorar mensagens ou documentação interna do produto.

Arquivos prováveis:
- src/lib/meta/config.ts
- src/lib/integrations/meta-graph.server.ts
- docs/meta-app-review.md

Critérios de aceite:
- o projeto deixa claro quais permissões usa;
- a justificativa conversa com o produto real;
- a documentação ajuda review e operação.
```

**Escopo da implementação:** documentação e clareza sobre scopes.  
**Arquivos prováveis:** `src/lib/meta/config.ts`, `src/lib/integrations/meta-graph.server.ts`, `docs/meta-app-review.md`.  
**Critérios de aceite:**  
- scopes explicados;  
- vínculo com funcionalidades reais;  
- utilidade para review e suporte.  
**Dependências:** Tarefa 26.  
**Risco técnico:** baixo.

### Tarefa 30 — Criar tela de status da conexão Meta

**Objetivo:**  
Tornar a área Meta mais operacional, exibindo conexão, ativos e sinais de saúde sem exigir leitura técnica.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar uma tela ou seção de status da conexão Meta mais clara para o usuário operacional.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- melhorar leitura da conexão Meta;
- mostrar estado, última sync e quantidade de ativos;
- não reescrever o fluxo de OAuth.

Arquivos prováveis:
- app/dashboard/perfil/meta/page.tsx
- app/dashboard/perfil/profile-sections.tsx
- src/lib/integrations/repository.server.ts

Critérios de aceite:
- o usuário entende se a Meta está conectada;
- páginas, formulários e contas ficam resumidos;
- a interface fica mais operacional e menos técnica.
```

**Escopo da implementação:** UX de status da conexão.  
**Arquivos prováveis:** `app/dashboard/perfil/meta/page.tsx`, `app/dashboard/perfil/profile-sections.tsx`, `src/lib/integrations/repository.server.ts`.  
**Critérios de aceite:**  
- status compreensível;  
- ativos resumidos;  
- UX mais operacional.  
**Dependências:** Tarefas 26 a 29.  
**Risco técnico:** baixo.

### Tarefa 31 — Criar diagnóstico de conexão Meta

**Objetivo:**  
Exibir um diagnóstico curto do que está faltando quando a Meta não está funcional.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar diagnóstico de conexão Meta com mensagens objetivas de falha.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- diagnosticar falta de env, token, sync ou billing;
- mostrar orientação prática para correção;
- evitar erro genérico na área Meta.

Arquivos prováveis:
- app/dashboard/perfil/meta/page.tsx
- src/lib/integrations/repository.server.ts
- src/lib/env/server.ts

Critérios de aceite:
- o usuário vê o motivo provável da falha;
- a mensagem orienta próximo passo;
- o diagnóstico diferencia código, ambiente e acesso.
```

**Escopo da implementação:** diagnóstico prático de falha da conexão.  
**Arquivos prováveis:** `app/dashboard/perfil/meta/page.tsx`, `src/lib/integrations/repository.server.ts`, `src/lib/env/server.ts`.  
**Critérios de aceite:**  
- falha explicada;  
- próximo passo indicado;  
- causas diferenciadas.  
**Dependências:** Tarefas 26 a 30.  
**Risco técnico:** baixo.

### Tarefa 32 — Listar páginas e formulários Meta disponíveis

**Objetivo:**  
Mostrar ativos sincronizados de forma utilizável para operação e para importação manual.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: listar páginas e formulários Meta disponíveis de forma mais útil para a operação.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- melhorar listagem de páginas e formulários sincronizados;
- usar dados já salvos no banco;
- facilitar seleção para importação e conferência.

Arquivos prováveis:
- app/dashboard/perfil/meta/page.tsx
- src/lib/integrations/repository.server.ts
- app/api/meta/leads/sources/route.ts

Critérios de aceite:
- páginas e formulários ficam legíveis;
- a seleção para importação fica mais clara;
- a tela usa os dados sincronizados já existentes.
```

**Escopo da implementação:** UX da listagem de ativos Meta.  
**Arquivos prováveis:** `app/dashboard/perfil/meta/page.tsx`, `src/lib/integrations/repository.server.ts`, `app/api/meta/leads/sources/route.ts`.  
**Critérios de aceite:**  
- listagem legível;  
- seleção clara;  
- uso de dados reais sincronizados.  
**Dependências:** Tarefa 30.  
**Risco técnico:** baixo.

### Tarefa 33 — Importar leads de formulário

**Objetivo:**  
Fazer a importação manual de leads de formulário ficar confiável e previsível para o usuário.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: melhorar o fluxo de importar leads de formulário Meta.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar UX e retorno da importação manual;
- melhorar feedback de total encontrado, importado e duplicado;
- preservar a idempotência já existente.

Arquivos prováveis:
- app/api/meta/leads/import/route.ts
- src/lib/meta/manual-lead-import.server.ts
- app/dashboard/leads/leads-workspace.tsx

Critérios de aceite:
- a importação de formulário fica mais previsível;
- feedback de resultado fica claro;
- duplicados continuam tratados com segurança.
```

**Escopo da implementação:** melhoria do fluxo de importação manual.  
**Arquivos prováveis:** `app/api/meta/leads/import/route.ts`, `src/lib/meta/manual-lead-import.server.ts`, `app/dashboard/leads/leads-workspace.tsx`.  
**Critérios de aceite:**  
- importação mais clara;  
- resumo final confiável;  
- idempotência mantida.  
**Dependências:** Tarefas 30 a 32.  
**Risco técnico:** médio.

### Tarefa 34 — Vincular lead importado à campanha, anúncio e formulário

**Objetivo:**  
Garantir que o lead vindo da Meta entra no CRM com rastreabilidade comercial completa.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: garantir que o lead importado da Meta fique vinculado à campanha, anúncio e formulário no CRM.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar mapeamento do lead importado;
- persistir ou exibir melhor campanha, anúncio e formulário;
- manter compatibilidade com webhook e importação manual.

Arquivos prováveis:
- src/lib/meta/manual-lead-import.server.ts
- src/lib/meta/lead-retrieval.server.ts
- src/lib/leads/repository.server.ts

Critérios de aceite:
- o lead importado entra com rastreabilidade de origem;
- os vínculos aparecem no CRM;
- webhook e importação manual ficam coerentes.
```

**Escopo da implementação:** reforço do mapeamento de origem Meta.  
**Arquivos prováveis:** `src/lib/meta/manual-lead-import.server.ts`, `src/lib/meta/lead-retrieval.server.ts`, `src/lib/leads/repository.server.ts`.  
**Critérios de aceite:**  
- rastreabilidade completa;  
- origem visível no CRM;  
- coerência entre import e webhook.  
**Dependências:** Tarefas 09 e 33.  
**Risco técnico:** médio.

### Tarefa 35 — Criar logs de webhook da Meta mais operacionais

**Objetivo:**  
Melhorar a leitura operacional dos eventos da Meta sem expor payload sensível.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: melhorar logs operacionais de webhook da Meta.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- registrar e exibir eventos Meta de forma mais útil;
- manter payload sanitizado;
- destacar duplicidade, falha e sucesso.

Arquivos prováveis:
- app/api/meta/webhook/route.ts
- src/lib/leads/webhook-events.server.ts
- src/lib/leads/webhook-events.repository.ts

Critérios de aceite:
- logs Meta ficam mais úteis para operação;
- dados sensíveis não são expostos;
- sucesso, falha e duplicidade ficam distinguíveis.
```

**Escopo da implementação:** logging operacional e seguro do webhook Meta.  
**Arquivos prováveis:** `app/api/meta/webhook/route.ts`, `src/lib/leads/webhook-events.server.ts`, `src/lib/leads/webhook-events.repository.ts`.  
**Critérios de aceite:**  
- logs mais úteis;  
- payload sanitizado;  
- estados bem separados.  
**Dependências:** Tarefa 31.  
**Risco técnico:** médio.

### Tarefa 36 — Criar tratamento de erro claro para falha da Meta

**Objetivo:**  
Padronizar mensagens de erro da integração Meta para reduzir suporte cego.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar tratamento de erro claro para falhas da Meta no produto.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- padronizar mensagens de erro da Meta;
- diferenciar permissão, token, sync, env e webhook;
- mostrar mensagens curtas e úteis ao usuário.

Arquivos prováveis:
- app/api/integrations/meta/*
- app/api/meta/*
- app/dashboard/perfil/meta/page.tsx

Critérios de aceite:
- as falhas Meta deixam de aparecer como erro genérico;
- mensagens diferentes apontam causas diferentes;
- a experiência fica mais clara para operação e suporte.
```

**Escopo da implementação:** padronização de mensagens de erro da Meta.  
**Arquivos prováveis:** `app/api/integrations/meta/*`, `app/api/meta/*`, `app/dashboard/perfil/meta/page.tsx`.  
**Critérios de aceite:**  
- menos erro genérico;  
- causas diferenciadas;  
- UX mais clara.  
**Dependências:** Tarefas 27 a 35.  
**Risco técnico:** baixo.

### Bloco E — Criação de anúncios com IA

### Tarefa 37 — Revisar gerador de campanha atual

**Objetivo:**  
Mapear o que o gerador atual já resolve e onde ele ainda está mais próximo de um assistente do que de um fluxo operacional.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: revisar o gerador de campanha atual e documentar gaps de produto e implementação.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar fluxo atual do gerador;
- apontar gaps entre criação de texto e operação real de campanha;
- não redesenhar o módulo inteiro nesta tarefa.

Arquivos prováveis:
- app/dashboard/campanhas/campaign-generator.tsx
- app/api/campaigns/generate/route.ts
- src/lib/campaigns/repository.server.ts

Critérios de aceite:
- existe diagnóstico curto do gerador atual;
- o diagnóstico aponta gargalos de uso real;
- nenhuma feature é alterada sem necessidade.
```

**Escopo da implementação:** auditoria curta do gerador atual.  
**Arquivos prováveis:** `app/dashboard/campanhas/campaign-generator.tsx`, `app/api/campaigns/generate/route.ts`, `src/lib/campaigns/repository.server.ts`.  
**Critérios de aceite:**  
- gaps documentados;  
- foco em uso real;  
- sem mudança ampla desnecessária.  
**Dependências:** nenhuma.  
**Risco técnico:** baixo.

### Tarefa 38 — Melhorar templates de campanha

**Objetivo:**  
Deixar os templates mais orientados ao mercado de plano de saúde empresarial e menos genéricos.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: melhorar os templates de campanha do gerador.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar exemplos e templates;
- aproximar linguagem do mercado-alvo do produto;
- manter os guardrails atuais de compliance.

Arquivos prováveis:
- app/dashboard/campanhas/campaign-generator.tsx
- src/data/system-templates.ts
- supabase/migrations/202605130001_system_templates.sql

Critérios de aceite:
- templates ficam mais úteis para o ICP do Leadi;
- exemplos mantêm tom consultivo;
- nenhum template reforça promessa sensível.
```

**Escopo da implementação:** melhorar templates e exemplos.  
**Arquivos prováveis:** `app/dashboard/campanhas/campaign-generator.tsx`, `src/data/system-templates.ts`, `supabase/migrations/202605130001_system_templates.sql`.  
**Critérios de aceite:**  
- templates mais aderentes ao ICP;  
- tom consultivo mantido;  
- guardrails preservados.  
**Dependências:** Tarefa 37.  
**Risco técnico:** baixo.

### Tarefa 39 — Melhorar campos de briefing

**Objetivo:**  
Refinar a coleta de contexto comercial antes da geração da campanha.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: melhorar os campos de briefing do gerador de campanha.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar briefing e campos de contexto;
- aproximar o formulário do trabalho de uma corretora;
- manter experiência simples.

Arquivos prováveis:
- app/dashboard/campanhas/campaign-generator.tsx
- app/api/campaigns/questions/route.ts

Critérios de aceite:
- o briefing coleta contexto mais útil;
- o fluxo continua simples de preencher;
- a geração recebe informações melhores.
```

**Escopo da implementação:** melhorar entrada de contexto do gerador.  
**Arquivos prováveis:** `app/dashboard/campanhas/campaign-generator.tsx`, `app/api/campaigns/questions/route.ts`.  
**Critérios de aceite:**  
- briefing mais útil;  
- UX continua simples;  
- geração melhora de entrada.  
**Dependências:** Tarefa 38.  
**Risco técnico:** baixo.

### Tarefa 40 — Criar estrutura de campanha gerada

**Objetivo:**  
Padronizar melhor o payload salvo de uma campanha gerada para facilitar histórico, publicação e análise.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: estruturar melhor a campanha gerada e o payload persistido.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar estrutura de entrada e resultado da campanha;
- padronizar o que é salvo no histórico;
- manter compatibilidade com campanhas já existentes.

Arquivos prováveis:
- app/api/campaigns/generate/route.ts
- src/lib/campaigns/repository.server.ts
- src/lib/campaigns/types.ts

Critérios de aceite:
- o histórico passa a salvar estrutura mais organizada;
- o contrato entre IA, API e banco fica mais claro;
- campanhas existentes continuam legíveis.
```

**Escopo da implementação:** contratos e persistência do payload de campanha.  
**Arquivos prováveis:** `app/api/campaigns/generate/route.ts`, `src/lib/campaigns/repository.server.ts`, `src/lib/campaigns/types.ts`.  
**Critérios de aceite:**  
- payload organizado;  
- contrato claro;  
- compatibilidade mantida.  
**Dependências:** Tarefas 37 a 39.  
**Risco técnico:** médio.

### Tarefa 41 — Criar variações de texto

**Objetivo:**  
Fazer a IA entregar mais de uma opção reaproveitável de copy por campanha.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar ou melhorar variações de texto nas campanhas geradas.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- expandir ou melhorar as variações de copy;
- manter coerência com objetivo e público;
- preservar o contrato atual do gerador.

Arquivos prováveis:
- src/lib/openai/index.ts
- src/lib/openai/prompt-playbooks.ts
- app/dashboard/campanhas/campaign-generator.tsx

Critérios de aceite:
- a campanha retorna variações úteis de texto;
- as variações seguem o briefing;
- o histórico salva ou exibe esse material.
```

**Escopo da implementação:** evolução das variações de copy.  
**Arquivos prováveis:** `src/lib/openai/index.ts`, `src/lib/openai/prompt-playbooks.ts`, `app/dashboard/campanhas/campaign-generator.tsx`.  
**Critérios de aceite:**  
- mais variações úteis;  
- aderência ao briefing;  
- visibilidade no histórico/UX.  
**Dependências:** Tarefa 40.  
**Risco técnico:** baixo.

### Tarefa 42 — Criar alerta de compliance

**Objetivo:**  
Exibir um alerta claro no fluxo de campanha quando a copy pedir revisão.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar alerta de compliance no fluxo de geração de campanha.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- destacar risco de compliance na UI da campanha;
- usar validação local e/ou notas já geradas;
- não transformar a tarefa em revisão jurídica completa.

Arquivos prováveis:
- app/dashboard/campanhas/campaign-generator.tsx
- src/lib/openai/compliance-guardrails.ts
- app/api/campaigns/generate/route.ts

Critérios de aceite:
- a interface alerta quando houver risco relevante;
- o usuário entende que precisa revisar;
- o fluxo segue utilizável.
```

**Escopo da implementação:** alerta de risco no fluxo de campanha.  
**Arquivos prováveis:** `app/dashboard/campanhas/campaign-generator.tsx`, `src/lib/openai/compliance-guardrails.ts`, `app/api/campaigns/generate/route.ts`.  
**Critérios de aceite:**  
- alerta visível;  
- revisão sugerida;  
- fluxo continua utilizável.  
**Dependências:** Tarefa 41.  
**Risco técnico:** baixo.

### Tarefa 43 — Reforçar guardrails contra promessa de economia e linguagem agressiva

**Objetivo:**  
Endurecer a geração para evitar duas classes de problema que mais arriscam anúncios do produto.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: reforçar guardrails contra promessa de economia garantida e linguagem agressiva na geração de campanhas.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- reforçar prompts e validações locais;
- bloquear ou reescrever linguagem sensível de promessa e urgência agressiva;
- adicionar testes quando couber.

Arquivos prováveis:
- src/lib/openai/compliance-guardrails.ts
- src/lib/openai/prompt-playbooks.ts
- src/lib/openai/index.test.ts

Critérios de aceite:
- a geração evita promessa de economia garantida;
- a geração reduz linguagem agressiva;
- há cobertura de teste ou bateria para o caso.
```

**Escopo da implementação:** guardrails de copy mais rígidos.  
**Arquivos prováveis:** `src/lib/openai/compliance-guardrails.ts`, `src/lib/openai/prompt-playbooks.ts`, `src/lib/openai/index.test.ts`.  
**Critérios de aceite:**  
- promessa sensível bloqueada;  
- urgência agressiva reduzida;  
- cobertura de teste quando fizer sentido.  
**Dependências:** Tarefa 42.  
**Risco técnico:** médio; excesso de bloqueio pode piorar a utilidade da geração.

### Tarefa 44 — Preparar campanha para publicação manual

**Objetivo:**  
Refinar o estado “manual_review” para que ele seja um passo operacional claro, não apenas um enum salvo.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: preparar melhor a campanha para publicação manual.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- melhorar o fluxo visual e o estado salvo de revisão manual;
- deixar claro o que já está pronto e o que ainda depende da equipe;
- não publicar automaticamente.

Arquivos prováveis:
- app/dashboard/campanhas/campaign-generator.tsx
- src/lib/campaigns/repository.server.ts
- app/api/campaigns/generate/route.ts

Critérios de aceite:
- o modo manual fica compreensível;
- a campanha salva esse estado de forma consistente;
- o usuário entende o próximo passo.
```

**Escopo da implementação:** UX e persistência do modo manual.  
**Arquivos prováveis:** `app/dashboard/campanhas/campaign-generator.tsx`, `src/lib/campaigns/repository.server.ts`, `app/api/campaigns/generate/route.ts`.  
**Critérios de aceite:**  
- revisão manual clara;  
- estado salvo corretamente;  
- próximo passo evidente.  
**Dependências:** Tarefas 40 e 42.  
**Risco técnico:** baixo.

### Tarefa 45 — Preparar campanha para publicação pausada

**Objetivo:**  
Tornar o modo pausado um fluxo realmente utilizável para operação, e não só uma opção de enum.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: preparar melhor a campanha para publicação pausada.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- melhorar feedback do modo pausado;
- exibir o que foi preparado para a Meta;
- manter o fluxo seguro e reversível.

Arquivos prováveis:
- app/dashboard/campanhas/campaign-generator.tsx
- app/api/campaigns/publish/route.ts
- src/lib/meta/campaign-publication.server.ts

Critérios de aceite:
- o modo pausado fica claro para o usuário;
- a campanha mostra o estado correto;
- a publicação continua segura.
```

**Escopo da implementação:** UX e status do modo pausado.  
**Arquivos prováveis:** `app/dashboard/campanhas/campaign-generator.tsx`, `app/api/campaigns/publish/route.ts`, `src/lib/meta/campaign-publication.server.ts`.  
**Critérios de aceite:**  
- modo pausado claro;  
- status coerente;  
- fluxo seguro.  
**Dependências:** Tarefa 44.  
**Risco técnico:** médio.

### Tarefa 46 — Criar histórico de campanhas geradas

**Objetivo:**  
Melhorar a área de histórico para reaproveitamento comercial e acompanhamento de tentativas de campanha.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: melhorar o histórico de campanhas geradas.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- enriquecer a leitura do histórico de campanhas;
- destacar status, origem e reutilização possível;
- não transformar a página em relatório completo.

Arquivos prováveis:
- app/dashboard/anuncios/page.tsx
- src/lib/campaigns/repository.server.ts
- app/dashboard/campanhas/campaign-generator.tsx

Critérios de aceite:
- o histórico fica mais útil para operação;
- status e contexto da campanha ficam mais claros;
- o usuário consegue retomar ideias anteriores com menos atrito.
```

**Escopo da implementação:** evolução do histórico de campanhas.  
**Arquivos prováveis:** `app/dashboard/anuncios/page.tsx`, `src/lib/campaigns/repository.server.ts`, `app/dashboard/campanhas/campaign-generator.tsx`.  
**Critérios de aceite:**  
- histórico mais útil;  
- status/contexto claros;  
- reaproveitamento facilitado.  
**Dependências:** Tarefas 40, 44 e 45.  
**Risco técnico:** baixo.

### Bloco F — Cadência de WhatsApp com IA

### Tarefa 47 — Criar biblioteca de modelos de mensagem

**Objetivo:**  
Estruturar uma base simples de modelos para não depender só de geração livre.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar biblioteca de modelos de mensagem para WhatsApp.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- organizar modelos base por objetivo;
- reaproveitar templates e tom comercial já existentes;
- não retirar o gerador com IA.

Arquivos prováveis:
- src/lib/whatsapp/templates.ts
- src/data/system-templates.ts
- src/lib/templates/repository.server.ts

Critérios de aceite:
- existe biblioteca inicial de modelos;
- os modelos respeitam o contexto comercial do produto;
- a geração com IA continua possível.
```

**Escopo da implementação:** base de modelos reutilizáveis.  
**Arquivos prováveis:** `src/lib/whatsapp/templates.ts`, `src/data/system-templates.ts`, `src/lib/templates/repository.server.ts`.  
**Critérios de aceite:**  
- biblioteca inicial pronta;  
- aderência ao contexto do produto;  
- IA continua disponível.  
**Dependências:** nenhuma.  
**Risco técnico:** baixo.

### Tarefa 48 — Criar mensagem inicial

**Objetivo:**  
Gerar melhor a primeira abordagem para novos leads com foco consultivo.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: melhorar ou criar mensagem inicial para novos leads no fluxo de WhatsApp.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar prompt e template da mensagem inicial;
- manter tom consultivo e humano;
- aproveitar contexto do lead.

Arquivos prováveis:
- src/lib/whatsapp/templates.ts
- src/lib/openai/prompt-playbooks.ts
- app/api/whatsapp/generate/route.ts

Critérios de aceite:
- a mensagem inicial fica mais forte comercialmente;
- usa dados do lead quando disponíveis;
- mantém linguagem segura e consultiva.
```

**Escopo da implementação:** primeira abordagem comercial.  
**Arquivos prováveis:** `src/lib/whatsapp/templates.ts`, `src/lib/openai/prompt-playbooks.ts`, `app/api/whatsapp/generate/route.ts`.  
**Critérios de aceite:**  
- mensagem inicial melhor;  
- usa contexto do lead;  
- tom seguro.  
**Dependências:** Tarefa 47.  
**Risco técnico:** baixo.

### Tarefa 49 — Criar follow-up para lead sem resposta

**Objetivo:**  
Adicionar uma abordagem de continuidade para leads que esfriaram após o primeiro contato.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar follow-up para lead sem resposta no fluxo de WhatsApp.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- criar texto e lógica de follow-up sem resposta;
- manter abordagem leve e não agressiva;
- integrar com estágios ou contexto atual.

Arquivos prováveis:
- src/lib/whatsapp/templates.ts
- app/api/whatsapp/generate/route.ts
- app/dashboard/whatsapp/whatsapp-workspace.tsx

Critérios de aceite:
- o sistema gera follow-up sem resposta;
- o texto evita pressão excessiva;
- o usuário consegue usar esse resultado no fluxo atual.
```

**Escopo da implementação:** follow-up leve para ausência de resposta.  
**Arquivos prováveis:** `src/lib/whatsapp/templates.ts`, `app/api/whatsapp/generate/route.ts`, `app/dashboard/whatsapp/whatsapp-workspace.tsx`.  
**Critérios de aceite:**  
- follow-up gerado;  
- linguagem leve;  
- uso simples no fluxo atual.  
**Dependências:** Tarefa 48.  
**Risco técnico:** baixo.

### Tarefa 50 — Criar follow-up por objeção

**Objetivo:**  
Gerar resposta melhor para leads que já trouxeram objeções comerciais.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar follow-up por objeção para mensagens de WhatsApp.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- suportar follow-up baseado em objeção;
- usar modelos simples de objeção comercial;
- manter o texto consultivo.

Arquivos prováveis:
- src/lib/whatsapp/templates.ts
- src/lib/openai/prompt-playbooks.ts
- app/dashboard/whatsapp/whatsapp-workspace.tsx

Critérios de aceite:
- o usuário consegue gerar resposta por objeção;
- o texto se adapta ao motivo informado;
- a experiência continua simples.
```

**Escopo da implementação:** resposta orientada por objeção.  
**Arquivos prováveis:** `src/lib/whatsapp/templates.ts`, `src/lib/openai/prompt-playbooks.ts`, `app/dashboard/whatsapp/whatsapp-workspace.tsx`.  
**Critérios de aceite:**  
- resposta por objeção;  
- adaptação ao motivo;  
- simplicidade mantida.  
**Dependências:** Tarefa 47.  
**Risco técnico:** baixo.

### Tarefa 51 — Criar mensagem de reativação

**Objetivo:**  
Oferecer uma abordagem própria para leads antigos ou esquecidos.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar mensagem de reativação para leads parados.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- criar modelo de reativação;
- usar tom respeitoso e útil;
- aproveitar informações existentes do lead.

Arquivos prováveis:
- src/lib/whatsapp/templates.ts
- app/api/whatsapp/generate/route.ts

Critérios de aceite:
- existe mensagem de reativação;
- o texto é adequado para lead antigo;
- a geração respeita o contexto comercial.
```

**Escopo da implementação:** texto de reativação para leads frios.  
**Arquivos prováveis:** `src/lib/whatsapp/templates.ts`, `app/api/whatsapp/generate/route.ts`.  
**Critérios de aceite:**  
- mensagem de reativação pronta;  
- tom adequado;  
- contexto respeitado.  
**Dependências:** Tarefa 47.  
**Risco técnico:** baixo.

### Tarefa 52 — Salvar mensagens geradas no histórico do lead

**Objetivo:**  
Amarrar o histórico de WhatsApp ao prontuário do lead para rastreabilidade comercial.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: salvar mensagens geradas no histórico do lead.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- relacionar mensagem gerada ao prontuário do lead;
- evitar que o histórico de WhatsApp fique solto;
- reaproveitar a persistência atual quando possível.

Arquivos prováveis:
- src/lib/whatsapp/repository.server.ts
- src/components/dashboard/lead-details-popup.tsx
- app/api/whatsapp/generate/route.ts

Critérios de aceite:
- o histórico do lead passa a refletir mensagens geradas;
- a persistência continua funcionando;
- o usuário consegue consultar esse material depois.
```

**Escopo da implementação:** integração entre histórico de WhatsApp e prontuário.  
**Arquivos prováveis:** `src/lib/whatsapp/repository.server.ts`, `src/components/dashboard/lead-details-popup.tsx`, `app/api/whatsapp/generate/route.ts`.  
**Critérios de aceite:**  
- histórico amarrado ao lead;  
- persistência mantida;  
- consulta futura possível.  
**Dependências:** Tarefa 11.  
**Risco técnico:** médio.

### Tarefa 53 — Permitir copiar mensagem

**Objetivo:**  
Facilitar uso imediato da mensagem gerada sem exigir navegação extra.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: permitir copiar mensagem gerada de forma mais clara no fluxo de WhatsApp.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- melhorar ação de copiar mensagem;
- reforçar feedback visual de sucesso/erro;
- manter compatibilidade com o histórico atual.

Arquivos prováveis:
- app/dashboard/whatsapp/whatsapp-workspace.tsx
- src/components/dashboard/lead-message-generator.tsx

Critérios de aceite:
- copiar mensagem fica simples;
- o usuário recebe feedback claro;
- a ação funciona com mensagens geradas e salvas.
```

**Escopo da implementação:** UX do botão copiar.  
**Arquivos prováveis:** `app/dashboard/whatsapp/whatsapp-workspace.tsx`, `src/components/dashboard/lead-message-generator.tsx`.  
**Critérios de aceite:**  
- copiar simples;  
- feedback claro;  
- funciona nos fluxos atuais.  
**Dependências:** Tarefa 52.  
**Risco técnico:** baixo.

### Tarefa 54 — Abrir WhatsApp com texto preenchido

**Objetivo:**  
Encadear a geração/cópia com o envio real para reduzir atrito comercial.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: permitir abrir WhatsApp com texto preenchido a partir da mensagem gerada.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- abrir WhatsApp com mensagem preenchida;
- reaproveitar telefone e texto já disponíveis;
- tratar falta de telefone com fallback claro.

Arquivos prováveis:
- app/dashboard/whatsapp/whatsapp-workspace.tsx
- src/components/dashboard/lead-details-popup.tsx

Critérios de aceite:
- o WhatsApp abre com o texto pronto;
- o CTA só tenta abrir quando houver telefone;
- o fluxo encurta o envio real da mensagem.
```

**Escopo da implementação:** CTA final de abertura no WhatsApp.  
**Arquivos prováveis:** `app/dashboard/whatsapp/whatsapp-workspace.tsx`, `src/components/dashboard/lead-details-popup.tsx`.  
**Critérios de aceite:**  
- WhatsApp abre com texto;  
- valida telefone;  
- reduz atrito operacional.  
**Dependências:** Tarefas 10 e 53.  
**Risco técnico:** baixo.

### Bloco G — Equipe e distribuição de leads

### Tarefa 55 — Revisar estrutura de usuários e equipe

**Objetivo:**  
Mapear o que já existe na camada de equipe e o que ainda falta para operar distribuição de leads.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: revisar a estrutura atual de usuários, equipe, papéis e permissões para distribuição de leads.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- produzir um diagnóstico curto da estrutura de equipe;
- mapear limites atuais para distribuição e supervisão;
- não implementar ainda as regras de distribuição.

Arquivos prováveis:
- src/lib/workspaces/team.ts
- src/lib/workspaces/permissions.ts
- app/team/setup/*
- middleware.ts

Critérios de aceite:
- o diagnóstico mostra papéis, visões e gargalos;
- owner, admin e seller ficam claramente mapeados;
- o material orienta as próximas tarefas de distribuição.
```

**Escopo da implementação:** diagnóstico de equipe e permissões.  
**Arquivos prováveis:** `src/lib/workspaces/team.ts`, `src/lib/workspaces/permissions.ts`, `app/team/setup/*`, `middleware.ts`.  
**Critérios de aceite:**  
- diagnóstico objetivo;  
- papéis claros;  
- base para próximas tarefas.  
**Dependências:** nenhuma.  
**Risco técnico:** baixo.

### Tarefa 56 — Criar responsável pelo lead

**Objetivo:**  
Deixar explícito na interface e no fluxo de edição quem é o dono atual da oportunidade.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar ou melhorar o responsável pelo lead no CRM.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- tornar owner_profile_id visível e editável quando permitido;
- exibir responsável na listagem e no detalhe;
- preservar regras de acesso por role.

Arquivos prováveis:
- src/lib/leads/repository.server.ts
- app/dashboard/leads/leads-workspace.tsx
- src/components/dashboard/lead-details-popup.tsx

Critérios de aceite:
- cada lead mostra responsável atual;
- gestores podem ajustar quando permitido;
- o seller continua vendo apenas sua carteira quando aplicável.
```

**Escopo da implementação:** visibilidade e edição controlada do owner do lead.  
**Arquivos prováveis:** `src/lib/leads/repository.server.ts`, `app/dashboard/leads/leads-workspace.tsx`, `src/components/dashboard/lead-details-popup.tsx`.  
**Critérios de aceite:**  
- responsável visível;  
- edição controlada por permissão;  
- RLS/visão preservados.  
**Dependências:** Tarefa 55.  
**Risco técnico:** médio.

### Tarefa 57 — Criar distribuição manual de leads

**Objetivo:**  
Permitir que owner/admin escolham explicitamente para quem um lead vai.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar distribuição manual de leads para a equipe.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- permitir atribuição manual de lead;
- limitar ação a gestores;
- exibir retorno claro na UI.

Arquivos prováveis:
- app/api/leads/[id]/route.ts
- src/lib/leads/repository.server.ts
- src/components/dashboard/lead-details-popup.tsx

Critérios de aceite:
- gestor consegue atribuir lead manualmente;
- a alteração reflete na UI;
- sellers sem permissão não conseguem redistribuir.
```

**Escopo da implementação:** atribuição manual controlada.  
**Arquivos prováveis:** `app/api/leads/[id]/route.ts`, `src/lib/leads/repository.server.ts`, `src/components/dashboard/lead-details-popup.tsx`.  
**Critérios de aceite:**  
- atribuição manual funciona;  
- UI atualiza;  
- sellers sem permissão são bloqueados.  
**Dependências:** Tarefa 56.  
**Risco técnico:** médio.

### Tarefa 58 — Criar distribuição em lote

**Objetivo:**  
Permitir distribuição rápida de múltiplos leads sem editar um a um.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar distribuição em lote de leads.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- selecionar vários leads;
- atribuir em lote para um consultor;
- restringir o recurso a quem pode gerenciar carteira.

Arquivos prováveis:
- app/dashboard/leads/leads-workspace.tsx
- app/api/leads/route.ts
- src/lib/leads/repository.server.ts

Critérios de aceite:
- leads podem ser atribuídos em lote;
- a seleção em massa é clara;
- o recurso respeita permissões.
```

**Escopo da implementação:** atribuição em massa no CRM.  
**Arquivos prováveis:** `app/dashboard/leads/leads-workspace.tsx`, `app/api/leads/route.ts`, `src/lib/leads/repository.server.ts`.  
**Critérios de aceite:**  
- distribuição em lote funciona;  
- seleção clara;  
- permissão respeitada.  
**Dependências:** Tarefa 57.  
**Risco técnico:** médio.

### Tarefa 59 — Criar regras simples de distribuição

**Objetivo:**  
Introduzir automação leve de distribuição sem tentar resolver roteamento complexo na primeira versão.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar regras simples de distribuição de leads para a equipe.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- criar regra simples de distribuição;
- evitar algoritmo complexo nesta etapa;
- documentar a lógica escolhida.

Arquivos prováveis:
- src/lib/leads/repository.server.ts
- app/dashboard/leads/leads-workspace.tsx
- src/lib/workspaces/team.ts

Critérios de aceite:
- existe ao menos uma regra simples utilizável;
- a lógica é previsível e documentada;
- o comportamento não conflita com distribuição manual.
```

**Escopo da implementação:** automação leve e previsível.  
**Arquivos prováveis:** `src/lib/leads/repository.server.ts`, `app/dashboard/leads/leads-workspace.tsx`, `src/lib/workspaces/team.ts`.  
**Critérios de aceite:**  
- regra simples pronta;  
- comportamento previsível;  
- sem conflitar com atribuição manual.  
**Dependências:** Tarefas 56 e 57.  
**Risco técnico:** médio.

### Tarefa 60 — Criar painel de supervisor

**Objetivo:**  
Dar para owner/admin uma visão própria de acompanhamento da operação da equipe.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar painel de supervisor para acompanhar leads e operação da equipe.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- criar visão inicial para gestores;
- focar em carteira, atraso e distribuição;
- não abrir um módulo enorme separado nesta primeira tarefa.

Arquivos prováveis:
- app/dashboard/page.tsx
- app/dashboard/dashboard-home.tsx
- src/lib/workspaces/context.ts

Critérios de aceite:
- gestores têm uma leitura própria da equipe;
- sellers não recebem esse painel extra;
- o painel destaca operação, não apenas volume.
```

**Escopo da implementação:** visão inicial de supervisão para gestores.  
**Arquivos prováveis:** `app/dashboard/page.tsx`, `app/dashboard/dashboard-home.tsx`, `src/lib/workspaces/context.ts`.  
**Critérios de aceite:**  
- visão extra para gestores;  
- sellers sem acesso;  
- foco operacional.  
**Dependências:** Tarefas 55 a 59.  
**Risco técnico:** médio.

### Tarefa 61 — Mostrar leads e atrasos por consultor

**Objetivo:**  
Permitir cobrança objetiva da equipe por carteira e atraso operacional.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: mostrar leads por consultor e leads atrasados por consultor.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- agregar carteira por consultor;
- mostrar atraso por consultor no painel de gestão;
- usar regras simples de atraso nesta primeira fase.

Arquivos prováveis:
- app/dashboard/dashboard-home.tsx
- src/lib/reports/commercial-report.server.ts
- src/lib/leads/repository.server.ts

Critérios de aceite:
- gestores veem carteira por consultor;
- atrasos ficam visíveis por consultor;
- os números são coerentes com o CRM.
```

**Escopo da implementação:** agregação por consultor para gestão.  
**Arquivos prováveis:** `app/dashboard/dashboard-home.tsx`, `src/lib/reports/commercial-report.server.ts`, `src/lib/leads/repository.server.ts`.  
**Critérios de aceite:**  
- carteira por consultor visível;  
- atraso por consultor visível;  
- coerência com CRM.  
**Dependências:** Tarefas 16, 20 e 60.  
**Risco técnico:** médio.

### Tarefa 62 — Permitir redistribuir lead parado

**Objetivo:**  
Dar ação prática para leads que ficaram travados na carteira errada ou sem avanço.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: permitir redistribuir lead parado para outro consultor.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- permitir ação de redistribuição em lead parado;
- limitar a ação a gestores;
- reaproveitar a distribuição manual já criada.

Arquivos prováveis:
- app/dashboard/funil/sales-funnel-workspace.tsx
- src/components/dashboard/lead-details-popup.tsx
- src/lib/leads/repository.server.ts

Critérios de aceite:
- gestores conseguem redistribuir lead parado;
- a ação usa o fluxo de atribuição existente;
- o CRM reflete o novo responsável.
```

**Escopo da implementação:** ação de redistribuição para casos parados.  
**Arquivos prováveis:** `app/dashboard/funil/sales-funnel-workspace.tsx`, `src/components/dashboard/lead-details-popup.tsx`, `src/lib/leads/repository.server.ts`.  
**Critérios de aceite:**  
- redistribuição funciona;  
- restrita a gestores;  
- novo responsável refletido na UI.  
**Dependências:** Tarefas 16, 57 e 61.  
**Risco técnico:** médio.

### Bloco H — Segurança e produção

### Tarefa 63 — Revisar exposição de chaves

**Objetivo:**  
Reduzir risco operacional com segredos e arquivos de ambiente no workspace e no frontend.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: revisar exposição de chaves e endurecer o tratamento de segredos no projeto.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar tratamento de segredos no repositório;
- melhorar alertas, documentação ou guardrails;
- não expor nenhum segredo real.

Arquivos prováveis:
- .env.example
- README.md
- src/lib/env/shared.ts
- docs/SECURITY_AUDIT.md

Critérios de aceite:
- o projeto deixa mais claro o uso seguro de segredos;
- não há exposição de segredo em código client;
- o risco operacional fica melhor documentado.
```

**Escopo da implementação:** guardrails e documentação de segredos.  
**Arquivos prováveis:** `.env.example`, `README.md`, `src/lib/env/shared.ts`, `docs/SECURITY_AUDIT.md`.  
**Critérios de aceite:**  
- uso seguro de segredos mais claro;  
- nada sensível no client;  
- risco operacional melhor documentado.  
**Dependências:** nenhuma.  
**Risco técnico:** baixo.

### Tarefa 64 — Revisar APIs protegidas

**Objetivo:**  
Garantir que as rotas sensíveis não dependam só do middleware para segurança.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: revisar APIs protegidas e reforçar checagens server-side quando faltarem.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar rotas mutáveis críticas;
- reforçar autenticação e permissão server-side quando necessário;
- evitar grande refactor nesta tarefa.

Arquivos prováveis:
- app/api/leads/*
- app/api/campaigns/*
- app/api/integrations/meta/*
- src/lib/api/route-security.ts

Critérios de aceite:
- rotas críticas validam sessão e permissão do lado servidor;
- nenhuma rota sensível fica só dependente do middleware;
- testes ou validações de erro são atualizados quando fizer sentido.
```

**Escopo da implementação:** endurecimento pontual de rotas sensíveis.  
**Arquivos prováveis:** `app/api/leads/*`, `app/api/campaigns/*`, `app/api/integrations/meta/*`, `src/lib/api/route-security.ts`.  
**Critérios de aceite:**  
- validação server-side reforçada;  
- menos dependência exclusiva do middleware;  
- erros e testes coerentes.  
**Dependências:** nenhuma.  
**Risco técnico:** médio.

### Tarefa 65 — Revisar RLS do Supabase

**Objetivo:**  
Confirmar se as tabelas sensíveis do CRM e integrações continuam isoladas por organização e por papel.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: revisar RLS do Supabase para CRM, integrações e billing.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar policies de leitura e escrita das tabelas críticas;
- corrigir gaps específicos encontrados;
- não reorganizar toda a estratégia de RLS do projeto.

Arquivos prováveis:
- supabase/migrations/202605120001_standardize_rls_isolation.sql
- supabase/migrations/202605200002_supabase_hardening_rls.sql
- docs/SECURITY_AUDIT.md

Critérios de aceite:
- tabelas críticas têm revisão objetiva de RLS;
- gaps encontrados recebem correção pontual ou documentação clara;
- o isolamento por organização continua íntegro.
```

**Escopo da implementação:** revisão cirúrgica de RLS.  
**Arquivos prováveis:** `supabase/migrations/202605120001_standardize_rls_isolation.sql`, `supabase/migrations/202605200002_supabase_hardening_rls.sql`, `docs/SECURITY_AUDIT.md`.  
**Critérios de aceite:**  
- revisão de RLS concluída;  
- gaps tratados ou documentados;  
- isolamento preservado.  
**Dependências:** nenhuma.  
**Risco técnico:** alto; qualquer policy errada afeta dados reais.

### Tarefa 66 — Revisar estrutura multi-tenant

**Objetivo:**  
Validar se a modelagem de organização, perfil e workspace continua coerente para a expansão do CRM.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: revisar a estrutura multi-tenant do projeto com foco em CRM, equipe e integrações.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar coerência de organization, profile e workspace;
- validar pontos de acoplamento com leads e integrações;
- documentar ou corrigir gaps pontuais.

Arquivos prováveis:
- src/lib/workspaces/context.ts
- src/lib/workspaces/permissions.ts
- middleware.ts
- supabase/migrations/202604290003_onboarding_workspaces_invites.sql

Critérios de aceite:
- a estrutura multi-tenant fica claramente validada;
- gargalos para CRM/equipe ficam documentados;
- correções pontuais não quebram o onboarding atual.
```

**Escopo da implementação:** validação da modelagem multi-tenant.  
**Arquivos prováveis:** `src/lib/workspaces/context.ts`, `src/lib/workspaces/permissions.ts`, `middleware.ts`, `supabase/migrations/202604290003_onboarding_workspaces_invites.sql`.  
**Critérios de aceite:**  
- modelagem validada;  
- gargalos documentados;  
- onboarding preservado.  
**Dependências:** Tarefa 55.  
**Risco técnico:** médio.

### Tarefa 67 — Impedir acesso cruzado entre empresas

**Objetivo:**  
Fechar qualquer brecha remanescente em APIs, queries e componentes que possa misturar dados entre organizações.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: impedir acesso cruzado entre empresas em APIs e consultas críticas.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar consultas por id e por organization_id;
- reforçar checagem em pontos críticos;
- adicionar cobertura de teste quando houver risco claro.

Arquivos prováveis:
- src/lib/leads/repository.server.ts
- src/lib/integrations/repository.server.ts
- app/api/leads/*
- app/api/meta/*

Critérios de aceite:
- operações críticas validam organização do recurso;
- não há acesso cruzado por id direto;
- existe teste ou validação prática para os casos mais sensíveis.
```

**Escopo da implementação:** endurecimento anti-cross-tenant em pontos críticos.  
**Arquivos prováveis:** `src/lib/leads/repository.server.ts`, `src/lib/integrations/repository.server.ts`, `app/api/leads/*`, `app/api/meta/*`.  
**Critérios de aceite:**  
- checagem por organização reforçada;  
- ids isolados não vazam dados;  
- cobertura prática para casos sensíveis.  
**Dependências:** Tarefas 64 a 66.  
**Risco técnico:** alto.

### Tarefa 68 — Validar payloads sensíveis

**Objetivo:**  
Padronizar validação de payloads em APIs mais críticas de leads, Meta, campanhas e webhooks.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: validar payloads sensíveis nas APIs críticas do projeto.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- reforçar validação de payload em rotas críticas;
- reaproveitar helpers existentes de route-security;
- manter mensagens de erro úteis.

Arquivos prováveis:
- src/lib/api/route-security.ts
- app/api/leads/*
- app/api/meta/*
- app/api/campaigns/*

Critérios de aceite:
- payloads críticos têm validação consistente;
- erros de entrada ficam claros;
- não há regressão em rotas já tipadas.
```

**Escopo da implementação:** padronização de validação em rotas sensíveis.  
**Arquivos prováveis:** `src/lib/api/route-security.ts`, `app/api/leads/*`, `app/api/meta/*`, `app/api/campaigns/*`.  
**Critérios de aceite:**  
- validação consistente;  
- mensagens claras;  
- sem regressão no que já está tipado.  
**Dependências:** Tarefa 64.  
**Risco técnico:** médio.

### Tarefa 69 — Criar logs seguros

**Objetivo:**  
Melhorar logging para operação sem persistir PII em excesso.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar logs mais seguros para leads, integrações e webhooks.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- reforçar sanitização de logs;
- reduzir payload salvo em eventos operacionais;
- preservar utilidade para debug.

Arquivos prováveis:
- src/lib/logger.ts
- src/lib/leads/webhook-events.server.ts
- app/api/webhooks/leads/route.ts
- app/api/meta/webhook/route.ts

Critérios de aceite:
- logs reduzem exposição de dados sensíveis;
- o time ainda consegue diagnosticar falhas;
- sanitização é aplicada de forma consistente.
```

**Escopo da implementação:** sanitização e utilidade de logs.  
**Arquivos prováveis:** `src/lib/logger.ts`, `src/lib/leads/webhook-events.server.ts`, `app/api/webhooks/leads/route.ts`, `app/api/meta/webhook/route.ts`.  
**Critérios de aceite:**  
- menos exposição de PII;  
- debug continua possível;  
- sanitização consistente.  
**Dependências:** Tarefa 68.  
**Risco técnico:** médio.

### Tarefa 70 — Revisar webhooks públicos

**Objetivo:**  
Revalidar autenticação, rate limit e tratamento de erro dos webhooks de leads e Meta.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: revisar webhooks públicos do projeto com foco em autenticação, rate limit e tratamento de erro.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar `/api/webhooks/leads` e `/api/meta/webhook`;
- reforçar respostas claras e proteção contra abuso;
- manter compatibilidade com integrações existentes.

Arquivos prováveis:
- app/api/webhooks/leads/route.ts
- app/api/meta/webhook/route.ts
- src/lib/rate-limit.ts
- src/lib/leads/webhook-auth.ts

Critérios de aceite:
- webhooks públicos têm proteção revisada;
- falhas e abusos retornam erro mais claro;
- integrações existentes continuam funcionando.
```

**Escopo da implementação:** revisão de webhooks públicos centrais.  
**Arquivos prováveis:** `app/api/webhooks/leads/route.ts`, `app/api/meta/webhook/route.ts`, `src/lib/rate-limit.ts`, `src/lib/leads/webhook-auth.ts`.  
**Critérios de aceite:**  
- proteção revisada;  
- erros mais claros;  
- compatibilidade mantida.  
**Dependências:** Tarefas 64, 68 e 69.  
**Risco técnico:** alto.

### Tarefa 71 — Revisar variáveis no Vercel e ambiente

**Objetivo:**  
Reduzir risco de quebra em produção por ausência, inconsistência ou uso errado de envs.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: revisar variáveis de ambiente no Vercel e alinhar o projeto para produção.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar envs obrigatórias para produção;
- alinhar mensagens, docs e checks;
- não expor valores reais em nenhum artefato.

Arquivos prováveis:
- .env.example
- README.md
- src/lib/env/shared.ts
- src/lib/env/server.ts

Critérios de aceite:
- o projeto deixa claro o que é obrigatório em produção;
- mensagens e checks cobrem integrações críticas;
- nenhum valor real é exposto.
```

**Escopo da implementação:** alinhamento de produção por envs.  
**Arquivos prováveis:** `.env.example`, `README.md`, `src/lib/env/shared.ts`, `src/lib/env/server.ts`.  
**Critérios de aceite:**  
- obrigatoriedades claras;  
- checks adequados;  
- nenhum valor real exposto.  
**Dependências:** Tarefa 27.  
**Risco técnico:** baixo.

### Tarefa 72 — Revisar dados sensíveis no frontend

**Objetivo:**  
Confirmar que o client não recebe além do necessário em dados de lead, integração e billing.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: revisar dados sensíveis entregues ao frontend e reduzir exposição quando necessário.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- revisar payloads enviados ao client;
- remover exposição excessiva quando existir;
- preservar a experiência atual do dashboard.

Arquivos prováveis:
- src/lib/integrations/repository.server.ts
- src/lib/leads/repository.server.ts
- app/dashboard/perfil/meta/page.tsx
- app/dashboard/leads/page.tsx

Critérios de aceite:
- o frontend recebe apenas o necessário;
- dados sensíveis deixam de circular sem necessidade;
- as telas continuam funcionando normalmente.
```

**Escopo da implementação:** redução de exposição em payloads client-side.  
**Arquivos prováveis:** `src/lib/integrations/repository.server.ts`, `src/lib/leads/repository.server.ts`, `app/dashboard/perfil/meta/page.tsx`, `app/dashboard/leads/page.tsx`.  
**Critérios de aceite:**  
- payloads mais enxutos;  
- menos dado sensível no client;  
- telas continuam íntegras.  
**Dependências:** Tarefas 63 a 71.  
**Risco técnico:** médio.

### Bloco I — Simulador de preços futuro

### Tarefa 73 — Mapear necessidade do simulador

**Objetivo:**  
Entender qual problema comercial o simulador resolve antes de abrir nova frente de produto.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: mapear a necessidade do simulador de preços para o contexto do Leadi.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- produzir um planejamento curto do simulador;
- focar em problema, usuário e momento ideal de uso;
- não implementar o simulador completo.

Arquivos prováveis:
- docs/tarefas-leadi-roadmap.md
- src/data/pricing.ts
- app/pricing/page.tsx

Critérios de aceite:
- o simulador tem problema e objetivo bem descritos;
- o material indica porque ele não deve furar a fila do core CRM + Meta;
- nenhuma funcionalidade nova é criada no produto.
```

**Escopo da implementação:** planejamento de produto do simulador.  
**Arquivos prováveis:** `docs/tarefas-leadi-roadmap.md`, `src/data/pricing.ts`, `app/pricing/page.tsx`.  
**Critérios de aceite:**  
- problema bem descrito;  
- prioridade baixa justificada;  
- nenhum módulo novo criado agora.  
**Dependências:** nenhuma.  
**Risco técnico:** baixo.

### Tarefa 74 — Definir campos mínimos do simulador

**Objetivo:**  
Listar apenas os dados mínimos necessários para um futuro simulador útil ao time comercial.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: definir campos mínimos de entrada e saída do simulador de preços.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- listar entradas e saídas mínimas do simulador;
- manter o escopo enxuto;
- não criar cálculo real nesta etapa.

Arquivos prováveis:
- docs/tarefas-leadi-roadmap.md
- src/data/pricing.ts

Critérios de aceite:
- os campos mínimos ficam definidos;
- a proposta não cresce além do necessário;
- nenhuma regra comercial complexa é implementada agora.
```

**Escopo da implementação:** definição de entradas e saídas mínimas.  
**Arquivos prováveis:** `docs/tarefas-leadi-roadmap.md`, `src/data/pricing.ts`.  
**Critérios de aceite:**  
- campos mínimos definidos;  
- escopo enxuto;  
- sem cálculo real agora.  
**Dependências:** Tarefa 73.  
**Risco técnico:** baixo.

### Tarefa 75 — Definir estrutura de dados do simulador

**Objetivo:**  
Preparar a modelagem futura do simulador sem criar ainda a experiência completa.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: definir a estrutura de dados futura do simulador de preços.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- descrever a estrutura de dados provável do simulador;
- alinhar relação futura com lead, campanha e proposta;
- não persistir nada em banco nesta etapa.

Arquivos prováveis:
- docs/tarefas-leadi-roadmap.md
- src/lib/supabase/database.types.ts

Critérios de aceite:
- a estrutura de dados futura fica definida em alto nível;
- o desenho respeita o CRM atual;
- nada novo é persistido agora.
```

**Escopo da implementação:** desenho futuro de dados, sem persistence real.  
**Arquivos prováveis:** `docs/tarefas-leadi-roadmap.md`, `src/lib/supabase/database.types.ts`.  
**Critérios de aceite:**  
- estrutura futura definida;  
- compatível com CRM;  
- sem schema novo agora.  
**Dependências:** Tarefa 74.  
**Risco técnico:** baixo.

### Tarefa 76 — Criar protótipo visual e manter como “Em breve”

**Objetivo:**  
Preparar um placeholder honesto do simulador sem competir com as prioridades do core.

**Prompt para implementação:**  
```txt
Você está no projeto Leadi.

Implemente apenas esta tarefa: criar protótipo visual simples do simulador e mantê-lo marcado como “Em breve”.

Antes de alterar código:
1. Leia os arquivos relacionados.
2. Identifique a estrutura atual.
3. Explique rapidamente o plano.
4. Só depois implemente.

Regras:
- Não altere funcionalidades não relacionadas.
- Não quebre rotas existentes.
- Não remova código sem justificar.
- Mantenha TypeScript estrito.
- Mantenha o padrão visual atual do SaaS.
- Use componentes existentes quando possível.
- Atualize ou crie testes quando fizer sentido.
- Ao final, liste arquivos alterados e como testar.

Escopo da implementação:
- criar um placeholder visual de baixo risco;
- deixar claro que o simulador ainda não faz parte do core;
- não ligar esse protótipo a cálculo real.

Arquivos prováveis:
- app/dashboard/configuracoes/page.tsx
- app/dashboard/perfil/empresa/page.tsx
- src/components/dashboard/widgets.tsx

Critérios de aceite:
- o protótipo visual existe;
- a interface mostra “Em breve” de forma explícita;
- nenhuma lógica real de simulação é criada.
```

**Escopo da implementação:** placeholder visual honesto, sem cálculo.  
**Arquivos prováveis:** `app/dashboard/configuracoes/page.tsx`, `app/dashboard/perfil/empresa/page.tsx`, `src/components/dashboard/widgets.tsx`.  
**Critérios de aceite:**  
- placeholder visível;  
- “Em breve” explícito;  
- sem lógica real de simulação.  
**Dependências:** Tarefas 73 a 75.  
**Risco técnico:** baixo.

### Ordem sugerida para começar

1. **Tarefa 26 — Revisar integração Meta atual**  
   Porque a cadeia de captação real ainda depende de OAuth, sync, env e ativos funcionando de verdade.

2. **Tarefa 02 — Ajustar modelo de lead com campos comerciais**  
   Porque o prontuário do lead ainda não sustenta uma operação comercial rastreável.

3. **Tarefa 03 — Criar tela de detalhe do lead com dados básicos**  
   Porque o atendimento só fica forte quando o time enxerga o lead como prontuário e não só como linha da lista.

### Resumo dos blocos

- Bloco A: CRM e prontuário do lead.
- Bloco B: Funil comercial.
- Bloco C: Dashboard operacional.
- Bloco D: Meta Ads e captação de leads.
- Bloco E: Criação de anúncios com IA.
- Bloco F: Cadência de WhatsApp com IA.
- Bloco G: Equipe e distribuição de leads.
- Bloco H: Segurança e produção.
- Bloco I: Simulador de preços futuro.
