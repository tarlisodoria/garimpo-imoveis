# ADR 0002 — Coleta diária no GitHub Actions, sequencial e idempotente por hash

**Status:** aceita

## Contexto

A Caixa publica um CSV por UF. A coleta precisa ser automática, gratuita e educada com a fonte: uma requisição por UF por dia, sem contornar bloqueios.

## Decisão

- Workflow agendado (`coleta-diaria.yml`, 03:15 de Brasília) que aplica as migrations, roda os testes e coleta as 27 UFs em sequência, com o mesmo script usado localmente.
- Cada arquivo é identificado por SHA-256. Se o hash for igual ao da última coleta `sucesso` da UF, a coleta é registrada como `sem_alteracao` e nada é reprocessado.
- Coletas com `falha` nunca bloqueiam o reprocessamento.
- Falhas abrem uma issue automática; o resumo de cada UF vai para o `GITHUB_STEP_SUMMARY`.
- Runners fixados em `ubuntu-24.04`, para evitar mudanças de imagem não planejadas.

## Consequências

- Simples de depurar e fiel à regra de coleta educada; a coleta completa leva cerca de 5 minutos.
- Rodar a mesma coleta duas vezes é seguro.
- Erros temporários da fonte (por exemplo, HTTP 502) são registrados e o arquivo é reprocessado no dia seguinte. Uma nova tentativa com espera exponencial e timeout por requisição é uma melhoria planejada.
