# LeadHealth - plano tecnico vigente

Este documento substitui o planejamento antigo e fixa a arquitetura atual do LeadHealth.

## Principio central

O LeadHealth e um SaaS/CRM para corretores e equipes de planos de saude empresariais. A plataforma organiza leads, funil, mensagens, campanhas, compliance, pedidos de materiais e integracoes.

A regra de arquitetura e:

```txt
O cliente conecta as proprias contas Meta e OpenAI no LeadHealth.
O LeadHealth usa apenas as permissoes concedidas pela organizacao para sincronizar leads, listar ativos e preparar campanhas controladas.
```

O produto nao deve assumir uma conta Meta ou OpenAI central da plataforma para operar recursos do cliente.

## Contas conectadas

Conceitos obrigatorios:

- `ConnectedAccountProvider`: `meta` ou `openai`.
- `ConnectedAccountStatus`: `connected`, `disconnected`, `expired`, `pending` ou `error`.
- `MetaConnection`: autorizacao OAuth da organizacao para Meta.
- `OpenAIConnection`: chave OpenAI cadastrada pela organizacao, com `usageMode = customer_key`.
- `MetaPage`: pagina Facebook sincronizada pela conexao Meta.
- `MetaAdAccount`: conta de anuncio sincronizada pela conexao Meta.
- `MetaLeadForm`: formulario Lead Ads sincronizado pela conexao Meta.
- `IntegrationSyncLog`: historico seguro de conexao, validacao, sync, falha e desconexao.

Regras de seguranca:

- Nunca salvar token ou API key em mock visivel.
- Nunca exibir segredo completo na UI.
- Usar apenas preview mascarado, como `sk-...abcd` ou `meta-...abcd`.
- Criptografar segredos ou guardar referencia segura no backend.
- Logs nao podem conter tokens, chaves, cookies ou payload sensivel completo.

## Fluxos do dashboard

`/dashboard/empresa` e a central de conexoes da organizacao.

Deve mostrar:

- status da conexao Meta;
- botao para conectar/reconectar Meta via OAuth;
- botao para sincronizar ativos Meta;
- botao para desconectar Meta;
- paginas, contas de anuncio e formularios encontrados;
- Instagram como permissao dependente da Meta, sem fluxo separado falso;
- status da OpenAI;
- cadastro, teste, preview mascarado e desconexao da chave OpenAI;
- logs recentes de sincronizacao e validacao;
- aviso claro quando os dados forem mock de desenvolvimento.

`/dashboard/campanhas` deve:

- exigir OpenAI conectada para gerar campanha com IA;
- mostrar CTA para conectar OpenAI quando ausente;
- mostrar CTA para conectar Meta quando a organizacao ainda nao conectou;
- permitir escolher pagina, conta de anuncio e formulario quando Meta estiver conectada;
- preparar rascunho ou revisao controlada, sem prometer publicacao automatica;
- persistir `connectedAccountId`, `metaPageId`, `metaAdAccountId`, `metaLeadFormId`, `publishMode` e `publicationStatus`.

`/dashboard/importar` e leads Meta devem:

- associar leads vindos de Lead Ads a pagina, formulario e conta conectada quando possivel;
- registrar `meta_connected_account_id` para rastrear a origem autorizada;
- tratar CSV Meta sem conexao como CSV importado para evitar falsa origem conectada.

`/dashboard/pedidos` deve continuar existindo como area de briefings e materiais de apoio da propria organizacao. A linguagem deve evitar qualquer promessa de que a LeadHealth publica campanhas por contas proprias.

## Rotas de integracao

Meta:

- `GET /api/integrations/meta/connect`
- `GET /api/integrations/meta/callback`
- `POST /api/integrations/meta/sync`
- `POST /api/integrations/meta/disconnect`

OpenAI:

- `POST /api/integrations/openai/connect`
- `POST /api/integrations/openai/test`
- `POST /api/integrations/openai/disconnect`

As rotas devem:

- retornar erro amigavel quando credenciais externas nao estiverem configuradas;
- registrar logs seguros;
- nao fingir integracao real em ambiente mock;
- nao aceitar tokens manuais como substituto do OAuth Meta.

## Linguagem e compliance

Preferir:

- contas conectadas;
- permissoes autorizadas por voce;
- rascunho para revisao;
- publicacao controlada;
- sua conta Meta conectada;
- sua chave OpenAI;
- avaliar alternativas;
- organizar leads;
- preparar campanha;
- sincronizar formularios.

Evitar:

- garantias de resultado;
- garantias de aprovacao;
- promessa absoluta de economia;
- coleta de dados sensiveis no primeiro contato;
- qualquer texto que diga ou sugira que a LeadHealth usa contas proprias para operar pelo cliente.

## Roadmap tecnico imediato

- Manter `/dashboard/empresa` como fonte oficial das conexoes.
- Aplicar migrations de contas conectadas, status de erro e rastreio de leads Meta.
- Validar OAuth Meta em ambiente real com dominio HTTPS e App Review quando necessario.
- Validar OpenAI com chave da organizacao.
- Criar testes automatizados para estados sem/com Meta, sem/com OpenAI e mascaramento de segredos.
- Evoluir publicacao Meta somente com permissao Marketing API e revisao controlada.

## Checklist de aceite

- Usuario sem Meta conectada ve CTA de conexao.
- Usuario com Meta conectada ve paginas, contas e formularios.
- Usuario sem OpenAI conectada ve CTA para conectar.
- Chave OpenAI aparece mascarada.
- Campanha nao avanca para preparo Meta sem conta, pagina e conta de anuncio conectadas.
- Leads Meta carregam pagina, formulario e conta conectada quando disponivel.
- Logs de sincronizacao aparecem sem segredos.
- Documentacao e tasks descrevem apenas a arquitetura de contas conectadas.
