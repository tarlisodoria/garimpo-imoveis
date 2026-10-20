const CSV_HEADER = [
  "N° do imóvel",
  "UF",
  "Cidade",
  "Bairro",
  "Endereço",
  "Preço",
  "Valor de avaliação",
  "Desconto",
  "Financiamento",
  "Descrição",
  "Modalidade de venda",
  "Link de acesso",
] as const;

const WINDOWS_1252_DECODER = new TextDecoder("windows-1252");

export type CaixaCsvRow = {
  idCaixa: string;
  uf: string;
  cidade: string;
  bairro: string;
  endereco: string;
  tipo: string;
  descricaoCurta: string;
  preco: string;
  valorAvaliacao: string;
  descontoPct: string;
  aceitaFinanciamento: boolean;
  modalidade: string;
  linkOficial: string;
};

export type CaixaCsvParseResult = {
  dataGeracao: string | null;
  rows: CaixaCsvRow[];
};

export function decodeCaixaCsvFile(input: Uint8Array): string {
  return WINDOWS_1252_DECODER.decode(input);
}

export function parseCaixaCsvFile(input: Uint8Array): CaixaCsvParseResult {
  const content = decodeCaixaCsvFile(input);
  const nonEmptyLines = content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\r/g, ""))
    .filter((line) => line.trim() !== "");

  if (nonEmptyLines.length < 2) {
    throw new Error("Arquivo CSV da Caixa sem linhas suficientes.");
  }

  const metadataLine = cleanField(nonEmptyLines[0]);

  if (!metadataLine.startsWith("Lista de Imóveis da Caixa")) {
    throw new Error("Linha de metadado da Caixa nao reconhecida.");
  }

  const header = splitSemicolonLine(nonEmptyLines[1]);

  validateHeader(header);

  return {
    dataGeracao: extractGenerationDate(metadataLine),
    rows: nonEmptyLines.slice(2).map(parseDataLine),
  };
}

function parseDataLine(line: string): CaixaCsvRow {
  const columns = splitSemicolonLine(line);

  if (columns.length !== CSV_HEADER.length) {
    throw new Error(
      `Linha de dados invalida: esperadas ${CSV_HEADER.length} colunas, recebidas ${columns.length}.`,
    );
  }

  const [
    idCaixa,
    uf,
    cidade,
    bairro,
    endereco,
    preco,
    valorAvaliacao,
    descontoPct,
    financiamento,
    descricaoCurta,
    modalidade,
    linkOficial,
  ] = columns;

  return {
    idCaixa,
    uf,
    cidade,
    bairro,
    endereco,
    tipo: extractTipo(descricaoCurta),
    descricaoCurta,
    preco: normalizePtBrDecimal(preco),
    valorAvaliacao: normalizePtBrDecimal(valorAvaliacao),
    descontoPct: normalizeDiscount(descontoPct),
    aceitaFinanciamento: parseFinancing(financiamento),
    modalidade,
    linkOficial,
  };
}

function validateHeader(header: string[]) {
  if (header.length !== CSV_HEADER.length) {
    throw new Error(
      `Cabecalho invalido: esperadas ${CSV_HEADER.length} colunas, recebidas ${header.length}.`,
    );
  }

  header.forEach((column, index) => {
    if (column !== CSV_HEADER[index]) {
      throw new Error(
        `Cabecalho invalido na coluna ${index + 1}: esperado \"${CSV_HEADER[index]}\", recebido \"${column}\".`,
      );
    }
  });
}

function splitSemicolonLine(line: string) {
  return line.split(";").map(cleanField);
}

function cleanField(value: string) {
  return value.trim();
}

function extractGenerationDate(metadataLine: string) {
  const match = metadataLine.match(/Data de geração:;(\d{2}\/\d{2}\/\d{4})/);
  return match?.[1] ?? null;
}

function normalizePtBrDecimal(value: string) {
  return value.replace(/\./g, "").replace(",", ".");
}

function normalizeDiscount(value: string) {
  return value.replace(",", ".");
}

function parseFinancing(value: string) {
  if (value === "Sim") {
    return true;
  }

  if (value === "Não") {
    return false;
  }

  throw new Error(`Valor de financiamento invalido: \"${value}\".`);
}

function extractTipo(descricaoCurta: string) {
  return descricaoCurta.split(",", 1)[0]?.trim() ?? "";
}

export { CSV_HEADER };
