# Leadi

CRM e automação para gestão de leads. Plataforma para captar, organizar e acompanhar leads com funil comercial, integrações e automações.

## Acesso

O SaaS está publicado e operando na Vercel:

[https://leadhealth.vercel.app](https://leadhealth.vercel.app)

Login direto:

[https://leadhealth.vercel.app/login](https://leadhealth.vercel.app/login)

Nota de rebrand: as URLs reais de produção ainda usam o domínio legado até a migração operacional de domínio, OAuth, webhooks e painéis externos.

## Status do Projeto

Atualmente, o projeto está com toda a sua fundação técnica estabelecida e operante. A **Fase 1 (Diagnóstico e Base)** do nosso roadmap técnico foi totalmente concluída. Isso significa que consolidamos nossa infraestrutura principal e estamos prontos para tracionar novas funcionalidades. Já estruturamos e estabilizamos:

- **Estrutura de Leads e Funil Comercial**: Alinhamento completo entre banco de dados, API e interface.
- **Integração com a Meta**: Fluxo ponta a ponta implementado (OAuth, Webhooks, Sincronização de formulários e anúncios).
- **IA e Automações**: Gerador de campanhas e criação de abordagens via WhatsApp usando OpenAI.
- **Workspaces e Equipe**: Estrutura multi-tenant com níveis de permissão definidos (owner, admin, seller).
- **Design System e UI/UX**: Interface premium, com suporte robusto a temas Claro e Escuro (Dark Mode) e alto padrão de acessibilidade.

O projeto agora avança para expandir as capacidades do CRM, o prontuário de cada lead e a gestão de tarefas operacionais no funil de vendas.

### 🚀 Em Breve: Simulador de Preços
Estamos desenvolvendo um **Simulador de Preços** nativo. Esta será uma ferramenta dedicada para consultores e corretores de plano de saúde poderem realizar cotações e cálculos de maneira ágil, tudo integrado diretamente ao ciclo de vendas do lead dentro do CRM Leadi.

## Arquitetura Atual

O Leadi opera em uma arquitetura moderna e escalável baseada em Vercel + Supabase:

- **Frontend/Backend**: Next.js 15 (App Router) hospedado na Vercel.
- **Banco de Dados & Auth**: Supabase Cloud (Postgres, Auth, Storage) com suporte multi-tenant.
- **IA**: OpenAI (GPT-4o-mini) para geração de campanhas, mensagens e análise de compliance.
- **Marketing**: Meta Graph API para sincronização de leads (Lead Ads), formulários e ativos.
- **Pagamentos**: Mercado Pago para checkout de planos e pacotes de créditos.
- **Segurança**: Rate limiting por IP/token e limites de payload em endpoints públicos.

O ambiente local é destinado apenas para desenvolvimento, scripts administrativos e validações técnicas.

## Stack Tecnológica

- **Core**: Next.js 15, React 19, TypeScript.
- **Styling**: Tailwind CSS com componentes baseados em design premium.
- **Backend-as-a-Service**: Supabase (Database, Auth, RLS, Storage).
- **Integrações**: Meta Graph API, OpenAI API, Mercado Pago API.
- **Infraestrutura**: Vercel, GitHub Actions (CI/CD).

## Funcionalidades Implementadas

### Onboarding e Ativação
- **Checklist de Onboarding**: Guia interativo no dashboard para novos usuários (Primeiro lead, Primeira campanha, Configuração de integração).
- **Indicadores de Ativação**: Monitoramento em tempo real de métricas de sucesso (Leads gerados, campanhas criadas, mensagens enviadas).
- **Setup de Equipe**: Fluxo completo de criação de organização, workspaces e convites para membros.

### CRM e Gestão de Leads
- **Workspace Inteligente**: Visualização em Kanban e Tabela com filtros avançados e busca.
- **Agendamento de Leads**: Campo `Próximo Contato` com indicadores visuais de "Sem Agenda" e "Atrasado".
- **Detalhes do Lead**: Histórico de comentários, alteração de status (read-only no Kanban para integridade) e notas.
- **Importação e Ingestão**: Importação via CSV e ingestão automática via Webhooks (Meta, Zapier, Make).

### Marketing e IA
- **Gerador de Campanhas**: Criação de campanhas baseadas em IA com histórico e filtros.
- **Biblioteca de Templates**: Templates profissionais prontos para uso (Planos de Saúde PME, Adesão, etc.).
- **Mensagens de WhatsApp**: Gerador de abordagens personalizadas via IA com base nos dados do lead.
- **Validador de Compliance**: Análise de risco jurídico e técnico para anúncios e abordagens.

### Integrações e Billing
- **Central de Contas**: Conexão OAuth com Meta (Páginas, Formulários, Instagram) e OpenAI (API Keys).
- **Webhook de Leads**: Endpoint autenticado com logs detalhados de eventos recebidos em tempo real.
- **Gestão de Créditos**: Sistema de saldo, extrato e compra de pacotes via Mercado Pago.
- **Pedidos Criativos**: Fluxo de solicitação de artes e peças com anexos e comentários.

## Principais Rotas

### Públicas
- `/`: Landing page moderna
- `/pricing`: Planos e pacotes
- `/login`: Autenticação centralizada
- `/privacy`, `/terms`, `/data-deletion`: Documentação legal e conformidade Meta

### Dashboard (Autenticado)
- `/dashboard`: Home com Checklist de Onboarding e Indicadores
- `/dashboard/leads`: CRM e Workspace
- `/dashboard/funil`: Funil de vendas por etapas
- `/dashboard/campanhas`: Gerador de campanhas e Biblioteca
- `/dashboard/whatsapp`: Gerador de mensagens
- `/dashboard/empresa`: Gestão de integrações (Meta, OpenAI)
- `/dashboard/perfil`: Configurações gerais e card-resumo do Webhook de Leads
- `/dashboard/integracoes/webhook-leads`: Configuração técnica do webhook, token e logs

## APIs Disponíveis

### Leads e Operação
- `GET/POST/PATCH/DELETE /api/leads`: CRUD completo de leads
- `POST /api/leads/[id]/comments`: Interação em leads
- `POST /api/webhooks/leads`: Ingestão externa (Rate limited)
- `GET /api/dashboard-reminders`: Lembretes e indicadores de ativação

### Integrações
- `/api/integrations/meta/*`: Fluxo OAuth e sincronização de ativos
- `/api/meta/webhook`: Recebimento de leads reais da Meta
- `/api/integrations/openai/*`: Configuração e teste de chaves OpenAI

### IA e Conteúdo
- `POST /api/campaigns/generate`: Geração de campanhas (Consome créditos)
- `POST /api/whatsapp/generate`: Geração de mensagens personalizadas
- `POST /api/compliance/validate`: Análise de conformidade

## Configuração de Ambiente (Vercel)

Use `.env.example` como catálogo base. Ele separa variáveis públicas de variáveis estritamente server-side.

| Variável | Exposição | Descrição |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Client/public | URL pública canônica do app |
| `NEXT_PUBLIC_SITE_NAME` | Client/public | Nome exibido na interface |
| `NEXT_PUBLIC_LEGAL_EMAIL` | Client/public | E-mail jurídico exibido em páginas públicas |
| `NEXT_PUBLIC_SUPABASE_URL` | Client/public | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client/public | Chave anônima usada pelo client SDK |
| `LEGAL_CONTACT_EMAIL` | Server-only | Contato jurídico/operacional interno |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Chave administrativa do Supabase |
| `INTEGRATIONS_SECRET_KEY` | Server-only | Chave dedicada para cifrar tokens de clientes |
| `OPENAI_API_KEY` | Server-only | Chave global da OpenAI para rotas server-side |
| `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN` | Server-only | Credenciais do App Meta Developers e do webhook |
| `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET` | Server-only | Credenciais financeiras do Mercado Pago |
| `META_WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_EXTERNAL_API_KEY` | Server-only | Credenciais de envio de WhatsApp |

Notas operacionais:

- Guarde segredos reais no painel da Vercel ou no ambiente seguro do servidor. Evite manter `.env.production` real no workspace.
- Nunca use valores reais em `.env.example`, screenshots, seeds, mocks ou documentação versionada.
- `INTEGRATIONS_SECRET_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são estritamente server-side e nunca devem aparecer em arquivos `"use client"`.
- Somente variáveis com prefixo `NEXT_PUBLIC_` podem ser consumidas em componentes client.
- Rode `npm run security:check` antes de publicar mudanças que mexam em autenticação, integrações ou configuração de ambiente.

## Documentação Técnica Complementar

- [Guia de Migrations e Banco de Dados](docs/MIGRATIONS.md)
- [Estratégia de Backup e Segurança](docs/BACKUP.md)
- [Configuração de Webhooks (Make/Zapier)](docs/make-zapier-webhook-validation.md)
- [Matriz de Decisão Meta Ads](meta_ads_decision_matrix.md)
- [Checklist de App Review Meta](docs/meta-app-review.md)

## Manutenção

```bash
npm run build         # Validação de produção
npm run lint          # Verificação de qualidade
npm run mcp:supabase  # Ferramenta administrativa local
npm run webhook:test  # Simulação de envio de leads
```

---
Desenvolvido por **DrekoDreko / Leadi**.
