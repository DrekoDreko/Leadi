# Meta App Review - checklist tecnico

Guia operacional para o Leadi publicar a integracao Meta com o minimo de retrabalho.

## 1. URLs publicas que devem existir

- Site principal: `NEXT_PUBLIC_APP_URL`
- Politica de privacidade: `/privacy`
- Termos de uso: `/terms`
- Exclusao de dados: `/data-deletion`
- Callback de exclusao da Meta: `/api/meta/data-deletion`
- Verificacao de webhook: `/api/meta/webhook`

## 2. Configuracao minima antes de abrir o painel da Meta

- Definir `NEXT_PUBLIC_APP_URL` com o dominio final em producao, por exemplo `https://app.seudominio.com`
- Publicar build acessivel sem login para `/privacy`, `/terms` e `/data-deletion`
- Configurar `META_REDIRECT_URI` apontando para `https://SEU_DOMINIO/api/integrations/meta/callback`
- Definir `INTEGRATIONS_SECRET_KEY` no servidor para cifrar tokens e chaves conectadas em qualquer ambiente
- Definir `META_VERIFY_TOKEN`
- Definir `META_APP_SECRET`
- Garantir HTTPS no dominio final

## 3. O que preencher no App Dashboard

- `App Domains`: dominio raiz do app publicado
- `Privacy Policy URL`: `https://SEU_DOMINIO/privacy`
- `Terms of Service URL`: `https://SEU_DOMINIO/terms`
- `User Data Deletion`: preferir `Data Deletion Callback URL` em `https://SEU_DOMINIO/api/meta/data-deletion`
- `User Data Deletion` instructions page: `https://SEU_DOMINIO/data-deletion`
- `Webhook Callback URL`: `https://SEU_DOMINIO/api/meta/webhook`
- `Verify Token`: o mesmo valor de `META_VERIFY_TOKEN`
- `OAuth Redirect URI`: `https://SEU_DOMINIO/api/integrations/meta/callback`
- Tela de conexao: `/dashboard/empresa`, onde o cliente conecta a propria conta Meta e sua chave OpenAI

## 4. Material tecnico para App Review

- Descricao objetiva do caso de uso:
  "Recebemos eventos de Meta Lead Ads para importar leads autorizados ao CRM da corretora, sincronizar os ativos conectados e preparar campanhas controladas pelo cliente."
- Lista curta das telas para gravar:
  - pagina publica `/privacy`
  - pagina publica `/terms`
  - pagina publica `/data-deletion`
  - area `/dashboard/empresa` mostrando a conexao Meta da empresa
  - tela do produto que mostra a configuracao da integracao ou logs
  - evidencia do endpoint `/api/meta/webhook` validando a inscricao
- Explicacao do fluxo:
  - usuario conecta a propria conta Meta na area `/dashboard/empresa`
  - o app sincroniza pages, ad accounts e formularios autorizados
  - Meta envia evento `leadgen`
  - o app valida assinatura e registra o evento
  - os dados do lead sao buscados/processados pelo backend e entram no CRM

## 4.1 Permissoes Meta revisadas contra o codigo

- `leads_retrieval`
  Necessaria para buscar o payload completo de cada lead recebido via webhook ou importacao manual.
  Evidencia atual: `src/lib/meta/lead-retrieval.server.ts` consulta `/{leadgenId}` com `field_data`, campanha, anuncio e formulario.
- `pages_show_list`
  Necessaria para sincronizar as paginas disponiveis da conta conectada.
  Evidencia atual: `src/lib/integrations/meta-graph.server.ts` consulta `/me/accounts`.
- `pages_read_engagement`
  Necessaria para listar os formularios vinculados a cada pagina sincronizada.
  Evidencia atual: `src/lib/integrations/meta-graph.server.ts` consulta `/{pageId}/leadgen_forms`.
- `ads_read`
  Necessaria para sincronizar as contas de anuncio disponiveis para selecao operacional.
  Evidencia atual: `src/lib/integrations/meta-graph.server.ts` consulta `/me/adaccounts`.
- `ads_management`
  Necessaria para publicar campanhas em modo pausado e enviar imagens para a biblioteca de anuncios.
  Evidencia atual: `src/lib/meta/campaign-publication.server.ts` cria campanhas em `act_{adAccountId}/campaigns` e `src/lib/meta/ad-image-upload.server.ts` envia arquivos para `act_{adAccountId}/adimages`.

## 4.2 Escopos que exigem revisao consciente antes do App Review

- `business_management`
  Continua no conjunto padrao de OAuth por compatibilidade com o fluxo atual de Meta Business Login e selecao da conta conectada.
  Auditoria de 2026-05-22: nao encontramos no codigo uma chamada dedicada da Graph API cuja necessidade dependa somente desse escopo. Se a Meta questionar esse ponto, revisar se ele continua realmente obrigatorio para o setup atual.
- `pages_manage_metadata`
  Continua no conjunto padrao de OAuth como escopo conservador de compatibilidade para a integracao por pagina.
  Auditoria de 2026-05-22: nao encontramos no codigo uma chamada ativa de alteracao de metadata de pagina. Se a Meta pedir justificativa mais estrita, tratar este escopo como candidato prioritario para reducao.

## 4.3 Texto curto sugerido para justificar as permissoes

"O Leadi usa `pages_show_list`, `pages_read_engagement` e `leads_retrieval` para conectar paginas, listar formularios de Lead Ads autorizados e importar leads recebidos pela corretora no CRM. Tambem usa `ads_read` para sincronizar contas de anuncio disponiveis e `ads_management` para publicar campanhas pausadas e enviar criativos autorizados pelo proprio cliente. Os escopos `business_management` e `pages_manage_metadata` estao sob revisao tecnica e so devem permanecer na submissao se continuarem necessarios para o fluxo final de conexao aprovado."

## 5. Roteiro de screencast sugerido

1. Abrir o dominio final publicado.
2. Mostrar `/privacy`, `/terms` e `/data-deletion` sem login.
3. Mostrar a area autenticada `/dashboard/empresa` onde a conta Meta e a chave OpenAI da organizacao sao conectadas.
4. Explicar que o app recebe leads de formularios Meta autorizados para uso comercial do cliente e prepara campanhas com revisão.
5. Demonstrar o webhook ou os logs internos de recebimento.

## 6. Checklist de validacao final

- `NEXT_PUBLIC_APP_URL` aponta para producao
- canonicias, `robots.txt` e `sitemap.xml` publicados no dominio real
- paginas legais abrem com `200`
- `/api/meta/webhook` responde `403` com token incorreto e `200` com `hub.challenge` correto
- `/api/integrations/meta/connect` redireciona para OAuth da Meta e volta para `/dashboard/empresa`
- `/api/integrations/openai/save` e `/api/integrations/openai/test` funcionam com chave mascarada na interface
- e-mail/canal juridico revisado antes da submissao
- texto das paginas revisado por apoio juridico antes de escalar o uso comercial

## 7. Observacao importante

Se a permissao ou produto solicitado pela Meta mudar, a documentacao do review pode exigir campos extras, outro screencast ou justificativas adicionais. Nesses casos, use este checklist como base tecnica e ajuste o material no painel atual da Meta.
