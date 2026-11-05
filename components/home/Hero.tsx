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
    <section className="grid items-center gap-10 pt-10 pb-4 sm:pt-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
      <div className="max-w-2xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-[#173b50]/10 bg-white px-3 py-1.5 text-xs font-semibold text-[#315769] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#83ae31]" />
          Oportunidades da Caixa, atualizadas todos os dias
        </p>
        <h1 className="mt-6 text-4xl leading-[1.08] font-semibold tracking-[-0.04em] text-[#173b50] sm:text-6xl">
          Um bom imóvel pode estar mais perto do que você imagina.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
          Explore imóveis à venda em todo o Brasil, compare o valor de venda com
          a avaliação e acompanhe as oportunidades direto da fonte.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="#explorar"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#173b50] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#173b50]/15 transition hover:bg-[#24526b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173b50]"
          >
            Explorar imóveis
            <span aria-hidden="true">→</span>
          </a>
          <a
            href="#como-funciona"
            className="rounded-full border border-[#173b50]/15 bg-white px-6 py-3.5 text-center text-sm font-semibold text-[#173b50] transition hover:border-[#28749a]/50 hover:bg-[#f3f8f8]"
          >
            Como funciona
          </a>
        </div>
        <p className="mt-5 text-xs leading-5 text-slate-500">
          Sem cadastro e sem anúncios. As condições são confirmadas no site
          oficial da Caixa.
        </p>
      </div>

      <div
        role="img"
        aria-label="Imagem ilustrativa de uma casa contemporânea"
        className="relative min-h-[360px] overflow-hidden rounded-[2rem] bg-[#dbe5e7] bg-cover bg-center shadow-[0_28px_70px_rgba(23,59,80,0.2)] sm:min-h-[470px]"
        style={{
          backgroundImage:
            "linear-gradient(180deg,rgba(8,29,39,0.02) 35%,rgba(8,29,39,0.58) 100%),url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=85')",
        }}
      >
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-between gap-5 p-6 text-white sm:flex-row sm:items-end sm:p-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-white/75 uppercase">
              Imóveis em todo o Brasil
            </p>
            <p className="mt-2 max-w-xs text-2xl leading-tight font-semibold">
              Uma busca mais simples começa por aqui.
            </p>
            <p className="mt-2 text-xs text-white/70">
              Imagem ilustrativa · foto do imóvel na página oficial
            </p>
          </div>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#173b50]/10 bg-white px-5 py-4">
          <dt className="text-xs text-slate-500">Última atualização</dt>
          <dd className="mt-1 font-semibold text-[#173b50]">
            {atualizacao ?? "em preparação"}
          </dd>
        </div>
        <div className="rounded-2xl border border-[#173b50]/10 bg-white px-5 py-4">
          <dt className="text-xs text-slate-500">Cobertura nacional</dt>
          <dd className="mt-1 font-semibold text-[#173b50]">
            {totalUfs === 27
              ? "26 estados e Distrito Federal"
              : `${totalUfs} unidades federativas`}
          </dd>
        </div>
        <div className="rounded-2xl border border-[#173b50]/10 bg-white px-5 py-4 sm:col-span-2 lg:col-span-1">
          <dt className="text-xs text-slate-500">Origem das informações</dt>
          <dd className="mt-1 font-semibold text-[#173b50]">
            Lista oficial de imóveis da Caixa
          </dd>
        </div>
      </dl>
    </section>
  );
}
