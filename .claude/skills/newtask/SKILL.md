---
name: newtask
description: Use esta skill quando o usuário digitar /newtask, $newtask, pedir para iniciar a próxima tarefa do roadmap, ou pedir para planejar a próxima implementação do Leadi sem executar ainda.
---

# Função da skill

Esta skill serve para preparar a próxima tarefa do SaaS Leadi, sem implementar imediatamente.

Ela deve trabalhar sempre em modo planejamento.

## Fontes de tarefas

A skill trabalha com **duas fontes de tarefas**, em ordem de prioridade:

### Fonte 1 — Plano Equipe (prioridade alta)

Arquivo: `docs/IMPLEMENTACAO_PLANO_EQUIPE.md`

Contém as tarefas do módulo Equipe organizadas por fases (F0 a F10).

Como identificar tarefas pendentes neste arquivo:

1. Procurar blocos `#### Tarefa F*.* —` seguidos de `- [ ] Concluído`.
2. A primeira tarefa onde `[ ]` **NÃO** estiver marcada como `[x]` é a próxima pendente.
3. Respeitar a ordem das fases: F0 → F1 → F2 → ... → F10.
4. Dentro de cada fase, respeitar a ordem numérica: F2.1 → F2.2 → F2.3 etc.

Cada tarefa neste arquivo já contém: objetivo, arquivos prováveis, o que fazer, critérios de aceite, riscos/cuidados e prompt futuro. O agente deve usar essas informações ao montar o plano.

### Fonte 2 — Roadmap geral (prioridade normal)

Arquivo: `docs/tarefas-leadi-roadmap-normalizado.md`

Contém tarefas gerais do roadmap do Leadi.

Como identificar tarefas pendentes neste arquivo:

1. Tarefas marcadas como `- [ ]`.
2. Tarefas marcadas como `## [ ]`.
3. Tarefas com status `Pendente`.
4. Tarefas sem status claro que pareçam não implementadas.

## Arquivos que a skill deve ler

1. `AGENTS.md`
2. `docs/AGENTE_LEADI_TAREFAS.md`
3. `docs/IMPLEMENTACAO_PLANO_EQUIPE.md` (Fonte 1 — prioridade)
4. `docs/tarefas-leadi-roadmap-normalizado.md` (Fonte 2 — fallback)

## Regra de prioridade entre fontes

1. Primeiro, verificar se há tarefas pendentes no `IMPLEMENTACAO_PLANO_EQUIPE.md`.
2. Se houver tarefa pendente lá, essa é a próxima tarefa.
3. Se **todas** as tarefas do Plano Equipe estiverem concluídas (`[x]`), então buscar no roadmap normalizado.
4. Se ambas as fontes tiverem tarefas, preferir o Plano Equipe.

## Regras obrigatórias

- Não implementar nada na primeira resposta.
- Não alterar arquivos.
- Não atualizar roadmap.
- Não atualizar log.
- Não rodar build, lint ou test.
- Não avançar para outra tarefa.
- Apenas encontrar a primeira tarefa pendente e montar o plano.
- Sempre perguntar autorização antes de implementar.

## Estrutura obrigatória da resposta

A resposta da skill deve seguir exatamente este formato:

```md
### Fonte da tarefa
Informar de qual arquivo veio a tarefa:
- `docs/IMPLEMENTACAO_PLANO_EQUIPE.md` (Plano Equipe)
- `docs/tarefas-leadi-roadmap-normalizado.md` (Roadmap geral)

### Tarefa encontrada
Informar ID e nome da primeira tarefa pendente.

### Objetivo da tarefa
Explicar em poucas linhas o que será feito.

### Arquivos prováveis
Listar os arquivos que provavelmente serão lidos ou alterados.

### Riscos
Listar riscos técnicos, especialmente se envolver:

autenticação;
Supabase;
banco de dados;
migrations;
RLS;
permissões;
multi-tenant;
webhooks;
Meta Ads;
OpenAI;
Mercado Pago;
billing;
créditos;
variáveis de ambiente;
dados de usuários;
dados de leads.

### Plano de implementação
Criar um plano objetivo, em etapas pequenas.

### Validações previstas
Dizer quais comandos pretende rodar depois, verificando antes o package.json.

### Pergunta final
Posso implementar esta tarefa agora?
```

## Regra para implementação posterior

Se o usuário responder exatamente:

`Pode implementar.`

Então o Codex pode implementar somente a tarefa planejada, respeitando:

- `AGENTS.md`;
- `docs/AGENTE_LEADI_TAREFAS.md`;
- escopo da tarefa;
- áreas sensíveis;
- atualização do status da tarefa na fonte correspondente;
- registro em `docs/LOG_EXECUCAO_TAREFAS.md`;
- parada após uma única tarefa.

## Como marcar tarefa como concluída

### Para tarefas do Plano Equipe (`IMPLEMENTACAO_PLANO_EQUIPE.md`):

Trocar `- [ ] Concluído` por `- [x] Concluído` logo abaixo do título da tarefa.

Adicionar abaixo do checkbox um bloco curto com:
- data da execução;
- resumo do que foi feito;
- arquivos alterados;
- comandos executados;
- pendências, se houver.

### Para tarefas do roadmap (`tarefas-leadi-roadmap-normalizado.md`):

Trocar `- [ ]` por `- [x]` ou alterar status para `Concluído`, conforme formato do roadmap.

## Restrições permanentes desta skill

- Nunca implementar a próxima tarefa imediatamente após encontrá-la.
- Nunca misturar a tarefa atual com correções paralelas fora do escopo.
- Nunca alterar autenticação, Supabase, banco, billing, integrações, webhooks ou variáveis de ambiente sem autorização explícita da própria tarefa e do usuário.
- Nunca tratar silêncio, contexto ou confirmação parcial como permissão para implementar.

## Comportamento esperado

Quando esta skill for acionada, o agente deve:

1. Ler os quatro arquivos obrigatórios.
2. Verificar primeiro o `IMPLEMENTACAO_PLANO_EQUIPE.md` por tarefas pendentes (`- [ ] Concluído`).
3. Se não houver tarefas pendentes no Plano Equipe, buscar no roadmap normalizado.
4. Ler a tarefa por completo.
5. Identificar escopo, arquivos prováveis e riscos.
6. Montar um plano curto.
7. Responder no formato obrigatório.
8. Encerrar a resposta com a pergunta exata:

`Posso implementar esta tarefa agora?`
