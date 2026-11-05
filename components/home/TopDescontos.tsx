"use client";

import { CardImovel, type CardImovelDados } from "./CardImovel";

type TopDescontosProps = {
  imoveis: CardImovelDados[];
  limite?: number;
  ufSelecionada: string | null;
  ufsSelecionadas: readonly string[] | null;
};

export function TopDescontos({
  imoveis,
  limite = 12,
  ufSelecionada,
  ufsSelecionadas,
}: TopDescontosProps) {
  const filtrados = imoveis
    .filter((imovel) =>
      ufSelecionada
        ? imovel.uf === ufSelecionada
        : !ufsSelecionadas || ufsSelecionadas.includes(imovel.uf),
    )
    .slice(0, limite);

  return (
    <div>
      {filtrados.length === 0 ? (
        <p className="mt-6 rounded-xl border border-[#173b50]/10 bg-white p-5 text-slate-600">
          Não encontramos imóveis com esse tipo nesta seleção. Tente outro
          filtro ou escolha uma região diferente.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((imovel) => (
            <CardImovel key={imovel.idCaixa} imovel={imovel} />
          ))}
        </div>
      )}
    </div>
  );
}
