// CSV no formato da RFC 4180: separador vírgula, aspas duplas só quando
// preciso e aspas internas dobradas. Fim de linha LF.

export type ValorCsv = string | number | boolean | Date | object | null;

/** Converte um valor do banco para texto: nulo vira vazio, data vira ISO 8601 em UTC, jsonb vira JSON. */
export function formatarValor(valor: ValorCsv | undefined): string {
  if (valor === null || valor === undefined) return "";
  if (valor instanceof Date) return valor.toISOString();
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

export function campoCsv(valor: ValorCsv | undefined): string {
  const texto = formatarValor(valor);
  return /[",\r\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

export function paraCsv(
  colunas: string[],
  linhas: Record<string, ValorCsv>[],
): string {
  const corpo = linhas.map((linha) =>
    colunas.map((coluna) => campoCsv(linha[coluna])).join(","),
  );
  return [colunas.join(","), ...corpo].join("\n") + "\n";
}

/** Uma linha no formato do `sha256sum`, para conferir com `sha256sum -c`. */
export function linhaChecksum(hashHex: string, arquivo: string): string {
  if (!/^[0-9a-f]{64}$/.test(hashHex))
    throw new Error("Hash SHA-256 inválido.");
  return `${hashHex}  ${arquivo}`;
}
