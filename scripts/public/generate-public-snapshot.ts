import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { and, desc, eq, gte, inArray, max } from "drizzle-orm";

import { db } from "../../db/client";
import { coletas, eventos, imoveis, imoveisHistorico } from "../../db/schema";
import { slugify } from "../../lib/slug";
import {
  calcularEconomia,
  cortesCargaInicial,
  JANELA_DIAS,
  limitarPorCidade,
  selecionarQuedasRecentes,
  resumirEventos,
  type SeloImovel,
} from "../../lib/snapshot-calculos";
import { erroSeguro } from "../lib/erro-seguro";

type PublicImovel = {
  idCaixa: string;
  uf: string;
  cidade: string;
  cidadeSlug: string;
  bairro: string | null;
  endereco: string;
  tipo: string | null;
  preco: string;
  valorAvaliacao: string;
  descontoPct: string;
  modalidade: string;
  aceitaFinanciamento: boolean;
  linkOficial: string;
  economiaReais: string;
  entrouEm: string;
  selo: SeloImovel;
};

type PublicCidade = {
  nome: string;
  slug: string;
  totalImoveis: number;
  topDescontos: PublicImovel[];
};

type PublicUf = {
  uf: string;
  /** "Data de geração" mais recente da lista oficial da UF (AAAA-MM-DD). */
  listaDe: string | null;
  totalImoveis: number;
  topDescontos: PublicImovel[];
  cidades: PublicCidade[];
};

type PublicSnapshot = {
  generatedAt: string;
  summary: {
    totalImoveis: number;
    totalUfs: number;
    totalCidades: number;
    novos7d: number;
    quedas7d: number;
  };
  topDescontos: PublicImovel[];
  ufs: PublicUf[];
  /** Maiores quedas de preço dos últimos 7 dias, fora da carga inicial. */
  quedasRecentes: Array<
    PublicImovel & { precoAnterior: string; quedaPct: string; quedaEm: string }
  >;
};

const TOP_GLOBAL = 30;
const TOP_QUEDAS = 12;
const TOP_UF = 50;
const TOP_CIDADE = 80;

async function carregarResumoEventos(agora: Date) {
  const historicoColetas = await db
    .select({
      uf: coletas.uf,
      status: coletas.status,
      iniciadoEm: coletas.iniciadoEm,
    })
    .from(coletas);

  const inicioJanela = new Date(
    agora.getTime() - JANELA_DIAS * 24 * 60 * 60 * 1000,
  );

  // Usa o índice eventos_criado_em_idx; só os dois tipos exibidos no site.
  const eventosRecentes = await db
    .select({
      idCaixa: eventos.idCaixa,
      uf: imoveis.uf,
      tipo: eventos.tipo,
      criadoEm: eventos.criadoEm,
      detalhe: eventos.detalhe,
    })
    .from(eventos)
    .innerJoin(imoveis, eq(imoveis.idCaixa, eventos.idCaixa))
    .where(
      and(
        gte(eventos.criadoEm, inicioJanela),
        inArray(eventos.tipo, ["novo", "queda_preco"]),
      ),
    );

  const cortes = cortesCargaInicial(historicoColetas);
  const quedas = selecionarQuedasRecentes(
    eventosRecentes
      .filter((evento) => evento.tipo === "queda_preco")
      .map((evento) => ({
        idCaixa: evento.idCaixa,
        uf: evento.uf,
        criadoEm: evento.criadoEm,
        precoAnterior: String(evento.detalhe.precoAnterior ?? ""),
        precoAtual: String(evento.detalhe.precoAtual ?? ""),
      })),
    cortes,
    agora,
  );

  return {
    ...resumirEventos(eventosRecentes, cortes, agora),
    quedas,
  };
}

