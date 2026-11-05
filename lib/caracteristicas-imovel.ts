export type CaracteristicasImovel = {
  quartos: number | null;
  banheiros: number | null;
  salas: number | null;
  vagas: number | null;
  areaTotal: number | null;
  areaPrivativa: number | null;
  areaTerreno: number | null;
};

function contar(texto: string, padrao: RegExp): number | null {
  const valor = texto.match(padrao)?.[1];
  if (!valor) return null;

  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function metragem(texto: string, tipo: string): number | null {
  const padrao = new RegExp(
    String.raw`(\d+(?:[.,]\d+)?)\s+de área ${tipo}(?![\p{L}])`,
    "iu",
  );
  const valor = texto.match(padrao)?.[1];
  if (!valor) return null;

  const numero = Number(valor.replace(",", "."));
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

export function lerCaracteristicasImovel(
  descricao: string,
): CaracteristicasImovel {
  const banheiros =
    contar(descricao, /(\d+)\s*banheiro(?:\(s\)|s)?/iu) ??
    contar(descricao, /(\d+)\s*WC\b/iu) ??
    (/\bWC\b/iu.test(descricao) ? 1 : null);

  return {
    quartos: contar(descricao, /(\d+)\s*(?:qto|quarto)(?:\(s\)|s)?/iu),
    banheiros,
    salas: contar(descricao, /(\d+)\s*sala(?:\(s\)|s)?/iu),
    vagas: contar(descricao, /(\d+)\s*vaga(?:\(s\)|s)?\s+de garagem/iu),
    areaTotal: metragem(descricao, "total"),
    areaPrivativa: metragem(descricao, "privativa"),
    areaTerreno: metragem(descricao, "do terreno"),
  };
}
