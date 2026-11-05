import assert from "node:assert/strict";
import test from "node:test";

import type { CardImovelDados } from "../components/home/CardImovel";
import {
  filtrarPorCaracteristicas,
  FILTROS_CARACTERISTICAS_VAZIOS,
} from "./filtro-caracteristicas";

function imovel(
  caracteristicas: CardImovelDados["caracteristicas"],
): CardImovelDados {
  return {
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
    economiaReais: "50000.00",
    entrouEm: null,
    selo: null,
    caracteristicas,
    encerramentoEm: null,
    cidadeNome: "Belém",
    listaDe: null,
  };
}

test("filtra por quantidade mínima e mantém dados sem restrição", () => {
  const lista = [
    imovel({
      quartos: 2,
      banheiros: 1,
      salas: 1,
      vagas: 1,
      areaTotal: null,
      areaPrivativa: 65,
      areaTerreno: 120,
    }),
    imovel({
      quartos: null,
      banheiros: null,
      salas: null,
      vagas: null,
      areaTotal: null,
      areaPrivativa: null,
      areaTerreno: null,
    }),
  ];

  assert.equal(
    filtrarPorCaracteristicas(lista, FILTROS_CARACTERISTICAS_VAZIOS).length,
    2,
  );
  assert.deepEqual(
    filtrarPorCaracteristicas(lista, {
      ...FILTROS_CARACTERISTICAS_VAZIOS,
      quartos: 2,
    }),
    [lista[0]],
  );
});

test("filtra metragem usando área privativa e, na ausência, área do terreno", () => {
  const lista = [
    imovel({
      quartos: null,
      banheiros: null,
      salas: null,
      vagas: null,
      areaTotal: null,
      areaPrivativa: 65,
      areaTerreno: 120,
    }),
    imovel({
      quartos: null,
      banheiros: null,
      salas: null,
      vagas: null,
      areaTotal: null,
      areaPrivativa: null,
      areaTerreno: 90,
    }),
  ];

  assert.deepEqual(
    filtrarPorCaracteristicas(lista, {
      ...FILTROS_CARACTERISTICAS_VAZIOS,
      areaMinima: 80,
    }),
    [lista[1]],
  );
});
