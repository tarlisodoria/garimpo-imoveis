// Formatadores sem dependência do snapshot: podem ir para componentes cliente.

export function toCurrency(value: string | number) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "R$ 0,00";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

export function toCurrencyCompacto(value: string | number) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "R$ 0";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function toPercent(value: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "0,00%";
  }

  return `${amount.toFixed(2).replace(".", ",")}%`;
}

export function toDataCurta(iso: string | null) {
  if (!iso) return null;

  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}

export function toNumero(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

/** "AAAA-MM-DD" → "DD/MM", sem fuso: datas sem horário não mudam de dia. */
export function toDiaMes(data: string | null) {
  const partes = data ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(data) : null;
  return partes ? `${partes[3]}/${partes[2]}` : null;
}
