import type { Metadata } from "next";

import { ComoFunciona } from "../components/home/ComoFunciona";
import type { CardImovelDados } from "../components/home/CardImovel";
import { Faq } from "../components/home/Faq";
import { Hero } from "../components/home/Hero";
import { NavegarUf } from "../components/home/NavegarUf";
import { Numeros } from "../components/home/Numeros";
import { QuedasRecentes } from "../components/home/QuedasRecentes";
import { TopDescontos } from "../components/home/TopDescontos";
import {
  getPublicSnapshot,
  type PublicImovel,
  type PublicSnapshot,
} from "../lib/public-data";
import { siteDescription, siteName, siteUrl } from "../lib/site";

const titulo = `${siteName}: imóveis da Caixa com desconto, monitorados todo dia`;

export const metadata: Metadata = {
  title: titulo,
  description: siteDescription,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: titulo,
    description: siteDescription,
    siteName,
    locale: "pt_BR",
  },
};

const TOP_POR_UF_NO_FILTRO = 6;

function paraCard(imovel: PublicImovel): CardImovelDados {
  return {
    idCaixa: imovel.idCaixa,
    uf: imovel.uf,
    cidade: imovel.cidade,
    cidadeSlug: imovel.cidadeSlug,
    bairro: imovel.bairro,
    endereco: imovel.endereco,
    tipo: imovel.tipo,
    preco: imovel.preco,
    valorAvaliacao: imovel.valorAvaliacao,
    descontoPct: imovel.descontoPct,
    modalidade: imovel.modalidade,
    aceitaFinanciamento: imovel.aceitaFinanciamento,
    linkOficial: imovel.linkOficial,
    economiaReais: imovel.economiaReais,
    entrouEm: imovel.entrouEm,
    selo: imovel.selo,
    cidadeNome: imovel.cidadeNome,
    listaDe: imovel.listaDe,
  };
}

/** Top global + os maiores de cada UF, para o filtro por estado ter o que mostrar. */
function imoveisParaFiltro(snapshot: PublicSnapshot): CardImovelDados[] {
  const porId = new Map<string, PublicImovel>();

  for (const imovel of [
    ...snapshot.topDescontos,
    ...snapshot.ufs.flatMap((uf) =>
      uf.topDescontos.slice(0, TOP_POR_UF_NO_FILTRO),
    ),
  ]) {
    porId.set(imovel.idCaixa, imovel);
  }

  return [...porId.values()]
    .sort(
      (a, b) =>
        Number(b.descontoPct) - Number(a.descontoPct) ||
        a.idCaixa.localeCompare(b.idCaixa),
    )
    .map(paraCard);
}

export default function Home() {
  const snapshot = getPublicSnapshot();
  const imoveis = imoveisParaFiltro(snapshot);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Hero
        atualizadoEm={snapshot.generatedAt}
        totalUfs={snapshot.summary.totalUfs}
      />
      <Numeros summary={snapshot.summary} />
      <QuedasRecentes quedas={snapshot.quedasRecentes} />

      <section
        id="descontos"
        aria-labelledby="descontos-titulo"
        className="mt-20 scroll-mt-6"
      >
        <h2
          id="descontos-titulo"
          className="text-3xl font-semibold tracking-tight text-slate-950"
        >
          Maiores descontos agora
        </h2>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-700">
          Imóveis da lista oficial com os maiores descontos sobre o valor de
          avaliação. Filtre por estado e tipo.
        </p>
        <div className="mt-6">
          {imoveis.length === 0 ? (
            <p className="rounded-xl bg-white/70 p-5 text-slate-700">
              A lista de imóveis está sendo atualizada. Volte em breve.
            </p>
          ) : (
            <TopDescontos imoveis={imoveis} />
          )}
        </div>
      </section>

      <ComoFunciona />
      <Faq />
      <NavegarUf ufs={snapshot.ufs} />
    </main>
  );
}
