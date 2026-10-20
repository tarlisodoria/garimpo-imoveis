import assert from "node:assert/strict";
import { test } from "node:test";

import {
  cortesCargaInicial,
  eventoAposCargaInicial,
  type ColetaParaCorte,
} from "./carga-inicial";

const d = (iso: string) => new Date(iso);

test("corte é o início da coleta seguinte à primeira coleta sucesso", () => {
  const coletas: ColetaParaCorte[] = [
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

test("falha não conta como carga: a carga é a primeira sucesso depois dela", () => {
  // Caso do RJ: linha órfã reparada para `falha`, reimportação depois.
  const cortes = cortesCargaInicial([
    { uf: "RJ", status: "falha", iniciadoEm: d("2026-10-18T06:38:00Z") },
    {
      uf: "RJ",
      status: "sem_alteracao",
      iniciadoEm: d("2026-10-19T06:53:00Z"),
    },
    { uf: "RJ", status: "sucesso", iniciadoEm: d("2026-10-20T01:00:00Z") },
  ]);

  assert.equal(cortes.get("RJ"), null);
});

test("UF só com a carga não tem corte e UF sem sucesso fica de fora", () => {
  const cortes = cortesCargaInicial([
    { uf: "AP", status: "sucesso", iniciadoEm: d("2026-10-16T10:00:00Z") },
    { uf: "AM", status: "falha", iniciadoEm: d("2026-10-16T10:00:00Z") },
  ]);

  assert.equal(cortes.get("AP"), null);
  assert.equal(cortes.has("AM"), false);
});

test("eventoAposCargaInicial descarta carga, UF sem corte e UF desconhecida", () => {
  const cortes = new Map<string, Date | null>([
    ["PA", d("2026-10-16T10:05:00Z")],
    ["AP", null],
  ]);

  assert.equal(
    eventoAposCargaInicial(
      { uf: "PA", criadoEm: d("2026-10-16T10:01:00Z") },
      cortes,
    ),
    false,
  );
  assert.equal(
    eventoAposCargaInicial(
      { uf: "PA", criadoEm: d("2026-10-16T10:05:00Z") },
      cortes,
    ),
    true,
  );
  assert.equal(
    eventoAposCargaInicial(
      { uf: "AP", criadoEm: d("2026-10-20T10:00:00Z") },
      cortes,
    ),
    false,
  );
  assert.equal(
    eventoAposCargaInicial(
      { uf: "SP", criadoEm: d("2026-10-20T10:00:00Z") },
      cortes,
    ),
    false,
  );
});
