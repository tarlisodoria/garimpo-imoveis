import assert from "node:assert/strict";
import { test } from "node:test";

import {
  calcularEconomia,
  cortesCargaInicial,
  limitarPorCidade,
  selecionarQuedasRecentes,
  resumirEventos,
  type ColetaResumo,
  type EventoResumo,
} from "./snapshot-calculos";

const agora = new Date("2026-10-20T12:00:00Z");
const d = (iso: string) => new Date(iso);

test("calcularEconomia subtrai preço da avaliação com duas casas", () => {
  assert.equal(calcularEconomia("100000.00", "250000.50"), "150000.50");
});

test("calcularEconomia nunca fica negativa nem quebra com valor inválido", () => {
  assert.equal(calcularEconomia("300000", "250000"), "0.00");
  assert.equal(calcularEconomia("abc", "250000"), "0.00");
});

test("corte é o início da coleta seguinte à primeira coleta sucesso", () => {
  const coletas: ColetaResumo[] = [
    {
      uf: "PA",
      status: "sem_alteracao",
      iniciadoEm: d("2026-10-15T10:00:00Z"),
    },
    { uf: "PA", status: "sucesso", iniciadoEm: d("2026-10-16T10:00:00Z") },
    {
      uf: "PA",
      status: "sem_alteracao",
      iniciadoEm: d("2026-10-16T10:05:00Z"),
    },
    { uf: "PA", status: "sucesso", iniciadoEm: d("2026-10-17T10:00:00Z") },
  ];

  assert.deepEqual(
    cortesCargaInicial(coletas).get("PA"),
    d("2026-10-16T10:05:00Z"),
  );
});

test("UF só com a carga não tem corte e UF sem sucesso fica de fora", () => {
  const cortes = cortesCargaInicial([
    { uf: "AP", status: "sucesso", iniciadoEm: d("2026-10-16T10:00:00Z") },
    { uf: "AM", status: "falha", iniciadoEm: d("2026-10-16T10:00:00Z") },
  ]);

  assert.equal(cortes.get("AP"), null);
  assert.equal(cortes.has("AM"), false);
});

test("resumirEventos ignora carga inicial, janela de 7 dias e outros tipos", () => {
  const cortes = new Map<string, Date | null>([
    ["PA", d("2026-10-16T10:05:00Z")],
    ["AP", null],
  ]);
  const eventos: EventoResumo[] = [
    // carga inicial do PA
    {
      idCaixa: "1",
      uf: "PA",
      tipo: "novo",
      criadoEm: d("2026-10-16T10:01:00Z"),
    },
    // depois do corte
    {
      idCaixa: "2",
      uf: "PA",
      tipo: "novo",
      criadoEm: d("2026-10-17T10:01:00Z"),
    },
    {
      idCaixa: "3",
      uf: "PA",
      tipo: "queda_preco",
      criadoEm: d("2026-10-17T10:01:00Z"),
    },
    {
      idCaixa: "4",
      uf: "PA",
      tipo: "saiu",
      criadoEm: d("2026-10-17T10:01:00Z"),
    },
    // fora da janela de 7 dias (antes de 13/10 12:00)
    {
      idCaixa: "5",
      uf: "PA",
      tipo: "novo",
      criadoEm: d("2026-10-13T11:59:00Z"),
    },
    // UF sem corte
    {
      idCaixa: "6",
      uf: "AP",
      tipo: "novo",
      criadoEm: d("2026-10-18T10:00:00Z"),
    },
  ];
  const cortesComJanela = new Map(cortes);
  cortesComJanela.set("PA", d("2026-10-10T00:00:00Z"));

  const resumo = resumirEventos(eventos, cortes, agora);
  assert.equal(resumo.novos7d, 1);
  assert.equal(resumo.quedas7d, 1);
  assert.deepEqual([...resumo.selos.entries()].sort(), [
    ["2", "novo"],
    ["3", "baixou"],
  ]);

  const comJanela = resumirEventos(eventos, cortesComJanela, agora);
  assert.equal(comJanela.selos.has("5"), false);
  assert.equal(comJanela.selos.get("1"), "novo");
});

