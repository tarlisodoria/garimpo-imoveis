/** Coleta congelada desde 16/11/2026: a Caixa bloqueia (HTTP 403) downloads vindos de nuvem. */
export function AvisoDadosCongelados() {
  return (
    <p
      role="status"
      className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-6 font-semibold text-amber-950"
    >
      Dados congelados em 15/11/2026: a fonte passou a bloquear coleta
      automatizada a partir de servidores em nuvem.
    </p>
  );
}
