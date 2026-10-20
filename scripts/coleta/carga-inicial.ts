export type ColetaParaCorte = {
  uf: string;
  status: "sucesso" | "falha" | "sem_alteracao";
  iniciadoEm: Date;
};

export type EventoComUf = {
  uf: string;
  criadoEm: Date;
};

/**
 * A carga inicial de uma UF é a primeira coleta `sucesso` (coletas
 * `sem_alteracao` e `falha` não contam). Seus eventos `novo` representam a
 * base inteira, não novidades. Para cada UF devolve o instante de corte: o
 * início da primeira coleta seguinte à carga. Eventos antes do corte são da
 * carga. Sem coleta seguinte o corte é `null` e nenhum evento da UF vale.
 * UFs sem carga ficam fora do mapa (nenhum evento vale).
 */
export function cortesCargaInicial(
  coletas: ColetaParaCorte[],
): Map<string, Date | null> {
  const porUf = new Map<string, ColetaParaCorte[]>();

  for (const coleta of coletas) {
    const lista = porUf.get(coleta.uf) ?? [];
    lista.push(coleta);
    porUf.set(coleta.uf, lista);
  }

  const cortes = new Map<string, Date | null>();

  for (const [uf, lista] of porUf) {
    const ordenadas = [...lista].sort(
      (a, b) => a.iniciadoEm.getTime() - b.iniciadoEm.getTime(),
    );
    const indiceCarga = ordenadas.findIndex((c) => c.status === "sucesso");

    if (indiceCarga === -1) {
      continue;
    }

    const inicioCarga = ordenadas[indiceCarga].iniciadoEm.getTime();
    const seguinte = ordenadas
      .slice(indiceCarga + 1)
      .find((c) => c.iniciadoEm.getTime() > inicioCarga);

    cortes.set(uf, seguinte ? seguinte.iniciadoEm : null);
  }

  return cortes;
}

/** O evento aconteceu depois da carga inicial da sua UF? */
export function eventoAposCargaInicial(
  evento: EventoComUf,
  cortes: Map<string, Date | null>,
): boolean {
  const corte = cortes.get(evento.uf);

  if (!corte) {
    return false;
  }

  return evento.criadoEm.getTime() >= corte.getTime();
}
