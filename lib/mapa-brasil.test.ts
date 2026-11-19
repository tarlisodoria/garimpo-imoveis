import assert from "node:assert/strict";
import test from "node:test";

import mapData from "../data/brasil-ufs.json";
import {
  caminhoDaGeometria,
  caminhosDosEstados,
  centroDaGeometria,
  criarProjecao,
  MAPA_ALTURA,
  MAPA_LARGURA,
  mercator,
  posicaoDoMarcador,
  raioDoMarcador,
  type FeatureEstado,
} from "./mapa-brasil";

const quadrado: FeatureEstado = {
  type: "Feature",
  properties: { sigla: "XX" },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
        [-1, -1],
      ],
    ],
  },
};

test("mercator é zero no equador e simétrico", () => {
  assert.ok(Math.abs(mercator(0)) < 1e-12);
  assert.ok(Math.abs(mercator(10) + mercator(-10)) < 1e-12);
});

test("projeção centraliza e preenche a menor dimensão respeitando a margem", () => {
  const projetar = criarProjecao([quadrado], 100, 50, 5);
  const [x0, y0] = projetar([-1, 1]);
  const [x1, y1] = projetar([1, -1]);

  assert.ok(Math.abs(y0 - 5) < 1e-9, "topo na margem");
  assert.ok(Math.abs(y1 - 45) < 1e-9, "base na margem");
  assert.ok(Math.abs((x0 + x1) / 2 - 50) < 1e-9, "centralizado na horizontal");
  assert.ok(x0 > 5 && x1 < 95);
});

test("norte fica em cima: latitude maior gera y menor", () => {
  const projetar = criarProjecao([quadrado]);
  assert.ok(projetar([0, 1])[1] < projetar([0, -1])[1]);
});

test("caminho SVG fecha cada anel e usa duas casas decimais", () => {
  const projetar = criarProjecao([quadrado], 100, 100, 0);
  const d = caminhoDaGeometria(quadrado.geometry, projetar);

  assert.match(
    d,
    /^M-?\d+\.\d{2},-?\d+\.\d{2}(L-?\d+\.\d{2},-?\d+\.\d{2}){4}Z$/,
  );
});

test("MultiPolygon gera um subcaminho por polígono", () => {
  const projetar = criarProjecao([quadrado]);
  const anel = (quadrado.geometry as { coordinates: [number, number][][] })
    .coordinates;
  const d = caminhoDaGeometria(
    { type: "MultiPolygon", coordinates: [anel, anel] },
    projetar,
  );
  assert.equal(d.match(/M/g)?.length, 2);
});

test("centro é a média dos vértices, contando o vértice que fecha o anel", () => {
  // O primeiro vértice se repete no fim do anel (GeoJSON) e pesa duas vezes.
  const projetar = criarProjecao([quadrado], 100, 100, 0);
  const [cx, cy] = centroDaGeometria(quadrado.geometry, projetar);
  const anel = (quadrado.geometry as { coordinates: [number, number][][] })
    .coordinates[0]!;
  const projetados = anel.map(projetar);
  const mediaX = projetados.reduce((t, [x]) => t + x, 0) / anel.length;
  const mediaY = projetados.reduce((t, [, y]) => t + y, 0) / anel.length;

  assert.equal(anel.length, 5);
  assert.ok(Math.abs(cx - mediaX) < 1e-9);
  assert.ok(Math.abs(cy - mediaY) < 1e-9);
  assert.ok(cx < 50 && cy > 50, "o vértice repetido puxa o centro para ele");
});

test("malha real: 27 UFs com caminho e centro dentro do SVG", () => {
  const estados = caminhosDosEstados(mapData.features as FeatureEstado[]);

  assert.equal(estados.length, 27);
  assert.equal(new Set(estados.map((estado) => estado.uf)).size, 27);
  for (const { uf, d, center } of estados) {
    assert.ok(d.startsWith("M") && d.endsWith("Z"), uf);
    assert.ok(center[0] > 0 && center[0] < MAPA_LARGURA, uf);
    assert.ok(center[1] > 0 && center[1] < MAPA_ALTURA, uf);
  }
});

test("marcadores ficam em círculo de raio 8, o primeiro no topo", () => {
  assert.deepEqual(posicaoDoMarcador([100, 100], 0, 4), [100, 92]);
  assert.deepEqual(posicaoDoMarcador([100, 100], 1, 4), [108, 100]);
  assert.deepEqual(posicaoDoMarcador([100, 100], 0, 0), [100, 92]);
});

test("raio do marcador cresce com a quantidade, entre 4 e 7", () => {
  assert.equal(raioDoMarcador(0), 4);
  assert.equal(raioDoMarcador(1), 4.3);
  assert.ok(raioDoMarcador(10) > raioDoMarcador(1));
  assert.equal(raioDoMarcador(1_000_000_000), 7);
});