async function main() {
  const agora = new Date();
  const resumoEventos = await carregarResumoEventos(agora);
  // A data de referência do histórico é a "Data de geração" do CSV da Caixa.
  const datasDasListas = new Map(
    (
      await db
        .select({ uf: imoveis.uf, data: max(imoveisHistorico.data) })
        .from(imoveisHistorico)
        .innerJoin(imoveis, eq(imoveis.idCaixa, imoveisHistorico.idCaixa))
        .groupBy(imoveis.uf)
    ).map((row) => [row.uf, row.data]),
  );

  const ufs = await db
    .selectDistinct({ uf: imoveis.uf })
    .from(imoveis)
    .where(eq(imoveis.ativo, true))
    .orderBy(imoveis.uf);

  const ufPayload: PublicUf[] = [];
  const imoveisPorId = new Map<string, PublicImovel>();

  for (const ufRow of ufs) {
    const uf = ufRow.uf;
    const ufRows = await db
      .select({
        idCaixa: imoveis.idCaixa,
        uf: imoveis.uf,
        cidade: imoveis.cidade,
        cidadeSlug: imoveis.cidadeSlug,
        bairro: imoveis.bairro,
        endereco: imoveis.endereco,
        tipo: imoveis.tipo,
        preco: imoveis.preco,
        valorAvaliacao: imoveis.valorAvaliacao,
        descontoPct: imoveis.descontoPct,
        modalidade: imoveis.modalidade,
        aceitaFinanciamento: imoveis.aceitaFinanciamento,
        linkOficial: imoveis.linkOficial,
        primeiraVezVisto: imoveis.primeiraVezVisto,
      })
      .from(imoveis)
      .where(and(eq(imoveis.uf, uf), eq(imoveis.ativo, true)))
      .orderBy(desc(imoveis.descontoPct), imoveis.idCaixa);

    const normalizedRows: PublicImovel[] = ufRows.map((row) => ({
      idCaixa: row.idCaixa,
      uf: row.uf,
      cidade: row.cidade,
      cidadeSlug: row.cidadeSlug || slugify(row.cidade),
      bairro: row.bairro,
      endereco: row.endereco,
      tipo: row.tipo,
      preco: String(row.preco),
      valorAvaliacao: String(row.valorAvaliacao),
      descontoPct: String(row.descontoPct),
      modalidade: row.modalidade,
      aceitaFinanciamento: row.aceitaFinanciamento,
      linkOficial: row.linkOficial,
      economiaReais: calcularEconomia(
        String(row.preco),
        String(row.valorAvaliacao),
      ),
      entrouEm: row.primeiraVezVisto.toISOString(),
      selo: resumoEventos.selos.get(row.idCaixa) ?? null,
    }));
    for (const row of normalizedRows) imoveisPorId.set(row.idCaixa, row);

    const cidadesMap = new Map<string, PublicImovel[]>();

    for (const row of normalizedRows) {
      const key = `${row.cidade}|${row.cidadeSlug}`;
      const current = cidadesMap.get(key) || [];
      current.push(row);
      cidadesMap.set(key, current);
    }

    const cidades: PublicCidade[] = [...cidadesMap.entries()]
      .map(([key, items]) => {
        const [nome, slug] = key.split("|");
        return {
          nome,
          slug,
          totalImoveis: items.length,
          topDescontos: items.slice(0, TOP_CIDADE),
        };
      })
      .sort((left, right) => right.totalImoveis - left.totalImoveis);

    ufPayload.push({
      uf,
      listaDe: datasDasListas.get(uf) ?? null,
      totalImoveis: normalizedRows.length,
      // Destaques da UF: no máximo 2 por cidade; a página da cidade lista todos.
      topDescontos: limitarPorCidade(normalizedRows).slice(0, TOP_UF),
      cidades,
    });
  }

  const allRows = ufPayload.flatMap((entry) => entry.topDescontos);
  allRows.sort(
    (left, right) =>
      Number(right.descontoPct) - Number(left.descontoPct) ||
      left.idCaixa.localeCompare(right.idCaixa),
  );

  const snapshot: PublicSnapshot = {
    generatedAt: agora.toISOString(),
    summary: {
      totalImoveis: ufPayload.reduce(
        (total, row) => total + row.totalImoveis,
        0,
      ),
      totalUfs: ufPayload.length,
      totalCidades: ufPayload.reduce(
        (total, row) => total + row.cidades.length,
        0,
      ),
      novos7d: resumoEventos.novos7d,
      quedas7d: resumoEventos.quedas7d,
    },
    topDescontos: limitarPorCidade(allRows).slice(0, TOP_GLOBAL),
    quedasRecentes: limitarPorCidade(
      resumoEventos.quedas.flatMap((queda) => {
        const imovel = imoveisPorId.get(queda.idCaixa);
        return imovel ? [{ ...imovel, ...queda }] : [];
      }),
    ).slice(0, TOP_QUEDAS),
    ufs: ufPayload,
  };

  const outputPath = path.join(process.cwd(), "data", "public-snapshot.json");

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        arquivo: "data/public-snapshot.json",
        geradoEm: snapshot.generatedAt,
        ufs: snapshot.summary.totalUfs,
        cidades: snapshot.summary.totalCidades,
        imoveis: snapshot.summary.totalImoveis,
        novos7d: snapshot.summary.novos7d,
        quedas7d: snapshot.summary.quedas7d,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Falha ao gerar snapshot publico.");
  console.error(erroSeguro(error));
  process.exitCode = 1;
});
