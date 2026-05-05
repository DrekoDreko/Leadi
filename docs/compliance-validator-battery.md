# Bateria de testes do validador de compliance

Objetivo: reduzir riscos obvios antes de publicar textos de campanha no Meta Ads, sem vender compliance como garantia absoluta.

## Como rodar

```bash
npm run compliance:battery
```

## O que a bateria cobre

- Casos `safe`: textos comerciais consultivos, focados em empresa, regiao e proximo passo.
- Casos `questionable`: superlativos, urgencia agressiva, simplificacao excessiva e coleta antecipada de dados.
- Casos `prohibited`: saude sensivel, atributo protegido, promessa de aprovacao Meta e promessa absoluta de compliance.

## Falsos negativos endurecidos nesta rodada

- Termos como `ansiedade`, `autismo`, `tdah`, `hipertensao` e `obesidade` agora entram na regra local de saude sensivel.

## Limitações

- A bateria valida as regras locais deterministicas. A analise com IA pode variar conforme prompt, modelo e disponibilidade de chave.
- O teste reduz falso negativo obvio, mas nao prova conformidade juridica, regulatoria ou comercial.
- Casos de contexto, imagem, segmentacao do conjunto de anuncios e landing page externa podem exigir revisao separada.

## Revisao humana

- Revisao comercial: confirmar se a linguagem continua vendavel sem promessas absolutas.
- Revisao juridica/regulatoria quando houver duvida sobre oferta, cobertura, elegibilidade ou coleta de dados.
- Publicacao final: usar o resultado do validador como triagem, nunca como aprovacao definitiva.
