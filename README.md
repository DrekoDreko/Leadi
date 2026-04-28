# LeadHealth

CRM e SaaS com IA para corretores de planos de saúde organizarem leads, planejarem campanhas e acompanharem oportunidades em um fluxo único.

## Badges

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Status](https://img.shields.io/badge/Status-Em%20desenvolvimento-f59e0b?style=for-the-badge)](#escopo-atual)

## Visão geral

LeadHealth é uma base visual para um produto de CRM focado em planos de saúde empresariais.

O projeto cobre:

- captura e organização de leads
- visão de funil e oportunidades
- campanhas sugeridas com IA
- checklist de compliance
- integrações futuras com Meta, Supabase e OpenAI

## Stack atual

- Next.js App Router
- TypeScript
- Tailwind CSS
- Lucide React para ícones
- Dados mockados em `src/data/mock.ts`
- Supabase futuramente para autenticação, banco e storage
- OpenAI API futuramente para geração de campanhas, compliance e WhatsApp

## Site e configuração

- Website: não configurado ainda
- Repositório: `leadhealth`
- Variáveis de ambiente: copie `.env.example` para `.env.local` quando for conectar Supabase, OpenAI, pagamentos e integrações Meta

## Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

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
2. Criar schema multi-tenant com `organizations`, `profiles`, `leads`, `campaign_plans` e `creative_orders`.
3. Trocar dados mockados por consultas reais.
4. Implementar serviços de IA para campanhas, compliance e WhatsApp.
5. Criar importação CSV e fluxo manual de Meta Lead Ads.
