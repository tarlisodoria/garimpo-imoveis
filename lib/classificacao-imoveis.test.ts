import assert from "node:assert/strict";
import test from "node:test";

import {
  categoriaDoTipo,
  contarPorCategoria,
  contarPorUfECategoria,
  dentroDaFaixa,
  noRecorte,
  REGIOES,
  regiaoDaUf,
  regiaoPorNome,
  totalDaRegiao,
} from "./classificacao-imoveis";

test("as cinco regiões cobrem as 27 UFs sem repetição", () => {
  const ufs = REGIOES.flatMap((regiao) => [...regiao.ufs]);
  assert.equal(ufs.length, 27);
  assert.equal(new Set(ufs).size, 27);
});

test("regiaoDaUf e regiaoPorNome", () => {
  assert.equal(regiaoDaUf("PA")?.nome, "Norte");
  assert.equal(regiaoDaUf("DF")?.nome, "Centro-Oeste");
  assert.equal(regiaoDaUf("XX"), undefined);
  assert.equal(regiaoPorNome("Sul")?.ufs.length, 3);
  assert.equal(regiaoPorNome(null), undefined);
});

test("categoriaDoTipo ignora acento e caixa e respeita a ordem das regras", () => {
  assert.equal(categoriaDoTipo("Casa"), "casa");
  assert.equal(categoriaDoTipo("SOBRADO"), "casa");
  assert.equal(categoriaDoTipo("Apartamento"), "apartamento");
  assert.equal(categoriaDoTipo("Terreno"), "terreno");
  assert.equal(categoriaDoTipo("Galpão"), "galpao");
  assert.equal(categoriaDoTipo("Prédio"), "comercial");
  assert.equal(categoriaDoTipo("Sala comercial"), "comercial");
  assert.equal(categoriaDoTipo("Casa comercial"), "casa");
  assert.equal(categoriaDoTipo("Gleba"), "outros");
  assert.equal(categoriaDoTipo(null), "outros");
});

test("dentroDaFaixa: sem faixa passa tudo; limites inclusivos; preço inválido sai", () => {
  const faixa = { minimo: 100, maximo: 200 };
  assert.equal(dentroDaFaixa("abc", null), true);
  assert.equal(dentroDaFaixa("100", faixa), true);
  assert.equal(dentroDaFaixa("200.00", faixa), true);
  assert.equal(dentroDaFaixa("99.99", faixa), false);
  assert.equal(dentroDaFaixa("abc", faixa), false);
});

test("noRecorte: UF tem prioridade sobre região; sem nada, Brasil inteiro", () => {
  assert.equal(noRecorte("PA", null, null), true);
  assert.equal(noRecorte("PA", null, ["PA", "AM"]), true);
  assert.equal(noRecorte("SP", null, ["PA", "AM"]), false);
  assert.equal(noRecorte("SP", "SP", ["PA"]), true);
  assert.equal(noRecorte("PA", "SP", null), false);
});

test("contagens por categoria e por UF com faixa de preço", () => {
  const imoveis = [
    { uf: "PA", tipo: "Casa", preco: "150" },
    { uf: "PA", tipo: "Casa", preco: "500" },
    { uf: "PA", tipo: "Apartamento", preco: "120" },
    { uf: "RJ", tipo: "Casa", preco: "x" },
  ];

  const porCategoria = contarPorCategoria(imoveis);
  assert.equal(porCategoria.get("casa"), 3);
  assert.equal(porCategoria.get("apartamento"), 1);

  const semFaixa = contarPorUfECategoria(imoveis, null);
  assert.equal(semFaixa.get("PA")?.get("casa"), 2);
  assert.equal(semFaixa.get("RJ")?.get("casa"), 1);

  const comFaixa = contarPorUfECategoria(imoveis, { minimo: 100, maximo: 200 });
  assert.equal(comFaixa.get("PA")?.get("casa"), 1);
  assert.equal(comFaixa.get("PA")?.get("apartamento"), 1);
  assert.equal(comFaixa.has("RJ"), false);
});

test("totalDaRegiao soma só as UFs da região", () => {
  const norte = regiaoPorNome("Norte");
  assert.ok(norte);
  assert.equal(
    totalDaRegiao(norte, [
      { uf: "PA", totalImoveis: 10 },
      { uf: "AM", totalImoveis: 5 },
      { uf: "SP", totalImoveis: 100 },
    ]),
    15,
  );
});
