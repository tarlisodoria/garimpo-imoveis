# Metodologia

Este documento descreve como os dados do Garimpo Imóveis foram coletados, comparados e publicados, com as limitações que devem ser consideradas por quem os usar em análises. Os números citados como exemplo vêm de [resultados.md](resultados.md), gerado diretamente do banco; o formato de cada campo está em [dados.md](dados.md).

## 1. Fonte

A fonte é a lista pública de imóveis à venda da Caixa Econômica Federal, publicada como um arquivo CSV por unidade federativa no endereço `https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_<UF>.csv`. Cada arquivo traz, numa linha de metadados, a sua "Data de geração", e uma linha por imóvel com identificador, localização, valor mínimo de venda, valor de avaliação, desconto, aceitação de financiamento, descrição e modalidade de venda.

A lista não tem histórico: cada arquivo representa só o estado do dia em que foi gerado. Toda informação temporal do conjunto de dados (entradas, saídas, mudanças de preço) foi construída pelo projeto, comparando arquivos sucessivos.

## 2. Período e frequência

O monitoramento cobre de 16/10/2026 a 15/11/2026. A última lista com mudanças é de 14/11/2026; na verificação de 15/11 os arquivos eram iguais aos anteriores. Esses limites e o número de dias com coleta são calculados da tabela `coletas` e publicados em [resultados.md](resultados.md).

A coleta foi agendada uma vez por dia no GitHub Actions, para as 03h15 de Brasília. Como o GitHub atrasa execuções agendadas em horários de pico, as execuções reais ocorreram entre cerca de 03h30 e 13h20 de Brasília. A partir de 16/11/2026 a Caixa passou a recusar (HTTP 403) os downloads feitos a partir de servidores em nuvem, e a coleta foi encerrada ([ADR 0009](adr/0009-congelamento-da-coleta.md)).

## 3. Procedimento

Para cada uma das 27 UFs, em sequência:

1. **Download.** Uma requisição HTTP por UF, com um user agent que identifica o projeto e o repositório.
2. **Identificação do arquivo.** O conteúdo recebido é identificado por SHA-256. Se o hash for igual ao da última coleta bem-sucedida da UF, a coleta é registrada como `sem_alteracao` e nada mais é processado.
3. **Leitura.** O arquivo está em Windows-1252, sem BOM, separado por `;`. Valores monetários usam `.` para milhar e `,` para decimais; o desconto usa `.` decimal. Todos os campos de texto passam por remoção de espaços nas pontas. O tipo do imóvel é o trecho inicial da descrição.
4. **Comparação** com o estado anterior da UF no banco (seção 4).
5. **Persistência** em lotes de 500 linhas. A coleta só é registrada como `sucesso` depois que todos os lotes foram gravados; qualquer erro fica registrado como `falha` e o mesmo arquivo é processado de novo na execução seguinte ([ADR 0004](adr/0004-persistencia-em-lotes.md)).

## 4. Regras de comparação

Seja _A_ o conjunto de imóveis da UF no banco antes da coleta e _N_ o conjunto do arquivo novo, ambos indexados pelo número do imóvel na Caixa (`id_caixa`).

| Situação                                          | Evento gerado      | Linha de histórico                                |
| ------------------------------------------------- | ------------------ | ------------------------------------------------- |
| Imóvel em _N_ e ausente de _A_                    | `novo`             | sim                                               |
| Valor mínimo de venda menor que o anterior        | `queda_preco`      | sim                                               |
| Valor mínimo de venda maior que o anterior        | nenhum             | sim                                               |
| Desconto diferente, com o mesmo valor             | nenhum             | sim                                               |
| Modalidade de venda diferente                     | `mudou_modalidade` | sim                                               |
| Imóvel ativo em _A_ e ausente de _N_              | `saiu`             | não                                               |
| Imóvel inativo em _A_ que volta a aparecer em _N_ | nenhum             | só se o valor, o desconto ou a modalidade mudaram |
| Nenhuma das anteriores                            | nenhum             | não                                               |

