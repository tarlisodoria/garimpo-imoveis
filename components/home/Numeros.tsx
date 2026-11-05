import { toNumero } from "../../lib/formatar";
import type { PublicSnapshot } from "../../lib/public-data";
import { IconeLinha, type NomeIconeLinha } from "../site/IconeLinha";

type NumerosProps = {
  summary: PublicSnapshot["summary"];
};

export function Numeros({ summary }: NumerosProps) {
  const itens = (
    [
      {
        valor: summary.totalImoveis,
        rotulo: "imóveis monitorados",
        icone: "casa",
      },
      {
        valor: summary.novos7d,
        rotulo: "novos nos últimos 7 dias",
        icone: "novos",
      },
      {
        valor: summary.quedas7d,
        rotulo: "quedas de preço em 7 dias",
        icone: "queda",
      },
      {
        valor: summary.totalUfs,
        rotulo: summary.totalUfs === 1 ? "UF coberta" : "UFs cobertas",
        icone: "mapa",
      },
    ] satisfies {
      valor: number;
      rotulo: string;
      icone: NomeIconeLinha;
    }[]
  ).filter((item) => item.valor > 0);

  if (itens.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Números do monitoramento"
      className="mt-2 scroll-mt-24 sm:mt-3"
    >
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {itens.map((item) => (
          <div
            key={item.rotulo}
            className="rounded-2xl border border-[#173b50]/10 bg-white p-5 shadow-sm"
          >
            <dt className="flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
              {item.rotulo}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f5f4] text-[#28749a]">
                <IconeLinha nome={item.icone} className="h-4 w-4" />
              </span>
            </dt>
            <dd className="mt-2 text-3xl font-semibold tracking-tight text-[#173b50] sm:text-4xl">
              {toNumero(item.valor)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
