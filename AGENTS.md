# AGENTS.md

## 1. Contexto do projeto

Este projeto e o SaaS **Leadi**.

O Leadi e um CRM com IA para consultores e corretores de planos de saude, com foco em:

- criacao de campanhas com IA;
- CRM de leads;
- importacao e organizacao de leads;
- funil de vendas;
- integracoes com Meta Ads e Meta Lead Ads;
- integracoes com OpenAI;
- Supabase para autenticacao, banco de dados e arquitetura multi-tenant;
- Next.js App Router;
- TypeScript;
- Tailwind CSS;
- deploy na Vercel.

Ao trabalhar neste repositorio, trate o produto como um SaaS real, com areas sensiveis de autenticacao, isolamento por organizacao, billing, creditos, webhooks e integracoes externas.

## 2. Stack principal

Antes de assumir qualquer tecnologia, verifique rapidamente o codigo e o `package.json`.

Stack confirmada neste repositorio:

- Next.js App Router;
- TypeScript;
- Tailwind CSS;
- Supabase;
- OpenAI;
- Meta Ads / Meta Lead Ads;
- Mercado Pago;
- Vercel;
- Lucide React.

Observacoes:

- `Mercado Pago` existe no projeto e aparece em rotas, bibliotecas e migrations de billing e creditos.
- `Lucide React` esta instalado e e usado em componentes da interface.
- O projeto tambem usa `next-themes`, entao alteracoes visuais devem respeitar tema claro e escuro quando aplicavel.

## 3. Regras gerais de trabalho

- Trabalhar sempre em tarefas pequenas.
- Nunca implementar multiplas tarefas ao mesmo tempo.
- Nunca fazer refactor global sem pedido explicito.
- Nunca remover funcionalidades existentes sem justificativa clara.
- Nunca alterar escopo fora da tarefa solicitada.
- Antes de editar codigo, localizar os arquivos relevantes.
- Antes de alterar, entender o padrao visual e estrutural existente.
- Preservar o padrao visual do SaaS.
- Manter compatibilidade com tema claro e escuro quando aplicavel.
- Usar TypeScript com tipagem segura.
- Evitar `any`, exceto quando inevitavel e justificado.
- Nao criar componentes duplicados se ja existir componente reutilizavel.
- Nao inventar endpoints, tabelas, variaveis de ambiente ou integracoes sem verificar o projeto.
- Nao assumir que mocks representam o comportamento final sem conferir a camada real de dados, API e repositorios server-side.
- Em mudancas de UI, reutilizar componentes, convencoes de layout, tokens visuais e padroes de navegacao ja existentes.
- Em mudancas de dados, conferir tipos compartilhados, schema do Supabase, validacoes e impacto multi-tenant antes de editar.

## 4. Regras de seguranca

- Nunca expor secrets, tokens, API keys ou variaveis sensiveis.
- Nunca colocar secrets em arquivos versionados.
- Nunca alterar autenticacao sem pedido explicito.
- Nunca alterar Supabase, policies, migrations, banco de dados ou schema sem pedido explicito.
- Nunca alterar billing, checkout, Mercado Pago ou creditos sem pedido explicito.
- Nunca alterar integracoes com Meta Ads, OpenAI ou webhooks sem pedido explicito.
- Nunca criar nova variavel de ambiente sem atualizar `.env.example`, pois esse arquivo existe no projeto.
- Nunca reduzir validacoes de seguranca para "fazer funcionar".
- Nunca remover checagens de autenticacao ou autorizacao sem justificativa explicita.
- Nunca alterar permissoes de usuario, organizacao ou workspace sem pedido direto.
- Nunca mover logica server-only sensivel para componentes client-side.
- Nunca retornar dados sensiveis em logs, respostas HTTP, toasts ou payloads de debug.
- Nunca confiar em acesso apenas via frontend quando a regra precisa ser garantida no servidor.
- Tratar como areas sensiveis, com atencao reforcada: autenticacao, Supabase, banco de dados, migrations, RLS, permissoes, multi-tenant, webhooks, Meta Ads, OpenAI, Mercado Pago, billing, creditos, variaveis de ambiente, dados de usuarios e dados de leads.

## 5. Fluxo obrigatorio para tarefas do roadmap

