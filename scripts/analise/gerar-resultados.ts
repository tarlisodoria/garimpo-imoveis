// Gera docs/resultados.md a partir do banco: distribuição de descontos por
// UF, imóveis com valor mínimo igual a 10% da avaliação e a reprecificação
// de 20/10/2026. Uso: `npm run analise` (requer DATABASE_URL).
// Só agrega dados públicos da lista da Caixa; não imprime a conexão.

import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { sql } from "drizzle-orm";

import { db } from "../../db/client";

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

async function main() {
  const porUf = (
    await db.execute(sql`
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
  ).rows as LinhaUf[];

  const total = (
    await db.execute(sql`
      select count(*)::int as imoveis,
             percentile_cont(0.5) within group (order by desconto_pct)::numeric(6,2)::text as mediana
        from imoveis where ativo`)
  ).rows[0] as { imoveis: number; mediana: string };

  // Datas em horário de Brasília.
  const quedas = (
    await db.execute(sql`
      select i.uf,
             count(*)::int as quedas,
             percentile_cont(0.5) within group (
               order by 100 * (1 - (e.detalhe->>'precoAtual')::numeric / nullif((e.detalhe->>'precoAnterior')::numeric, 0))
             )::numeric(6,2)::text as "medianaPct",
             sum((e.detalhe->>'precoAnterior')::numeric - (e.detalhe->>'precoAtual')::numeric)::numeric(16,2)::text as "somaReais"
        from eventos e
        join imoveis i using (id_caixa)
       where e.tipo = 'queda_preco'
         and (e.criado_em at time zone 'America/Sao_Paulo')::date = ${DIA_REPRECIFICACAO}::date
       group by i.uf
       order by count(*) desc`)
  ).rows as LinhaQueda[];

  const totalQuedas = quedas.reduce((soma, linha) => soma + linha.quedas, 0);
  const dezPorCento = porUf.reduce(
    (soma, linha) => soma + linha.dezPorCento,
    0,
  );
  const geradoEm = new Date().toISOString().slice(0, 10);

  const md = [
    "# Resultados",
    "",
    `> Gerado por \`npm run analise\` (\`scripts/analise/gerar-resultados.ts\`) em ${geradoEm}, a partir dos dados públicos da lista de imóveis à venda da Caixa coletados pelo pipeline. Os números mudam a cada coleta.`,
    "",
    "## Distribuição dos descontos por estado",
    "",
    `São **${numero(total.imoveis)} imóveis ativos**, com desconto mediano de **${pct(total.mediana)}** sobre o valor de avaliação.`,
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
    `## A reprecificação de ${DIA_REPRECIFICACAO.split("-").reverse().join("/")}`,
    "",
    `Na coleta de ${DIA_REPRECIFICACAO.split("-").reverse().join("/")}, a Caixa publicou listas novas com **${numero(totalQuedas)} quedas de preço** em um único dia. A comparação diária detectou cada uma como um evento \`queda_preco\`.`,
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

  const saida = path.join(process.cwd(), "docs", "resultados.md");
  await mkdir(path.dirname(saida), { recursive: true });
  await writeFile(saida, md, "utf8");
  console.log(
    JSON.stringify(
      {
        arquivo: "docs/resultados.md",
        imoveis: total.imoveis,
        ufs: porUf.length,
        quedasNoDia: totalQuedas,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Falha ao gerar a análise.");
  console.error(error instanceof Error ? error.message : "erro desconhecido");
  process.exitCode = 1;
});
