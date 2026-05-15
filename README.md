# Leadi

CRM e automação para gestão de leads. Plataforma para captar, organizar e acompanhar leads com funil comercial, integrações e automações.

## Acesso

O SaaS está publicado e operando na Vercel:

[https://leadhealth.vercel.app](https://leadhealth.vercel.app)

Login direto:

[https://leadhealth.vercel.app/login](https://leadhealth.vercel.app/login)

Nota de rebrand: as URLs reais de produção ainda usam o domínio legado até a migração operacional de domínio, OAuth, webhooks e painéis externos.

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

| Variável | Descrição |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave administrativa (Server-side) |
| `META_APP_ID` / `META_APP_SECRET` | Credenciais do App Meta Developers |
| `META_VERIFY_TOKEN` | Token de validação do Webhook Meta |
| `INTEGRATIONS_SECRET_KEY` | Chave para cifrar tokens de clientes |
| `MERCADO_PAGO_ACCESS_TOKEN` | Token de integração financeira |

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
