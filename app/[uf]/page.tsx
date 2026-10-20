import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CardImovel } from "../../components/home/CardImovel";
import { toNumero } from "../../lib/formatar";
import { getPublicSnapshot } from "../../lib/public-data";
import { nomeUf, noUf } from "../../lib/ufs";

type UfPageProps = {
  params: Promise<{
    uf: string;
  }>;
};

export async function generateStaticParams() {
  const snapshot = getPublicSnapshot();

  return snapshot.ufs.map((entry) => ({
    uf: entry.uf.toLowerCase(),
  }));
}

export async function generateMetadata({
  params,
}: UfPageProps): Promise<Metadata> {
  const { uf } = await params;
  const snapshot = getPublicSnapshot();
  const current = snapshot.ufs.find(
    (entry) => entry.uf.toLowerCase() === uf.toLowerCase(),
  );

  if (!current) {
    return {
      title: "Estado não encontrado | Garimpo Imóveis",
    };
  }

  return {
    title: `Imóveis da Caixa com desconto ${noUf(current.uf)} (${current.uf}) | Garimpo Imóveis`,
    description: `${current.totalImoveis} imóveis da Caixa à venda ${noUf(current.uf)}, ordenados por desconto, com link para a página oficial.`,
    alternates: {
      canonical: `/${current.uf.toLowerCase()}`,
    },
  };
}

export default async function UfPage({ params }: UfPageProps) {
  const { uf } = await params;
  const snapshot = getPublicSnapshot();
  const current = snapshot.ufs.find(
    (entry) => entry.uf.toLowerCase() === uf.toLowerCase(),
  );

  if (!current) {
    notFound();
  }

  const nome = nomeUf(current.uf);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="text-sm text-slate-600" aria-label="Navegação">
        <Link href="/" className="underline-offset-4 hover:underline">
          Início
        </Link>{" "}
        / {nome}
      </nav>

      <header className="mt-6">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Imóveis da Caixa {noUf(current.uf)}
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-700">
          {toNumero(current.totalImoveis)} imóveis à venda{" "}
          {toNumero(current.cidades.length)}{" "}
          {current.cidades.length === 1 ? "cidade" : "cidades"}, segundo a lista
          oficial.
        </p>
      </header>

      <section aria-labelledby="descontos-uf" className="mt-12">
        <h2
          id="descontos-uf"
          className="text-2xl font-semibold tracking-tight text-slate-950"
        >
          Maiores descontos {noUf(current.uf)}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {current.topDescontos.slice(0, 18).map((imovel) => (
            <CardImovel key={imovel.idCaixa} imovel={imovel} />
          ))}
        </div>
      </section>

      <section aria-labelledby="cidades-uf" className="mt-16">
        <h2
          id="cidades-uf"
          className="text-2xl font-semibold tracking-tight text-slate-950"
        >
          Cidades
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {current.cidades.map((cidade) => (
            <li key={`${cidade.nome}-${cidade.slug}`}>
              <Link
                href={`/${current.uf.toLowerCase()}/${cidade.slug}`}
                className="block rounded-xl border border-slate-900/10 bg-white p-4 transition hover:border-emerald-700"
              >
                <span className="block font-semibold text-slate-900">
                  {cidade.nomeExibicao}
                </span>
                <span className="mt-1 block text-sm text-slate-700">
                  {toNumero(cidade.totalImoveis)}{" "}
                  {cidade.totalImoveis === 1 ? "imóvel" : "imóveis"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
