// Conexão node-postgres para scripts de leitura (exportação e análise).
// Funciona com o Neon (TCP com SSL, pela própria URL) e com Postgres local.

import "dotenv/config";

import pg from "pg";

// `date` sem horário fica como texto (AAAA-MM-DD): convertê-lo em Date
// aplicaria fuso e poderia deslocar o dia.
pg.types.setTypeParser(pg.types.builtins.DATE, (valor) => valor);

export function abrirPool(): pg.Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada (veja .env.example).");
  }
  return new pg.Pool({ connectionString, max: 2 });
}
