// Exporta o conjunto de dados do período monitorado em CSV UTF-8, com um
// arquivo de checksums SHA-256. Uso: `npm run dataset:exportar` (requer
// DATABASE_URL). Saída em dataset/, fora do Git; os arquivos vão para a
// release do GitHub. Só lê o banco; não imprime a conexão.

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { campoCsv, linhaChecksum, paraCsv, type ValorCsv } from "./lib/csv";
import { erroSeguro } from "./lib/erro-seguro";
import { abrirPool } from "./lib/pg";

type Tabela = {
  nome: string;
  colunas: string[];
  /** Ordem estável: o mesmo banco gera sempre os mesmos bytes. */
  ordem: string;
  tratar?: (linha: Record<string, ValorCsv>) => Record<string, ValorCsv>;
};

const TABELAS: Tabela[] = [
  {
    nome: "imoveis",
    colunas: [
      "id_caixa",
      "uf",
      "cidade",
      "cidade_slug",
      "bairro",
      "endereco",
      "tipo",
      "descricao_curta",
      "preco",
      "valor_avaliacao",
      "desconto_pct",
      "modalidade",
      "aceita_financiamento",
      "link_oficial",
      "primeira_vez_visto",
      "ultima_vez_visto",
      "ativo",
    ],
    ordem: "id_caixa",
  },
  {
    nome: "imoveis_historico",
    colunas: ["id", "id_caixa", "data", "preco", "desconto_pct", "modalidade"],
    ordem: "id",
  },
  {
    nome: "eventos",
    colunas: ["id", "id_caixa", "tipo", "detalhe", "criado_em"],
    ordem: "id",
  },
  {
    nome: "coletas",
    colunas: [
      "id",
      "uf",
      "iniciado_em",
      "status",
      "linhas",
      "hash_arquivo",
      "erro",
    ],
    ordem: "id",
    // Mensagens de erro antigas podem citar a conexão; a exportação mascara.
    tratar: (linha) => ({
      ...linha,
      erro: linha.erro === null ? null : erroSeguro(String(linha.erro)),
    }),
  },
];

async function main() {
  const pool = abrirPool();
  const pasta = path.join(process.cwd(), "dataset");
  await mkdir(pasta, { recursive: true });

  const checksums: string[] = [];
  const resumo: Record<string, number> = {};

  try {
    for (const tabela of TABELAS) {
      // Nomes vêm da lista fixa acima, nunca de entrada externa.
      const { rows } = await pool.query<Record<string, ValorCsv>>(
        `select ${tabela.colunas.join(", ")} from ${tabela.nome} order by ${tabela.ordem}`,
      );
      const linhas = tabela.tratar ? rows.map(tabela.tratar) : rows;
      const conteudo = Buffer.from(paraCsv(tabela.colunas, linhas), "utf8");
      const arquivo = `${tabela.nome}.csv`;

      await writeFile(path.join(pasta, arquivo), conteudo);
      checksums.push(
        linhaChecksum(
          createHash("sha256").update(conteudo).digest("hex"),
          arquivo,
        ),
      );
      resumo[tabela.nome] = linhas.length;
    }

    const periodo = await pool.query<{ inicio: Date; fim: Date }>(
      "select min(iniciado_em) as inicio, max(iniciado_em) as fim from coletas where status = 'sucesso'",
    );
    await writeFile(
      path.join(pasta, "SHA256SUMS.txt"),
      checksums.join("\n") + "\n",
      "utf8",
    );

    console.log(
      JSON.stringify(
        {
          pasta: "dataset/",
          linhas: resumo,
          primeiraColetaSucesso: campoCsv(periodo.rows[0]?.inicio ?? null),
          ultimaColetaSucesso: campoCsv(periodo.rows[0]?.fim ?? null),
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Falha ao exportar o conjunto de dados.");
  console.error(erroSeguro(error));
  process.exitCode = 1;
});
