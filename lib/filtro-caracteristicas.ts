import type { CaracteristicasImovel } from "./caracteristicas-imovel";

export type FiltrosCaracteristicas = {
  quartos: number | null;
  banheiros: number | null;
  salas: number | null;
  vagas: number | null;
  areaMinima: number | null;
  areaMaxima: number | null;
};

export const FILTROS_CARACTERISTICAS_VAZIOS: FiltrosCaracteristicas = {
  quartos: null,
  banheiros: null,
  salas: null,
  vagas: null,
  areaMinima: null,
  areaMaxima: null,
};

export function filtrarPorCaracteristicas<
  T extends { caracteristicas: CaracteristicasImovel },
>(imoveis: T[], filtros: FiltrosCaracteristicas) {
  return imoveis.filter((imovel) => {
    const { caracteristicas } = imovel;
    for (const campo of ["quartos", "banheiros", "salas", "vagas"] as const) {
      const minimo = filtros[campo];
      if (minimo !== null) {
        const quantidade = caracteristicas[campo];
        if (quantidade === null || quantidade < minimo) return false;
      }
    }

    if (filtros.areaMinima !== null || filtros.areaMaxima !== null) {
      const area =
        caracteristicas.areaPrivativa ??
        caracteristicas.areaTotal ??
        caracteristicas.areaTerreno;
      if (
        area === null ||
        (filtros.areaMinima !== null && area < filtros.areaMinima) ||
        (filtros.areaMaxima !== null && area > filtros.areaMaxima)
      ) {
        return false;
      }
    }

    return true;
  });
}
