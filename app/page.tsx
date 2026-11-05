import type { Metadata } from "next";

import { ComoFunciona } from "../components/home/ComoFunciona";
import type { CardImovelDados } from "../components/home/CardImovel";
import { ExplorarImoveis } from "../components/home/ExplorarImoveis";
import { Faq } from "../components/home/Faq";
import { Hero } from "../components/home/Hero";
import { NavegarUf } from "../components/home/NavegarUf";
import { Numeros } from "../components/home/Numeros";
import { QuedasRecentes } from "../components/home/QuedasRecentes";
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
  const ufs = snapshot.ufs.map((estado) => ({
    uf: estado.uf,
    totalImoveis: estado.totalImoveis,
    cidades: estado.cidades.map((cidade) => ({
      nomeExibicao: cidade.nomeExibicao,
      slug: cidade.slug,
      totalImoveis: cidade.totalImoveis,
    })),
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <Hero
        atualizadoEm={snapshot.generatedAt}
        totalUfs={snapshot.summary.totalUfs}
        totalImoveis={snapshot.summary.totalImoveis}
      />
      <Numeros summary={snapshot.summary} />
      <ExplorarImoveis imoveis={imoveis} ufs={ufs} />
      <QuedasRecentes quedas={snapshot.quedasRecentes} />
      <ComoFunciona />
      <Faq />
      <NavegarUf ufs={snapshot.ufs} />
    </main>
  );
}
