// Teste de integração: Postgres real, migrations reais e o mesmo código de
// diff e persistência da coleta, sobre a fixture anonimizada do PA.
// Uso: TEST_DATABASE_URL=postgres://... npm run test:integracao
// O banco é apagado e recriado; por isso só aceita banco local ou de teste.

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, before, test } from "node:test";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

import { listaImoveisPaAnonFixture } from "./__fixtures__/lista-imoveis-pa-anon";
import { parseCaixaCsvFile } from "./caixa-csv";
import { cortesCargaInicial } from "./carga-inicial";
import { diffImoveis } from "./diff-imoveis";
import {
  carregarEstadoAnterior,
  criarGravacoes,
  paraGravacao,
} from "./gravacoes-db";
import { persistirColeta } from "./persistencia";

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  throw new Error("Defina TEST_DATABASE_URL para rodar o teste de integração.");
}
const destino = new URL(url);
const local = ["localhost", "127.0.0.1", "postgres"].includes(destino.hostname);
if (!local && !/teste|test/i.test(destino.pathname)) {
  throw new Error(
    "TEST_DATABASE_URL precisa apontar para um banco local ou com 'teste' no nome.",
  );
}

const pool = new pg.Pool({ connectionString: url });
const db = drizzle({ client: pool });

/** Dia 2: imóvel 1 baixa de preço, imóvel 2 sai da lista, imóvel 3 entra. */
function listaDia2(): Buffer {
  const texto = listaImoveisPaAnonFixture.toString("latin1");
  const linhas = texto.split("\r\n");
  const imovel1 = linhas.findIndex((l) => l.includes("9000000000001"));
  const imovel2 = linhas.findIndex((l) => l.includes("9000000000002"));
  const original2 = linhas[imovel2]!;

  linhas[imovel1] = linhas[imovel1]!.replace(
    "111.638,68;239.000,00;53.29",
    "100.000,00;239.000,00;58.16",
  );
  linhas[imovel2] = original2.replaceAll("9000000000002", "9000000000003");
  linhas[1] = linhas[1]!.replace("15/10/2026", "16/10/2026");
  return Buffer.from(linhas.join("\r\n"), "latin1");
}

/** Mesmos imóveis do dia 2 num arquivo gerado de novo: só a data muda (e o hash). */
function listaDia3MesmoConteudo(): Buffer {
  return Buffer.from(
    listaDia2().toString("latin1").replace("16/10/2026", "17/10/2026"),
    "latin1",
  );
}

async function coletar(arquivo: Buffer, tamanhoLote = 1) {
  // Relógio do banco, o mesmo do `criado_em` dos eventos: evita que uma
  // diferença entre os relógios do Node e do Postgres confunda o corte.
  const { rows: agora } = await pool.query<{ t: Date }>(
    "select clock_timestamp() as t",
  );
  const iniciadoEm = agora[0]!.t;
  const parsed = parseCaixaCsvFile(new Uint8Array(arquivo));
  const [dia, mes, ano] = (parsed.dataGeracao ?? "").split("/");
  const anterior = await carregarEstadoAnterior(db, "PA");
  const diff = diffImoveis(parsed.rows, anterior, `${ano}-${mes}-${dia}`);
  const processadoEm = new Date();

  // Lote de 1 força várias rodadas por tabela, como numa UF grande.
  await persistirColeta(
    {
      imoveis: paraGravacao(diff.toUpsert, processadoEm),
      desativados: diff.deactivatedIds,
      historico: diff.historyToInsert,
      eventos: diff.eventsToInsert,
    },
    criarGravacoes(db, {
      uf: "PA",
      iniciadoEm,
      processadoEm,
      linhas: parsed.rows.length,
      hashArquivo: createHash("sha256").update(arquivo).digest("hex"),
    }),
    tamanhoLote,
  );
  return diff;
}

async function contar(consulta: string): Promise<number> {
  const { rows } = await pool.query<{ n: number }>(consulta);
  return rows[0]!.n;
}

async function eventosPorTipo(): Promise<Record<string, number>> {
  const { rows } = await pool.query<{ tipo: string; n: number }>(
    "select tipo::text, count(*)::int as n from eventos group by tipo",
  );
  return Object.fromEntries(rows.map((r) => [r.tipo, r.n]));
}

