# LeadHealth

SaaS para corretores e vendedores de plano de saúde empresarial organizarem leads, planejarem campanhas com IA e acompanharem oportunidades em CRM.

## Stack atual

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide React para ícones
- Dados mockados em `src/data/mock.ts`
- Supabase futuramente para autenticação, banco e storage
- OpenAI API futuramente para geração de campanhas, compliance e WhatsApp

## Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Ambiente

Copie `.env.example` para `.env.local` quando formos conectar Supabase, OpenAI, pagamentos e integrações Meta.

## Escopo atual

Esta primeira etapa é uma base visual mockada. Não há banco, autenticação real nem integrações externas ainda.

## Páginas implementadas

- `/`: landing page da LeadHealth com proposta de CRM + IA, preview do dashboard, formulário seguro para Meta Lead Ads e CTA para dashboard/planos.
- `/dashboard`: dashboard mockado com métricas, CRM de leads, tabela, funil Kanban visual, campanha sugerida por IA, checklist de compliance, mensagem de WhatsApp e pedido criativo.
- `/login`: tela visual de login, ainda sem autenticação real.
- `/pricing`: página visual de planos com valores placeholder.

## Componentes e dados

- `src/components/brand-mark.tsx`: marca reutilizável.
- `src/components/mock-dashboard-preview.tsx`: preview visual da operação na landing.
- `src/data/mock.ts`: leads, colunas do Kanban, campanha sugerida, navegação e agenda mockados.

## Próximos passos técnicos

1. Conectar Supabase Auth.
2. Criar schema multi-tenant com organizations, profiles, leads, campaign_plans e creative_orders.
3. Trocar dados mockados por consultas reais.
4. Implementar serviços de IA para campanhas, compliance e WhatsApp.
5. Criar importação CSV e fluxo manual de Meta Lead Ads.

# app-meta-crm
