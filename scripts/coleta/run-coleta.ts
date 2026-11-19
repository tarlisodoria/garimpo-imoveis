import "dotenv/config";

import { createHash } from "node:crypto";

import { and, desc, eq, isNotNull } from "drizzle-orm";

import { db } from "../../db/client";
import { coletas } from "../../db/schema";
import { parseCaixaCsvFile } from "./caixa-csv";
import { diffImoveis } from "./diff-imoveis";
import {
  carregarEstadoAnterior,
  criarGravacoes,
  paraGravacao,
} from "./gravacoes-db";
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

  const previousSnapshot = await carregarEstadoAnterior(db, uf);

  const dataReferencia = parsed.dataGeracao
    ? convertBrazilianDateToIso(parsed.dataGeracao)
    : formatDate(startedAt);
  const diff = diffImoveis(parsed.rows, previousSnapshot, dataReferencia);
  const processedAt = new Date();

  await persistirColeta(
    {
      imoveis: paraGravacao(diff.toUpsert, processedAt),
      desativados: diff.deactivatedIds,
      historico: diff.historyToInsert,
      eventos: diff.eventsToInsert,
    },
    criarGravacoes(db, {
      uf,
      iniciadoEm: startedAt,
      processadoEm: processedAt,
      linhas: parsed.rows.length,
      hashArquivo,
    }),
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
