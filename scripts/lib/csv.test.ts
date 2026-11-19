import assert from "node:assert/strict";
import test from "node:test";

import { campoCsv, formatarValor, linhaChecksum, paraCsv } from "./csv";

test("formatarValor: nulo vazio, data em ISO UTC, jsonb em JSON", () => {
  assert.equal(formatarValor(null), "");
  assert.equal(formatarValor(undefined), "");
  assert.equal(
    formatarValor(new Date("2026-11-15T13:59:40.568Z")),
    "2026-11-15T13:59:40.568Z",
  );
  assert.equal(
    formatarValor({ precoAnterior: "10.00", precoAtual: "9.00" }),
    '{"precoAnterior":"10.00","precoAtual":"9.00"}',
  );
  assert.equal(formatarValor(true), "true");
  assert.equal(formatarValor("111638.68"), "111638.68");
});

test("campoCsv só usa aspas quando precisa e dobra as aspas internas", () => {
  assert.equal(campoCsv("CENTRO"), "CENTRO");
  assert.equal(campoCsv("RUA A, N. 10"), '"RUA A, N. 10"');
  assert.equal(campoCsv('casa "nova"'), '"casa ""nova"""');
  assert.equal(campoCsv("linha 1\nlinha 2"), '"linha 1\nlinha 2"');
  assert.equal(campoCsv({ a: 1, b: 2 }), '"{""a"":1,""b"":2}"');
  assert.equal(campoCsv("ÁGUA"), "ÁGUA");
});

test("paraCsv mantém a ordem das colunas e termina com quebra de linha", () => {
  const csv = paraCsv(
    ["id_caixa", "bairro", "preco"],
    [
      { preco: "1.00", id_caixa: "1", bairro: null },
      { id_caixa: "2", bairro: "VILA, NOVA", preco: "2.50" },
    ],
  );
  assert.equal(csv, 'id_caixa,bairro,preco\n1,,1.00\n2,"VILA, NOVA",2.50\n');
});

test("paraCsv sem linhas gera só o cabeçalho", () => {
  assert.equal(paraCsv(["a", "b"], []), "a,b\n");
});

test("linhaChecksum segue o formato do sha256sum e recusa hash inválido", () => {
  const hash = "a".repeat(64);
  assert.equal(linhaChecksum(hash, "imoveis.csv"), `${hash}  imoveis.csv`);
  assert.throws(() => linhaChecksum("xyz", "imoveis.csv"));
});