O roadmap oficial fica em:

`docs/tarefas-leadi-roadmap-normalizado.md`

Em futuras execucoes, o Codex deve seguir este fluxo:

1. Ler `AGENTS.md`.
2. Ler `docs/AGENTE_LEADI_TAREFAS.md`.
3. Ler `docs/tarefas-leadi-roadmap-normalizado.md`.
4. Se o arquivo normalizado nao existir, ler `docs/tarefas-leadi-roadmap.md`.
5. Encontrar a primeira tarefa pendente.
6. Ler completamente a tarefa.
7. Identificar os arquivos provaveis.
8. Avaliar riscos, com atencao especial para areas sensiveis.
9. Criar um plano curto.
10. Responder com a estrutura obrigatoria de planejamento e perguntar: `Posso implementar esta tarefa agora?`
11. Parar.

O agente so podera implementar depois que o usuario responder explicitamente:

`Pode implementar.`

Regras complementares para o roadmap:

- O agente nunca deve implementar a proxima tarefa imediatamente apos encontra-la.
- Antes de qualquer alteracao funcional ou documental ligada ao roadmap, ele deve apresentar o plano e pedir aprovacao.
- Nao antecipar etapas futuras "aproveitando o contexto".
- Nao misturar correcoes paralelas fora da tarefa atual, exceto quando forem estritamente necessarias para a propria tarefa e estiverem claramente documentadas no resumo.
- Se a tarefa tocar area sensivel, confirmar primeiro se o pedido explicito realmente autoriza a mudanca.

### Resposta obrigatoria antes de implementar

Sempre que encontrar a proxima tarefa pendente, o agente deve responder exatamente com esta estrutura:

```md
### Tarefa encontrada
ID e nome da tarefa.

### Objetivo da tarefa
Resumo curto.

### Arquivos provaveis
Arquivos que provavelmente serao lidos ou alterados.

### Riscos
Riscos tecnicos, especialmente se envolver areas sensiveis.

### Plano de implementacao
Plano curto em etapas.

### Validacoes previstas
Comandos que pretende rodar depois, verificando package.json antes.

### Pergunta final
Posso implementar esta tarefa agora?
```

## 6. Comandos de validacao

Antes de rodar qualquer validacao, verificar os scripts disponiveis em `package.json`.

Quando existirem, tentar rodar:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Regras para validacao:

- Se algum comando nao existir, registrar isso no resumo final.
- Se algum comando falhar, explicar:
- qual comando falhou;
- qual erro apareceu;
- se a falha tem relacao com a alteracao feita;
- o que precisa ser corrigido.
- Nao inventar scripts locais nem substituir silenciosamente um comando ausente por outro sem registrar isso.
- Em mudancas sensiveis de seguranca, auth, integracoes ou ambiente, considerar tambem scripts especificos do projeto quando existirem e fizerem sentido, sempre registrando o que foi executado.

## 7. Quando parar

O Codex deve parar quando:

- concluir a tarefa solicitada;
- apresentar o plano da proxima tarefa do roadmap e ficar aguardando a resposta explicita `Pode implementar.`;
- encontrar bloqueio tecnico relevante;
- detectar risco de alterar area sensivel nao solicitada;
- precisar alterar autenticacao, Supabase, banco, billing, Meta Ads, OpenAI ou variaveis de ambiente sem isso estar explicitamente pedido.

Tambem deve parar se:

- a tarefa real depender de decisao de produto nao definida;
- houver conflito entre o pedido atual e as protecoes de seguranca do projeto;
- a unica forma de continuar for assumir comportamento nao verificado no codigo.

## 8. Resumo obrigatorio no final de cada execucao

Toda execucao deve terminar com um resumo contendo:

- arquivos criados ou alterados;
- o que foi feito;
- comandos executados;
- resultado dos comandos;
- pendencias;
- riscos;
- proximos passos recomendados.

Boas praticas para o resumo:

- dizer explicitamente se a tarefa foi concluida ou se ficou bloqueada;
- citar arquivos e areas sensiveis afetadas;
- registrar se algum script nao existia no `package.json`;
- registrar se nenhuma validacao foi rodada e por qual motivo;
- manter o resumo objetivo, auditavel e facil de continuar na proxima execucao.
