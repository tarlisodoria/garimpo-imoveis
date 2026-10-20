const DEFAULT_SITE_URL = "https://garimpo-imoveis.pages.dev";

function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const siteUrl = normalizeUrl(
  process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL,
);

export const siteName = "Garimpo Imóveis";

export const siteDescription =
  "Projeto de portfólio que monitora todos os dias a lista oficial de imóveis à venda da Caixa: maiores descontos, quedas de preço e imóveis novos por estado e cidade.";

/** Código-fonte público do projeto. */
export const repositorioUrl = "https://github.com/tarlisodoria/garimpo-imoveis";

/** Contato público: issues do repositório (o site não coleta dados pessoais). */
export const contatoUrl = `${repositorioUrl}/issues`;

export const DOCUMENTOS_LEGAIS = {
  versao: "2.0",
  /** AAAA-MM-DD */
  vigencia: "2026-10-20",
} as const;

export function vigenciaPorExtenso(): string {
  const [ano, mes, dia] = DOCUMENTOS_LEGAIS.vigencia.split("-");
  return `${dia}/${mes}/${ano}`;
}
