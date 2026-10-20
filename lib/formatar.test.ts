import assert from "node:assert/strict";
import { test } from "node:test";

import { toDataCurta, toDiaMes } from "./formatar";

test("toDiaMes não desloca datas sem horário para o dia anterior", () => {
  assert.equal(toDiaMes("2026-10-16"), "16/10");
  assert.equal(toDiaMes("2026-01-01"), "01/01");
  // O formatador com fuso mostraria 15/10 para a mesma data.
  assert.equal(toDataCurta("2026-10-16"), "15/10");
});

test("toDiaMes rejeita formatos inesperados", () => {
  assert.equal(toDiaMes(null), null);
  assert.equal(toDiaMes("16/10/2026"), null);
  assert.equal(toDiaMes("2026-10-16T00:00:00Z"), null);
});
