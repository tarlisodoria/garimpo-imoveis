import assert from "node:assert/strict";
import test from "node:test";

import {
  barrasHorizontais,
  colunasDiarias,
  diasContinuos,
  escaparXml,
  marcasLimpas,
} from "./graficos";

test("marcasLimpas usa passos redondos e cobre o máximo", () => {
  assert.deepEqual(marcasLimpas(3931), [0, 1000, 2000, 3000, 4000]);
  assert.deepEqual(marcasLimpas(44.8), [0, 20, 40, 60]);
  assert.deepEqual(marcasLimpas(7), [0, 2, 4, 6, 8]);
  assert.deepEqual(marcasLimpas(0), [0, 1]);
  for (const maximo of [1, 13, 99, 250, 8200]) {
    const marcas = marcasLimpas(maximo);
    assert.ok(marcas.at(-1)! >= maximo, `cobre ${maximo}`);
    assert.ok(marcas.length <= 6, `poucas marcas para ${maximo}`);
  }
});

test("escaparXml protege os caracteres especiais", () => {
  assert.equal(
    escaparXml('A & B <c> "d"'),
    "A &amp; B &lt;c&gt; &quot;d&quot;",
  );
});

test("diasContinuos preenche dias vazios com zero, inclusive na virada do mês", () => {
  const pontos = diasContinuos(
    "2026-10-30",
    "2026-11-02",
    new Map([
      ["2026-10-30", 5],
      ["2026-11-02", 1],
    ]),
  );
  assert.deepEqual(pontos, [
    { data: "2026-10-30", valor: 5 },
    { data: "2026-10-31", valor: 0 },
    { data: "2026-11-01", valor: 0 },
    { data: "2026-11-02", valor: 1 },
  ]);
});

test("barrasHorizontais gera um SVG acessível com uma marca por item e modo escuro", () => {
  const svg = barrasHorizontais({
    titulo: "Desconto mediano por UF",
    subtitulo: "Imóveis ativos em 15/11/2026",
    itens: [
      { rotulo: "RJ", valor: 44.8, textoValor: "44,8%" },
      { rotulo: "SC", valor: 0, textoValor: "0,0%" },
    ],
  });
  assert.match(svg, /^<svg [^>]*role="img"/);
  assert.match(svg, /<title id="t">Desconto mediano por UF<\/title>/);
  assert.match(svg, /prefers-color-scheme: dark/);
  // Valor zero não desenha marca, mas mantém rótulo e valor.
  assert.equal(svg.match(/class="marca"/g)?.length, 1);
  assert.match(svg, />0,0%</);
  assert.ok(svg.trimEnd().endsWith("</svg>"));
});

test("colunasDiarias rotula só o maior valor", () => {
  const svg = colunasDiarias({
    titulo: "Quedas de preço por dia",
    subtitulo: "Fora da carga inicial",
    pontos: [
      { data: "2026-10-19", valor: 10 },
      { data: "2026-10-20", valor: 3931 },
      { data: "2026-10-21", valor: 0 },
    ],
  });
  assert.equal(svg.match(/class="marca"/g)?.length, 2);
  assert.equal(svg.match(/class="valor"/g)?.length, 1);
  assert.match(svg, /3\.931 em 20\/10/);
});