A linha de histórico é datada com a "Data de geração" do arquivo, não com a data da coleta, e há no máximo uma linha por imóvel e por data. O instante dos eventos (`criado_em`) é o momento do processamento, não o momento em que a Caixa alterou o dado. Um imóvel que sai da lista é marcado como inativo, nunca apagado.

## 5. Tratamento da carga inicial

A primeira coleta bem-sucedida de cada UF encontra o banco vazio para aquela UF e, pela regra acima, gera um evento `novo` para cada imóvel da lista. Esses eventos descrevem a base existente, não imóveis que acabaram de entrar. Para separá-los, define-se, para cada UF, um instante de corte: o início da primeira coleta registrada depois da carga inicial. Eventos anteriores ao corte pertencem à carga e são excluídos de todas as contagens de novidades, quedas e saídas, no site e em [resultados.md](resultados.md). Uma UF sem coleta posterior à carga não contribui com eventos ([ADR 0003](adr/0003-corte-da-carga-inicial.md)).

Os eventos da carga inicial permanecem no conjunto de dados publicado, para que quem o usar possa aplicar outro critério. O corte pode ser reproduzido a partir da tabela `coletas` com a função `cortesCargaInicial` de `scripts/coleta/carga-inicial.ts`.

## 6. Limitações e vieses

1. **Lista atrasada em relação à página oficial.** A lista em CSV não é atualizada em tempo real. Em 20/10/2026, o arquivo servido ainda era o gerado em 16/10, e a modalidade de alguns imóveis divergia da página oficial. Os dados descrevem a lista publicada, que pode estar dias atrás da situação real de cada imóvel.
2. **Valor mínimo, não valor de venda.** O campo de preço é o valor mínimo de venda. Na modalidade Venda Online há disputa, e o valor final pode ser maior. O desconto calculado sobre esse valor é, portanto, um limite superior do desconto efetivamente praticado, e as quedas de preço são quedas do valor mínimo anunciado.
3. **Cidades sem correspondência no IBGE.** Os nomes de cidade vêm da Caixa, em caixa alta e quase sempre sem acento. Para exibição, foram associados aos nomes oficiais do IBGE; na medição de 20/10/2026, 12 de 1.187 cidades não tinham correspondência (regiões administrativas do DF, distritos e grafias diferentes). O conjunto de dados publica o nome como veio da Caixa; quem cruzar com dados do IBGE deve tratar essas diferenças.
4. **Instante do evento.** Como os eventos são datados pelo processamento, mudanças feitas pela Caixa num mesmo dia aparecem juntas, e um dia sem coleta bem-sucedida desloca as mudanças para o dia seguinte. Falhas pontuais da fonte (por exemplo, HTTP 502 ou 504 para uma única UF) produziram esse efeito em poucos dias.
5. **Altas de preço e reentradas não geram evento.** Elas só aparecem no histórico de preços e no campo `ativo`. Análises de altas de preço ou de imóveis que voltam à lista devem partir de `imoveis_historico` e de `imoveis`, não de `eventos`. As reentradas são frequentes: no período, 12.063 imóveis saíram da lista ao menos uma vez, 5.213 deles voltaram e estavam ativos no fim, e 1.836 saíram mais de uma vez (até 4 vezes).
6. **Saída da lista não é venda.** O evento `saiu` só registra que o imóvel deixou de constar no arquivo. Pelos números acima, uma parte relevante das saídas é temporária. Estimativas de imóveis vendidos ou de tempo até a venda precisam considerar reentradas e não devem tratar `saiu` como desfecho.
7. **Mudança de modalidade é, em geral, o ciclo de venda.** Das 39.600 mudanças de modalidade registradas, em 18.734 imóveis, 38.198 (96,5%) são idas e vindas entre Venda Online e Venda Direta Online. O evento `mudou_modalidade` reflete sobretudo esse ciclo, não uma mudança de condição do imóvel.
8. **Seleção da fonte.** Os dados cobrem só imóveis retomados e vendidos pela Caixa. Eles não representam o mercado imobiliário em geral, e a distribuição entre UFs reflete a carteira do banco, não a oferta regional (na análise de 20/10/2026, o RJ concentrava 37% da lista).
9. **Descontos nulos.** Em várias UFs, a maioria dos imóveis é oferecida pelo valor de avaliação, com desconto zero. Na última verificação eram 9 UFs (DF, ES, MG, MS, PR, RS, SC, SP e TO); em 20/10/2026, só SC e DF. Medianas por UF mudam com a composição da lista e devem ser lidas junto com a distribuição e o percentil 90.
10. **Características extraídas por texto.** Quartos, banheiros, áreas e outras características vêm de padrões na descrição livre e só existem quando aparecem explicitamente. Ausência não significa zero.

