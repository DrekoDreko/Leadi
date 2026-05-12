# Checklist de URLs Públicas e Integrações

Este documento lista as URLs públicas de produção da LeadHealth que devem ser configuradas nos painéis externos (Meta, Supabase, Make/Zapier, Mercado Pago, etc.).

## 🌐 URLs da Aplicação (Produção)
- **App Principal:** `https://leadhealth.vercel.app`
- **Login:** `https://leadhealth.vercel.app/login`
- **Privacidade:** `https://leadhealth.vercel.app/privacy`
- **Termos de Uso:** `https://leadhealth.vercel.app/terms`
- **Exclusão de Dados:** `https://leadhealth.vercel.app/data-deletion`

## 🔒 Supabase Auth
Cadastre na "Allowlist de Redirect URLs" do painel do Supabase:
- `http://localhost:3000/auth/callback` (Para desenvolvimento local)
- `https://leadhealth.vercel.app/auth/callback` (Produção)

## 🟦 Integração Meta (Facebook/Instagram)
Painel do App Review e configurações de produtos Meta:
- **Privacy Policy URL:** `https://leadhealth.vercel.app/privacy`
- **Terms of Service URL:** `https://leadhealth.vercel.app/terms`
- **User Data Deletion:** `https://leadhealth.vercel.app/data-deletion`
- **Valid OAuth Redirect URI:** `https://leadhealth.vercel.app/api/integrations/meta/callback`
- **Webhook Callback URL (Meta Webhooks):** `https://leadhealth.vercel.app/api/meta/webhook`

## ⚡ Webhook de Leads Externos (Make, Zapier, RD, etc.)
- **URL de Disparo:** `https://leadhealth.vercel.app/api/webhooks/leads`
- **Método:** `POST`
- *(Lembre-se de enviar o token de autenticação gerado na aba "Perfil" no header `Authorization: Bearer <token>` ou `x-leadhealth-token: <token>`)*

## 💳 Mercado Pago (Cobranças/Assinaturas)
- **Webhook URL:** `https://leadhealth.vercel.app/api/billing/webhooks/mercadopago`

> **Nota:** As rotas foram testadas e o hardcode de `localhost` foi removido do sistema base, garantindo que o domínio principal em produção responda como padrão para as integrações.
