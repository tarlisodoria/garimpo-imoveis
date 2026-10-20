# ADR 0008 — Modo vitrine: sem contas, cobrança nem backend na borda

**Status:** aceita

## Contexto

O projeto começou com contas, filtros, alertas por Telegram e assinatura. A decisão de produto passou a ser publicá-lo como portfólio, sem fins comerciais.

## Decisão

- Remover do código cadastro, login, filtros, cobrança e alertas, inclusive todas as Cloudflare Pages Functions. O site passa a ser 100% estático.
- Remover do banco, com uma migration revisada, as tabelas de usuário, cobrança e Telegram; ficam `imoveis`, `imoveis_historico`, `eventos` e `coletas`.
- Textos legais sem dados pessoais: o site não tem cadastro nem cookies próprios.

## Consequências

- Nenhuma credencial fica na borda, e o banco só é acessado pelo GitHub Actions.
- A superfície de ataque e o custo de manutenção caem, e não há dados pessoais para proteger.
- O histórico das migrations mantém o registro das tabelas removidas.
