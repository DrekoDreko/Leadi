# Como usar o `newtask`

## Como usar como skill

No Codex, use:

```txt
$newtask
```

Ou abra `/skills` e escolha `newtask`.

## Como usar como slash command

Se o prompt local estiver instalado, use:

```txt
/prompts:newtask
```

Ou, se o Codex reconhecer o nome diretamente:

```txt
/newtask
```

## O que o `newtask` faz

O comando prepara a próxima tarefa pendente do roadmap do Leadi sem executar nada imediatamente.

Fluxo esperado:

1. Ler `AGENTS.md`.
2. Ler `docs/AGENTE_LEADI_TAREFAS.md`.
3. Ler `docs/tarefas-leadi-roadmap-normalizado.md`.
4. Encontrar a primeira tarefa pendente.
5. Apresentar:
   - tarefa encontrada;
   - objetivo;
   - arquivos prováveis;
   - riscos;
   - plano de implementação;
   - validações previstas.
6. Finalizar perguntando exatamente:

`Posso implementar esta tarefa agora?`

O Codex só deve implementar depois que você responder exatamente:

`Pode implementar.`

## Se o comando não aparecer

Talvez seja necessário:

- reiniciar o Codex;
- abrir uma nova sessão;
- rodar `scripts/install-newtask-codex-prompt.sh`, se o arquivo local ainda não foi criado;
- verificar se existe `~/.codex/prompts/newtask.md`.

## Arquivos desta configuração

- Skill do repositório: `.agents/skills/newtask/SKILL.md`
- Prompt versionado no projeto: `docs/CODEX_PROMPT_NEWTASK.md`
- Instalador do prompt local: `scripts/install-newtask-codex-prompt.sh`

## Observação sobre `/newtask`

Se `/newtask` puro não aparecer, isso não é erro do projeto. Pode ser apenas uma limitação ou variação do ambiente do Codex.

Os caminhos mais confiáveis são:

- `$newtask` para usar a skill;
- `/prompts:newtask` para usar o prompt personalizado.
