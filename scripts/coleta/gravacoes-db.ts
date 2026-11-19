// Gravações da coleta no Postgres, separadas do run-coleta.ts para servirem a
// qualquer driver do Drizzle: neon-http na coleta real e node-postgres no
// teste de integração do CI.

import { eq, inArray, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import { coletas, eventos, imoveis, imoveisHistorico } from "../../db/schema";
import type {
  EventoInsert,
  HistoricoInsert,
  ImovelSnapshot,
  ImovelUpsert,
} from "./diff-imoveis";
import type { GravacoesColeta } from "./persistencia";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BancoColeta = PgDatabase<PgQueryResultHKT, any>;

export type ImovelGravado = typeof imoveis.$inferInsert;

export async function carregarEstadoAnterior(
  db: BancoColeta,
  uf: string,
): Promise<ImovelSnapshot[]> {
  return db
    .select({
      idCaixa: imoveis.idCaixa,
      preco: imoveis.preco,
      descontoPct: imoveis.descontoPct,
      modalidade: imoveis.modalidade,
      ativo: imoveis.ativo,
    })
    .from(imoveis)
    .where(eq(imoveis.uf, uf));
}

export function paraGravacao(
  linhas: ImovelUpsert[],
  processadoEm: Date,
): ImovelGravado[] {
  return linhas.map((row) => ({
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
    primeiraVezVisto: processadoEm,
    ultimaVezVisto: processadoEm,
    ativo: true,
  }));
}

/** No conflito, atualiza tudo menos `primeira_vez_visto`. */
const colunasAtualizadas = {
  uf: imoveis.uf,
  cidade: imoveis.cidade,
  cidadeSlug: imoveis.cidadeSlug,
  bairro: imoveis.bairro,
  endereco: imoveis.endereco,
  tipo: imoveis.tipo,
  descricaoCurta: imoveis.descricaoCurta,
  preco: imoveis.preco,
  valorAvaliacao: imoveis.valorAvaliacao,
  descontoPct: imoveis.descontoPct,
  modalidade: imoveis.modalidade,
  aceitaFinanciamento: imoveis.aceitaFinanciamento,
  linkOficial: imoveis.linkOficial,
  ultimaVezVisto: imoveis.ultimaVezVisto,
  ativo: imoveis.ativo,
};

export function criarGravacoes(
  db: BancoColeta,
  coleta: {
    uf: string;
    iniciadoEm: Date;
    processadoEm: Date;
    linhas: number;
    hashArquivo: string;
  },
): GravacoesColeta<ImovelGravado, HistoricoInsert, EventoInsert> {
  return {
    upsertImoveis: async (lote) => {
      await db
        .insert(imoveis)
        .values(lote)
        .onConflictDoUpdate({
          target: imoveis.idCaixa,
          set: Object.fromEntries(
            Object.entries(colunasAtualizadas).map(([chave, coluna]) => [
              chave,
              sql.raw(`excluded.${coluna.name}`),
            ]),
          ),
        });
    },
    desativarImoveis: async (lote) => {
      await db
        .update(imoveis)
        .set({ ativo: false, ultimaVezVisto: coleta.processadoEm })
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
        uf: coleta.uf,
        iniciadoEm: coleta.iniciadoEm,
        status: "sucesso",
        linhas: coleta.linhas,
        hashArquivo: coleta.hashArquivo,
      });
    },
  };
}
