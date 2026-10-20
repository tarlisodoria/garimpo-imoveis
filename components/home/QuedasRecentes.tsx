import { toCurrencyCompacto, toDataCurta } from "../../lib/formatar";
import type { PublicQueda } from "../../lib/public-data";
import { CardImovel } from "./CardImovel";

type QuedasRecentesProps = {
  quedas: PublicQueda[];
};

export function QuedasRecentes({ quedas }: QuedasRecentesProps) {
  if (quedas.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="quedas" className="mt-20">
      <h2
        id="quedas"
        className="text-3xl font-semibold tracking-tight text-slate-950"
      >
        Maiores quedas de preço da semana
      </h2>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-700">
        Imóveis cujo valor mínimo de venda caiu nos últimos 7 dias, segundo a
        comparação diária das listas oficiais.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quedas.slice(0, 6).map((queda) => (
          <CardImovel
            key={queda.idCaixa}
            imovel={queda}
            destaque={
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
                Baixou{" "}
                <strong className="font-semibold">
                  {queda.quedaPct.replace(".", ",")}%
                </strong>{" "}
                em {toDataCurta(queda.quedaEm)}: de{" "}
                {toCurrencyCompacto(queda.precoAnterior)} para{" "}
                <strong className="font-semibold">
                  {toCurrencyCompacto(queda.preco)}
                </strong>
              </p>
            }
          />
        ))}
      </div>
    </section>
  );
}
