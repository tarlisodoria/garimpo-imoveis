export const NOMES_UF: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AM: "Amazonas",
  AP: "Amapá",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MG: "Minas Gerais",
  MS: "Mato Grosso do Sul",
  MT: "Mato Grosso",
  PA: "Pará",
  PB: "Paraíba",
  PE: "Pernambuco",
  PI: "Piauí",
  PR: "Paraná",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RO: "Rondônia",
  RR: "Roraima",
  RS: "Rio Grande do Sul",
  SC: "Santa Catarina",
  SE: "Sergipe",
  SP: "São Paulo",
  TO: "Tocantins",
};

export function nomeUf(uf: string) {
  return NOMES_UF[uf.toUpperCase()] ?? uf.toUpperCase();
}

// Estados que pedem artigo: "no Pará", "na Bahia"; os demais usam "em".
const PREPOSICAO_UF: Record<string, "no" | "na"> = {
  AC: "no",
  AM: "no",
  AP: "no",
  BA: "na",
  CE: "no",
  DF: "no",
  ES: "no",
  MA: "no",
  MS: "no",
  MT: "no",
  PA: "no",
  PB: "na",
  PI: "no",
  PR: "no",
  RJ: "no",
  RN: "no",
  RS: "no",
  TO: "no",
};

/** "no Pará", "na Bahia", "em São Paulo". */
export function noUf(uf: string) {
  const sigla = uf.toUpperCase();
  return `${PREPOSICAO_UF[sigla] ?? "em"} ${nomeUf(sigla)}`;
}
