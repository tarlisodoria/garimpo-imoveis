import test from "node:test";
import assert from "node:assert/strict";

import type { CaixaCsvRow } from "./caixa-csv";
import { diffImoveis } from "./diff-imoveis";

const currentRows: CaixaCsvRow[] = [
  {
    idCaixa: "1",
    uf: "PA",
    cidade: "Belém",
    bairro: "Marco",
    endereco: "Rua A",
    tipo: "Casa",
    descricaoCurta: "Casa, 100 m2.",
    preco: "100000.00",
    valorAvaliacao: "150000.00",
    descontoPct: "33.33",
    aceitaFinanciamento: true,
    modalidade: "Venda Direta Online",
    linkOficial: "https://example.com/1",
  },
  {
    idCaixa: "2",
    uf: "PA",
    cidade: "Ananindeua",
    bairro: "Centro",
    endereco: "Rua B",
    tipo: "Apartamento",
    descricaoCurta: "Apartamento, 58 m2.",
    preco: "200000.00",
    valorAvaliacao: "250000.00",
    descontoPct: "20.00",
    aceitaFinanciamento: false,
    modalidade: "Venda Online",
    linkOficial: "https://example.com/2",
  },
];

test("diffImoveis gera evento novo e historico para imovel inedito", () => {
  const result = diffImoveis([currentRows[0]], [], "2026-10-16");

  assert.equal(result.toUpsert.length, 1);
  assert.equal(result.toUpsert[0]?.cidadeSlug, "belem");
  assert.equal(result.toUpsert[0]?.isNew, true);
  assert.deepEqual(result.deactivatedIds, []);
  assert.deepEqual(result.historyToInsert, [
    {
      idCaixa: "1",
      data: "2026-10-16",
      preco: "100000.00",
      descontoPct: "33.33",
      modalidade: "Venda Direta Online",
    },
  ]);
  assert.deepEqual(result.eventsToInsert, [
    {
      idCaixa: "1",
      tipo: "novo",
      detalhe: {
        uf: "PA",
        cidade: "Belém",
        modalidade: "Venda Direta Online",
        preco: "100000.00",
      },
    },
  ]);
});

test("diffImoveis detecta queda de preco, mudanca de modalidade e saida", () => {
  const previousSnapshot = [
    {
      idCaixa: "1",
      preco: "120000.00",
      descontoPct: "20.00",
      modalidade: "Venda Online",
      ativo: true,
    },
    {
      idCaixa: "3",
      preco: "90000.00",
      descontoPct: "10.00",
      modalidade: "Venda Direta Online",
      ativo: true,
    },
  ];

  const result = diffImoveis([currentRows[0]], previousSnapshot, "2026-10-16");

  assert.deepEqual(result.deactivatedIds, ["3"]);
  assert.deepEqual(result.historyToInsert, [
    {
      idCaixa: "1",
      data: "2026-10-16",
      preco: "100000.00",
      descontoPct: "33.33",
      modalidade: "Venda Direta Online",
    },
  ]);
  assert.deepEqual(result.eventsToInsert, [
    {
      idCaixa: "1",
      tipo: "queda_preco",
      detalhe: {
        precoAnterior: "120000.00",
        precoAtual: "100000.00",
        descontoAnterior: "20.00",
        descontoAtual: "33.33",
      },
    },
    {
      idCaixa: "1",
      tipo: "mudou_modalidade",
      detalhe: {
        modalidadeAnterior: "Venda Online",
        modalidadeAtual: "Venda Direta Online",
      },
    },
    {
      idCaixa: "3",
      tipo: "saiu",
      detalhe: {
        motivo: "ausente_no_csv_atual",
      },
    },
  ]);
});

test("diffImoveis e idempotente quando snapshot e csv nao mudam", () => {
  const previousSnapshot = [
    {
      idCaixa: "2",
      preco: "200000.00",
      descontoPct: "20.00",
      modalidade: "Venda Online",
      ativo: true,
    },
  ];

  const result = diffImoveis([currentRows[1]], previousSnapshot, "2026-10-16");

  assert.equal(result.toUpsert.length, 1);
  assert.equal(result.toUpsert[0]?.isNew, false);
  assert.deepEqual(result.historyToInsert, []);
  assert.deepEqual(result.eventsToInsert, []);
  assert.deepEqual(result.deactivatedIds, []);
});

test("diffImoveis grava historico quando preco sobe sem disparar evento de queda", () => {
  const previousSnapshot = [
    {
      idCaixa: "2",
      preco: "180000.00",
      descontoPct: "28.00",
      modalidade: "Venda Online",
      ativo: true,
    },
  ];

  const result = diffImoveis([currentRows[1]], previousSnapshot, "2026-10-16");

  assert.deepEqual(result.historyToInsert, [
    {
      idCaixa: "2",
      data: "2026-10-16",
      preco: "200000.00",
      descontoPct: "20.00",
      modalidade: "Venda Online",
    },
  ]);
  assert.deepEqual(result.eventsToInsert, []);
});
