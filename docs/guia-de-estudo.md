# Guia de estudo

Uma trilha para aprender com o código do Garimpo Imóveis, seguindo o caminho que os dados fazem: do CSV da Caixa até a página estática. Cada etapa traz o que ler, por que o código é assim e um exercício curto. Não é preciso banco para a maior parte da trilha; os exercícios rodam com `npm test`.

## Antes de começar

```bash
npm ci
npm test            # testes de unidade, sem banco
npm run dev         # site em http://localhost:3000, a partir do snapshot versionado
```

Leia primeiro a [arquitetura](arquitetura.md) para ter o mapa geral, e deixe [dados.md](dados.md) aberto como referência dos campos. A [metodologia](metodologia.md) explica as mesmas regras do ponto de vista de quem analisa os dados.

## 1. O CSV da Caixa

**O que ler:** a seção "Formato do CSV da Caixa" em [dados.md](dados.md) e a fixture [lista-imoveis-pa-anon.ts](../scripts/coleta/__fixtures__/lista-imoveis-pa-anon.ts).

A fonte é um arquivo por UF, em Windows-1252, separado por `;`, com uma linha de metadados antes do cabeçalho. Não há histórico: cada arquivo é uma foto do dia. Tudo o que o projeto sabe sobre "o que mudou" vem de comparar fotos sucessivas.

A fixture reproduz esse formato com dados inventados (números de imóvel começando em 9000000000000) e é gravada em `latin1`, para que os testes leiam bytes como os da fonte real, não texto já convertido.

**Exercício.** Decodifique a fixture como UTF-8 em vez de Windows-1252 (`new TextDecoder("utf-8")`) e veja o que acontece com "Imóveis" e "Não". Por que isso quebraria a leitura da coluna de financiamento?

## 2. Parser

**O que ler:** [scripts/coleta/caixa-csv.ts](../scripts/coleta/caixa-csv.ts), principalmente `parseCaixaCsvFile` (linha 43), `validateHeader` (linha 112) e `normalizePtBrDecimal` (linha 141).

```ts
function normalizePtBrDecimal(value: string) {
  return value.replace(/\./g, "").replace(",", ".");
}
```

Decisões que valem notar:

- **Valores monetários continuam texto** (`"111638.68"`), não `number`. O banco guarda `numeric(14,2)`, e texto evita erros de ponto flutuante no caminho.
- **O cabeçalho é conferido coluna por coluna.** Se a Caixa mudar o arquivo, a coleta falha cedo, com uma mensagem clara, em vez de gravar dados em colunas trocadas.
- **Valores inesperados viram erro.** `parseFinancing` aceita só `Sim` e `Não`; qualquer outra coisa interrompe a coleta.

**Exercício.** Em [caixa-csv.test.ts](../scripts/coleta/caixa-csv.test.ts), escreva um teste em que a coluna "Desconto" aparece com outro nome e confirme que `parseCaixaCsvFile` lança um erro citando a coluna 8.

## 3. Comparação (diff)

**O que ler:** [scripts/coleta/diff-imoveis.ts](../scripts/coleta/diff-imoveis.ts), função `diffImoveis` (linha 39), e o quadro de regras na seção 4 da [metodologia](metodologia.md).

O diff é uma função pura: recebe as linhas do arquivo novo e o estado anterior da UF, e devolve o que gravar (imóveis, histórico, eventos e quem saiu). Não toca no banco, por isso é testado sem infraestrutura.

```ts
if (isNew || priceChanged || discountChanged || modalidadeChanged) {
  historyToInsert.push({ idCaixa: row.idCaixa, data: dataReferencia, ... });
}
```

Repare que há duas saídas diferentes: **eventos** (o que é notícia: novo, queda, mudança de modalidade, saída) e **histórico** (toda mudança de preço, desconto ou modalidade). Uma alta de preço entra no histórico, mas não vira evento.

**Exercício.** Em [diff-imoveis.test.ts](../scripts/coleta/diff-imoveis.test.ts), escreva um teste para uma alta de preço e confirme: uma linha de histórico, nenhum evento. Depois, esboce o que seria preciso para criar um evento `alta_preco` (dica: o tipo é um enum no Postgres, em [db/schema.ts](../db/schema.ts), e exige migration).

## 4. Persistência

**O que ler:** [scripts/coleta/persistencia.ts](../scripts/coleta/persistencia.ts) (`persistirColeta`, linha 40), [scripts/coleta/gravacoes-db.ts](../scripts/coleta/gravacoes-db.ts) e o [ADR 0004](adr/0004-persistencia-em-lotes.md).

Duas lições vieram de um incidente real: o RJ, com 8.053 linhas, estourou a pilha do Drizzle num único insert, e a coleta já tinha sido marcada como bem-sucedida. No dia seguinte, o mesmo arquivo foi ignorado como "sem alteração", e a UF ficou vazia.

```ts
for (const lote of emLotes(dados.imoveis, tamanho)) {
  await gravacoes.upsertImoveis(lote);
}
// ... histórico e eventos, também em lotes
await gravacoes.registrarSucesso();
```

