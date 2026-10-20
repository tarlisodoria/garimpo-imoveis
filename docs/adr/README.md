# Decisões de arquitetura (ADRs)

Registro curado das decisões técnicas do projeto, no formato contexto, decisão e consequências.

| ADR                                                      | Decisão                                                            | Status |
| -------------------------------------------------------- | ------------------------------------------------------------------ | ------ |
| [0001](0001-site-estatico-a-partir-de-snapshot.md)       | Site estático gerado a partir de um snapshot versionado            | Aceita |
| [0002](0002-coleta-diaria-no-github-actions.md)          | Coleta diária no GitHub Actions, sequencial e idempotente por hash | Aceita |
| [0003](0003-corte-da-carga-inicial.md)                   | Ignorar a carga inicial de cada UF nos números e destaques         | Aceita |
| [0004](0004-persistencia-em-lotes.md)                    | Persistência em lotes, com `sucesso` registrado por último         | Aceita |
| [0005](0005-postgres-no-neon-com-drizzle.md)             | Postgres no Neon com Drizzle                                       | Aceita |
| [0006](0006-deploy-direct-upload-no-cloudflare-pages.md) | Deploy por Direct Upload no Cloudflare Pages                       | Aceita |
| [0007](0007-destaques-por-cidade-e-nomes-do-ibge.md)     | Destaques limitados por cidade e nomes oficiais do IBGE            | Aceita |
| [0008](0008-modo-vitrine-sem-backend.md)                 | Modo vitrine: sem contas, cobrança nem backend na borda            | Aceita |
