# ADR 0005 — Postgres no Neon com Drizzle

**Status:** aceita

## Contexto

O projeto precisa de um Postgres gratuito, sem pausa por inatividade, acessível a partir do GitHub Actions e com migrations versionadas.

## Decisão

- Neon (Postgres serverless, região São Paulo) com o driver HTTP `@neondatabase/serverless`.
- Drizzle ORM para as consultas e `drizzle-kit` para gerar migrations SQL versionadas em `db/migrations/`. Elas rodam num workflow reutilizável e serializado (`migrate-db.yml`) antes de cada coleta.
- Migrations destrutivas são revisadas à mão. A remoção das tabelas de contas, por exemplo, foi aplicada sem `CASCADE`, para falhar em vez de apagar dependências inesperadas.

## Consequências

- Custo zero e nenhum servidor de banco para manter.
- As operações em massa usam lotes, para respeitar o compute do plano gratuito e o tamanho máximo das requisições.
- As migrations ficam no histórico como documentação da evolução do schema, inclusive das tabelas já removidas.
