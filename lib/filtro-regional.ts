import type { CardImovelDados } from "../components/home/CardImovel";
import {
  filtrarPorCaracteristicas,
  type FiltrosCaracteristicas,
} from "./filtro-caracteristicas";

export type FiltrosBuscaRegional = {
  modo: "estado" | "cidade";
  tipo: string;
  cidadeSlug: string;
  bairro: string;
  precoMinimo: number | null;
  precoMaximo: number | null;
  caracteristicas: FiltrosCaracteristicas;
};

export function filtrarImoveisRegionais(
  imoveis: CardImovelDados[],
  filtros: FiltrosBuscaRegional,
) {
  const base = imoveis.filter((imovel) => {
    if (filtros.tipo && imovel.tipo !== filtros.tipo) return false;
    if (
      filtros.modo === "estado" &&
      filtros.cidadeSlug &&
      imovel.cidadeSlug !== filtros.cidadeSlug
    ) {
      return false;
    }
    if (
      filtros.modo === "cidade" &&
      filtros.bairro &&
      imovel.bairro !== filtros.bairro
    ) {
      return false;
    }

    const preco = Number(imovel.preco);
    if (
      filtros.precoMinimo !== null &&
      (!Number.isFinite(preco) || preco < filtros.precoMinimo)
    ) {
      return false;
    }
    if (
      filtros.precoMaximo !== null &&
      (!Number.isFinite(preco) || preco > filtros.precoMaximo)
    ) {
      return false;
    }
    return true;
  });

  return filtrarPorCaracteristicas(base, filtros.caracteristicas);
}
