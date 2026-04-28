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

Esta etapa já possui a base da Fase 1 para Supabase Auth, schema multi-tenant,
CRUD de leads por API e campos de origem preparados para Meta Lead Ads. Sem as
variáveis do Supabase configuradas, o dashboard continua usando dados mockados
para não bloquear a interface.

## Páginas implementadas

- `/`: landing page da LeadHealth com proposta de CRM + IA, preview do dashboard, formulário seguro para Meta Lead Ads e CTA para dashboard/planos.
- `/dashboard`: dashboard com métricas, CRM de leads, tabela, funil Kanban visual, campanha sugerida por IA, checklist de compliance, mensagem de WhatsApp e pedido criativo. Usa Supabase quando configurado e mock como fallback.
- `/login`: autenticação real com Supabase Auth quando as variáveis de ambiente estão configuradas.
- `/pricing`: página visual de planos com valores placeholder.

## Componentes e dados

- `src/components/brand-mark.tsx`: marca reutilizável.
- `src/components/mock-dashboard-preview.tsx`: preview visual da operação na landing.
- `src/data/mock.ts`: leads, colunas do Kanban, campanha sugerida, navegação e agenda mockados.

## Supabase Fase 1

Já implementado no código:

- Cliente Supabase para server/browser.
- Middleware para refresh de sessão.
- Login e cadastro por Supabase Auth.
- Schema multi-tenant em `supabase/migrations/202604280001_phase_1_core.sql`.
- API de CRUD de leads.
- Tela `/dashboard/leads` lendo Supabase quando houver sessão e usando mock quando não houver configuração.

O cadastro cria automaticamente uma organização e um perfil `owner`. A rota
`/dashboard/leads` consulta os leads reais quando existe sessão ativa.

## API de leads

- `GET /api/leads`: lista leads da organização logada.
- `POST /api/leads`: cria lead manual, CSV, API ou origem Meta.
- `PATCH /api/leads/:id`: atualiza lead da organização logada.
- `DELETE /api/leads/:id`: remove lead da organização logada.

Campos preparados para Meta:

```txt
source
source_campaign
source_adset
source_ad
meta_lead_id
meta_form_id
meta_page_id
meta_campaign_id
meta_adset_id
meta_ad_id
received_at
raw_payload
```
