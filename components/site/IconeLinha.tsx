export type NomeIconeLinha =
  | "local"
  | "casa"
  | "preco"
  | "calendario"
  | "relogio"
  | "financiamento"
  | "novos"
  | "queda"
  | "mapa"
  | "quartos"
  | "banheiro"
  | "area"
  | "vaga"
  | "sala";

type IconeLinhaProps = {
  nome: NomeIconeLinha;
  className?: string;
};

const caminhos: Record<NomeIconeLinha, string> = {
  local:
    "M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z M12 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  casa: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z",
  preco: "M20.5 13.5 13 21l-9-9V4h8l8.5 9.5Z M8 8h.01",
  calendario: "M8 3v4m8-4v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z",
  relogio: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 6v6l4 2",
  financiamento: "M3 10h18M5 10v9m4-9v9m6-9v9m4-9v9M3 21h18M12 3 3 8h18l-9-5Z",
  novos:
    "m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z M19 16l1 2.5 2.5 1-2.5 1L19 23l-1-2.5-2.5-1 2.5-1 1-2.5Z",
  queda: "m3 7 6 6 4-4 8 8m-6 0h6v-6",
  mapa: "M9 18 3 21V6l6-3m0 15 6 3m-6-3V3m6 18V9m0 0 6-3v15l-6 3",
  quartos: "M3 19V8m0 8h18v3M3 13h18v-2a3 3 0 0 0-3-3H9v5M3 11h6",
  banheiro:
    "M4 13h16v2a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-2ZM6 13V6a2 2 0 0 1 4 0m-4 4h3m8 9v2m-8-2v2",
  area: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 8 3 3m13 5 5-5M8 16l-5 5m13-5 5 5",
  vaga: "m5 17 1.5-6h11l1.5 6M4 17h16v3H4v-3Zm3 0v-2m10 2v-2M7 11l1.5-4h7l1.5 4M8 14h.01M16 14h.01",
  sala: "M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M3 12h18v7H3v-7Zm2 7v2m14-2v2m-14-9V9m14 3V9",
};

export function IconeLinha({ nome, className = "h-4 w-4" }: IconeLinhaProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={caminhos[nome]} />
    </svg>
  );
}
