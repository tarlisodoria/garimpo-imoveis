// Gera docs/resultados.md e os gráficos em docs/img/resultados/ a partir do
// banco, cobrindo todo o período monitorado. Uso: `npm run analise` (requer
// DATABASE_URL). Só agrega dados públicos da lista da Caixa; não imprime a
// conexão. Os eventos da carga inicial de cada UF ficam de fora, com o mesmo
// corte usado pelo site (scripts/coleta/carga-inicial.ts).

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { cortesCargaInicial } from "../coleta/carga-inicial";
import { erroSeguro } from "../lib/erro-seguro";
import { abrirPool } from "../lib/pg";
import { barrasHorizontais, colunasDiarias, diasContinuos } from "./graficos";

type LinhaUf = {
  uf: string;
  imoveis: number;
  mediana: string;
  p90: string;
  acima50: number;
  dezPorCento: number;
};

type LinhaQueda = {
  uf: string;
  quedas: number;
  medianaPct: string;
  somaReais: string;
};

const DIA_REPRECIFICACAO = "2026-10-20";
const PASTA_GRAFICOS = path.join("docs", "img", "resultados");

const numero = (valor: number | string) =>
  new Intl.NumberFormat("pt-BR").format(Number(valor));
const pct = (valor: number | string) =>
  `${Number(valor).toFixed(1).replace(".", ",")}%`;
const reais = (valor: number | string) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(valor));
const dataBr = (iso: string) => iso.split("-").reverse().join("/");

async function main() {
  const pool = abrirPool();
  try {
    await gerar(pool);
  } finally {
    await pool.end();
  }
}

