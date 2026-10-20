const CONECTIVOS = new Set(["de", "da", "do", "das", "dos", "e", "d"]);
const ROMANOS = /^(i{1,3}|iv|v|vi{1,3}|ix|x{1,3})$/;

function capitalizar(parte: string): string {
  // "d'oeste" -> "D'Oeste"; mantém o que vier depois do apóstrofo em título.
  return parte
    .split("'")
    .map((trecho) => trecho.charAt(0).toUpperCase() + trecho.slice(1))
    .join("'");
}

function formatarPalavra(palavra: string, primeira: boolean): string {
  if (/\d/.test(palavra)) {
    return palavra.toUpperCase();
  }

  const minuscula = palavra.toLowerCase();

  if (ROMANOS.test(minuscula) && !primeira) {
    return minuscula.toUpperCase();
  }

  if (CONECTIVOS.has(minuscula) && !primeira) {
    return minuscula;
  }

  return minuscula
    .split("-")
    .map((parte) => capitalizar(parte))
    .join("-");
}

/**
 * Exibe nomes de cidade e bairro da fonte (CAIXA ALTA, sem acento) em formato
 * título. Não reacentua: "SANTA ISABEL DO PARA" vira "Santa Isabel do Para".
 * Slugs e dados persistidos não passam por aqui.
 */
export function formatarLocal(nome: string | null | undefined): string {
  if (!nome) {
    return "";
  }

  return nome
    .trim()
    .split(/\s+/)
    .map((palavra, indice) => formatarPalavra(palavra, indice === 0))
    .join(" ");
}
