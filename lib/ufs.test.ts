import assert from "node:assert/strict";
import { test } from "node:test";

import { nomeUf, noUf } from "./ufs";

test("noUf usa a preposição correta de cada estado", () => {
  assert.equal(noUf("pa"), "no Pará");
  assert.equal(noUf("BA"), "na Bahia");
  assert.equal(noUf("SP"), "em São Paulo");
  assert.equal(noUf("MG"), "em Minas Gerais");
});

test("nomeUf devolve a sigla quando a UF é desconhecida", () => {
  assert.equal(nomeUf("xx"), "XX");
});
