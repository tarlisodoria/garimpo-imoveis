import test from "node:test";
import assert from "node:assert/strict";

import { listaImoveisPaAnonFixture } from "./__fixtures__/lista-imoveis-pa-anon";
import { CSV_HEADER, decodeCaixaCsvFile, parseCaixaCsvFile } from "./caixa-csv";

test("decodeCaixaCsvFile preserva acentos do arquivo Windows-1252", () => {
  const content = decodeCaixaCsvFile(listaImoveisPaAnonFixture);

  assert.match(content, /Lista de Imóveis da Caixa/);
  assert.match(content, /Data de geração/);
  assert.match(content, /Endereço/);
  assert.match(content, /Não/);
});

test("parseCaixaCsvFile interpreta metadado, cabecalho e linhas reais", () => {
  const parsed = parseCaixaCsvFile(listaImoveisPaAnonFixture);

  assert.equal(parsed.dataGeracao, "15/10/2026");
  assert.equal(parsed.rows.length, 2);
  assert.deepEqual(Object.keys(parsed.rows[0]), [
    "idCaixa",
    "uf",
    "cidade",
    "bairro",
    "endereco",
    "tipo",
    "descricaoCurta",
    "preco",
    "valorAvaliacao",
    "descontoPct",
    "aceitaFinanciamento",
    "modalidade",
    "linkOficial",
  ]);
  assert.deepEqual(parsed.rows[0], {
    idCaixa: "9000000000001",
    uf: "PA",
    cidade: "ALTAMIRA",
    bairro: "CENTRO",
    endereco: "RUA EXEMPLO, N. 10",
    tipo: "Casa",
    descricaoCurta:
      "Casa, 0.00 de área total, 120.00 de área privativa, 120.00 de área do terreno,  2 qto(s), varanda, a.serv, WC, 1 sala(s), cozinha.",
    preco: "111638.68",
    valorAvaliacao: "239000.00",
    descontoPct: "53.29",
    aceitaFinanciamento: true,
    modalidade: "Venda Direta Online",
    linkOficial:
      "https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?hdnimovel=9000000000001",
  });
  assert.equal(parsed.rows[1]?.aceitaFinanciamento, false);
  assert.equal(parsed.rows[1]?.tipo, "Apartamento");
});

test("parseCaixaCsvFile rejeita cabecalho inesperado", () => {
  const invalidHeader = Buffer.from(
    [
      "",
      " Lista de Imóveis da Caixa;;Data de geração:;15/10/2026;;;;;;;",
      CSV_HEADER.map((value) =>
        value === "Cidade" ? "Municipio" : value,
      ).join(";"),
      "",
      " 9000000000001 ;PA ;ALTAMIRA ;CENTRO ;RUA EXEMPLO, N. 10 ;111.638,68;239.000,00;53.29;Sim;Casa, 0.00 de área total.;Venda Direta Online;https://example.com/imovel/1",
    ].join("\r\n"),
    "latin1",
  );

  assert.throws(
    () => parseCaixaCsvFile(invalidHeader),
    /Cabecalho invalido na coluna 3/,
  );
});

test("parseCaixaCsvFile rejeita valor inesperado em financiamento", () => {
  const invalidFinancing = Buffer.from(
    [
      "",
      " Lista de Imóveis da Caixa;;Data de geração:;15/10/2026;;;;;;;",
      CSV_HEADER.join(";"),
      "",
      " 9000000000001 ;PA ;ALTAMIRA ;CENTRO ;RUA EXEMPLO, N. 10 ;111.638,68;239.000,00;53.29;Talvez;Casa, 0.00 de área total.;Venda Direta Online;https://example.com/imovel/1",
    ].join("\r\n"),
    "latin1",
  );

  assert.throws(
    () => parseCaixaCsvFile(invalidFinancing),
    /Valor de financiamento invalido/,
  );
});
