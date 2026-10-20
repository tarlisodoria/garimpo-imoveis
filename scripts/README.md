# Scripts

Scripts operacionais e do pipeline. Todos leem `DATABASE_URL` do `.env`, exceto o mapa do IBGE.

## Coleta (`coleta/`)

- `run-coleta.ts <UF>`: baixa o CSV da UF, compara com o estado atual e grava imóveis, histórico, eventos e a coleta. É o mesmo script usado pelo workflow diário.
- `caixa-csv.ts`: parser do CSV oficial da Caixa (Windows-1252, linhas de metadados antes do cabeçalho).
- `diff-imoveis.ts`: diff puro entre o estado anterior e o CSV atual (eventos `novo`, `queda_preco`, `mudou_modalidade` e `saiu`).
- `persistencia.ts`: gravação em lotes de 500 e registro de `sucesso` só no fim; registro de `falha` em qualquer erro.
- `carga-inicial.ts`: corte que separa a carga inicial de cada UF das mudanças reais.

## Publicação (`public/`)

- `generate-public-snapshot.ts` (`npm run public:snapshot`): exporta `data/public-snapshot.json` para o build estático.
- `gerar-municipios-ibge.ts` (`npm run public:municipios`): regenera `data/municipios-ibge.json` a partir da API de localidades do IBGE.

## Análise (`analise/`)

- `gerar-resultados.ts` (`npm run analise`): gera `docs/resultados.md` com a distribuição de descontos por UF e as quedas de preço de um dia.

## Banco

- `db-migrate.ts` (`npm run db:migrate`): aplica as migrations versionadas.
- `db-counts.ts` (`npm run db:counts`): contagens operacionais para validar a coleta.
- `check-db.ts` (`npm run db:check`) e `check-drizzle.ts` (`npm run db:introspect`): testam a conexão.

## Utilitários (`lib/`)

- `erro-seguro.ts`: formata erros para log mantendo a pilha e mascarando URL, senha, usuário e host do banco.
