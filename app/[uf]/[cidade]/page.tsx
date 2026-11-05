import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BuscaRegional } from "../../../components/home/BuscaRegional";
import { toNumero } from "../../../lib/formatar";
import { getPublicSnapshot } from "../../../lib/public-data";
import { nomeUf } from "../../../lib/ufs";

type CidadePageProps = {
  params: Promise<{
    uf: string;
    cidade: string;
  }>;
};

export async function generateStaticParams() {
  const snapshot = getPublicSnapshot();

  return snapshot.ufs.flatMap((entry) =>
    entry.cidades.map((cidade) => ({
      uf: entry.uf.toLowerCase(),
      cidade: cidade.slug,
    })),
  );
}

function localizar(uf: string, cidade: string) {
  const snapshot = getPublicSnapshot();
  const currentUf = snapshot.ufs.find(
    (entry) => entry.uf.toLowerCase() === uf.toLowerCase(),
  );
  const currentCidade = currentUf?.cidades.find(
    (entry) => entry.slug === cidade,
  );

  return { currentUf, currentCidade };
}

export async function generateMetadata({
  params,
}: CidadePageProps): Promise<Metadata> {
  const { uf, cidade } = await params;
  const { currentUf, currentCidade } = localizar(uf, cidade);

  if (!currentUf || !currentCidade) {
    return {
      title: "Cidade não encontrada | Garimpo Imóveis",
    };
  }

  const nome = `${currentCidade.nomeExibicao}/${currentUf.uf}`;

  return {
    title: `Imóveis da Caixa com desconto em ${nome} | Garimpo Imóveis`,
    description: `${currentCidade.totalImoveis} imóveis da Caixa à venda em ${nome}, ordenados por desconto, com link para a página oficial.`,
    alternates: {
      canonical: `/${currentUf.uf.toLowerCase()}/${currentCidade.slug}`,
    },
  };
}

export default async function CidadePage({ params }: CidadePageProps) {
  const { uf, cidade } = await params;
  const { currentUf, currentCidade } = localizar(uf, cidade);

  if (!currentUf || !currentCidade) {
    notFound();
  }

  const nomeCidade = currentCidade.nomeExibicao;
  const nomeEstado = nomeUf(currentUf.uf);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6 lg:px-8">
      <nav className="text-sm text-slate-500" aria-label="Navegação">
        <Link href="/" className="underline-offset-4 hover:underline">
          Início
        </Link>{" "}
        /{" "}
        <Link
          href={`/${currentUf.uf.toLowerCase()}`}
          className="underline-offset-4 hover:underline"
        >
          {nomeEstado}
        </Link>{" "}
        <span aria-hidden="true">/</span>{" "}
        <span className="font-medium text-[#173b50]">{nomeCidade}</span>
      </nav>

      <header className="mt-7 rounded-[1.75rem] bg-[#173b50] px-6 py-8 text-white sm:px-10 sm:py-12">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#c8ec67] uppercase">
          Oportunidades por cidade
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
          Imóveis da Caixa em {nomeCidade}/{currentUf.uf}
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-white/75">
          {toNumero(currentCidade.totalImoveis)}{" "}
          {currentCidade.totalImoveis === 1
            ? "imóvel à venda"
            : "imóveis à venda"}{" "}
          nesta cidade, segundo a lista oficial.
        </p>
      </header>

      <BuscaRegional
        imoveis={currentCidade.topDescontos}
        modo="cidade"
        totalImoveis={currentCidade.totalImoveis}
      />
    </main>
  );
}
