import "dotenv/config";

import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";
import { erroSeguro } from "./lib/erro-seguro";

const databaseUrl = process.env.DATABASE_URL;
const tempDir = ".tmp/drizzle-introspect";

async function main() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL nao configurada.");
  }

  await rm(tempDir, { recursive: true, force: true });

  const result = spawnSync(
    process.execPath,
    [
      "./node_modules/drizzle-kit/bin.cjs",
      "introspect",
      "--dialect=postgresql",
      `--out=${tempDir}`,
      "--url",
      databaseUrl,
    ],
    { stdio: "inherit" },
  );

  await rm(tempDir, { recursive: true, force: true });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

main().catch((error) => {
  console.error("Falha ao validar a conectividade do drizzle-kit.");
  console.error(erroSeguro(error));
  process.exitCode = 1;
});
