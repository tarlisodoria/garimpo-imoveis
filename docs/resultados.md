# Resultados

> Gerado por `npm run analise` (`scripts/analise/gerar-resultados.ts`) em 2026-11-19, a partir dos dados públicos da lista de imóveis à venda da Caixa coletados pelo pipeline. Cobre todo o período monitorado; a coleta está congelada desde 16/11/2026 ([ADR 0009](adr/0009-congelamento-da-coleta.md)). O método está descrito em [metodologia.md](metodologia.md).

## Período e cobertura

- **Período:** de 16/10/2026 a 15/11/2026. A última lista com mudanças é de 14/11/2026; na verificação de 15/11/2026 os arquivos eram iguais aos anteriores. Houve coletas com dados novos em 23 dias.
- **Coletas registradas:** 540 com dados novos (`sucesso`), 251 com arquivo igual ao anterior (`sem_alteracao`) e 84 com falha.
- **Imóveis:** 30.619 imóveis distintos apareceram na lista em algum momento; 23.769 estavam ativos na última coleta.
- **Eventos fora da carga inicial:** 8.624 imóveis novos, 13.124 quedas de preço, 39.600 mudanças de modalidade e 14.171 saídas.

## Eventos ao longo do período

Cada gráfico tem a sua própria escala, porque os volumes são muito diferentes entre si. Os números exatos estão na tabela logo abaixo.

![Imóveis novos na lista, por dia](img/resultados/novos-por-dia.svg)

![Quedas de preço, por dia](img/resultados/quedas-por-dia.svg)

![Imóveis que saíram da lista, por dia](img/resultados/saidas-por-dia.svg)

<details>
<summary>Tabela: eventos por dia</summary>

| Dia | Novos | Quedas de preço | Mudanças de modalidade | Saídas |
| --- | ---: | ---: | ---: | ---: |
| 17/10/2026 | 10 | 6 | 1 | 14 |
| 18/10/2026 | 0 | 0 | 0 | 0 |
| 19/10/2026 | 0 | 0 | 0 | 0 |
| 20/10/2026 | 606 | 3.931 | 4.622 | 605 |
| 21/10/2026 | 1.180 | 1.028 | 1.800 | 367 |
| 22/10/2026 | 723 | 1.524 | 2.117 | 922 |
| 23/10/2026 | 79 | 111 | 4.431 | 544 |
| 24/10/2026 | 610 | 129 | 2.394 | 832 |
| 25/10/2026 | 0 | 0 | 0 | 0 |
| 26/10/2026 | 0 | 0 | 0 | 0 |
| 27/10/2026 | 51 | 737 | 2.840 | 288 |
| 28/10/2026 | 807 | 1.003 | 1.471 | 1.240 |
| 29/10/2026 | 1.063 | 879 | 1.759 | 145 |
| 30/10/2026 | 53 | 115 | 1.490 | 326 |
| 31/10/2026 | 607 | 358 | 2.511 | 995 |
| 01/11/2026 | 0 | 0 | 0 | 0 |
| 02/11/2026 | 0 | 0 | 0 | 0 |
| 03/11/2026 | 0 | 0 | 0 | 0 |
| 04/11/2026 | 41 | 884 | 2.752 | 1.239 |
| 05/11/2026 | 15 | 178 | 1.406 | 358 |
| 06/11/2026 | 1.082 | 142 | 999 | 952 |
| 07/11/2026 | 9 | 389 | 2.010 | 495 |
| 08/11/2026 | 0 | 0 | 0 | 0 |
| 09/11/2026 | 0 | 0 | 0 | 0 |
| 10/11/2026 | 609 | 716 | 1.914 | 1.690 |
| 11/11/2026 | 7 | 343 | 1.248 | 1.415 |
| 12/11/2026 | 540 | 333 | 1.544 | 199 |
| 13/11/2026 | 37 | 144 | 1.367 | 830 |
| 14/11/2026 | 495 | 174 | 924 | 715 |
| 15/11/2026 | 0 | 0 | 0 | 0 |

</details>

## Distribuição dos descontos

Na última coleta havia **23.769 imóveis ativos**, com desconto mediano de **41,5%** sobre o valor de avaliação.

![Imóveis ativos por faixa de desconto](img/resultados/distribuicao-descontos.svg)

