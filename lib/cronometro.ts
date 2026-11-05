const DATA_CAIXA =
  /carregaContador\.asp[\s\S]{0,500}?"(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})"/i;

export function lerDataEncerramentoCaixa(html: string): string | null {
  const match = html.match(DATA_CAIXA);
  if (!match) return null;

  const [, dia, mes, ano, hora, minuto, segundo] = match;
  const valor = `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}-03:00`;
  const timestamp = Date.parse(valor);

  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export function prazoFuturo(data: string | null, agora = new Date()): boolean {
  if (!data) return false;
  const timestamp = Date.parse(data);
  return Number.isFinite(timestamp) && timestamp > agora.getTime();
}
