export type CategoriaImovel =
  "casa" | "apartamento" | "terreno" | "comercial" | "galpao" | "outros";

export type FaixaDePreco = { minimo: number; maximo: number };

export const REGIOES = [
  { nome: "Norte", ufs: ["AC", "AP", "AM", "PA", "RO", "RR", "TO"] },
  {
    nome: "Nordeste",
    ufs: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
  },
  { nome: "Centro-Oeste", ufs: ["DF", "GO", "MS", "MT"] },
  { nome: "Sudeste", ufs: ["ES", "MG", "RJ", "SP"] },
  { nome: "Sul", ufs: ["PR", "RS", "SC"] },
] as const;

export type Regiao = (typeof REGIOES)[number];

export const CATEGORIAS_IMOVEL: {
  id: CategoriaImovel;
  nome: string;
  cor: string;
}[] = [
  { id: "casa", nome: "Casas", cor: "#35e0c1" },
  { id: "apartamento", nome: "Apartamentos", cor: "#b28cff" },
  { id: "terreno", nome: "Terrenos", cor: "#ffbd55" },
  { id: "comercial", nome: "Comerciais", cor: "#58a9ff" },
  { id: "galpao", nome: "Galpões", cor: "#ff7182" },
  { id: "outros", nome: "Outros", cor: "#ec68b4" },
];

export function regiaoDaUf(uf: string): Regiao | undefined {
  return REGIOES.find((regiao) => regiao.ufs.some((sigla) => sigla === uf));
}

export function regiaoPorNome(nome: string | null): Regiao | undefined {
  return REGIOES.find((regiao) => regiao.nome === nome);
}

/** A ordem importa: "Casa comercial" é casa, "Sala comercial" é comercial. */
export function categoriaDoTipo(tipo: string | null): CategoriaImovel {
  const nome = (tipo ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("pt-BR");

  if (/casa|sobrado/.test(nome)) return "casa";
  if (/apartamento/.test(nome)) return "apartamento";
  if (/terreno/.test(nome)) return "terreno";
  if (/galpao/.test(nome)) return "galpao";
  if (/comercial|predio|loja|sala/.test(nome)) return "comercial";
  return "outros";
}

/** Sem faixa, tudo passa; com faixa, preço inválido fica de fora. Limites inclusivos. */
export function dentroDaFaixa(
  preco: string,
  faixa: FaixaDePreco | null,
): boolean {
  if (!faixa) return true;
  const valor = Number(preco);
  return (
    Number.isFinite(valor) && valor >= faixa.minimo && valor <= faixa.maximo
  );
}

/** UF selecionada tem prioridade; sem ela, vale a região; sem as duas, o Brasil inteiro. */
export function noRecorte(
  uf: string,
  ufSelecionada: string | null,
  ufsDaRegiao: readonly string[] | null,
): boolean {
  return ufSelecionada
    ? uf === ufSelecionada
    : !ufsDaRegiao || ufsDaRegiao.includes(uf);
}

export function contarPorCategoria(
  imoveis: { tipo: string | null }[],
): Map<CategoriaImovel, number> {
  const totais = new Map<CategoriaImovel, number>();
  for (const imovel of imoveis) {
    const categoria = categoriaDoTipo(imovel.tipo);
    totais.set(categoria, (totais.get(categoria) ?? 0) + 1);
  }
  return totais;
}

export function contarPorUfECategoria(
  imoveis: { uf: string; tipo: string | null; preco: string }[],
  faixa: FaixaDePreco | null,
): Map<string, Map<CategoriaImovel, number>> {
  const totais = new Map<string, Map<CategoriaImovel, number>>();
  for (const imovel of imoveis) {
    if (!dentroDaFaixa(imovel.preco, faixa)) continue;
    const categorias = totais.get(imovel.uf) ?? new Map();
    const categoria = categoriaDoTipo(imovel.tipo);
    categorias.set(categoria, (categorias.get(categoria) ?? 0) + 1);
    totais.set(imovel.uf, categorias);
  }
  return totais;
}

export function totalDaRegiao(
  regiao: Regiao,
  estados: { uf: string; totalImoveis: number }[],
): number {
  return estados
    .filter((estado) => regiao.ufs.some((sigla) => sigla === estado.uf))
    .reduce((total, estado) => total + estado.totalImoveis, 0);
}
