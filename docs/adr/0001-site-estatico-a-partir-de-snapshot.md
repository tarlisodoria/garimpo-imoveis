# ADR 0001 — Site estático gerado a partir de um snapshot versionado

**Status:** aceita

## Contexto

O site precisa de páginas por estado e por cidade (mais de mil), boas para SEO, com custo zero e sem expor o banco. Os dados mudam no máximo uma vez por dia.

## Decisão

- Um script (`npm run public:snapshot`) exporta do banco um JSON público, `data/public-snapshot.json`.
- O Next.js usa `output: "export"`: a home, `/[uf]` e `/[uf]/[cidade]` leem só esse arquivo durante o build (`generateStaticParams`).
- O workflow diário commita o snapshot quando ele muda; o deploy usa a versão commitada.

## Consequências

- O site não acessa o banco em tempo de execução e não precisa de servidor.
- Cada atualização de conteúdo exige um novo build e deploy (cerca de 2 minutos).
- O snapshot fica no histórico do Git, o que dá rastreabilidade de cada publicação, ao custo de um arquivo de alguns megabytes por versão.
- A leitura do snapshot aceita versões antigas, preenchendo valores padrão para campos que ainda não existiam.
