# Changelog

Todas as mudanças relevantes do projeto ficam registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Alterado

- Actions atualizadas para checkout v7, setup-node v7 e github-script v9, ainda fixadas por SHA.
- Faixas de preço e o rótulo de acessibilidade do cabeçalho sem travessão ("R$ 50 a 150 mil", "Garimpo Imóveis, início").
- Captura do card no README refeita com o card atual, sem o cronômetro removido na 1.1.0.
- Dependabot ignora majors do TypeScript até o typescript-eslint suportar a versão 7.
- ESLint 10 e atualizações menores de dependências (#7). Node mínimo passa a 22.13, exigido pelo ESLint 10.

## [1.1.0] - 2026-11-19

### Adicionado

- Vitrine redesenhada com mapa interativo do Brasil, seleção por região e estado e marcadores por tipo de imóvel.
- Filtro de orçamento com faixas rápidas, histograma e régua em escala progressiva.
- Filtros por características (quartos, banheiros, salas, vagas e área) na busca geral e nas páginas de estado e cidade.
- Tema claro e escuro, com a preferência salva no navegador.
- Prévias sociais (Open Graph e Twitter) e canonical por estado e cidade, JSON-LD `WebSite` e sitemap com as datas reais do snapshot.
- Aviso de dados congelados em 15/11/2026 na home e em `/status`.
- Pós-mortem do bloqueio HTTP 403 em `docs/incidentes/` e ADR 0009 sobre o congelamento da coleta.
- `SECURITY.md`, `CONTRIBUTING.md`, este changelog, `.nvmrc` e configuração do Dependabot.
- Testes para a projeção do mapa e para a classificação de regiões e categorias.
- Conjunto de dados do período monitorado (imóveis, histórico, eventos e coletas) em CSV UTF-8 com checksums SHA-256, publicado nesta release e gerado por `npm run dataset:exportar`.
- `docs/metodologia.md`, com fonte, procedimento, regras de comparação, limitações, vieses e considerações éticas.
- `docs/guia-de-estudo.md`, uma trilha didática pelo código na ordem do fluxo de dados, com exercícios.
- Teste de integração com Postgres real no CI (migrations, diff e persistência sobre a fixture), sem secrets.
- Gráficos em SVG em `docs/resultados.md`, gerados por script sem dependência nova.

### Alterado

- Coleta congelada: a Caixa passou a responder HTTP 403 a downloads vindos do GitHub Actions em 16/11/2026, e o agendamento foi removido em 18/11/2026. O disparo manual continua para teste.
- Título e descrição do site não prometem mais atualização diária.
- Projeção do mapa e classificação de regiões e categorias extraídas de `ExplorarImoveis` para funções puras em `lib/`, sem mudança visual.
- Node 22 em todos os workflows, actions fixadas por SHA, versão exata do wrangler e permissões mínimas nos workflows.
- Next.js atualizado para 16.4.6.
- `package.json` com licença MIT, autor e versão 1.1.0, alinhado ao `LICENSE`.
- README em PT e EN com métricas medidas em 19/11/2026, próximos passos coerentes com a coleta congelada e seções para pesquisadores e para quem quer estudar o código.
- `docs/resultados.md` passa a cobrir todo o período monitorado, sem os eventos da carga inicial.
- Gravações da coleta separadas em `scripts/coleta/gravacoes-db.ts`, para servirem a qualquer driver do Drizzle.
- CI roda também em push na `main`.

### Removido

- Consulta às páginas de detalhe da Caixa durante a geração do snapshot, o cronômetro de Venda Online e o campo `encerramentoEm`. O projeto volta a fazer uma requisição por UF por dia.

### Segurança

- Next.js 16.4.6 corrige GHSA-mfr8-8qww-v76h e GHSA-vc7v-qv4w-wrv8.
- `npm audit fix` atualizou typescript-eslint e minimatch. Restam 4 alertas moderados na cadeia do drizzle-kit, usado só em desenvolvimento.
- Relato privado de vulnerabilidades ativado no repositório.
- No conjunto de dados publicado, `coletas.erro` traz só a primeira linha de cada mensagem, mascarada, sem pilha, caminhos de máquina ou dados de conexão.

## [1.0.0] - 2026-10-20

### Adicionado

- Coleta diária no GitHub Actions da lista de imóveis à venda da Caixa nas 27 UFs, com uma requisição por UF e detecção de arquivo repetido por SHA-256.
- Parser do CSV da Caixa (Windows-1252, metadados e formatos numéricos brasileiros).
- Diff com o estado anterior, gerando eventos `novo`, `queda_preco`, `mudou_modalidade` e `saiu` e histórico de preços.
- Persistência em lotes de 500 no Postgres (Neon) com Drizzle, com a coleta marcada como `sucesso` só no fim.
- Corte da carga inicial de cada UF, para não contar a base inteira como imóveis novos.
- Snapshot público versionado e site estático em Next.js publicado no Cloudflare Pages, com páginas por estado e cidade.
- Destaques limitados a 2 imóveis por cidade e nomes de município do IBGE.
- Issue automática em caso de falha na coleta.
- ADRs 0001 a 0008, documentação de arquitetura e de dados e análise reproduzível em `docs/resultados.md`.
