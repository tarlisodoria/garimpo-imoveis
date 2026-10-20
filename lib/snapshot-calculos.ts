import {
  eventoAposCargaInicial,
  type ColetaParaCorte,
} from "../scripts/coleta/carga-inicial";

// A regra da carga inicial é única: a mesma usada pelo coletor.
export { cortesCargaInicial } from "../scripts/coleta/carga-inicial";
export type ColetaResumo = ColetaParaCorte;

export const JANELA_DIAS = 7;

const JANELA_MS = JANELA_DIAS * 24 * 60 * 60 * 1000;

export type SeloImovel = "novo" | "baixou" | null;

export type EventoResumo = {
  idCaixa: string;
  uf: string;
  tipo: string;
  criadoEm: Date;
};

export type ResumoEventos = {
  novos7d: number;
  quedas7d: number;
  selos: Map<string, Exclude<SeloImovel, null>>;
};

/** Avaliação menos preço, com duas casas; nunca negativa. */
export function calcularEconomia(
  preco: string,
  valorAvaliacao: string,
): string {
  const economia = Number(valorAvaliacao) - Number(preco);

  if (!Number.isFinite(economia) || economia <= 0) {
    return "0.00";
  }

  return economia.toFixed(2);
}

export function eventoConta(
  evento: EventoResumo,
  cortes: Map<string, Date | null>,
  agora: Date,
): boolean {
  return (
    eventoAposCargaInicial(evento, cortes) &&
    evento.criadoEm.getTime() >= agora.getTime() - JANELA_MS
  );
}

/**
 * Conta eventos `novo` e `queda_preco` dos últimos 7 dias, fora da carga
 * inicial, e define o selo de cada imóvel pelo evento mais recente.
 */
export function resumirEventos(
  eventos: EventoResumo[],
  cortes: Map<string, Date | null>,
  agora: Date,
): ResumoEventos {
  let novos7d = 0;
  let quedas7d = 0;
  const ultimo = new Map<string, EventoResumo>();

  for (const evento of eventos) {
    if (evento.tipo !== "novo" && evento.tipo !== "queda_preco") continue;
    if (!eventoConta(evento, cortes, agora)) continue;

    if (evento.tipo === "novo") novos7d += 1;
    else quedas7d += 1;

    const atual = ultimo.get(evento.idCaixa);
    if (!atual || evento.criadoEm.getTime() >= atual.criadoEm.getTime()) {
      ultimo.set(evento.idCaixa, evento);
    }
  }

  const selos = new Map<string, "novo" | "baixou">();
  for (const [idCaixa, evento] of ultimo) {
    selos.set(idCaixa, evento.tipo === "novo" ? "novo" : "baixou");
  }

  return { novos7d, quedas7d, selos };
}

export const MAX_DESTAQUES_POR_CIDADE = 2;

/**
 * Mantém a ordem recebida e deixa no máximo `max` imóveis por cidade (UF +
 * slug), para os destaques não ficarem concentrados numa só cidade.
 */
export function limitarPorCidade<T extends { uf: string; cidadeSlug: string }>(
  itens: T[],
  max = MAX_DESTAQUES_POR_CIDADE,
): T[] {
  const porCidade = new Map<string, number>();

  return itens.filter((item) => {
    const chave = `${item.uf}|${item.cidadeSlug}`;
    const atual = porCidade.get(chave) ?? 0;
    if (atual >= max) return false;
    porCidade.set(chave, atual + 1);
    return true;
  });
}

export type QuedaEvento = {
  idCaixa: string;
  uf: string;
  criadoEm: Date;
  precoAnterior: string;
  precoAtual: string;
};

export type QuedaSelecionada = {
  idCaixa: string;
  precoAnterior: string;
  /** Percentual da queda sobre o preço anterior, com duas casas. */
  quedaPct: string;
  quedaEm: string;
};

/**
 * Maiores quedas de preço dos últimos 7 dias, fora da carga inicial de cada
 * UF. Fica a queda mais recente de cada imóvel; ordena pelo percentual da
 * queda e desempata pelo número do imóvel.
 */
export function selecionarQuedasRecentes(
  eventos: QuedaEvento[],
  cortes: Map<string, Date | null>,
  agora: Date,
): QuedaSelecionada[] {
  const maisRecente = new Map<string, QuedaEvento>();

  for (const evento of eventos) {
    if (!eventoConta({ ...evento, tipo: "queda_preco" }, cortes, agora)) {
      continue;
    }
    const anterior = Number(evento.precoAnterior);
    const atual = Number(evento.precoAtual);
    if (!Number.isFinite(anterior) || !Number.isFinite(atual)) continue;
    if (anterior <= 0 || atual >= anterior) continue;

    const atualizado = maisRecente.get(evento.idCaixa);
    if (!atualizado || evento.criadoEm > atualizado.criadoEm) {
      maisRecente.set(evento.idCaixa, evento);
    }
  }

  return [...maisRecente.values()]
    .map((evento) => {
      const anterior = Number(evento.precoAnterior);
      const pct = ((anterior - Number(evento.precoAtual)) / anterior) * 100;
      return {
        idCaixa: evento.idCaixa,
        precoAnterior: anterior.toFixed(2),
        quedaPct: pct.toFixed(2),
        quedaEm: evento.criadoEm.toISOString(),
      };
    })
    .sort(
      (a, b) =>
        Number(b.quedaPct) - Number(a.quedaPct) ||
        a.idCaixa.localeCompare(b.idCaixa),
    );
}
