import "dotenv/config";

import { migrate } from "drizzle-orm/neon-http/migrator";

import { db } from "../db/client";
import { erroSeguro } from "./lib/erro-seguro";

async function main() {
  await migrate(db, { migrationsFolder: "db/migrations" });
  console.log("Migrations aplicadas com sucesso.");
}

main().catch((error) => {
  console.error("Falha ao aplicar migrations.");
  console.error(erroSeguro(error));
  process.exitCode = 1;
});
