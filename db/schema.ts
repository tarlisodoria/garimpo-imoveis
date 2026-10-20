import {
  bigserial,
  boolean,
  date,
  integer,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const coletaStatusEnum = pgEnum("coleta_status", [
  "sucesso",
  "falha",
  "sem_alteracao",
]);

export const eventoTipoEnum = pgEnum("evento_tipo", [
  "novo",
  "queda_preco",
  "mudou_modalidade",
  "saiu",
]);

export const imoveis = pgTable(
  "imoveis",
  {
    idCaixa: varchar("id_caixa", { length: 32 }).primaryKey(),
    uf: varchar("uf", { length: 2 }).notNull(),
    cidade: varchar("cidade", { length: 160 }).notNull(),
    cidadeSlug: varchar("cidade_slug", { length: 180 }),
    bairro: varchar("bairro", { length: 160 }),
    endereco: text("endereco").notNull(),
    tipo: varchar("tipo", { length: 80 }),
    descricaoCurta: text("descricao_curta").notNull(),
    preco: numeric("preco", { precision: 14, scale: 2 }).notNull(),
    valorAvaliacao: numeric("valor_avaliacao", {
      precision: 14,
      scale: 2,
    }).notNull(),
    descontoPct: numeric("desconto_pct", { precision: 5, scale: 2 }).notNull(),
    modalidade: varchar("modalidade", { length: 120 }).notNull(),
    aceitaFinanciamento: boolean("aceita_financiamento").notNull(),
    linkOficial: text("link_oficial").notNull(),
    primeiraVezVisto: timestamp("primeira_vez_visto", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    ultimaVezVisto: timestamp("ultima_vez_visto", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    ativo: boolean("ativo").default(true).notNull(),
  },
  (table) => [
    index("imoveis_uf_idx").on(table.uf),
    index("imoveis_cidade_idx").on(table.cidade),
    index("imoveis_cidade_slug_idx").on(table.cidadeSlug),
    index("imoveis_ativo_idx").on(table.ativo),
    index("imoveis_desconto_idx").on(table.descontoPct),
  ],
);

export const imoveisHistorico = pgTable(
  "imoveis_historico",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    idCaixa: varchar("id_caixa", { length: 32 })
      .notNull()
      .references(() => imoveis.idCaixa, { onDelete: "cascade" }),
    data: date("data", { mode: "string" }).notNull(),
    preco: numeric("preco", { precision: 14, scale: 2 }).notNull(),
    descontoPct: numeric("desconto_pct", { precision: 5, scale: 2 }).notNull(),
    modalidade: varchar("modalidade", { length: 120 }).notNull(),
  },
  (table) => [
    index("imoveis_historico_id_caixa_idx").on(table.idCaixa),
    uniqueIndex("imoveis_historico_id_caixa_data_idx").on(
      table.idCaixa,
      table.data,
    ),
  ],
);

export const eventos = pgTable(
  "eventos",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    idCaixa: varchar("id_caixa", { length: 32 })
      .notNull()
      .references(() => imoveis.idCaixa, { onDelete: "cascade" }),
    tipo: eventoTipoEnum("tipo").notNull(),
    detalhe: jsonb("detalhe").$type<Record<string, unknown>>().notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("eventos_id_caixa_idx").on(table.idCaixa),
    index("eventos_tipo_idx").on(table.tipo),
    index("eventos_criado_em_idx").on(table.criadoEm),
  ],
);

export const coletas = pgTable(
  "coletas",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    uf: varchar("uf", { length: 2 }).notNull(),
    iniciadoEm: timestamp("iniciado_em", { withTimezone: true })
      .defaultNow()
      .notNull(),
    status: coletaStatusEnum("status").notNull(),
    linhas: integer("linhas"),
    hashArquivo: varchar("hash_arquivo", { length: 128 }),
    erro: text("erro"),
  },
  (table) => [
    index("coletas_uf_idx").on(table.uf),
    index("coletas_iniciado_em_idx").on(table.iniciadoEm),
    uniqueIndex("coletas_uf_hash_arquivo_idx").on(table.uf, table.hashArquivo),
  ],
);
