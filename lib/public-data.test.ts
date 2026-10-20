import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizarSnapshot } from "./public-data";

const imovelAntigo = {
  idCaixa: "1",
  uf: "PA",
  cidade: "BELEM",
  cidadeSlug: "belem",
  bairro: null,
  endereco: "RUA A, N. 1",
  tipo: "Casa",
  preco: "100000.00",
  valorAvaliacao: "150000.00",
  descontoPct: "33.33",
  modalidade: "Venda Online",
  aceitaFinanciamento: true,
  linkOficial: "https://venda-imoveis.caixa.gov.br/",
};

test("snapshot antigo sem campos novos recebe padrões seguros", () => {
  const snapshot = normalizarSnapshot({
    generatedAt: null,
    summary: { totalImoveis: 1, totalUfs: 1, totalCidades: 1 },
    topDescontos: [imovelAntigo],
    ufs: [
      {
        uf: "PA",
        totalImoveis: 1,
        topDescontos: [imovelAntigo],
        cidades: [
          {
            nome: "BELEM",
            slug: "belem",
            totalImoveis: 1,
            topDescontos: [imovelAntigo],
          },
        ],
      },
    ],
  });

  assert.equal(snapshot.summary.novos7d, 0);
  assert.equal(snapshot.summary.quedas7d, 0);
  assert.equal(snapshot.topDescontos[0].economiaReais, "50000.00");
  assert.equal(snapshot.topDescontos[0].entrouEm, null);
  assert.equal(snapshot.ufs[0].cidades[0].topDescontos[0].selo, null);
});

test("selo desconhecido vira null", () => {
  const snapshot = normalizarSnapshot({
    generatedAt: null,
    summary: {
      totalImoveis: 1,
      totalUfs: 1,
      totalCidades: 1,
      novos7d: 2,
      quedas7d: 1,
    },
    topDescontos: [
      { ...imovelAntigo, selo: "outro", entrouEm: "2026-10-17T00:00:00Z" },
    ],
    ufs: [],
  });

  assert.equal(snapshot.summary.novos7d, 2);
  assert.equal(snapshot.topDescontos[0].selo, null);
  assert.equal(snapshot.topDescontos[0].entrouEm, "2026-10-17T00:00:00Z");
});

test("cada imóvel recebe a data da lista da sua UF", () => {
  const snapshot = normalizarSnapshot({
    generatedAt: null,
    summary: { totalImoveis: 1, totalUfs: 1, totalCidades: 1 },
    topDescontos: [imovelAntigo],
    ufs: [
      {
        uf: "PA",
        listaDe: "2026-10-16",
        totalImoveis: 1,
        topDescontos: [imovelAntigo],
        cidades: [
          {
            nome: "BELEM",
            slug: "belem",
            totalImoveis: 1,
            topDescontos: [imovelAntigo],
          },
        ],
      },
    ],
  });

  assert.equal(snapshot.topDescontos[0].listaDe, "2026-10-16");
  assert.equal(
    snapshot.ufs[0].cidades[0].topDescontos[0].listaDe,
    "2026-10-16",
  );
  assert.equal(snapshot.ufs[0].cidades[0].nomeExibicao, "Belém");
});

test("snapshot sem quedasRecentes vira lista vazia", () => {
  const snapshot = normalizarSnapshot({
    generatedAt: null,
    summary: { totalImoveis: 0, totalUfs: 0, totalCidades: 0 },
    topDescontos: [],
    ufs: [],
  });

  assert.deepEqual(snapshot.quedasRecentes, []);
});
