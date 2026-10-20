import assert from "node:assert/strict";
import { test } from "node:test";

import {
  emLotes,
  executarRegistrandoFalha,
  persistirColeta,
  type GravacoesColeta,
} from "./persistencia";

test("emLotes divide sem perder nem repetir itens", () => {
  const itens = Array.from({ length: 1201 }, (_, indice) => indice);
  const lotes = emLotes(itens, 500);

  assert.deepEqual(
    lotes.map((lote) => lote.length),
    [500, 500, 201],
  );
  assert.deepEqual(lotes.flat(), itens);
  assert.deepEqual(emLotes([], 500), []);
  assert.throws(() => emLotes([1], 0));
});

function gravacoesFalsas(falharEm?: string) {
  const chamadas: string[] = [];
  const registrar =
    (nome: string) =>
    async (lote: unknown[]): Promise<void> => {
      chamadas.push(`${nome}:${lote.length}`);
      if (falharEm === nome) throw new Error(`falha em ${nome}`);
    };
  const gravacoes: GravacoesColeta<number, number, number> = {
    upsertImoveis: registrar("imoveis"),
    desativarImoveis: registrar("desativar"),
    inserirHistorico: registrar("historico"),
    inserirEventos: registrar("eventos"),
    registrarSucesso: async () => {
      chamadas.push("sucesso");
    },
  };
  return { chamadas, gravacoes };
}

const dados = {
  imoveis: Array.from({ length: 1200 }, (_, i) => i),
  desativados: ["a", "b"],
  historico: Array.from({ length: 501 }, (_, i) => i),
  eventos: Array.from({ length: 3 }, (_, i) => i),
};

test("persistirColeta grava em lotes e registra sucesso por último", async () => {
  const { chamadas, gravacoes } = gravacoesFalsas();
  await persistirColeta(dados, gravacoes, 500);

  assert.deepEqual(chamadas, [
    "imoveis:500",
    "imoveis:500",
    "imoveis:200",
    "desativar:2",
    "historico:500",
    "historico:1",
    "eventos:3",
    "sucesso",
  ]);
});

test("persistirColeta não registra sucesso se algum lote falhar", async () => {
  const { chamadas, gravacoes } = gravacoesFalsas("historico");

  await assert.rejects(persistirColeta(dados, gravacoes, 500), /historico/);
  assert.equal(chamadas.includes("sucesso"), false);
  assert.equal(chamadas.includes("eventos:3"), false);
});

test("executarRegistrandoFalha registra falha e propaga o erro original", async () => {
  const falhas: string[] = [];
  const original = new RangeError("Maximum call stack size exceeded");

  await assert.rejects(
    executarRegistrandoFalha(
      "RJ",
      async () => {
        throw original;
      },
      async (uf, erro) => {
        falhas.push(`${uf}:${erro}`);
      },
    ),
    (error) => error === original,
  );
  assert.deepEqual(falhas, ["RJ:Maximum call stack size exceeded"]);
});

test("executarRegistrandoFalha mantém o erro original se registrar falha também falhar", async () => {
  const original = new Error("CSV indisponível");

  await assert.rejects(
    executarRegistrandoFalha(
      "SP",
      async () => {
        throw original;
      },
      async () => {
        throw new Error("banco fora do ar");
      },
    ),
    (error) => error === original,
  );
});

test("executarRegistrandoFalha não registra nada quando a coleta passa", async () => {
  let registrou = false;
  await executarRegistrandoFalha(
    "PA",
    async () => {},
    async () => {
      registrou = true;
    },
  );
  assert.equal(registrou, false);
});