## 7. Considerações éticas

- **Coleta educada.** O projeto fez uma requisição por UF por dia, com user agent identificado, sem autenticação, sem simular navegador e sem contornar nenhuma barreira de acesso. Arquivos iguais ao anterior não foram reprocessados.
- **Um desvio, reconhecido.** Entre 05/11 e 15/11/2026, a geração do site também consultou até 120 páginas de detalhe por dia, o que elevou o volume diário de 27 para cerca de 147 requisições. Essa mudança provavelmente contribuiu para o bloqueio de 16/11 e foi revertida. A análise está no [pós-mortem](incidentes/2026-11-bloqueio-403.md).
- **Bloqueio respeitado.** Quando a fonte passou a recusar a coleta a partir de servidores em nuvem, o projeto decidiu não contornar o bloqueio (sem proxy, troca de IP ou coleta automatizada a partir de rede residencial) e encerrou a coleta.
- **Dados pessoais.** A lista descreve imóveis, não pessoas, e o projeto não coleta dados de visitantes. Endereços são de imóveis à venda, publicados pela própria Caixa. Mensagens de erro técnico foram mascaradas antes da publicação para não expor credenciais.
- **Uso dos resultados.** Os dados não substituem a consulta à página oficial de cada imóvel, onde estão o edital, a situação de ocupação e as regras da venda.

## 8. Como reproduzir

### A partir do conjunto de dados publicado

1. Baixe os arquivos da [release v1.1.0](https://github.com/tarlisodoria/garimpo-imoveis/releases/tag/v1.1.0) e confira a integridade com `sha256sum -c SHA256SUMS.txt`.
2. Os CSVs estão em UTF-8 sem BOM, separados por vírgula, com cabeçalho e fim de linha LF. Instantes estão em ISO 8601 UTC, datas em `AAAA-MM-DD` e valores decimais com ponto. O dicionário está em [dados.md](dados.md).
3. Para carregar num Postgres com o schema do projeto, aplique as migrations (`npm run db:migrate`) e importe na ordem `imoveis`, `imoveis_historico`, `eventos` e `coletas`, por causa das chaves estrangeiras. Exemplo no `psql`:

   ```sql
   \copy imoveis from 'imoveis.csv' with (format csv, header true)
   ```

### A partir do código

```bash
npm ci
cp .env.example .env              # preencha DATABASE_URL
npm run db:migrate
npm run analise                   # regenera resultados.md e os gráficos
npm run dataset:exportar          # regenera os CSVs e os checksums em dataset/
```

O teste de integração (`npm run test:integracao`, com um Postgres descartável em `TEST_DATABASE_URL`) aplica as migrations e executa a comparação e a persistência sobre uma lista anonimizada, conferindo as contagens de cada etapa. Uma nova coleta a partir da fonte não é possível enquanto o bloqueio estiver em vigor, e o projeto não recomenda contorná-lo.

## Como citar

Use os metadados de [CITATION.cff](../CITATION.cff). No GitHub, o botão "Cite this repository" gera a referência em APA e BibTeX.