test("selo segue o evento mais recente do imóvel", () => {
  const cortes = new Map<string, Date | null>([
    ["PA", d("2026-10-01T00:00:00Z")],
  ]);
  const resumo = resumirEventos(
    [
      {
        idCaixa: "9",
        uf: "PA",
        tipo: "novo",
        criadoEm: d("2026-10-15T10:00:00Z"),
      },
      {
        idCaixa: "9",
        uf: "PA",
        tipo: "queda_preco",
        criadoEm: d("2026-10-18T10:00:00Z"),
      },
    ],
    cortes,
    agora,
  );

  assert.equal(resumo.selos.get("9"), "baixou");
  assert.equal(resumo.novos7d, 1);
  assert.equal(resumo.quedas7d, 1);
});

test("limitarPorCidade deixa no máximo 2 por cidade e preserva a ordem", () => {
  const item = (idCaixa: string, uf: string, cidadeSlug: string) => ({
    idCaixa,
    uf,
    cidadeSlug,
  });
  const ordenados = [
    item("1", "RJ", "sao-goncalo"),
    item("2", "RJ", "sao-goncalo"),
    item("3", "RJ", "sao-goncalo"),
    item("4", "PA", "belem"),
    item("5", "RJ", "sao-goncalo"),
    item("6", "PA", "sao-goncalo"),
    item("7", "PA", "belem"),
    item("8", "PA", "belem"),
  ];

  assert.deepEqual(
    limitarPorCidade(ordenados).map((i) => i.idCaixa),
    ["1", "2", "4", "6", "7"],
  );
  assert.deepEqual(
    limitarPorCidade(ordenados, 1).map((i) => i.idCaixa),
    ["1", "4", "6"],
  );
});

test("selecionarQuedasRecentes ordena pelo percentual e ignora carga e janela", () => {
  const agora = new Date("2026-10-20T12:00:00Z");
  const cortes = new Map<string, Date | null>([
    ["RJ", new Date("2026-10-19T00:00:00Z")],
    ["AP", null],
  ]);
  const quedas = selecionarQuedasRecentes(
    [
      // 10% de queda
      {
        idCaixa: "1",
        uf: "RJ",
        criadoEm: new Date("2026-10-20T06:00:00Z"),
        precoAnterior: "100000.00",
        precoAtual: "90000.00",
      },
      // 25% de queda
      {
        idCaixa: "2",
        uf: "RJ",
        criadoEm: new Date("2026-10-20T06:00:00Z"),
        precoAnterior: "200000.00",
        precoAtual: "150000.00",
      },
      // carga inicial (antes do corte)
      {
        idCaixa: "3",
        uf: "RJ",
        criadoEm: new Date("2026-10-18T06:00:00Z"),
        precoAnterior: "100000.00",
        precoAtual: "10000.00",
      },
      // UF sem corte
      {
        idCaixa: "4",
        uf: "AP",
        criadoEm: new Date("2026-10-20T06:00:00Z"),
        precoAnterior: "100000.00",
        precoAtual: "50000.00",
      },
      // preço não caiu
      {
        idCaixa: "5",
        uf: "RJ",
        criadoEm: new Date("2026-10-20T06:00:00Z"),
        precoAnterior: "100000.00",
        precoAtual: "100000.00",
      },
    ],
    cortes,
    agora,
  );

  assert.deepEqual(
    quedas.map((q) => [q.idCaixa, q.quedaPct, q.precoAnterior]),
    [
      ["2", "25.00", "200000.00"],
      ["1", "10.00", "100000.00"],
    ],
  );
});

test("selecionarQuedasRecentes mantém só a queda mais recente do imóvel", () => {
  const agora = new Date("2026-10-20T12:00:00Z");
  const cortes = new Map<string, Date | null>([
    ["GO", new Date("2026-10-01T00:00:00Z")],
  ]);
  const quedas = selecionarQuedasRecentes(
    [
      {
        idCaixa: "9",
        uf: "GO",
        criadoEm: new Date("2026-10-15T06:00:00Z"),
        precoAnterior: "100000.00",
        precoAtual: "50000.00",
      },
      {
        idCaixa: "9",
        uf: "GO",
        criadoEm: new Date("2026-10-20T06:00:00Z"),
        precoAnterior: "50000.00",
        precoAtual: "45000.00",
      },
    ],
    cortes,
    agora,
  );

  assert.equal(quedas.length, 1);
  assert.equal(quedas[0].quedaPct, "10.00");
  assert.equal(quedas[0].quedaEm, "2026-10-20T06:00:00.000Z");
});
