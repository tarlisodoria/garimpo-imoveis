"use client";

import { useMemo, useState } from "react";

import { nomeUf } from "../../lib/ufs";
import { CardImovel, type CardImovelDados } from "./CardImovel";

type TopDescontosProps = {
  imoveis: CardImovelDados[];
  limite?: number;
};

const seletor =
  "w-full rounded-xl border border-slate-900/15 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20";

export function TopDescontos({ imoveis, limite = 12 }: TopDescontosProps) {
  const [uf, setUf] = useState("");
  const [tipo, setTipo] = useState("");

  const ufs = useMemo(
    () => [...new Set(imoveis.map((imovel) => imovel.uf))].sort(),
    [imoveis],
  );
  const tipos = useMemo(
    () =>
      [...new Set(imoveis.map((imovel) => imovel.tipo || "Imóvel"))].sort(
        (a, b) => a.localeCompare(b, "pt-BR"),
      ),
    [imoveis],
  );

  const filtrados = imoveis
    .filter((imovel) => !uf || imovel.uf === uf)
    .filter((imovel) => !tipo || (imovel.tipo || "Imóvel") === tipo)
    .slice(0, limite);

  return (
    <div>
      <div className="grid gap-3 sm:max-w-md sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Estado
          <select
            className={`mt-1 ${seletor}`}
            value={uf}
            onChange={(event) => setUf(event.target.value)}
          >
            <option value="">Todos</option>
            {ufs.map((sigla) => (
              <option key={sigla} value={sigla}>
                {nomeUf(sigla)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Tipo
          <select
            className={`mt-1 ${seletor}`}
            value={tipo}
            onChange={(event) => setTipo(event.target.value)}
          >
            <option value="">Todos</option>
            {tipos.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtrados.length === 0 ? (
        <p className="mt-6 rounded-xl bg-white/70 p-5 text-slate-700">
          Nenhum imóvel com esses filtros entre os maiores descontos. Veja a
          lista completa na página do estado.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((imovel) => (
            <CardImovel key={imovel.idCaixa} imovel={imovel} />
          ))}
        </div>
      )}
    </div>
  );
}
