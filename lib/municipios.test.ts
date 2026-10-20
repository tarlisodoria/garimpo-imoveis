import assert from "node:assert/strict";
import { test } from "node:test";

import { nomeCidade } from "./municipios";

test("usa o nome oficial do IBGE, com acentos", () => {
  assert.equal(nomeCidade("RJ", "SAO GONCALO"), "São Gonçalo");
  assert.equal(nomeCidade("pa", "BELEM"), "Belém");
  assert.equal(nomeCidade("PA", "PAU D'ARCO"), "Pau D'Arco");
});

test("a busca é feita dentro da UF", () => {
  assert.equal(nomeCidade("SP", "SAO PAULO"), "São Paulo");
  // Não existe São Gonçalo no Pará: não pega o nome de outra UF.
  assert.equal(nomeCidade("PA", "SAO GONCALO"), "Sao Goncalo");
});

test("sem correspondência, cai no formato título sem reacentuar", () => {
  assert.equal(nomeCidade("DF", "CEILANDIA"), "Ceilandia");
  assert.equal(
    nomeCidade("PA", "SANTA ISABEL DO PARA"),
    "Santa Isabel do Para",
  );
});
