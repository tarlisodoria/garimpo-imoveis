import { toNumero } from "../../lib/formatar";
import type { PublicSnapshot } from "../../lib/public-data";

type NumerosProps = {
  summary: PublicSnapshot["summary"];
};

export function Numeros({ summary }: NumerosProps) {
  const itens = [
    { valor: summary.totalImoveis, rotulo: "imóveis monitorados" },
    { valor: summary.novos7d, rotulo: "novos nos últimos 7 dias" },
    { valor: summary.quedas7d, rotulo: "quedas de preço em 7 dias" },
    {
      valor: summary.totalUfs,
      rotulo: summary.totalUfs === 1 ? "estado coberto" : "estados cobertos",
    },
  ].filter((item) => item.valor > 0);

  if (itens.length === 0) {
    return null;
  }

  return (
    <section aria-label="Números do monitoramento" className="mt-12">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {itens.map((item) => (
          <div
            key={item.rotulo}
            className="flex flex-col rounded-2xl border border-slate-900/10 bg-white/80 p-5"
          >
            <dt className="text-sm text-slate-600">{item.rotulo}</dt>
            <dd className="order-first text-3xl font-semibold text-slate-950 sm:text-4xl">
              {toNumero(item.valor)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
