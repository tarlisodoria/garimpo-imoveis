// Texto de erro seguro para logs (inclusive os públicos do GitHub Actions):
// mantém mensagem e pilha, mas troca por *** a URL do banco e suas partes
// (senha, usuário, host e endpoint), caso apareçam no erro.

function partesSensiveis(databaseUrl: string | undefined): string[] {
  if (!databaseUrl) return [];
  const partes = [databaseUrl];
  try {
    const url = new URL(databaseUrl);
    partes.push(
      decodeURIComponent(url.password),
      url.password,
      url.hostname,
      url.hostname.split(".")[0] ?? "",
      decodeURIComponent(url.username),
    );
  } catch {
    // URL inválida: mascara só o texto inteiro.
  }
  // Mais longas primeiro, para não deixar pedaços de uma parte maior.
  return [...new Set(partes)]
    .filter((parte) => parte.length >= 4)
    .sort((a, b) => b.length - a.length);
}

export function erroSeguro(
  error: unknown,
  databaseUrl: string | undefined = process.env.DATABASE_URL,
): string {
  let texto =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  for (const parte of partesSensiveis(databaseUrl)) {
    texto = texto.split(parte).join("***");
  }
  return texto;
}
