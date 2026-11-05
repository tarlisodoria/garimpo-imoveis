# Dados

## Origem e licença

- **Imóveis:** lista pública de imóveis à venda da Caixa Econômica Federal, um CSV por UF em `https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_<UF>.csv`, baixado uma vez por dia por UF. São dados divulgados publicamente pela Caixa; a licença MIT deste repositório cobre o **código**, não esses dados, cuja reutilização deve respeitar as condições da fonte. O projeto não armazena fotos e sempre aponta para a página oficial de cada imóvel.
- **Fotos dos imóveis:** quando disponíveis, são solicitadas diretamente ao domínio oficial da Caixa para exibição no cartão; não são copiadas para o snapshot ou para o repositório. A disponibilidade depende da fonte e o site apresenta uma alternativa quando a imagem falha.
- **Municípios:** nomes oficiais da [API de localidades do IBGE](https://servicodados.ibge.gov.br/api/docs/localidades), usados só para exibir os nomes com acentos (fonte: IBGE).
- **Mapa:** geometria das UFs derivada da malha do IBGE distribuída pelo [br-geojson](https://github.com/henriquemalvar/br-geojson), sob CC0 1.0. O mapa não contém coordenadas de anúncios.
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

A descrição também pode informar contagens de quartos, banheiros, salas e vagas de garagem, além das áreas total, privativa e do terreno. Esses campos são interpretados apenas quando aparecem explicitamente; valores zero e ausentes não são exibidos. A sigla `WC` representa um banheiro no card; se vier acompanhada de quantidade, prevalece o número informado. Nem todos os imóveis têm essas características na lista.

Para os imóveis em destaque na modalidade **Venda Online**, a geração do snapshot consulta no máximo 120 páginas oficiais da Caixa, com duas consultas simultâneas e limite de tempo por página. Quando a página publica uma data exata, ela é guardada em `encerramentoEm` e exibida como prazo previsto. O cronômetro não é estimado para páginas sem essa informação; a Caixa pode prorrogar o prazo quando recebe propostas nos minutos finais. A modalidade Venda Direta Online não recebe contagem regressiva sem data publicada.

A "Data de geração" vai para `imoveis_historico.data` e é exibida nos cartões como "Lista Caixa · dd/mm", para indicar a data-base dos dados apresentados. O texto não é repetido como aviso em todos os cartões; o link para a página oficial continua disponível para conferência. A lista pode ficar alguns dias atrás da página oficial, que é atualizada em tempo real.

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
| `caracteristicas` | quartos, banheiros, salas, vagas e áreas; campos ausentes permanecem sem valor                               |
| `encerramentoEm`  | data/hora ISO do prazo publicado pela Caixa, ou `null` quando não disponível                                 |

Cada imóvel no snapshot traz os campos da tabela `imoveis` usados no site, mais `economiaReais` (avaliação − valor mínimo), `entrouEm`, `selo` (`novo`, `baixou` ou `null`), as `caracteristicas` extraídas da descrição e o prazo oficial, quando disponível. Snapshots antigos sem os campos novos continuam válidos: a leitura (`lib/public-data.ts`) preenche valores padrão e converte a chave antiga `wcInformado` em um banheiro.

## Busca na home e interpretação das contagens

A home monta um recorte de destaques com os maiores descontos globais e até seis imóveis por UF. Os controles de tipo, faixa de preço e características, o histograma e os cartões filtram somente esse recorte. Os IDs da busca principal também são usados para remover da seção de quedas recentes os anúncios já apresentados na home, evitando a repetição do mesmo imóvel em blocos diferentes. Assim, a contagem mostrada ao selecionar um orçamento significa “imóveis em destaque nesta faixa”, não o número total de anúncios disponíveis na Caixa. Já os totais agregados de imóveis e cidades vêm dos campos completos do snapshot.

O tipo informado pela Caixa é agrupado para a legenda do mapa em casas (inclui sobrado), apartamentos, terrenos, galpões, comerciais (inclui prédio, loja e sala) e outros. Os pontos são posicionados de forma ilustrativa dentro da UF e não identificam cidade, bairro ou endereço. A lista pública não fornece coordenadas geográficas por anúncio para posicionamento preciso.

O filtro de orçamento permite valores mínimo e máximo; as faixas sugeridas são atalhos. A régua usa uma escala logarítmica progressiva para manter faixas mais baixas ajustáveis mesmo quando há valores máximos muito maiores. Quartos, banheiros, salas, vagas e metragem usam somente características presentes; área privativa tem prioridade, seguida de área total e de terreno. O preço filtrado é o valor mínimo de venda fornecido pela Caixa, sujeito às regras da modalidade e à confirmação do edital.

Nas páginas de estado e cidade, tipo, faixa de preço e características refinam os imóveis destacados no snapshot. A página estadual também filtra por cidade; a municipal permite filtrar por bairro quando ele aparece nos destaques. Essas listas são limitadas e não representam o catálogo completo informado pela Caixa. O cronômetro aparece apenas quando há data exata publicada na página oficial, é apresentado como previsão e pode ficar sujeito a prorrogação.
