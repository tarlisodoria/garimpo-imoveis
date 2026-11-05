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
    <main className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6 lg:px-8">
      <nav className="text-sm text-slate-500" aria-label="Navegação">
        <Link href="/" className="underline-offset-4 hover:underline">
          Início
        </Link>{" "}
        <span aria-hidden="true">/</span>{" "}
        <span className="font-medium text-[#173b50]">{nome}</span>
      </nav>

      <header className="mt-7 rounded-[1.75rem] bg-[#173b50] px-6 py-8 text-white sm:px-10 sm:py-12">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#c8ec67] uppercase">
          Oportunidades por estado
        </p>
        <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
          Imóveis da Caixa {noUf(current.uf)}
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-white/75">
          {toNumero(current.totalImoveis)} imóveis em{" "}
          {toNumero(current.cidades.length)}{" "}
          {current.cidades.length === 1 ? "cidade" : "cidades"}, segundo a lista
          oficial.
        </p>
      </header>

      <section aria-labelledby="descontos-uf" className="mt-12">
        <h2
          id="descontos-uf"
          className="text-2xl font-semibold tracking-tight text-[#173b50]"
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
          className="text-2xl font-semibold tracking-tight text-[#173b50]"
        >
          Cidades
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {current.cidades.map((cidade) => (
            <li key={`${cidade.nome}-${cidade.slug}`}>
              <Link
                href={`/${current.uf.toLowerCase()}/${cidade.slug}`}
                className="block rounded-xl border border-[#173b50]/10 bg-white p-4 transition hover:border-[#28749a]/50 hover:shadow-sm"
              >
                <span className="block font-semibold text-[#173b50]">
                  {cidade.nomeExibicao}
                </span>
                <span className="mt-1 block text-sm text-slate-500">
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
