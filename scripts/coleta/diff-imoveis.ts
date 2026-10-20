import type { CaixaCsvRow } from "./caixa-csv";

export type ImovelSnapshot = {
  idCaixa: string;
  preco: string;
  descontoPct: string;
  modalidade: string;
  ativo: boolean;
};

export type ImovelUpsert = Omit<CaixaCsvRow, "descricaoCurta"> & {
  cidadeSlug: string;
  descricaoCurta: string;
  ativo: true;
  isNew: boolean;
};

export type HistoricoInsert = {
  idCaixa: string;
  data: string;
  preco: string;
  descontoPct: string;
  modalidade: string;
};

export type EventoInsert = {
  idCaixa: string;
  tipo: "novo" | "queda_preco" | "mudou_modalidade" | "saiu";
  detalhe: Record<string, unknown>;
};

export type DiffImoveisResult = {
  toUpsert: ImovelUpsert[];
  historyToInsert: HistoricoInsert[];
  eventsToInsert: EventoInsert[];
  deactivatedIds: string[];
};

export function diffImoveis(
  currentRows: CaixaCsvRow[],
  previousSnapshot: ImovelSnapshot[],
  dataReferencia: string,
): DiffImoveisResult {
  const previousById = new Map(
    previousSnapshot.map((row) => [row.idCaixa, row]),
  );
  const currentIds = new Set(currentRows.map((row) => row.idCaixa));

  const toUpsert: ImovelUpsert[] = [];
  const historyToInsert: HistoricoInsert[] = [];
  const eventsToInsert: EventoInsert[] = [];

  for (const row of currentRows) {
    const previous = previousById.get(row.idCaixa);
    const isNew = !previous;
    const priceChanged = previous ? previous.preco !== row.preco : false;
    const discountChanged = previous
      ? previous.descontoPct !== row.descontoPct
      : false;
    const modalidadeChanged = previous
      ? previous.modalidade !== row.modalidade
      : false;
    const priceDropped = previous
      ? compareDecimalStrings(row.preco, previous.preco) < 0
      : false;

    toUpsert.push({
      ...row,
      cidadeSlug: slugify(row.cidade),
      ativo: true,
      isNew,
    });

    if (isNew) {
      eventsToInsert.push({
        idCaixa: row.idCaixa,
        tipo: "novo",
        detalhe: {
          uf: row.uf,
          cidade: row.cidade,
          modalidade: row.modalidade,
          preco: row.preco,
        },
      });
    }

    if (priceDropped && previous) {
      eventsToInsert.push({
        idCaixa: row.idCaixa,
        tipo: "queda_preco",
        detalhe: {
          precoAnterior: previous.preco,
          precoAtual: row.preco,
          descontoAnterior: previous.descontoPct,
          descontoAtual: row.descontoPct,
        },
      });
    }

    if (modalidadeChanged && previous) {
      eventsToInsert.push({
        idCaixa: row.idCaixa,
        tipo: "mudou_modalidade",
        detalhe: {
          modalidadeAnterior: previous.modalidade,
          modalidadeAtual: row.modalidade,
        },
      });
    }

    if (isNew || priceChanged || discountChanged || modalidadeChanged) {
      historyToInsert.push({
        idCaixa: row.idCaixa,
        data: dataReferencia,
        preco: row.preco,
        descontoPct: row.descontoPct,
        modalidade: row.modalidade,
      });
    }
  }

  const deactivatedIds = previousSnapshot
    .filter((row) => row.ativo && !currentIds.has(row.idCaixa))
    .map((row) => row.idCaixa);

  for (const idCaixa of deactivatedIds) {
    eventsToInsert.push({
      idCaixa,
      tipo: "saiu",
      detalhe: {
        motivo: "ausente_no_csv_atual",
      },
    });
  }

  return {
    toUpsert,
    historyToInsert,
    eventsToInsert,
    deactivatedIds,
  };
}

function compareDecimalStrings(left: string, right: string) {
  return Number(left) - Number(right);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
