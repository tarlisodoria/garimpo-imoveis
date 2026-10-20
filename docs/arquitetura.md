# Arquitetura

O Garimpo Imóveis é um pipeline de dados diário que termina num site estático. Não há servidor de aplicação: o banco só é acessado pela coleta, e o site lê um arquivo JSON gerado no build.

## Visão geral

```mermaid
flowchart LR
    caixa["Lista oficial da Caixa<br/>CSV por UF (27)"]
    subgraph actions["GitHub Actions (03:15, Brasília)"]
        coleta["Coleta<br/>download + hash"]
        parser["Parser<br/>Windows-1252"]
        diff["Diff com o estado anterior<br/>eventos novo / queda / saiu"]
        snapshot["Snapshot público<br/>data/public-snapshot.json"]
    end
    neon[("Neon Postgres<br/>imoveis · imoveis_historico<br/>eventos · coletas")]
    repo["Repositório<br/>commit automático do snapshot"]
    build["next build<br/>export estático"]
    pages["Cloudflare Pages<br/>~1.200 páginas"]

    caixa --> coleta --> parser --> diff
    diff -->|lotes de 500| neon
    neon --> snapshot --> repo --> build --> pages
```

## Etapas

### 1. Coleta (`scripts/coleta/run-coleta.ts`)

- Um workflow agendado (`coleta-diaria.yml`) aplica as migrations, roda os testes e coleta as 27 UFs em sequência: uma requisição por UF por dia.
- O arquivo é baixado e identificado por SHA-256. Se o hash for igual ao da última coleta **bem-sucedida** da UF, a coleta é registrada como `sem_alteracao` e nada mais é feito.
- Qualquer erro (HTTP 5xx da Caixa, falha de banco) fica registrado como `falha` em `coletas`; o arquivo é reprocessado na coleta seguinte. Uma falha no job abre uma issue automaticamente.

### 2. Parser (`scripts/coleta/caixa-csv.ts`)

- O CSV vem em Windows-1252, sem BOM, com uma linha de metadados ("Data de geração") e linhas vazias antes do cabeçalho.
- Valores monetários usam milhar com `.` e decimal com `,`; o desconto usa decimal com `.`. Todos os campos de texto são normalizados com `trim`.

### 3. Diff e persistência (`scripts/coleta/diff-imoveis.ts`, `persistencia.ts`)

- A lista nova é comparada com o estado atual da UF no banco e gera eventos `novo`, `queda_preco`, `mudou_modalidade` e `saiu`, além de linhas de histórico de preço.
- Toda gravação em massa vai em lotes de 500 (um insert único com milhares de linhas estourava a pilha do Drizzle).
- A linha `sucesso` em `coletas` só é gravada depois que todos os lotes foram persistidos, com o horário de início da coleta. Assim uma falha no meio nunca marca o arquivo como processado.

### 4. Snapshot (`scripts/public/generate-public-snapshot.ts`)

- Gera um JSON com os números gerais, os maiores descontos (global, por UF e por cidade), as maiores quedas da semana e a data da lista de cada UF.
- **Carga inicial:** a primeira coleta de cada UF gera um evento `novo` para todos os imóveis. Esses eventos são ignorados nas contagens de 7 dias e nos selos, usando como corte o início da coleta seguinte (ver [ADR 0003](adr/0003-corte-da-carga-inicial.md)).
- Os destaques têm no máximo 2 imóveis por cidade; nomes de município vêm do IBGE (`data/municipios-ibge.json`, versionado).
- O workflow commita o snapshot só quando ele muda e chama o deploy em seguida.

### 5. Site (`app/`, `components/`, `lib/`)

- Next.js com `output: "export"`: home, páginas por UF e por cidade (`generateStaticParams`), status, termos e privacidade.
- O único componente interativo é o filtro por estado e tipo dos maiores descontos; ele recebe só os campos que exibe, para não levar o snapshot inteiro para o navegador.
- Deploy por `wrangler pages deploy` (Direct Upload) no Cloudflare Pages, depois de `format:check` e build.

## Segurança

- O site não tem Functions nem cadastro: nenhuma credencial fica na borda, e o banco não é acessível pela internet a partir do site.
- Os workflows usam só três secrets: `DATABASE_URL` (coleta) e `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` (deploy). Host, endpoint e usuário do banco são mascarados nos logs, que são públicos.
- O token da Cloudflare tem escopo mínimo (`Cloudflare Pages: Edit`).

## Custos

Todos os serviços estão em planos gratuitos: GitHub Actions, Neon (Postgres serverless) e Cloudflare Pages (até 20.000 arquivos por deploy; o site usa cerca de 6.100).
