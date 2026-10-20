// Gera data/municipios-ibge.json: UF -> slug -> nome oficial (com acentos).
// Roda manualmente (npm run public:municipios) e o resultado é versionado;
// o build e o runtime nunca acessam a rede para isso.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { slugify } from "../../lib/slug";
import { erroSeguro } from "../lib/erro-seguro";

const FONTE = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios";

type UfIbge = { sigla: string };
type MunicipioIbge = {
  id: number;
  nome: string;
  microrregiao?: { mesorregiao?: { UF?: UfIbge } } | null;
  "regiao-imediata"?: { "regiao-intermediaria"?: { UF?: UfIbge } } | null;
};

function siglaUf(municipio: MunicipioIbge): string | undefined {
  // Municípios recentes podem vir sem microrregião; a região imediata cobre.
  return (
    municipio.microrregiao?.mesorregiao?.UF?.sigla ??
    municipio["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla
  );
}

async function main() {
  const resposta = await fetch(FONTE);
  if (!resposta.ok) {
    throw new Error(`IBGE respondeu HTTP ${resposta.status}.`);
  }

  const municipios = (await resposta.json()) as MunicipioIbge[];
  const porUf: Record<string, Record<string, string>> = {};
  const colisoes: string[] = [];

  for (const municipio of municipios) {
    const uf = siglaUf(municipio);
    if (!uf) {
      throw new Error(`Município sem UF na resposta do IBGE: ${municipio.id}.`);
    }

    const slug = slugify(municipio.nome);
    porUf[uf] ??= {};
    if (porUf[uf][slug] && porUf[uf][slug] !== municipio.nome) {
      colisoes.push(`${uf}/${slug}`);
    }
    porUf[uf][slug] = municipio.nome;
  }

  if (colisoes.length > 0) {
    throw new Error(`Slugs repetidos na mesma UF: ${colisoes.join(", ")}.`);
  }

  const ordenado = Object.fromEntries(
    Object.keys(porUf)
      .sort()
      .map((uf) => [
        uf,
        Object.fromEntries(
          Object.entries(porUf[uf]).sort(([a], [b]) => a.localeCompare(b)),
        ),
      ]),
  );

  const saida = path.join(process.cwd(), "data", "municipios-ibge.json");
  await mkdir(path.dirname(saida), { recursive: true });
  await writeFile(
    saida,
    `${JSON.stringify({ fonte: FONTE, municipios: ordenado }, null, 2)}\n`,
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        arquivo: "data/municipios-ibge.json",
        municipios: municipios.length,
        ufs: Object.keys(ordenado).length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Falha ao gerar o mapa de municípios do IBGE.");
  console.error(erroSeguro(error));
  process.exitCode = 1;
});
