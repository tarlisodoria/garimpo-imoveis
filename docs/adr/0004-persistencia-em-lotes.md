# ADR 0004 — Persistência em lotes, com `sucesso` registrado por último

**Status:** aceita

## Contexto

Na primeira coleta nacional, o RJ (8.053 linhas) falhou com `RangeError: Maximum call stack size exceeded`: o Drizzle monta o SQL de um insert de forma recursiva, e milhares de linhas estouram a pilha. Pior: o coletor já tinha gravado a coleta como `sucesso`, com o hash do arquivo. No dia seguinte o RJ foi considerado "sem alteração" e continuou com zero imóveis. A falha nem foi registrada, porque erros inesperados não gravavam `falha`.

## Decisão

- Upsert de imóveis, desativações, histórico e eventos em lotes de 500 (`scripts/coleta/persistencia.ts`).
- A linha `sucesso` é gravada só depois de todos os lotes, com o horário de início da coleta.
- Qualquer erro registra `falha`, sem esconder o erro original.
- A idempotência considera apenas coletas `sucesso`.
- O registro errado do RJ foi corrigido para `falha` (sem apagar dados de coleta), e a UF foi reimportada: 8.053 imóveis.

## Consequências

- Uma falha no meio da gravação nunca marca o arquivo como processado; ele é reprocessado na execução seguinte.
- Eventos de uma gravação interrompida podem se perder, mas nunca duplicam: o reprocessamento parte do estado já gravado.
- A ordem de gravação e o registro de falha são cobertos por testes com dublês.
