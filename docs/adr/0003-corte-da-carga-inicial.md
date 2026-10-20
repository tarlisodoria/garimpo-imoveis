# ADR 0003 — Ignorar a carga inicial de cada UF nos números e destaques

**Status:** aceita

## Contexto

A primeira coleta de uma UF não tem estado anterior, então gera um evento `novo` para todos os imóveis. Na primeira coleta nacional, isso produziu 13.711 eventos `novo` de uma só vez; a importação do RJ produziu outros 8.053. Contados como novidade, esses eventos fariam a home anunciar milhares de "imóveis novos" que só estavam entrando no monitoramento.

## Decisão

- A **carga inicial** de uma UF é a sua primeira coleta com status `sucesso` (`sem_alteracao` e `falha` não contam).
- O corte é o `iniciado_em` da coleta seguinte da mesma UF. Funciona porque a linha da coleta é gravada com o horário de início e as coletas são serializadas, então todos os eventos da carga ficam antes do corte. Não foi preciso alterar o schema.
- UF sem coleta posterior à carga não conta nenhum evento.
- As contagens de 7 dias, os selos (`novo`, `baixou`) e as quedas da semana usam esse corte (`scripts/coleta/carga-inicial.ts`).

## Consequências

- Os números da home refletem mudanças reais: com os dados de 20/10/2026, 616 novos e 3.937 quedas em 7 dias, em vez de mais de 20 mil "novos".
- A regra é uma função pura, coberta por testes e compartilhada entre o snapshot e o coletor.