before(async () => {
  await pool.query("drop schema if exists drizzle cascade");
  await pool.query("drop schema public cascade");
  await pool.query("create schema public");
  await migrate(db, { migrationsFolder: "db/migrations" });
});

after(async () => {
  await pool.end();
});

test("migrations criam as quatro tabelas da coleta", async () => {
  const { rows } = await pool.query<{ table_name: string }>(
    "select table_name from information_schema.tables where table_schema = 'public' order by 1",
  );
  assert.deepEqual(
    rows.map((r) => r.table_name),
    ["coletas", "eventos", "imoveis", "imoveis_historico"],
  );
});

test("carga inicial grava os imóveis, o histórico e um evento novo para cada um", async () => {
  await coletar(listaImoveisPaAnonFixture);

  assert.equal(
    await contar("select count(*)::int as n from imoveis where ativo"),
    2,
  );
  assert.equal(
    await contar("select count(*)::int as n from imoveis_historico"),
    2,
  );
  assert.deepEqual(await eventosPorTipo(), { novo: 2 });
  assert.equal(
    await contar(
      "select count(*)::int as n from coletas where status = 'sucesso'",
    ),
    1,
  );
});

test("segunda coleta detecta queda, saída e imóvel novo", async () => {
  await coletar(listaDia2());

  assert.deepEqual(await eventosPorTipo(), {
    novo: 3,
    queda_preco: 1,
    saiu: 1,
  });
  assert.equal(await contar("select count(*)::int as n from imoveis"), 3);
  assert.equal(
    await contar("select count(*)::int as n from imoveis where ativo"),
    2,
  );
  // +1 pela mudança de preço do imóvel 1, +1 pelo imóvel 3.
  assert.equal(
    await contar("select count(*)::int as n from imoveis_historico"),
    4,
  );

  const { rows } = await pool.query<{ preco: string; ativo: boolean }>(
    "select preco::text, ativo from imoveis where id_caixa in ('9000000000001', '9000000000002') order by id_caixa",
  );
  assert.deepEqual(rows, [
    { preco: "100000.00", ativo: true },
    { preco: "206888.15", ativo: false },
  ]);

  const { rows: queda } = await pool.query<{ detalhe: Record<string, string> }>(
    "select detalhe from eventos where tipo = 'queda_preco'",
  );
  assert.equal(queda[0]!.detalhe.precoAnterior, "111638.68");
  assert.equal(queda[0]!.detalhe.precoAtual, "100000.00");
});

test("lista regerada com o mesmo conteúdo não gera eventos nem histórico novos", async () => {
  const diff = await coletar(listaDia3MesmoConteudo(), 500);

  assert.equal(diff.eventsToInsert.length, 0);
  assert.deepEqual(await eventosPorTipo(), {
    novo: 3,
    queda_preco: 1,
    saiu: 1,
  });
  assert.equal(
    await contar("select count(*)::int as n from imoveis_historico"),
    4,
  );
  assert.equal(
    await contar(
      "select count(*)::int as n from coletas where status = 'sucesso'",
    ),
    3,
  );
});

test("o mesmo arquivo não pode ser registrado duas vezes como sucesso", async () => {
  // Na coleta real o hash repetido vira `sem_alteracao` antes de chegar aqui;
  // o índice único (uf, hash_arquivo) é a segunda barreira.
  await assert.rejects(coletar(listaDia3MesmoConteudo(), 500));
  assert.equal(
    await contar(
      "select count(*)::int as n from coletas where status = 'sucesso'",
    ),
    3,
  );
});

test("o corte da carga inicial deixa de fora só os eventos da primeira coleta", async () => {
  const { rows: coletasPa } = await pool.query<{
    uf: string;
    status: "sucesso" | "falha" | "sem_alteracao";
    iniciadoEm: Date;
  }>('select uf, status::text, iniciado_em as "iniciadoEm" from coletas');
  const corte = cortesCargaInicial(coletasPa).get("PA");
  assert.ok(corte instanceof Date);

  const { rows } = await pool.query<{ tipo: string; n: number }>(
    "select tipo::text, count(*)::int as n from eventos where criado_em >= $1 group by tipo order by tipo",
    [corte],
  );
  assert.deepEqual(rows, [
    { tipo: "novo", n: 1 },
    { tipo: "queda_preco", n: 1 },
    { tipo: "saiu", n: 1 },
  ]);
});
