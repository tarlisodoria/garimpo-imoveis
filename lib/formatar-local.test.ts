import assert from "node:assert/strict";
import { test } from "node:test";

import { formatarLocal } from "./formatar-local";

test("converte CAIXA ALTA em título com conectivos minúsculos", () => {
  assert.equal(formatarLocal("SANTA ISABEL DO PARA"), "Santa Isabel do Para");
  assert.equal(formatarLocal("SAO JOAO DE PIRABAS"), "Sao Joao de Pirabas");
  assert.equal(formatarLocal("CAPITAO POCO"), "Capitao Poco");
});

test("não reacentua e preserva acentos que já vierem da fonte", () => {
  assert.equal(formatarLocal("BELÉM"), "Belém");
  assert.equal(formatarLocal("PARA"), "Para");
});

test("conectivo no início é capitalizado", () => {
  assert.equal(formatarLocal("DO NORTE"), "Do Norte");
});

test("hífen, apóstrofo, números e romanos", () => {
  assert.equal(formatarLocal("PAU D'ARCO"), "Pau D'Arco");
  assert.equal(formatarLocal("SANTA BARBARA D'OESTE"), "Santa Barbara D'Oeste");
  assert.equal(formatarLocal("MOGI-MIRIM"), "Mogi-Mirim");
  assert.equal(
    formatarLocal("CONJUNTO CIDADE NOVA VIII"),
    "Conjunto Cidade Nova VIII",
  );
  assert.equal(formatarLocal("RESIDENCIAL BR-316"), "Residencial BR-316");
});

test("espaços extras e valores vazios", () => {
  assert.equal(formatarLocal("  ANANINDEUA   CENTRO "), "Ananindeua Centro");
  assert.equal(formatarLocal(""), "");
  assert.equal(formatarLocal(null), "");
});
