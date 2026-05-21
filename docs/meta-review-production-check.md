# Meta Review Production Check

## Veredito

BLOCKER

## Resumo executivo

A produção responde e as páginas públicas abrem, mas a revisão da Meta ainda tem risco alto de travar em produção. A org de teste que encontrei tem conexão Meta ativa, porém o ambiente puxado da Vercel não expõe os segredos necessários para OAuth/webhook/descriptografia de token da Meta, e a assinatura ligada a essa org está cancelada. Sem corrigir isso, o revisor pode abrir o app, mas não vai conseguir demonstrar o fluxo Meta e parte do CRM.

## Fluxo testado

- URL testada: `https://leadhealth.vercel.app`
- Páginas acessadas: `/login`, `/dashboard`, `/privacy`, `/terms`, `/data-deletion`, `/auth/callback`
- Resultado do login: não foi executado com a conta de review porque as variáveis locais `META_REVIEW_EMAIL` e `META_REVIEW_PASSWORD` não estavam disponíveis neste ambiente
- Resultado do dashboard: `GET /dashboard` responde com `307` para `/login?next=%2Fdashboard` quando acessado sem sessão
- Resultado da área Meta: `GET /dashboard/perfil/meta` responde com `307` para `/login?next=%2Fdashboard%2Fperfil%2Fmeta` sem sessão; na base, a org de teste tem `meta_integrations` ativa, mas não há `meta_pages`, `meta_forms` ou `meta_ad_accounts` sincronizados
- Resultado da área Leads/CRM: a rota existe e o CRM carrega na base da org, mas criação/importação de leads fica bloqueada pelo billing e o fluxo Meta depende de sincronização que hoje não consegue ler o token
- Resultado das APIs críticas:
  - `/api/integrations/meta/connect` sem sessão: `401`
  - `/api/meta/leads/sources` sem sessão: `401`
  - `/api/meta/webhook` sem `hub.challenge`: `403`
  - `/api/meta/data-deletion` em `GET`: `405`
  - `/auth/callback` em `GET`: `307` para `/dashboard`

## Bloqueadores encontrados

- `INTEGRATIONS_SECRET_KEY` não apareceu no env de produção puxado da Vercel, então `decryptIntegrationSecret()` não consegue recuperar o token da Meta salvo em `meta_integrations`; isso derruba sincronização e listagem real de ativos Meta.
- `META_APP_SECRET` e `META_VERIFY_TOKEN` vieram vazios no env de produção puxado da Vercel; com isso, OAuth/webhook da Meta ficam sem validação adequada e o webhook pode responder `503`/`403` em runtime.
- A assinatura ligada à org de teste `8ee99ffd-57f0-48bf-a68b-d3b16588a735` está `cancelled`, e o código bloqueia `lead_creation` e `campaign_generation` para assinaturas inativas.
- Não há `meta_pages`, `meta_forms` nem `meta_ad_accounts` sincronizados para a org de teste, então o usuário não consegue demonstrar visualmente pages/forms/ad accounts sem uma sincronização que hoje depende dos segredos ausentes.

## Riscos encontrados

- O fluxo de Meta está explicado em texto, mas a tela pode parecer vazia porque não há ativos sincronizados.
- A revisão depende de assets reais da Meta para deixar claro o uso de `pages_show_list` e `leads_retrieval`.
- O dashboard público e as páginas legais carregam, mas a validação autenticada não foi concluída com a conta de review neste ambiente.
- O CRM tem dados reais na base, mas o fluxo de criação/importação pode ficar travado por billing e pela integração Meta incompleta.

## Correções mínimas recomendadas

- CRÍTICO: configurar em produção `INTEGRATIONS_SECRET_KEY`, `META_APP_SECRET` e `META_VERIFY_TOKEN` para liberar descriptografia, OAuth e webhook da Meta.
- CRÍTICO: reativar a assinatura da org usada na review ou fornecer um plano/estado que não bloqueie `lead_creation` e `campaign_generation`.
- CRÍTICO: garantir que a org de review tenha ao menos uma página, um formulário e uma conta de anúncio sincronizados para demonstrar `pages_show_list` e `leads_retrieval`.
- RECOMENDADO: validar a conta de teste diretamente em Supabase Auth com a credencial enviada à Meta e repetir o fluxo autenticado.
- OPCIONAL: exibir um resumo visual mais explícito na área Meta sobre por que as permissões `pages_show_list` e `leads_retrieval` são necessárias.

## Checklist final

- [ ] Login funciona em produção
- [ ] Conta de teste existe
- [ ] E-mail da conta está confirmado
- [x] Usuário tem organização vinculada
- [x] Usuário tem role correta
- [ ] Dashboard carrega
- [ ] Página de perfil carrega
- [ ] Área Meta carrega
- [ ] Área Leads/CRM carrega
- [ ] Área Campanhas carrega
- [x] Não há erro 404
- [x] Não há erro 500
- [x] Não há redirect infinito
- [x] Não há loading infinito
- [ ] Não há bloqueio por assinatura
- [ ] Não há bloqueio por créditos
- [ ] Não há bloqueio por OpenAI
- [x] Não há dependência de localhost
- [ ] Variáveis da Vercel estão corretas
- [ ] Supabase Auth está funcionando
- [ ] Supabase RLS permite o acesso correto
- [ ] pages_show_list tem fluxo demonstrável
- [ ] leads_retrieval tem fluxo demonstrável
- [x] Nenhum segredo está exposto no frontend
- [x] Nenhuma credencial real foi commitada

## Conclusão

Existe risco alto de reprovação técnica.