- **Lotes de 500** para qualquer gravação em massa.
- **`sucesso` por último.** Se um lote falhar, a coleta não fica marcada, e o arquivo é processado de novo na próxima execução.
- **Gravação separada da lógica.** `persistirColeta` recebe as funções de gravação como parâmetro. Nos testes de unidade, elas são falsas; no [teste de integração](../scripts/coleta/coleta.integracao.ts), gravam num Postgres real.

**Exercício.** Em [persistencia.test.ts](../scripts/coleta/persistencia.test.ts), simule uma falha no segundo lote de eventos e confirme que `registrarSucesso` nunca é chamado. Depois rode o teste de integração com um Postgres descartável:

```bash
docker run -d --name pg-estudo -e POSTGRES_PASSWORD=teste -e POSTGRES_USER=teste -e POSTGRES_DB=garimpo_teste -p 127.0.0.1:55432:5432 postgres:16-alpine
TEST_DATABASE_URL=postgres://teste:teste@127.0.0.1:55432/garimpo_teste npm run test:integracao
```

## 5. Carga inicial

**O que ler:** [scripts/coleta/carga-inicial.ts](../scripts/coleta/carga-inicial.ts) (`cortesCargaInicial`, linha 20) e o [ADR 0003](adr/0003-corte-da-carga-inicial.md).

Na primeira coleta de uma UF, todo imóvel é "novo" para o banco. Isso gerou mais de 20 mil eventos `novo` falsos. A solução não mudou o schema: para cada UF, o corte é o início da primeira coleta depois da carga, e eventos anteriores a ele não contam.

```ts
const seguinte = ordenadas
  .slice(indiceCarga + 1)
  .find((c) => c.iniciadoEm.getTime() > inicioCarga);
cortes.set(uf, seguinte ? seguinte.iniciadoEm : null);
```

Por isso `registrarSucesso` grava `iniciado_em` com o horário de **início** da coleta, não o de término: o corte precisa ficar antes dos eventos da coleta seguinte.

**Exercício.** Monte à mão uma lista de coletas para uma UF (`falha`, `sucesso`, `sem_alteracao`, `sucesso`) e descubra qual é o corte. Confirme escrevendo o caso em [carga-inicial.test.ts](../scripts/coleta/carga-inicial.test.ts). O que acontece com uma UF que teve só a carga inicial?

## 6. Snapshot

**O que ler:** [scripts/public/generate-public-snapshot.ts](../scripts/public/generate-public-snapshot.ts), [lib/snapshot-calculos.ts](../lib/snapshot-calculos.ts) (`resumirEventos` na linha 58, `limitarPorCidade` na linha 94) e o [ADR 0001](adr/0001-site-estatico-a-partir-de-snapshot.md).

O site nunca consulta o banco. Um script exporta um JSON (`data/public-snapshot.json`) com os números e os destaques, e esse arquivo é versionado no Git. Cada publicação fica rastreável no histórico, e o site não precisa de servidor nem de credenciais.

- **Destaques limitados por cidade** (`limitarPorCidade`): no máximo 2 imóveis por cidade, para os 30 maiores descontos não serem todos do mesmo bairro do RJ.
- **Leitura tolerante** ([lib/public-data.ts](../lib/public-data.ts), `normalizarImovel`): snapshots antigos, sem campos novos, continuam válidos.

**Exercício.** Leia `limitarPorCidade` e escreva um teste com 5 imóveis da mesma cidade e 1 de outra. Quantos sobram com `max = 2`? Por que a função preserva a ordem recebida?

## 7. Site

**O que ler:** [app/[uf]/[cidade]/page.tsx](../app/%5Buf%5D/%5Bcidade%5D/page.tsx) (`generateStaticParams`), [components/home/ExplorarImoveis.tsx](../components/home/ExplorarImoveis.tsx), [lib/classificacao-imoveis.ts](../lib/classificacao-imoveis.ts) e [lib/mapa-brasil.ts](../lib/mapa-brasil.ts).

O Next.js gera uma página HTML por UF e por cidade no build (`output: "export"`). O componente da busca guarda só estado e interface; as regras (categoria de um imóvel, região de uma UF, projeção do mapa) são funções puras em `lib/`, testadas sem navegador.

```ts
if (/casa|sobrado/.test(nome)) return "casa";
if (/apartamento/.test(nome)) return "apartamento";
// ...
if (/comercial|predio|loja|sala/.test(nome)) return "comercial";
```

A ordem das regras em `categoriaDoTipo` é uma decisão: "Casa comercial" vira casa, "Sala comercial" vira comercial.

**Exercício.** Em [lib/classificacao-imoveis.test.ts](../lib/classificacao-imoveis.test.ts), descubra a categoria de "Loja e sobrado" e explique pelo código. Depois, troque a ordem das duas primeiras regras e veja quais testes quebram.

## Para ir além

- Leia o [pós-mortem do bloqueio](incidentes/2026-11-bloqueio-403.md): uma mudança de interface (um cronômetro) multiplicou o volume de acesso à fonte. Que revisão teria pego isso antes?
- Baixe o [conjunto de dados](https://github.com/tarlisodoria/garimpo-imoveis/releases/tag/v1.1.0) e reproduza um número de [resultados.md](resultados.md) com SQL próprio, aplicando o corte da carga inicial.
- Compare os [ADRs](adr/) com o código: alguma decisão registrada já não corresponde ao que o código faz?
