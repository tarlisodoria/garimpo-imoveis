import { repositorioUrl } from "../../lib/site";

type HeroProps = {
  atualizadoEm: string | null;
  totalUfs: number;
};

function dataHora(iso: string | null): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(data);
}

export function Hero({ atualizadoEm, totalUfs }: HeroProps) {
  const atualizacao = dataHora(atualizadoEm);

  return (
    <section className="grid items-center gap-10 pt-6 sm:pt-12 lg:grid-cols-[1.25fr_0.75fr]">
      <div>
        <p className="text-sm font-semibold tracking-[0.2em] text-emerald-800 uppercase">
          Projeto de portfólio · dados públicos
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl leading-tight font-semibold tracking-tight text-slate-950 sm:text-6xl">
          A lista de imóveis da Caixa, monitorada todos os dias.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
          Um pipeline automático baixa a lista oficial de imóveis à venda de
          todos os estados, compara com o dia anterior e publica os maiores
          descontos, as quedas de preço e os imóveis novos. Sem cadastro e sem
          anúncios.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="#descontos"
            className="rounded-full bg-emerald-800 px-6 py-3.5 text-center text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          >
            Ver maiores descontos
          </a>
          <a
            href={repositorioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-slate-900/15 bg-white/70 px-6 py-3.5 text-center text-base font-semibold text-slate-900 transition hover:border-emerald-800 hover:text-emerald-800"
          >
            Código no GitHub ↗
          </a>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Não é afiliado à Caixa; os links levam sempre ao site oficial.
        </p>
      </div>

      <dl className="rounded-3xl border border-slate-900/10 bg-white/85 p-6 text-sm shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div>
          <dt className="text-slate-500">Última atualização</dt>
          <dd className="mt-1 text-lg font-semibold text-slate-950">
            {atualizacao ?? "em preparação"}
          </dd>
        </div>
        <div className="mt-4 border-t border-slate-900/10 pt-4">
          <dt className="text-slate-500">Fonte</dt>
          <dd className="mt-1 text-slate-800">
            Lista oficial de imóveis à venda da Caixa, {totalUfs}{" "}
            {totalUfs === 1 ? "estado" : "estados"}
          </dd>
        </div>
        <div className="mt-4 border-t border-slate-900/10 pt-4">
          <dt className="text-slate-500">Frequência</dt>
          <dd className="mt-1 text-slate-800">
            Diária, às 03:15 (horário de Brasília)
          </dd>
        </div>
      </dl>
    </section>
  );
}
