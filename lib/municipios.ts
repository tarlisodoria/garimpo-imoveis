// Nome oficial do município (IBGE, com acentos) a partir do nome da Caixa.
// Só para código de servidor/build: importa um JSON de ~200 KB, que não deve
// ir para componentes cliente. Esses recebem o nome já resolvido.

import dados from "../data/municipios-ibge.json";
import { formatarLocal } from "./formatar-local";
import { slugify } from "./slug";

const municipios = (
  dados as { municipios: Record<string, Record<string, string>> }
).municipios;

/**
 * Procura o município pelo slug dentro da UF; sem correspondência (regiões
 * administrativas do DF, distritos, grafias diferentes), cai no formato
 * título de `formatarLocal`, sem reacentuar.
 */
export function nomeCidade(uf: string, nomeFonte: string): string {
  return (
    municipios[uf.toUpperCase()]?.[slugify(nomeFonte)] ??
    formatarLocal(nomeFonte)
  );
}
