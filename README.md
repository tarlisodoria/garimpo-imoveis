# Garimpo Imóveis

![Busca atualizada com mapa, tipos de imóvel e resultados em destaque](docs/img/home.png)

![Card com características do imóvel](docs/img/card-imovel.png)

![Filtros de cidade, preço e características na página de imóveis de Belém](docs/img/filtros-regionais.png)

![Filtro de orçamento com faixas rápidas, histograma de preços e régua ajustável](docs/img/orcamento.png)

[![CI](https://github.com/tarlisodoria/garimpo-imoveis/actions/workflows/ci.yml/badge.svg)](https://github.com/tarlisodoria/garimpo-imoveis/actions/workflows/ci.yml)
[![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-green.svg)](LICENSE)

> English version: [README.en.md](README.en.md)

Pipeline de dados que coletou todos os dias, de outubro a novembro de 2026, a lista oficial de imóveis à venda da Caixa nas 27 UFs, detectou imóveis novos e quedas de preço e publica um site estático com os maiores descontos por estado e cidade.

> **Dados congelados em 15/11/2026.** A partir de 16/11 a Caixa passou a bloquear downloads feitos por servidores em nuvem, e decidi não contornar o bloqueio. O site continua no ar com a última lista coletada. Detalhes no [pós-mortem](docs/incidentes/2026-11-bloqueio-403.md) e no [ADR 0009](docs/adr/0009-congelamento-da-coleta.md).

**Site:** [garimpo-imoveis.pages.dev](https://garimpo-imoveis.pages.dev) · projeto de portfólio, sem fins comerciais e sem afiliação com a Caixa.

## O problema

A Caixa publica a lista de imóveis à venda como um CSV por estado, sem histórico, sem comparação entre dias e sem busca por desconto. Saber o que entrou na lista ou baixou de preço exige baixar e comparar arquivos manualmente. O projeto automatiza essa comparação e transforma o resultado em páginas navegáveis.

## O que construí

Redesenhei a vitrine para tornar a busca por oportunidades mais visual, direta e fácil de usar:

- **Busca lado a lado:** em telas grandes, mapa e filtros ficam numa barra lateral fixa enquanto os resultados rolam; em celulares, um painel abre mapa e filtros sem empurrar a lista para baixo.
- **Mapa interativo do Brasil:** seleção de região e estado, com acesso às cidades atendidas em cada UF e resultados atualizados pelo local selecionado.
- **Tipos de imóvel por cor:** filtros para casas, apartamentos, terrenos, galpões, imóveis comerciais e outros. Os marcadores são agrupados por estado porque a lista pública não fornece coordenadas exatas dos endereços.
- **Filtro de orçamento:** atalhos de faixa de preço, histograma dos anúncios exibidos, régua de mínimo e máximo em escala progressiva e campos numéricos editáveis.
- **Filtros por características:** quartos, banheiros, salas, vagas e metragem na busca geral e nas páginas por estado/cidade; a lista local também permite refinar por cidade ou bairro quando esses dados estão disponíveis.
- **Tema claro e escuro:** alternância no cabeçalho, com preferência salva no navegador.
- **Cards mais legíveis:** preço de venda, avaliação e economia em destaque; modalidade, financiamento, endereço e datas em linhas curtas, com ícones para apoiar a leitura. Quando constam na descrição da Caixa, quartos, banheiros, salas, vagas e áreas também aparecem no card, sem completar dados ausentes por estimativa.
- **Sem cards repetidos na home:** anúncios já exibidos nos destaques não voltam a aparecer no bloco de quedas recentes.
- **Fotos oficiais:** quando a Caixa disponibiliza uma imagem, ela é carregada diretamente da fonte. O projeto não copia nem hospeda as fotografias.
- **Páginas de estado e cidade:** navegação contextual para continuar a busca e conferir as oportunidades publicadas.
- **SEO técnico:** títulos, descrições e prévias sociais por estado/cidade, sitemap com datas reais do snapshot e dados estruturados de site e navegação.

As contagens e os cartões da busca usam os imóveis em destaque incluídos no snapshot público, e não todo o catálogo ativo da Caixa. Preço, disponibilidade, edital, ocupação e regras podem mudar; a confirmação deve ser feita na página oficial do imóvel.

## Validação antes da publicação

Antes de subir esta versão, fiz os testes na minha máquina local:

```bash
npm run lint
npm run format:check
npm test
npm run build
```

Os 74 testes automatizados passaram e o build estático do Next.js gerou 1.293 páginas HTML. Também conferi a versão local no navegador: filtros de características e localização, leitura dos endereços e ausência de anúncios repetidos entre os blocos da home. As capturas acima foram feitas no site local validado, antes do commit e da publicação no Cloudflare Pages.

A aprovação dos testes não substitui a conferência das condições de cada imóvel na página oficial da Caixa.

## Como funciona

```mermaid
flowchart LR
    caixa["CSV da Caixa<br/>27 UFs"] -->|"GitHub Actions<br/>até 15/11/2026"| coleta["Coleta<br/>hash + parser"]
    coleta --> diff["Diff diário<br/>novo · queda · saiu"]
    diff -->|"lotes de 500"| neon[("Neon<br/>Postgres")]
    neon --> snapshot["Snapshot JSON<br/>versionado"]
    snapshot --> build["Next.js<br/>export estático"]
    build -->|"wrangler"| pages["Cloudflare Pages<br/>~1.290 páginas"]
```

1. **Coleta:** até 15/11/2026, um workflow agendado baixava o CSV de cada UF (uma requisição por UF por dia). Arquivos iguais ao último processado (mesmo SHA-256) são ignorados. O agendamento está desativado desde 18/11/2026; o mesmo workflow continua disponível para disparo manual.
2. **Comparação:** cada lista é comparada com o estado anterior; mudanças viram eventos e histórico de preço no Postgres.
3. **Snapshot:** um JSON com números, maiores descontos e quedas da semana é gerado e commitado quando muda.
4. **Publicação:** o Next.js gera páginas estáticas a partir do snapshot e o Cloudflare Pages as publica. O site não acessa o banco.

Detalhes em [docs/arquitetura.md](docs/arquitetura.md) e [docs/dados.md](docs/dados.md).

## Stack e motivos

| Camada         | Tecnologia                              | Por quê                                                                                  |
| -------------- | --------------------------------------- | ---------------------------------------------------------------------------------------- |
| Orquestração   | GitHub Actions                          | agendamento, logs e secrets gratuitos, no mesmo lugar do código                          |
| Banco          | Neon (Postgres serverless, São Paulo)   | não pausa o projeto por inatividade (diferente do Supabase); só suspende o processamento |
| Acesso a dados | Drizzle ORM + drizzle-kit               | tipagem de ponta a ponta e migrations SQL versionadas                                    |
| Linguagem      | TypeScript (Node 22, `tsx`)             | o mesmo código roda localmente e no CI                                                   |
| Site           | Next.js (`output: "export"`) + Tailwind | páginas estáticas por UF e cidade, boas para SEO                                         |
| Hospedagem     | Cloudflare Pages (Direct Upload)        | CDN gratuita, sem servidor e sem credenciais na borda                                    |
| Qualidade      | `node:test`, ESLint, Prettier           | testes sem dependências extras; formatação checada no CI                                 |

Custo de operação: **zero** (todos os serviços em planos gratuitos).

## Decisões

As decisões técnicas estão registradas como ADRs em [docs/adr/](docs/adr/). As principais:

- [0001](docs/adr/0001-site-estatico-a-partir-de-snapshot.md): site estático a partir de um snapshot versionado, sem banco em tempo de execução.
- [0003](docs/adr/0003-corte-da-carga-inicial.md): a primeira coleta de cada UF não conta como "novidade".
- [0004](docs/adr/0004-persistencia-em-lotes.md): gravação em lotes, com a coleta marcada como concluída só no fim.
- [0008](docs/adr/0008-modo-vitrine-sem-backend.md): sem contas, cobrança nem código na borda.
- [0009](docs/adr/0009-congelamento-da-coleta.md): coleta congelada depois do bloqueio da fonte, sem contornar o bloqueio.

## Problemas reais resolvidos

1. **Uma UF inteira ficou fora do banco.** O RJ (8.053 linhas) estourou a pilha do Drizzle num insert único, e o coletor já tinha marcado a coleta como `sucesso`. No dia seguinte, o mesmo arquivo foi tratado como "sem alteração" e o RJ ficou com zero imóveis. Correção: lotes de 500, `sucesso` gravado só depois de persistir, toda falha registrada e o registro errado corrigido sem apagar dados. O RJ foi reimportado com 8.053 imóveis ([ADR 0004](docs/adr/0004-persistencia-em-lotes.md)).
2. **Mais de 20 mil "imóveis novos" falsos.** A primeira coleta de cada UF gera um evento `novo` para a base inteira: 13.711 na coleta nacional e 8.053 no RJ. Um corte por UF, sem mudar o schema, separa a carga inicial das novidades reais ([ADR 0003](docs/adr/0003-corte-da-carga-inicial.md)).
3. **Erro 502 da fonte.** A Caixa às vezes responde HTTP 502. A falha fica registrada, não bloqueia a próxima tentativa e abre uma issue automática; o arquivo é reprocessado no dia seguinte.
4. **Descontos de 90% suspeitos.** Na data da análise (20/10/2026), 34 imóveis tinham desconto de exatamente 90,00% ou 90,01%. A investigação mostrou que não é arredondamento: o valor mínimo de venda é 10% da avaliação, em imóveis que passaram por leilões sem comprador. Os destaques passaram a limitar 2 imóveis por cidade ([ADR 0007](docs/adr/0007-destaques-por-cidade-e-nomes-do-ibge.md)).
5. **Lista atrasada em relação à página oficial.** Para alguns imóveis, a modalidade do CSV diferia da página oficial. O CSV servido em 20/10 ainda era o gerado em 16/10. Cada card agora mostra a data da lista de onde vieram os dados.
6. **Datas um dia antes.** `2026-10-16` formatado com fuso de Brasília virava 15/10. Datas sem horário passaram a ser formatadas sem fuso, com teste.
7. **Formatação quebrando no Windows.** 75 de 76 falhas do `format:check` eram fim de linha CRLF. Um `.gitattributes` com `eol=lf` resolveu, e o check passou a rodar no CI.
8. **Bloqueio da fonte a servidores em nuvem.** Desde 16/11/2026, a Caixa responde HTTP 403 para todas as UFs quando o download parte do GitHub Actions; de um IP residencial, o mesmo CSV baixa normalmente. Decisão: não contornar o bloqueio (sem proxy, sem troca de IP, sem disfarce de navegador). O agendamento foi desativado em 18/11/2026, o disparo manual ficou para teste e o site exibe os dados congelados em 15/11/2026 ([pós-mortem](docs/incidentes/2026-11-bloqueio-403.md)).

## Resultados

Análise reproduzível em [docs/resultados.md](docs/resultados.md), gerada por `npm run analise` ([scripts/analise/](scripts/analise/)). Com os dados de 20/10/2026:

- **21.992 imóveis ativos** em 27 UFs e 1.180 cidades, com desconto mediano de **42,1%** sobre a avaliação. O RJ concentra 37% da lista (8.200 imóveis).
- Em SC e no DF, o desconto mediano é 0%: a maioria dos imóveis está à venda pelo valor de avaliação.
- **Reprecificação de 20/10/2026:** 3.931 quedas de preço num único dia, 2.166 no RJ e 1.113 em GO, com queda mediana de cerca de 2,8% e R$ 9,7 milhões de redução somada.

## Métricas

Medido em 19/11/2026, sobre o código atual e o snapshot de 15/11/2026.

| Métrica                               | Valor                                                |
| ------------------------------------- | ---------------------------------------------------- |
| Imóveis no último snapshot            | 23.769, em 27 UFs e 1.260 cidades                    |
| Período monitorado                    | outubro a 15/11/2026                                 |
| Coleta diária completa (quando ativa) | 6 a 8 min por execução                               |
| Build e deploy                        | ~2 min                                               |
| Páginas estáticas                     | 1.293 HTML, 6.489 arquivos (limite do Pages: 20.000) |
| Testes                                | 74, em 16 arquivos                                   |
| Código                                | 7.540 linhas de TypeScript, 6.007 sem contar testes  |
| Custo mensal                          | R$ 0                                                 |

## Como rodar

Requisitos: Node.js 22+ e npm 10+.

```bash
npm install
npm run dev        # site em http://localhost:3000, usando o snapshot versionado
npm test           # testes
npm run build      # site estático em out/
```

O site funciona sem banco, a partir de `data/public-snapshot.json`. Para coletar e gerar o snapshot, crie um banco Postgres (por exemplo, no Neon) e um `.env` com `DATABASE_URL` (veja `.env.example`):

```bash
npm run db:migrate                     # cria as tabelas
npx tsx scripts/coleta/run-coleta.ts PA  # coleta uma UF
npm run public:snapshot                # gera o snapshot
npm run analise                        # regenera docs/resultados.md
```

## Limitações

- **Dados congelados em 15/11/2026.** Desde 16/11/2026, a Caixa bloqueia a coleta automatizada a partir de servidores em nuvem (HTTP 403). Por decisão do projeto, o bloqueio não será contornado, e a coleta diária está desativada.
- Os dados dependem da lista da Caixa, que pode atrasar dias em relação à página oficial. **Confirme sempre na fonte.**
- O valor exibido é o valor mínimo de venda; na Venda Online há disputa e o valor final pode ser maior.
- O histórico cobre só o período monitorado, de outubro a 15/11/2026.
- 12 de 1.187 cidades não têm correspondência no IBGE (regiões administrativas do DF, distritos e grafias diferentes) e aparecem sem acento.

## Próximos passos

Com a coleta congelada ([pós-mortem](docs/incidentes/2026-11-bloqueio-403.md)), o foco passa a ser o que já foi coletado:

- Testes de integração com um Postgres no CI, cobrindo coleta, diff e persistência de ponta a ponta.
- Publicação do conjunto de dados do período monitorado (imóveis, histórico de preços e eventos), com dicionário de dados e a indicação da fonte.

## Licença e dados

O código está sob a [licença MIT](LICENSE). Os dados de imóveis são públicos, divulgados pela Caixa Econômica Federal, e os nomes de município vêm do IBGE; eles não são relicenciados pela MIT (veja [docs/dados.md](docs/dados.md)). Para citar o projeto, use [CITATION.cff](CITATION.cff).

O mapa interativo usa a malha estadual do IBGE distribuída pelo [br-geojson](https://github.com/henriquemalvar/br-geojson), sob CC0 1.0. Os pontos coloridos agrupam os imóveis em destaque por tipo e estado; representam presença aproximada, não o endereço exato. A régua de orçamento filtra a vitrine por faixa de preço, com escala progressiva e opções rápidas. O seletor no cabeçalho alterna entre os temas claro e escuro e guarda a preferência neste navegador. Quando disponíveis, as fotos dos cartões são carregadas diretamente do domínio oficial da Caixa; os arquivos não são copiados para este projeto.

## Autor

Tarliso Dória · [github.com/tarlisodoria](https://github.com/tarlisodoria) · [LinkedIn](https://www.linkedin.com/in/tarlisodoria)