![Desconto mediano por UF](img/resultados/desconto-mediano-por-uf.svg)

| UF | Imóveis | Desconto mediano | Percentil 90 | Com desconto ≥ 50% | Valor mínimo = 10% da avaliação |
| --- | ---: | ---: | ---: | ---: | ---: |
| RJ | 8.119 | 42,9% | 58,0% | 1.801 (22,2%) | 12 |
| GO | 3.455 | 44,8% | 55,8% | 838 (24,3%) | 0 |
| SP | 3.316 | 0,0% | 41,5% | 34 (1,0%) | 0 |
| PE | 1.095 | 43,2% | 55,3% | 175 (16,0%) | 0 |
| RS | 1.069 | 0,0% | 46,4% | 55 (5,1%) | 0 |
| MG | 856 | 0,0% | 43,1% | 24 (2,8%) | 0 |
| BA | 778 | 39,6% | 52,9% | 109 (14,0%) | 0 |
| PI | 746 | 42,7% | 53,8% | 110 (14,7%) | 0 |
| PB | 702 | 42,1% | 52,3% | 88 (12,5%) | 0 |
| RN | 645 | 43,5% | 61,2% | 168 (26,0%) | 0 |
| CE | 610 | 42,1% | 65,4% | 173 (28,4%) | 0 |
| PR | 444 | 0,0% | 42,2% | 5 (1,1%) | 0 |
| SE | 431 | 43,5% | 53,5% | 77 (17,9%) | 0 |
| PA | 254 | 37,1% | 48,8% | 23 (9,1%) | 0 |
| MS | 239 | 0,0% | 42,7% | 6 (2,5%) | 0 |
| AM | 196 | 40,8% | 48,8% | 13 (6,6%) | 0 |
| MA | 187 | 39,6% | 47,0% | 9 (4,8%) | 0 |
| SC | 176 | 0,0% | 38,8% | 3 (1,7%) | 0 |
| MT | 143 | 37,1% | 41,1% | 4 (2,8%) | 0 |
| AL | 103 | 36,3% | 52,4% | 11 (10,7%) | 0 |
| DF | 80 | 0,0% | 37,1% | 0 (0,0%) | 0 |
| ES | 44 | 0,0% | 45,5% | 2 (4,5%) | 0 |
| RO | 29 | 37,9% | 48,8% | 3 (10,3%) | 1 |
| TO | 26 | 0,0% | 46,3% | 2 (7,7%) | 0 |
| AC | 19 | 45,0% | 69,0% | 6 (31,6%) | 0 |
| AP | 5 | 36,3% | 63,0% | 1 (20,0%) | 0 |
| RR | 2 | 21,3% | 38,4% | 0 (0,0%) | 0 |

**13 imóveis** têm valor mínimo de venda igual a 10% da avaliação (descontos de 90,00% ou 90,01%). Não é arredondamento: são imóveis que passaram por leilões sem comprador, conferidos por amostragem na página oficial ("Averbação dos leilões negativos: Averbado").

## A reprecificação de 20/10/2026

Na coleta de 20/10/2026, a Caixa publicou listas novas com **3.931 quedas de preço** em um único dia. A comparação diária detectou cada uma como um evento `queda_preco`.

| UF | Quedas | Queda mediana | Redução somada |
| --- | ---: | ---: | ---: |
| RJ | 2.166 | 2,8% | R$ 5.766.916 |
| GO | 1.113 | 2,8% | R$ 2.528.508 |
| PE | 131 | 2,9% | R$ 273.953 |
| PI | 127 | 2,7% | R$ 234.256 |
| CE | 111 | 6,3% | R$ 332.836 |
| RN | 89 | 6,3% | R$ 150.560 |
| SE | 74 | 2,8% | R$ 133.484 |
| PB | 56 | 2,8% | R$ 118.253 |
| BA | 39 | 2,9% | R$ 84.241 |
| SP | 13 | 2,5% | R$ 35.936 |
| AM | 8 | 2,5% | R$ 20.091 |
| MG | 3 | 2,7% | R$ 6.259 |
| PR | 1 | 2,5% | R$ 3.173 |

Os eventos da primeira coleta de cada estado (a carga inicial) não entram nesses números: eles descrevem a base inteira, não novidades.