async function gerar(pool: ReturnType<typeof abrirPool>) {
  // Período e coletas. Datas em horário de Brasília.
  const periodo = (
    await pool.query<{
      inicio: string;
      fim: string;
      verificadoAte: string;
      dias: number;
      sucesso: number;
      semAlteracao: number;
      falha: number;
    }>(`
      select (min(iniciado_em) filter (where status = 'sucesso') at time zone 'America/Sao_Paulo')::date::text as inicio,
             (max(iniciado_em) filter (where status = 'sucesso') at time zone 'America/Sao_Paulo')::date::text as fim,
             (max(iniciado_em) filter (where status in ('sucesso', 'sem_alteracao')) at time zone 'America/Sao_Paulo')::date::text as "verificadoAte",
             count(distinct (iniciado_em at time zone 'America/Sao_Paulo')::date) filter (where status = 'sucesso')::int as dias,
             count(*) filter (where status = 'sucesso')::int as sucesso,
             count(*) filter (where status = 'sem_alteracao')::int as "semAlteracao",
             count(*) filter (where status = 'falha')::int as falha
        from coletas`)
  ).rows[0]!;

  const coletasBrutas = (
    await pool.query<{
      uf: string;
      status: "sucesso" | "falha" | "sem_alteracao";
      iniciadoEm: Date;
    }>(
      'select uf, status::text as status, iniciado_em as "iniciadoEm" from coletas',
    )
  ).rows;
  const cortes = [...cortesCargaInicial(coletasBrutas)].filter(
    (par): par is [string, Date] => par[1] instanceof Date,
  );
  const ufsCorte = cortes.map(([uf]) => uf);
  const datasCorte = cortes.map(([, corte]) => corte);

  // Eventos por dia e tipo, só depois do corte da carga inicial de cada UF.
  const porDia = (
    await pool.query<{ dia: string; tipo: string; n: number }>(
      `
      with cortes(uf, corte) as (select * from unnest($1::text[], $2::timestamptz[]))
      select (e.criado_em at time zone 'America/Sao_Paulo')::date::text as dia,
             e.tipo::text as tipo,
             count(*)::int as n
        from eventos e
        join imoveis i using (id_caixa)
        join cortes c on c.uf = i.uf
       where e.criado_em >= c.corte
       group by 1, 2
       order by 1, 2`,
      [ufsCorte, datasCorte],
    )
  ).rows;

  const serie = (tipo: string) =>
    new Map(porDia.filter((l) => l.tipo === tipo).map((l) => [l.dia, l.n]));
  const totalTipo = (tipo: string) =>
    porDia.filter((l) => l.tipo === tipo).reduce((s, l) => s + l.n, 0);
  const primeiroDia = porDia[0]?.dia ?? periodo.inicio;
  // Até a última verificação: uma lista igual à anterior também é dado.
  const ultimoDia = periodo.verificadoAte;

  const porUf = (
    await pool.query<LinhaUf>(`
      select uf,
             count(*)::int as imoveis,
             percentile_cont(0.5) within group (order by desconto_pct)::numeric(6,2)::text as mediana,
             percentile_cont(0.9) within group (order by desconto_pct)::numeric(6,2)::text as p90,
             count(*) filter (where desconto_pct >= 50)::int as acima50,
             count(*) filter (where abs(preco - round(valor_avaliacao * 0.10, 2)) <= 0.02)::int as "dezPorCento"
        from imoveis
       where ativo
       group by uf
       order by count(*) desc`)
  ).rows;

  const total = (
    await pool.query<{ imoveis: number; mediana: string; vistos: number }>(`
      select count(*) filter (where ativo)::int as imoveis,
             (percentile_cont(0.5) within group (order by desconto_pct) filter (where ativo))::numeric(6,2)::text as mediana,
             count(*)::int as vistos
        from imoveis`)
  ).rows[0]!;

  const faixas = (
    await pool.query<{ faixa: number; n: number }>(`
      select least(floor(desconto_pct / 10), 9)::int as faixa, count(*)::int as n
        from imoveis
       where ativo
       group by 1
       order by 1`)
  ).rows;

  const quedas = (
    await pool.query<LinhaQueda>(
      `
      select i.uf,
             count(*)::int as quedas,
             percentile_cont(0.5) within group (
               order by 100 * (1 - (e.detalhe->>'precoAtual')::numeric / nullif((e.detalhe->>'precoAnterior')::numeric, 0))
             )::numeric(6,2)::text as "medianaPct",
             sum((e.detalhe->>'precoAnterior')::numeric - (e.detalhe->>'precoAtual')::numeric)::numeric(16,2)::text as "somaReais"
        from eventos e
        join imoveis i using (id_caixa)
       where e.tipo = 'queda_preco'
         and (e.criado_em at time zone 'America/Sao_Paulo')::date = $1::date
       group by i.uf
       order by count(*) desc`,
      [DIA_REPRECIFICACAO],
    )
  ).rows;

  const totalQuedasDia = quedas.reduce((soma, linha) => soma + linha.quedas, 0);
  const dezPorCento = porUf.reduce((soma, l) => soma + l.dezPorCento, 0);
  const geradoEm = new Date().toISOString().slice(0, 10);

  // Gráficos
  await mkdir(PASTA_GRAFICOS, { recursive: true });
  const subtituloEventos = `${dataBr(primeiroDia)} a ${dataBr(ultimoDia)}, sem a carga inicial de cada UF, por dia (horário de Brasília)`;
  const graficos: Record<string, string> = {
    "novos-por-dia.svg": colunasDiarias({
      titulo: "Imóveis novos na lista, por dia",
      subtitulo: subtituloEventos,
      pontos: diasContinuos(primeiroDia, ultimoDia, serie("novo")),
    }),
    "quedas-por-dia.svg": colunasDiarias({
      titulo: "Quedas de preço, por dia",
      subtitulo: subtituloEventos,
      pontos: diasContinuos(primeiroDia, ultimoDia, serie("queda_preco")),
    }),
    "saidas-por-dia.svg": colunasDiarias({
      titulo: "Imóveis que saíram da lista, por dia",
      subtitulo: subtituloEventos,
      pontos: diasContinuos(primeiroDia, ultimoDia, serie("saiu")),
    }),
    "desconto-mediano-por-uf.svg": barrasHorizontais({
      titulo: "Desconto mediano por UF",
      subtitulo: `Imóveis ativos na última coleta (${dataBr(ultimoDia)}), em % sobre o valor de avaliação`,
      itens: [...porUf]
        .sort(
          (a, b) =>
            Number(b.mediana) - Number(a.mediana) || a.uf.localeCompare(b.uf),
        )
        .map((l) => ({
          rotulo: l.uf,
          valor: Number(l.mediana),
          textoValor: pct(l.mediana),
        })),
    }),
    "distribuicao-descontos.svg": barrasHorizontais({
      titulo: "Imóveis ativos por faixa de desconto",
      subtitulo: `Desconto sobre o valor de avaliação, na última coleta (${dataBr(ultimoDia)})`,
      itens: Array.from({ length: 10 }, (_, faixa) => {
        const n = faixas.find((f) => f.faixa === faixa)?.n ?? 0;
        return {
          rotulo:
            faixa === 9 ? "90% ou +" : `${faixa * 10} a ${faixa * 10 + 9}%`,
          valor: n,
          textoValor: numero(n),
        };
      }),
    }),
  };
  for (const [arquivo, svg] of Object.entries(graficos)) {
    await writeFile(path.join(PASTA_GRAFICOS, arquivo), svg, "utf8");
  }

  const img = (arquivo: string, alt: string) =>
    `![${alt}](img/resultados/${arquivo})`;
  const dias = diasContinuos(primeiroDia, ultimoDia, new Map());
  const md = [
    "# Resultados",
    "",
    `> Gerado por \`npm run analise\` (\`scripts/analise/gerar-resultados.ts\`) em ${geradoEm}, a partir dos dados públicos da lista de imóveis à venda da Caixa coletados pelo pipeline. Cobre todo o período monitorado; a coleta está congelada desde 16/11/2026 ([ADR 0009](adr/0009-congelamento-da-coleta.md)). O método está descrito em [metodologia.md](metodologia.md).`,
    "",
    "## Período e cobertura",
    "",
    `- **Período:** de ${dataBr(periodo.inicio)} a ${dataBr(periodo.verificadoAte)}. A última lista com mudanças é de ${dataBr(periodo.fim)}; na verificação de ${dataBr(periodo.verificadoAte)} os arquivos eram iguais aos anteriores. Houve coletas com dados novos em ${numero(periodo.dias)} dias.`,
    `- **Coletas registradas:** ${numero(periodo.sucesso)} com dados novos (\`sucesso\`), ${numero(periodo.semAlteracao)} com arquivo igual ao anterior (\`sem_alteracao\`) e ${numero(periodo.falha)} com falha.`,
    `- **Imóveis:** ${numero(total.vistos)} imóveis distintos apareceram na lista em algum momento; ${numero(total.imoveis)} estavam ativos na última coleta.`,
    `- **Eventos fora da carga inicial:** ${numero(totalTipo("novo"))} imóveis novos, ${numero(totalTipo("queda_preco"))} quedas de preço, ${numero(totalTipo("mudou_modalidade"))} mudanças de modalidade e ${numero(totalTipo("saiu"))} saídas.`,
    "",
    "## Eventos ao longo do período",
    "",
    "Cada gráfico tem a sua própria escala, porque os volumes são muito diferentes entre si. Os números exatos estão na tabela logo abaixo.",
    "",
    img("novos-por-dia.svg", "Imóveis novos na lista, por dia"),
    "",
    img("quedas-por-dia.svg", "Quedas de preço, por dia"),
    "",
    img("saidas-por-dia.svg", "Imóveis que saíram da lista, por dia"),
    "",
    "<details>",
    "<summary>Tabela: eventos por dia</summary>",
    "",
    "| Dia | Novos | Quedas de preço | Mudanças de modalidade | Saídas |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...dias.map(({ data }) => {
      const n = (tipo: string) => numero(serie(tipo).get(data) ?? 0);
      return `| ${dataBr(data)} | ${n("novo")} | ${n("queda_preco")} | ${n("mudou_modalidade")} | ${n("saiu")} |`;
    }),
    "",
    "</details>",
    "",
    "## Distribuição dos descontos",
    "",
    `Na última coleta havia **${numero(total.imoveis)} imóveis ativos**, com desconto mediano de **${pct(total.mediana)}** sobre o valor de avaliação.`,
    "",
    img("distribuicao-descontos.svg", "Imóveis ativos por faixa de desconto"),
    "",
    img("desconto-mediano-por-uf.svg", "Desconto mediano por UF"),
    "",
    "| UF | Imóveis | Desconto mediano | Percentil 90 | Com desconto ≥ 50% | Valor mínimo = 10% da avaliação |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    ...porUf.map(
      (linha) =>
        `| ${linha.uf} | ${numero(linha.imoveis)} | ${pct(linha.mediana)} | ${pct(linha.p90)} | ${numero(linha.acima50)} (${pct((100 * linha.acima50) / linha.imoveis)}) | ${numero(linha.dezPorCento)} |`,
    ),
    "",
    `**${numero(dezPorCento)} imóveis** têm valor mínimo de venda igual a 10% da avaliação (descontos de 90,00% ou 90,01%). Não é arredondamento: são imóveis que passaram por leilões sem comprador, conferidos por amostragem na página oficial ("Averbação dos leilões negativos: Averbado").`,
    "",
    `## A reprecificação de ${dataBr(DIA_REPRECIFICACAO)}`,
    "",
    `Na coleta de ${dataBr(DIA_REPRECIFICACAO)}, a Caixa publicou listas novas com **${numero(totalQuedasDia)} quedas de preço** em um único dia. A comparação diária detectou cada uma como um evento \`queda_preco\`.`,
    "",
    "| UF | Quedas | Queda mediana | Redução somada |",
    "| --- | ---: | ---: | ---: |",
    ...quedas.map(
      (linha) =>
        `| ${linha.uf} | ${numero(linha.quedas)} | ${pct(linha.medianaPct)} | ${reais(linha.somaReais)} |`,
    ),
    "",
    "Os eventos da primeira coleta de cada estado (a carga inicial) não entram nesses números: eles descrevem a base inteira, não novidades.",
    "",
  ].join("\n");

  await writeFile(path.join("docs", "resultados.md"), md, "utf8");
  console.log(
    JSON.stringify(
      {
        arquivo: "docs/resultados.md",
        graficos: Object.keys(graficos).length,
        periodo: `${periodo.inicio} a ${periodo.verificadoAte}`,
        imoveisAtivos: total.imoveis,
        ufs: porUf.length,
        quedasNoDia: totalQuedasDia,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Falha ao gerar a análise.");
  console.error(erroSeguro(error));
  process.exitCode = 1;
});
