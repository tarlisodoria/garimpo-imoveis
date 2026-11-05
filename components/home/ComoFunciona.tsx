const ETAPAS = [
  {
    titulo: "Encontre uma oportunidade",
    texto:
      "Explore os imóveis por região, estado e cidade, ou comece pelos maiores descontos e pelas quedas de preço recentes.",
  },
  {
    titulo: "Compare os valores",
    texto:
      "Veja o valor mínimo de venda, a avaliação e as condições de pagamento informadas na lista oficial.",
  },
  {
    titulo: "Confira na fonte oficial",
    texto:
      "Abra a página do imóvel na Caixa para confirmar preço, edital, ocupação e todas as regras antes de tomar uma decisão.",
  },
];

export function ComoFunciona() {
  return (
    <section
      aria-labelledby="como-funciona"
      className="mt-20 scroll-mt-24 sm:mt-28"
    >
      <h2
        id="como-funciona"
        className="text-3xl font-semibold tracking-tight text-[#173b50] sm:text-4xl"
      >
        Como funciona
      </h2>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">
        Uma forma mais clara de acompanhar os imóveis anunciados pela Caixa e
        chegar à informação completa na página oficial.
      </p>
      <ol className="mt-6 grid gap-4 md:grid-cols-3">
        {ETAPAS.map((etapa, indice) => (
          <li
            key={etapa.titulo}
            className="rounded-2xl border border-[#173b50]/10 bg-white p-6 shadow-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#173b50] text-sm font-bold text-white">
              {indice + 1}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-[#173b50]">
              {etapa.titulo}
            </h3>
            <p className="mt-2 leading-7 text-slate-600">{etapa.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
