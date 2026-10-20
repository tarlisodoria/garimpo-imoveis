import "dotenv/config";

import { sql } from "../db/client";
import { erroSeguro } from "./lib/erro-seguro";

async function main() {
  const result = await sql`select 1 as status`;

  console.log("Conexao com o Neon validada.");
  console.log(result);
}

main().catch((error) => {
  console.error("Falha ao validar a conexao com o banco.");
  console.error(erroSeguro(error));
  process.exitCode = 1;
});
