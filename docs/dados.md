# Dados

## Origem e licença

- **Imóveis:** lista pública de imóveis à venda da Caixa Econômica Federal, um CSV por UF em `https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_<UF>.csv`, baixado uma vez por dia por UF. São dados divulgados publicamente pela Caixa; a licença MIT deste repositório cobre o **código**, não esses dados, cuja reutilização deve respeitar as condições da fonte. O projeto não armazena fotos e sempre aponta para a página oficial de cada imóvel.
- **Municípios:** nomes oficiais da [API de localidades do IBGE](https://servicodados.ibge.gov.br/api/docs/localidades), usados só para exibir os nomes com acentos (fonte: IBGE).
- **Dados pessoais:** nenhum. O site não tem cadastro, e a lista da Caixa descreve imóveis, não pessoas.

## Formato do CSV da Caixa

| Linha | Conteúdo                                                                |
| ----- | ----------------------------------------------------------------------- |
| 1     | vazia                                                                   |
| 2     | metadados: `Lista de Imóveis da Caixa;;Data de geração:;16/10/2026;...` |
| 3     | cabeçalho                                                               |
| 4     | vazia                                                                   |
| 5+    | dados, separados por `;`, em Windows-1252                               |

| Coluna                       | Campo no banco                       | Observação                                          |
| ---------------------------- | ------------------------------------ | --------------------------------------------------- |
| N° do imóvel                 | `id_caixa`                           | identificador estável                               |
| UF, Cidade, Bairro, Endereço | `uf`, `cidade`, `bairro`, `endereco` | caixa alta, sem acento na maioria das cidades       |
| Preço                        | `preco`                              | **valor mínimo de venda**; milhar `.` e decimal `,` |
| Valor de avaliação           | `valor_avaliacao`                    | idem                                                |
| Desconto                     | `desconto_pct`                       | decimal com `.`                                     |
| Financiamento                | `aceita_financiamento`               | `Sim`/`Não`                                         |
| Descrição                    | `descricao_curta`, `tipo`            | o tipo é extraído do início da descrição            |
| Modalidade de venda          | `modalidade`                         | ex.: Venda Direta Online, Venda Online, Leilão SFI  |
| Link de acesso               | `link_oficial`                       | página oficial do imóvel                            |

A "Data de geração" vai para `imoveis_historico.data` e é exibida como "Modalidade informada na lista da Caixa de dd/mm". A lista pode ficar alguns dias atrás da página oficial, que é atualizada em tempo real.

## Tabelas (Postgres, Drizzle)

### `imoveis`

Estado atual de cada imóvel. Chave: `id_caixa`.

| Coluna                                              | Tipo          | Descrição                                               |
| --------------------------------------------------- | ------------- | ------------------------------------------------------- |
| `id_caixa`                                          | varchar(32)   | número do imóvel na Caixa                               |
| `uf`, `cidade`, `cidade_slug`, `bairro`, `endereco` | texto         | localização                                             |
| `tipo`, `descricao_curta`                           | texto         | tipo (Casa, Apartamento, Terreno…) e descrição da fonte |
| `preco`, `valor_avaliacao`                          | numeric(14,2) | valor mínimo de venda e avaliação                       |
| `desconto_pct`                                      | numeric(5,2)  | desconto sobre a avaliação                              |
| `modalidade`                                        | varchar(120)  | modalidade de venda                                     |
| `aceita_financiamento`                              | boolean       |                                                         |
| `link_oficial`                                      | texto         | URL da página oficial                                   |
| `primeira_vez_visto`, `ultima_vez_visto`            | timestamptz   | primeira e última coleta em que apareceu                |
| `ativo`                                             | boolean       | `false` quando saiu da lista                            |

### `imoveis_historico`

Uma linha por imóvel e data de lista em que preço, desconto ou modalidade mudaram (ou na primeira aparição). Colunas: `id_caixa`, `data` (data de geração da lista), `preco`, `desconto_pct`, `modalidade`.

### `eventos`

Mudanças detectadas pela comparação diária. Colunas: `id_caixa`, `tipo` (`novo`, `queda_preco`, `mudou_modalidade`, `saiu`), `detalhe` (jsonb; em `queda_preco`, `precoAnterior`, `precoAtual`, `descontoAnterior`, `descontoAtual`), `criado_em`.

### `coletas`

Uma linha por tentativa de coleta de UF. Colunas: `uf`, `iniciado_em`, `status` (`sucesso`, `sem_alteracao`, `falha`), `linhas`, `hash_arquivo` (só em `sucesso`), `erro`. A primeira `sucesso` de cada UF é a **carga inicial**.

## Snapshot público (`data/public-snapshot.json`)

| Campo             | Descrição                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `generatedAt`     | horário da geração (ISO 8601)                                                                                |
| `summary`         | `totalImoveis`, `totalUfs`, `totalCidades`, `novos7d`, `quedas7d` (sem a carga inicial)                      |
| `topDescontos`    | até 30 maiores descontos, no máximo 2 por cidade                                                             |
| `quedasRecentes`  | até 12 maiores quedas percentuais dos últimos 7 dias, com `precoAnterior`, `quedaPct` e `quedaEm`            |
| `ufs[]`           | por UF: `uf`, `listaDe` (data da lista), `totalImoveis`, `topDescontos` (até 50, 2 por cidade) e `cidades[]` |
| `ufs[].cidades[]` | `nome`, `slug`, `totalImoveis` e `topDescontos` (até 80 imóveis)                                             |

Cada imóvel no snapshot traz os campos da tabela `imoveis` usados no site, mais `economiaReais` (avaliação − valor mínimo), `entrouEm` e `selo` (`novo`, `baixou` ou `null`). Snapshots antigos sem os campos novos continuam válidos: a leitura (`lib/public-data.ts`) preenche valores padrão.
