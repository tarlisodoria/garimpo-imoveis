# ADR 0006 — Deploy por Direct Upload no Cloudflare Pages

**Status:** aceita

## Contexto

O site é estático e precisa ser republicado logo depois de cada coleta que muda o snapshot. Commits feitos com o `GITHUB_TOKEN` não disparam outros workflows.

## Decisão

- Projeto Cloudflare Pages do tipo Direct Upload: o GitHub Actions faz o build e publica com `wrangler pages deploy out`.
- `deploy-pages.yml` roda em push na `main` (ignorando mudanças só de documentação) e é chamado como workflow reutilizável pela coleta quando o snapshot muda.
- Antes do build, `format:check`. O repositório usa fim de linha LF (`.gitattributes`), porque 75 de 76 falhas de formatação no Windows eram só CRLF.

## Consequências

- Um único pipeline controla coleta e publicação, com os logs no mesmo lugar.
- Não há preview automático por branch.
- O token da Cloudflare fica só nos GitHub Secrets, com escopo mínimo.
- O domínio `*.pages.dev` não permite limpar o cache da borda manualmente: páginas removidas podem continuar sendo servidas durante o prazo de cache com que foram guardadas.
