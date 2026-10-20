import "dotenv/config";

import { createHash } from "node:crypto";

import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";

import { db } from "../../db/client";
import { coletas, eventos, imoveis, imoveisHistorico } from "../../db/schema";
import { parseCaixaCsvFile } from "./caixa-csv";
import { diffImoveis } from "./diff-imoveis";
import { executarRegistrandoFalha, persistirColeta } from "./persistencia";
import { erroSeguro } from "../lib/erro-seguro";

async function main() {
  const uf = (process.argv[2] ?? "PA").trim().toUpperCase();

  validateUf(uf);

  // Qualquer erro a partir daqui fica registrado como `falha` em `coletas`.
  await executarRegistrandoFalha(uf, () => coletarUf(uf), registerFailure);
}

async function coletarUf(uf: string) {
  const downloadUrl = `https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_${uf}.csv`;
  const startedAt = new Date();
  const response = await fetch(downloadUrl, {
    headers: {
      "user-agent":
        "Garimpo-Imoveis/0.1 (+https://github.com/tarlisodoria/garimpo-imoveis)",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Falha ao baixar CSV da Caixa para ${uf}: HTTP ${response.status}.`,
    );
  }

  const fileBytes = new Uint8Array(await response.arrayBuffer());
  const hashArquivo = createHash("sha256").update(fileBytes).digest("hex");
  const parsed = parseCaixaCsvFile(fileBytes);
  const latestHash = await db
    .select({ hashArquivo: coletas.hashArquivo })
    .from(coletas)
    // Só coletas que persistiram dados contam; `falha` nunca bloqueia reprocessar.
    .where(
      and(
        eq(coletas.uf, uf),
        eq(coletas.status, "sucesso"),
        isNotNull(coletas.hashArquivo),
      ),
    )
    .orderBy(desc(coletas.iniciadoEm))
    .limit(1);

  if (latestHash[0]?.hashArquivo === hashArquivo) {
    await db.insert(coletas).values({
      uf,
      iniciadoEm: startedAt,
      status: "sem_alteracao",
      linhas: parsed.rows.length,
      erro: "hash_igual_ao_ultimo_processado",
    });

    console.log(`Coleta ${uf} ignorada: hash igual ao ultimo processamento.`);
    console.log(
      JSON.stringify(
        { uf, status: "sem_alteracao", linhas: parsed.rows.length },
        null,
        2,
      ),
    );
    return;
  }

  const previousSnapshot = await db
    .select({
      idCaixa: imoveis.idCaixa,
      preco: imoveis.preco,
      descontoPct: imoveis.descontoPct,
      modalidade: imoveis.modalidade,
      ativo: imoveis.ativo,
    })
    .from(imoveis)
    .where(eq(imoveis.uf, uf));

  const dataReferencia = parsed.dataGeracao
    ? convertBrazilianDateToIso(parsed.dataGeracao)
    : formatDate(startedAt);
  const diff = diffImoveis(parsed.rows, previousSnapshot, dataReferencia);
  const processedAt = new Date();

  const imoveisPayload = diff.toUpsert.map((row) => ({
    idCaixa: row.idCaixa,
    uf: row.uf,
    cidade: row.cidade,
    cidadeSlug: row.cidadeSlug,
    bairro: row.bairro,
    endereco: row.endereco,
    tipo: row.tipo,
    descricaoCurta: row.descricaoCurta,
    preco: row.preco,
    valorAvaliacao: row.valorAvaliacao,
    descontoPct: row.descontoPct,
    modalidade: row.modalidade,
    aceitaFinanciamento: row.aceitaFinanciamento,
    linkOficial: row.linkOficial,
    primeiraVezVisto: processedAt,
    ultimaVezVisto: processedAt,
    ativo: true,
  }));

  await persistirColeta(
    {
      imoveis: imoveisPayload,
      desativados: diff.deactivatedIds,
      historico: diff.historyToInsert,
      eventos: diff.eventsToInsert,
    },
    {
      upsertImoveis: async (lote) => {
        await db
          .insert(imoveis)
          .values(lote)
          .onConflictDoUpdate({
            target: imoveis.idCaixa,
            set: {
              uf: sql.raw(`excluded.${imoveis.uf.name}`),
              cidade: sql.raw(`excluded.${imoveis.cidade.name}`),
              cidadeSlug: sql.raw(`excluded.${imoveis.cidadeSlug.name}`),
              bairro: sql.raw(`excluded.${imoveis.bairro.name}`),
              endereco: sql.raw(`excluded.${imoveis.endereco.name}`),
              tipo: sql.raw(`excluded.${imoveis.tipo.name}`),
              descricaoCurta: sql.raw(
                `excluded.${imoveis.descricaoCurta.name}`,
              ),
              preco: sql.raw(`excluded.${imoveis.preco.name}`),
              valorAvaliacao: sql.raw(
                `excluded.${imoveis.valorAvaliacao.name}`,
              ),
              descontoPct: sql.raw(`excluded.${imoveis.descontoPct.name}`),
              modalidade: sql.raw(`excluded.${imoveis.modalidade.name}`),
              aceitaFinanciamento: sql.raw(
                `excluded.${imoveis.aceitaFinanciamento.name}`,
              ),
              linkOficial: sql.raw(`excluded.${imoveis.linkOficial.name}`),
              ultimaVezVisto: sql.raw(
                `excluded.${imoveis.ultimaVezVisto.name}`,
              ),
              ativo: sql.raw(`excluded.${imoveis.ativo.name}`),
            },
          });
      },
      desativarImoveis: async (lote) => {
        await db
          .update(imoveis)
          .set({ ativo: false, ultimaVezVisto: processedAt })
          .where(inArray(imoveis.idCaixa, lote));
      },
      inserirHistorico: async (lote) => {
        await db.insert(imoveisHistorico).values(lote).onConflictDoNothing();
      },
      inserirEventos: async (lote) => {
        await db.insert(eventos).values(lote);
      },
      // `iniciadoEm` explícito: a linha é gravada no fim, mas precisa marcar o
      // início da coleta, antes dos seus eventos (corte da carga inicial).
      registrarSucesso: async () => {
        await db.insert(coletas).values({
          uf,
          iniciadoEm: startedAt,
          status: "sucesso",
          linhas: parsed.rows.length,
          hashArquivo,
        });
      },
    },
  );

  console.log(
    JSON.stringify(
      {
        uf,
        status: "sucesso",
        dataGeracao: parsed.dataGeracao,
        dataReferencia,
        linhas: parsed.rows.length,
        hashArquivo,
        upserts: diff.toUpsert.length,
        historico: diff.historyToInsert.length,
        eventos: diff.eventsToInsert.length,
        desativados: diff.deactivatedIds.length,
      },
      null,
      2,
    ),
  );
}

async function registerFailure(uf: string, error: string) {
  await db.insert(coletas).values({
    uf,
    status: "falha",
    erro: error.slice(0, 1000),
  });
}

function validateUf(uf: string) {
  if (!/^[A-Z]{2}$/.test(uf)) {
    throw new Error(`UF invalida: \"${uf}\".`);
  }
}

function convertBrazilianDateToIso(value: string) {
  const [day, month, year] = value.split("/");

  if (!day || !month || !year) {
    throw new Error(`Data de geracao invalida: \"${value}\".`);
  }

  return `${year}-${month}-${day}`;
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

main().catch(async (error) => {
  console.error("Falha na coleta manual.");
  console.error(erroSeguro(error));
  process.exitCode = 1;
});
