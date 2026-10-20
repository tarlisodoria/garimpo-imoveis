# Resultados

> Gerado por `npm run analise` (`scripts/analise/gerar-resultados.ts`) em 2026-10-20, a partir dos dados públicos da lista de imóveis à venda da Caixa coletados pelo pipeline. Os números mudam a cada coleta.

## Distribuição dos descontos por estado

São **21.992 imóveis ativos**, com desconto mediano de **42,1%** sobre o valor de avaliação.

| UF  | Imóveis | Desconto mediano | Percentil 90 | Com desconto ≥ 50% | Valor mínimo = 10% da avaliação |
| --- | ------: | ---------------: | -----------: | -----------------: | ------------------------------: |
| RJ  |   8.200 |            44,8% |        60,9% |      2.242 (27,3%) |                              33 |
| GO  |   2.924 |            45,2% |        56,3% |        806 (27,6%) |                               0 |
| SP  |   2.700 |            38,8% |        42,1% |          36 (1,3%) |                               0 |
| PE  |   1.117 |            42,9% |        58,2% |        253 (22,6%) |                               0 |
| RS  |     809 |            36,3% |        48,1% |          56 (6,9%) |                               0 |
| PI  |     743 |            42,9% |        55,8% |        151 (20,3%) |                               0 |
| MG  |     728 |            38,8% |        44,7% |          30 (4,1%) |                               0 |
| BA  |     710 |            41,5% |        53,0% |        141 (19,9%) |                               0 |
| PB  |     682 |            42,7% |        53,0% |        126 (18,5%) |                               0 |
| RN  |     650 |            42,9% |        65,9% |        208 (32,0%) |                               0 |
| CE  |     581 |            43,7% |        65,3% |        198 (34,1%) |                               0 |
| PR  |     410 |            39,6% |        42,1% |          11 (2,7%) |                               0 |
| SE  |     401 |            43,5% |        53,7% |         94 (23,4%) |                               0 |
| PA  |     221 |            39,6% |        50,8% |         27 (12,2%) |                               0 |
| MA  |     207 |            39,6% |        46,4% |          11 (5,3%) |                               0 |
| AM  |     206 |            40,8% |        50,9% |         23 (11,2%) |                               0 |
| MS  |     163 |            37,9% |        42,6% |           4 (2,5%) |                               0 |
| MT  |     144 |            38,8% |        42,0% |           4 (2,8%) |                               0 |
| SC  |     138 |             0,0% |        39,6% |           2 (1,4%) |                               0 |
| AL  |      83 |            39,5% |        52,8% |         11 (13,3%) |                               0 |
| DF  |      70 |             0,0% |        40,8% |           0 (0,0%) |                               0 |
| ES  |      41 |            36,3% |        44,9% |           2 (4,9%) |                               0 |
| RO  |      22 |            40,9% |        46,4% |           2 (9,1%) |                               1 |
| TO  |      20 |            36,3% |        46,6% |          2 (10,0%) |                               0 |
| AC  |      19 |            44,3% |        66,6% |          6 (31,6%) |                               0 |
| RR  |       2 |            49,3% |        54,5% |          1 (50,0%) |                               0 |
| AP  |       1 |            36,3% |        36,3% |           0 (0,0%) |                               0 |

**34 imóveis** têm valor mínimo de venda igual a 10% da avaliação (descontos de 90,00% ou 90,01%). Não é arredondamento: são imóveis que passaram por leilões sem comprador, conferidos por amostragem na página oficial ("Averbação dos leilões negativos: Averbado").

## A reprecificação de 20/10/2026

Na coleta de 20/10/2026, a Caixa publicou listas novas com **3.931 quedas de preço** em um único dia. A comparação diária detectou cada uma como um evento `queda_preco`.

| UF  | Quedas | Queda mediana | Redução somada |
| --- | -----: | ------------: | -------------: |
| RJ  |  2.166 |          2,8% |   R$ 5.766.916 |
| GO  |  1.113 |          2,8% |   R$ 2.528.508 |
| PE  |    131 |          2,9% |     R$ 273.953 |
| PI  |    127 |          2,7% |     R$ 234.256 |
| CE  |    111 |          6,3% |     R$ 332.836 |
| RN  |     89 |          6,3% |     R$ 150.560 |
| SE  |     74 |          2,8% |     R$ 133.484 |
| PB  |     56 |          2,8% |     R$ 118.253 |
| BA  |     39 |          2,9% |      R$ 84.241 |
| SP  |     13 |          2,5% |      R$ 35.936 |
| AM  |      8 |          2,5% |      R$ 20.091 |
| MG  |      3 |          2,7% |       R$ 6.259 |
| PR  |      1 |          2,5% |       R$ 3.173 |

Os eventos da primeira coleta de cada estado (a carga inicial) não entram nesses números: eles descrevem a base inteira, não novidades.
