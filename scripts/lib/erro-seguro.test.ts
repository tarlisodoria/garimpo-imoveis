import assert from "node:assert/strict";
import { test } from "node:test";

import { erroParaPublicacao, erroSeguro } from "./erro-seguro";

const URL_FALSA =
  "postgresql://usuario_app:s3nh4-secreta@ep-exemplo-123456.sa-east-1.aws.neon.tech/neondb?sslmode=require";

test("mascara URL, senha, usuário, host e endpoint do banco", () => {
  const erro = new Error(
    `falha em ${URL_FALSA} (host ep-exemplo-123456.sa-east-1.aws.neon.tech, endpoint ep-exemplo-123456, senha s3nh4-secreta, usuario usuario_app)`,
  );
  const texto = erroSeguro(erro, URL_FALSA);

  for (const vazamento of [
    "s3nh4-secreta",
    "usuario_app",
    "ep-exemplo-123456",
    "neon.tech",
    "postgresql://",
  ]) {
    assert.equal(texto.includes(vazamento), false, vazamento);
  }
  assert.match(texto, /falha em \*\*\*/);
});

test("preserva a pilha e erros sem dados do banco", () => {
  const erro = new RangeError("Maximum call stack size exceeded");
  const texto = erroSeguro(erro, URL_FALSA);

  assert.match(texto, /^RangeError: Maximum call stack size exceeded/);
  assert.match(texto, /\n\s+at /);
});

test("funciona sem DATABASE_URL e com valores que não são Error", () => {
  assert.equal(erroSeguro("falha simples", undefined), "falha simples");
  assert.equal(erroSeguro(42, "não é url"), "42");
});

test("erroParaPublicacao mantém só a primeira linha, mascarada", () => {
  const comPilha = [
    `Error: Falha ao baixar CSV da Caixa para SP: HTTP 403. (${URL_FALSA})`,
    "    at coletarUf (/home/runner/work/garimpo-imoveis/scripts/coleta/run-coleta.ts:34:11)",
    "    at async main (/home/runner/work/garimpo-imoveis/scripts/coleta/run-coleta.ts:20:3)",
  ].join("\n");

  const publicado = erroParaPublicacao(comPilha, URL_FALSA);

  assert.equal(
    publicado,
    "Error: Falha ao baixar CSV da Caixa para SP: HTTP 403. (***)",
  );
  assert.ok(!publicado.includes("/home/runner"));
  assert.equal(erroParaPublicacao("\n\n  HTTP 502  \n", URL_FALSA), "HTTP 502");
  assert.equal(erroParaPublicacao("", URL_FALSA), "");
});
