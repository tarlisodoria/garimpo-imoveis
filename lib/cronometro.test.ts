import assert from "node:assert/strict";
import test from "node:test";

import { lerDataEncerramentoCaixa, prazoFuturo } from "./cronometro";

test("extrai somente o prazo previsto publicado pela página da Caixa", () => {
  assert.equal(
    lerDataEncerramentoCaixa(
      'carregaContador.asp", { strLista: ("1@@" + "05/11/2026 18:00:00" + "||" + "0,00")',
    ),
    "2026-11-05T21:00:00.000Z",
  );
});

test("não inventa prazo quando a página não publica a contagem", () => {
  assert.equal(
    lerDataEncerramentoCaixa("<html><body>Venda Direta Online</body></html>"),
    null,
  );
});

test("confirma se o prazo publicado ainda está ativo", () => {
  assert.equal(
    prazoFuturo("2026-11-05T21:00:00.000Z", new Date("2026-11-05T20:00:00Z")),
    true,
  );
  assert.equal(
    prazoFuturo("2026-11-05T21:00:00.000Z", new Date("2026-11-05T21:00:00Z")),
    false,
  );
  assert.equal(prazoFuturo("invalid"), false);
});
