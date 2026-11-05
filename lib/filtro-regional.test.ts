import assert from "node:assert/strict";
import test from "node:test";

import type { CardImovelDados } from "../components/home/CardImovel";
import { FILTROS_CARACTERISTICAS_VAZIOS } from "./filtro-caracteristicas";
import { filtrarImoveisRegionais } from "./filtro-regional";

function imovel(
  idCaixa: string,
  overrides: Partial<CardImovelDados> = {},
): CardImovelDados {
  return {
    idCaixa,
    uf: "PA",
    cidade: "BELEM",
    cidadeSlug: "belem",
    bairro: "CENTRO",
    endereco: "RUA A, N. 1",
    tipo: "Casa",
    preco: "100000.00",
    valorAvaliacao: "150000.00",
    descontoPct: "33.33",
    modalidade: "Venda Online",
    aceitaFinanciamento: true,
    linkOficial: "https://venda-imoveis.caixa.gov.br/",
    economiaReais: "50000.00",
    entrouEm: null,
    selo: null,
    caracteristicas: {
      quartos: 2,
      banheiros: 1,
      salas: 1,
      vagas: 1,
      areaTotal: null,
      areaPrivativa: 65,
      areaTerreno: null,
    },
    encerramentoEm: null,
    cidadeNome: "Belém",
    listaDe: null,
    ...overrides,
  };
}

const filtrosVazios = {
  tipo: "",
  cidadeSlug: "",
  bairro: "",
  precoMinimo: null,
  precoMaximo: null,
  caracteristicas: FILTROS_CARACTERISTICAS_VAZIOS,
};

test("filtra por cidade na página estadual", () => {
  const belem = imovel("1");
  const ananindeua = imovel("2", {
    cidade: "ANANINDEUA",
    cidadeSlug: "ananindeua",
  });

  assert.deepEqual(
    filtrarImoveisRegionais([belem, ananindeua], {
      ...filtrosVazios,
      modo: "estado",
      cidadeSlug: "ananindeua",
    }),
    [ananindeua],
  );
});

test("filtra por bairro, tipo, preço e características na página municipal", () => {
  const centro = imovel("1");
  const bairro = imovel("2", { bairro: "GUAMA", tipo: "Apartamento" });

  assert.deepEqual(
    filtrarImoveisRegionais([centro, bairro], {
      ...filtrosVazios,
      modo: "cidade",
      bairro: "GUAMA",
      tipo: "Apartamento",
      precoMinimo: 90_000,
      precoMaximo: 110_000,
      caracteristicas: {
        ...FILTROS_CARACTERISTICAS_VAZIOS,
        quartos: 2,
      },
    }),
    [bairro],
  );
});

test("não considera metragem nem contagens ausentes como correspondências", () => {
  const semDados = imovel("1", {
    caracteristicas: {
      quartos: null,
      banheiros: null,
      salas: null,
      vagas: null,
      areaTotal: null,
      areaPrivativa: null,
      areaTerreno: null,
    },
  });

  assert.deepEqual(
    filtrarImoveisRegionais([semDados], {
      ...filtrosVazios,
      modo: "cidade",
      caracteristicas: {
        ...FILTROS_CARACTERISTICAS_VAZIOS,
        quartos: 1,
      },
    }),
    [],
  );
});
