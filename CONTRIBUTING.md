# Como contribuir

Obrigado pelo interesse. O Garimpo Imóveis é um projeto de portfólio com a coleta congelada desde 15/11/2026 ([ADR 0009](docs/adr/0009-congelamento-da-coleta.md)), então as contribuições mais úteis agora são correções, testes, acessibilidade, documentação e análises sobre os dados já coletados.

Antes de abrir um pull request grande, abra uma issue para combinar a ideia. Para dados errados num imóvel, use o modelo de issue "Dado incorreto ou desatualizado". Para falhas de segurança, siga o [SECURITY.md](SECURITY.md).

## Como rodar

Requisitos: Node.js 22+ (a versão exata está em `.nvmrc`) e npm 10+.

```bash
npm ci
npm run dev        # site em http://localhost:3000, a partir de data/public-snapshot.json
```

O site não precisa de banco. Para rodar a coleta e gerar um snapshot novo, crie um Postgres (por exemplo, no Neon) e copie `.env.example` para `.env` com a `DATABASE_URL`:

```bash
npm run db:migrate
npx tsx scripts/coleta/run-coleta.ts PA
npm run public:snapshot
```

Não envie mudanças que tentem contornar o bloqueio da Caixa à coleta automatizada (proxy, troca de IP, disfarce de navegador). Esses pull requests serão fechados.

## Como testar

Os testes usam o `node:test`, sem framework extra, e ficam ao lado do código, com o sufixo `.test.ts`:

- `lib/`: funções puras do site (filtros, classificação, projeção do mapa, cálculos do snapshot).
- `scripts/coleta/`: parser do CSV, diff e persistência, com fixtures anonimizadas em `__fixtures__/`.
- `scripts/lib/`: utilitários dos scripts.

Antes de abrir o pull request, rode os quatro checks que o CI também roda:

```bash
npm run lint
npm run format:check   # npm run format corrige
npm test
npm run build
```

Lógica nova (um parser, um cálculo, uma regra de filtro) vem com teste. Se criar testes numa pasta nova, inclua o caminho no script `test` do `package.json`. Mudanças visuais devem ser conferidas no navegador em 390px e 1280px de largura.

## Padrão de commits

Mensagens no formato [Conventional Commits](https://www.conventionalcommits.org/pt-br/), em português, no imperativo:

```text
tipo: resumo curto em minúsculas

Corpo opcional explicando o porquê da mudança.
```

Tipos usados no projeto: `feat`, `fix`, `refactor`, `docs`, `test`, `ci`, `build` e `chore`. Exemplos do histórico:

- `refactor: extrair projecao do mapa e classificacao para lib`
- `ci: Node 22, actions fixadas por SHA e permissoes minimas`
- `docs: pos-mortem do bloqueio 403 da Caixa`

Um commit por mudança lógica. Não inclua segredos, `.env` nem dados pessoais em commits, issues ou logs.

## Documentação

Quando uma decisão técnica mudar, registre um ADR novo em `docs/adr/` (contexto, decisão e consequências) e atualize o índice. Mudanças que alterem o uso do projeto entram no [CHANGELOG.md](CHANGELOG.md) e nos dois READMEs (PT e EN).
