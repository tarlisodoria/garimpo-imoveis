import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CardImovel } from "../../../components/home/CardImovel";
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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="text-sm text-slate-600" aria-label="Navegação">
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
        / {nomeCidade}
      </nav>

      <header className="mt-6">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Imóveis da Caixa em {nomeCidade}/{currentUf.uf}
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-700">
          {toNumero(currentCidade.totalImoveis)}{" "}
          {currentCidade.totalImoveis === 1
            ? "imóvel à venda"
            : "imóveis à venda"}{" "}
          nesta cidade, segundo a lista oficial.
        </p>
      </header>

      <section aria-labelledby="descontos-cidade" className="mt-12">
        <h2
          id="descontos-cidade"
          className="text-2xl font-semibold tracking-tight text-slate-950"
        >
          Imóveis por desconto
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {currentCidade.topDescontos.map((imovel) => (
            <CardImovel
              key={imovel.idCaixa}
              imovel={imovel}
              contexto="cidade"
            />
          ))}
        </div>
      </section>
    </main>
  );
}
