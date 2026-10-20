import snapshot from "../data/public-snapshot.json";

import { nomeCidade } from "./municipios";
import {
  calcularEconomia,
  limitarPorCidade,
  type SeloImovel,
} from "./snapshot-calculos";

export type PublicImovel = {
  idCaixa: string;
  uf: string;
  cidade: string;
  cidadeSlug: string;
  bairro: string | null;
  endereco: string;
  tipo: string | null;
  preco: string;
  valorAvaliacao: string;
  descontoPct: string;
  modalidade: string;
  aceitaFinanciamento: boolean;
  linkOficial: string;
  economiaReais: string;
  entrouEm: string | null;
  selo: SeloImovel;
  /** Nome oficial do município (IBGE), resolvido no servidor. */
  cidadeNome: string;
  /** Data da lista oficial da UF de onde vieram modalidade e valores. */
  listaDe: string | null;
};

/** Formato bruto do JSON: os campos novos podem faltar em snapshots antigos. */
type RawImovel = Omit<
  PublicImovel,
  "economiaReais" | "entrouEm" | "selo" | "cidadeNome" | "listaDe"
> & {
  economiaReais?: string;
  entrouEm?: string | null;
  selo?: string | null;
};

type RawCidade = Omit<PublicCidade, "topDescontos" | "nomeExibicao"> & {
  topDescontos: RawImovel[];
};
type RawUf = Omit<PublicUf, "topDescontos" | "cidades" | "listaDe"> & {
  listaDe?: string | null;
  topDescontos: RawImovel[];
  cidades: RawCidade[];
};
type RawSnapshot = {
  generatedAt: string | null;
  summary: Omit<PublicSnapshot["summary"], "novos7d" | "quedas7d"> & {
    novos7d?: number;
    quedas7d?: number;
  };
  topDescontos: RawImovel[];
  ufs: RawUf[];
  quedasRecentes?: Array<RawImovel & QuedaInfo>;
};

export type PublicCidade = {
  nome: string;
  /** Nome oficial do município (IBGE); `nome` é o texto bruto da Caixa. */
  nomeExibicao: string;
  slug: string;
  totalImoveis: number;
  topDescontos: PublicImovel[];
};

export type PublicUf = {
  uf: string;
  listaDe: string | null;
  totalImoveis: number;
  topDescontos: PublicImovel[];
  cidades: PublicCidade[];
};

type QuedaInfo = {
  precoAnterior: string;
  /** Percentual da queda sobre o preço anterior. */
  quedaPct: string;
  quedaEm: string;
};

export type PublicQueda = PublicImovel & QuedaInfo;

export type PublicSnapshot = {
  generatedAt: string | null;
  summary: {
    totalImoveis: number;
    totalUfs: number;
    totalCidades: number;
    novos7d: number;
    quedas7d: number;
  };
  topDescontos: PublicImovel[];
  ufs: PublicUf[];
  quedasRecentes: PublicQueda[];
};

export function normalizarImovel(
  raw: RawImovel,
  listaDe: string | null = null,
): PublicImovel {
  return {
    ...raw,
    economiaReais:
      raw.economiaReais ?? calcularEconomia(raw.preco, raw.valorAvaliacao),
    entrouEm: raw.entrouEm ?? null,
    selo: raw.selo === "novo" || raw.selo === "baixou" ? raw.selo : null,
    cidadeNome: nomeCidade(raw.uf, raw.cidade),
    listaDe,
  };
}

export function normalizarSnapshot(raw: RawSnapshot): PublicSnapshot {
  const listas = new Map(raw.ufs.map((uf) => [uf.uf, uf.listaDe ?? null]));
  const imovel = (item: RawImovel) =>
    normalizarImovel(item, listas.get(item.uf) ?? null);

  return {
    generatedAt: raw.generatedAt,
    summary: {
      ...raw.summary,
      novos7d: raw.summary.novos7d ?? 0,
      quedas7d: raw.summary.quedas7d ?? 0,
    },
    // O limite por cidade também vale para snapshots gerados antes dele.
    topDescontos: limitarPorCidade(raw.topDescontos.map(imovel)),
    quedasRecentes: (raw.quedasRecentes ?? []).map((queda) => ({
      ...imovel(queda),
      precoAnterior: queda.precoAnterior,
      quedaPct: queda.quedaPct,
      quedaEm: queda.quedaEm,
    })),
    ufs: raw.ufs.map((uf) => ({
      ...uf,
      listaDe: uf.listaDe ?? null,
      topDescontos: limitarPorCidade(uf.topDescontos.map(imovel)),
      cidades: uf.cidades.map((cidade) => ({
        ...cidade,
        nomeExibicao: nomeCidade(uf.uf, cidade.nome),
        topDescontos: cidade.topDescontos.map(imovel),
      })),
    })),
  };
}

let cache: PublicSnapshot | null = null;

export function getPublicSnapshot(): PublicSnapshot {
  cache ??= normalizarSnapshot(snapshot as RawSnapshot);
  return cache;
}

export { toCurrency, toPercent } from "./formatar";
