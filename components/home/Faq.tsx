const PERGUNTAS = [
  {
    pergunta: "O Garimpo Imóveis é da Caixa?",
    resposta:
      "Não. É um projeto de portfólio independente, sem vínculo com a Caixa Econômica Federal e sem fins comerciais. Ele apenas organiza a lista pública de imóveis à venda que a própria Caixa divulga, e todo imóvel tem link para a página oficial.",
  },
  {
    pergunta: "O que é Venda Direta Online, Venda Online e Licitação?",
    resposta:
      "São modalidades de venda da Caixa. Na Venda Direta Online, o imóvel pode ser comprado direto pelo site, sem disputa. Na Venda Online, há disputa de propostas pela internet durante um período definido. A Licitação Aberta segue um edital com data e regras próprias. As condições de cada imóvel, como pagamento e financiamento, estão sempre na página oficial.",
  },
  {
    pergunta: "Por que alguns imóveis têm até 90% de desconto?",
    resposta:
      "Em geral são imóveis que já passaram por leilões sem comprador. Depois disso, a Caixa pode oferecê-los por um valor mínimo de venda bem abaixo da avaliação, às vezes de apenas 10% dela. É um valor mínimo: na Venda Online há disputa e o preço final pode subir. Descontos assim costumam vir com condições específicas, como pagamento só à vista ou com FGTS, área construída não averbada ou imóvel ocupado. Confira sempre as condições na página oficial antes de qualquer decisão.",
  },
  {
    pergunta: "Os dados são confiáveis?",
    resposta:
      "Os dados vêm da lista oficial da Caixa e são atualizados uma vez por dia. Mesmo assim, a Caixa pode alterar preço, condições ou retirar um imóvel a qualquer momento. Confirme sempre na página oficial antes de qualquer decisão.",
  },
];

export function Faq() {
  return (
    <section aria-labelledby="faq" className="mt-20">
      <h2
        id="faq"
        className="text-3xl font-semibold tracking-tight text-slate-950"
      >
        Perguntas frequentes
      </h2>
      <div className="mt-6 divide-y divide-slate-900/10 rounded-2xl border border-slate-900/10 bg-white/80">
        {PERGUNTAS.map((item) => (
          <details key={item.pergunta} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
              {item.pergunta}
              <span
                aria-hidden="true"
                className="text-xl text-emerald-800 transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 leading-7 text-slate-700">{item.resposta}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
