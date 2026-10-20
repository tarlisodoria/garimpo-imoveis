import "dotenv/config";

import { count, eq } from "drizzle-orm";

import { db } from "../db/client";
import { coletas, eventos, imoveis, imoveisHistorico } from "../db/schema";
import { erroSeguro } from "./lib/erro-seguro";

async function main() {
  const uf = (process.argv[2] ?? "PA").trim().toUpperCase();

  const [{ total: totalImoveis }] = await db
    .select({ total: count() })
    .from(imoveis)
    .where(eq(imoveis.uf, uf));

  const [{ total: totalHistorico }] = await db
    .select({ total: count() })
    .from(imoveisHistorico);
  const [{ total: totalEventos }] = await db
    .select({ total: count() })
    .from(eventos);
  const [{ total: totalColetas }] = await db
    .select({ total: count() })
    .from(coletas)
    .where(eq(coletas.uf, uf));

  console.log(
    JSON.stringify(
      {
        uf,
        imoveis: totalImoveis,
        historico: totalHistorico,
        eventos: totalEventos,
        coletas: totalColetas,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Falha ao consultar contagens do banco.");
  console.error(erroSeguro(error));
  process.exitCode = 1;
});
