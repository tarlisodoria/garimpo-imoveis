import test from "node:test";
import assert from "node:assert/strict";

import { lerCaracteristicasImovel } from "./caracteristicas-imovel";

test("extrai apenas características numéricas explícitas da descrição da Caixa", () => {
  assert.deepEqual(
    lerCaracteristicasImovel(
      "Casa, 0.00 de área total, 120.00 de área privativa, 240.00 de área do terreno, 2 qto(s), WC, 1 sala(s), cozinha, 1 vaga(s) de garagem.",
    ),
    {
      quartos: 2,
      banheiros: 1,
      salas: 1,
      vagas: 1,
      areaTotal: null,
      areaPrivativa: 120,
      areaTerreno: 240,
    },
  );
});

test("considera WC informado como um banheiro", () => {
  assert.deepEqual(lerCaracteristicasImovel("Apartamento, WC, cozinha."), {
    quartos: null,
    banheiros: 1,
    salas: null,
    vagas: null,
    areaTotal: null,
    areaPrivativa: null,
    areaTerreno: null,
  });
});

test("reconhece banheiro contado e áreas com decimal em formato brasileiro", () => {
  assert.deepEqual(
    lerCaracteristicasImovel(
      "Apartamento, 2 quarto(s), 1 banheiro(s), 1 vaga(s) de garagem, 65,5 de área privativa.",
    ),
    {
      quartos: 2,
      banheiros: 1,
      salas: null,
      vagas: 1,
      areaTotal: null,
      areaPrivativa: 65.5,
      areaTerreno: null,
    },
  );
});

test("usa a quantidade explícita quando WC vem acompanhado de número", () => {
  assert.equal(lerCaracteristicasImovel("Apartamento, 2 WC.").banheiros, 2);
});

test("ignora valores zero, campos ausentes e WC dentro de outra palavra", () => {
  assert.deepEqual(
    lerCaracteristicasImovel(
      "Terreno, 0,00 de área total, 0,00 de área privativa, 0 qto(s), WCC, 0 sala(s).",
    ),
    {
      quartos: null,
      banheiros: null,
      salas: null,
      vagas: null,
      areaTotal: null,
      areaPrivativa: null,
      areaTerreno: null,
    },
  );
});
