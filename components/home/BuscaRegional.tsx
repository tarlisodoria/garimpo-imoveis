"use client";

import { useMemo, useState } from "react";

import { toNumero } from "../../lib/formatar";
import { CardImovel, type CardImovelDados } from "./CardImovel";
import { FiltroCaracteristicas } from "./FiltroCaracteristicas";
import { filtrarImoveisRegionais } from "../../lib/filtro-regional";
import {
  FILTROS_CARACTERISTICAS_VAZIOS,
  type FiltrosCaracteristicas,
} from "../../lib/filtro-caracteristicas";

type CidadeFiltro = {
  slug: string;
  nomeExibicao: string;
};

type BuscaRegionalProps = {
  imoveis: CardImovelDados[];
  modo: "estado" | "cidade";
  cidades?: CidadeFiltro[];
  totalImoveis: number;
};

const LIMITE_INICIAL = 18;

function numeroOuNulo(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function BuscaRegional({
  imoveis,
  modo,
  cidades = [],
  totalImoveis,
}: BuscaRegionalProps) {
  const [tipo, setTipo] = useState("");
  const [cidadeSlug, setCidadeSlug] = useState("");
  const [bairro, setBairro] = useState("");
  const [precoMinimo, setPrecoMinimo] = useState("");
  const [precoMaximo, setPrecoMaximo] = useState("");
  const [caracteristicas, setCaracteristicas] =
    useState<FiltrosCaracteristicas>(FILTROS_CARACTERISTICAS_VAZIOS);
  const [limiteVisivel, setLimiteVisivel] = useState(LIMITE_INICIAL);

  const tipos = useMemo(
    () =>
      [
        ...new Set(
          imoveis
            .map((imovel) => imovel.tipo)
            .filter((nome): nome is string => Boolean(nome)),
        ),
      ].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [imoveis],
  );
  const bairros = useMemo(
    () =>
      [
        ...new Set(
          imoveis
            .map((imovel) => imovel.bairro)
            .filter((nome): nome is string => Boolean(nome)),
        ),
      ].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [imoveis],
  );

  const resultados = useMemo(() => {
    return filtrarImoveisRegionais(imoveis, {
      modo,
      tipo,
      cidadeSlug,
      bairro,
      precoMinimo: numeroOuNulo(precoMinimo),
      precoMaximo: numeroOuNulo(precoMaximo),
      caracteristicas,
    });
  }, [
    bairro,
    caracteristicas,
    cidadeSlug,
    imoveis,
    modo,
    precoMaximo,
    precoMinimo,
    tipo,
  ]);

  function limparFiltros() {
    setTipo("");
    setCidadeSlug("");
    setBairro("");
    setPrecoMinimo("");
    setPrecoMaximo("");
    setCaracteristicas(FILTROS_CARACTERISTICAS_VAZIOS);
    setLimiteVisivel(LIMITE_INICIAL);
  }

  const campoClasse =
    "mt-1 w-full rounded-lg border border-[#173b50]/15 bg-white px-3 py-2.5 text-sm text-[#173b50] focus:border-[#28749a] focus:outline-none focus:ring-2 focus:ring-[#28749a]/10";

  return (
    <div className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(17rem,21rem)_minmax(0,1fr)]">
      <aside
        aria-label="Filtros de imóveis"
        className="min-w-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
      >
        <div className="rounded-2xl border border-[#173b50]/10 bg-white p-5 shadow-[0_8px_28px_rgba(23,59,80,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#173b50]">
              Refine sua busca
            </h2>
            <button
              type="button"
              onClick={limparFiltros}
              className="text-xs font-semibold text-[#28749a] hover:underline"
            >
              Limpar
            </button>
          </div>

          {modo === "estado" ? (
            <label className="mt-4 block">
              <span className="text-xs font-medium text-slate-600">Cidade</span>
              <select
                value={cidadeSlug}
                onChange={(event) => {
                  setCidadeSlug(event.target.value);
                  setLimiteVisivel(LIMITE_INICIAL);
                }}
                className={campoClasse}
              >
                <option value="">Todas as cidades</option>
                {cidades.map((cidade) => (
                  <option key={cidade.slug} value={cidade.slug}>
                    {cidade.nomeExibicao}
                  </option>
                ))}
              </select>
            </label>
          ) : bairros.length > 0 ? (
            <label className="mt-4 block">
              <span className="text-xs font-medium text-slate-600">Bairro</span>
              <select
                value={bairro}
                onChange={(event) => {
                  setBairro(event.target.value);
                  setLimiteVisivel(LIMITE_INICIAL);
                }}
                className={campoClasse}
              >
                <option value="">Todos os bairros</option>
                {bairros.map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="mt-4 block">
            <span className="text-xs font-medium text-slate-600">
              Tipo de imóvel
            </span>
            <select
              value={tipo}
              onChange={(event) => {
                setTipo(event.target.value);
                setLimiteVisivel(LIMITE_INICIAL);
              }}
              className={campoClasse}
            >
              <option value="">Todos os tipos</option>
              {tipos.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="mt-5 border-t border-[#173b50]/10 pt-4">
            <legend className="text-sm font-semibold text-[#173b50]">
              Faixa de preço
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label>
                <span className="text-xs font-medium text-slate-600">
                  A partir de
                </span>
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={precoMinimo}
                  onChange={(event) => {
                    setPrecoMinimo(event.target.value);
                    setLimiteVisivel(LIMITE_INICIAL);
                  }}
                  placeholder="R$ mínimo"
                  className={campoClasse}
                />
              </label>
              <label>
                <span className="text-xs font-medium text-slate-600">Até</span>
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={precoMaximo}
                  onChange={(event) => {
                    setPrecoMaximo(event.target.value);
                    setLimiteVisivel(LIMITE_INICIAL);
                  }}
                  placeholder="R$ máximo"
                  className={campoClasse}
                />
              </label>
            </div>
            <p className="mt-2 text-[0.7rem] leading-5 text-slate-500">
              Valores em reais, conforme a lista da Caixa.
            </p>
          </fieldset>

          <FiltroCaracteristicas
            value={caracteristicas}
            onChange={(value) => {
              setCaracteristicas(value);
              setLimiteVisivel(LIMITE_INICIAL);
            }}
          />
        </div>
      </aside>

      <section aria-labelledby="resultados-regionais" className="min-w-0">
        <div className="mb-5 rounded-xl border border-sky-900/10 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950">
          A lista oficial registra {toNumero(totalImoveis)} imóveis. Os filtros
          desta página consideram os destaques disponíveis no snapshot, não o
          catálogo completo.
        </div>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="resultados-regionais"
              className="text-2xl font-semibold tracking-tight text-[#173b50]"
            >
              Imóveis em destaque
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {toNumero(resultados.length)} de {toNumero(imoveis.length)}{" "}
              destaques correspondem aos filtros
            </p>
          </div>
          <p className="rounded-full bg-[#e8f7f4] px-3 py-1.5 text-xs font-semibold text-[#12675e]">
            Valores e condições devem ser confirmados na Caixa
          </p>
        </div>

        {resultados.length > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
              {resultados.slice(0, limiteVisivel).map((imovel) => (
                <CardImovel
                  key={imovel.idCaixa}
                  imovel={imovel}
                  contexto={modo === "cidade" ? "cidade" : "geral"}
                />
              ))}
            </div>
            {resultados.length > limiteVisivel ? (
              <button
                type="button"
                onClick={() =>
                  setLimiteVisivel((atual) =>
                    Math.min(atual + LIMITE_INICIAL, resultados.length),
                  )
                }
                className="mt-6 w-full rounded-xl border border-[#173b50]/15 bg-white px-4 py-3 text-sm font-semibold text-[#173b50] transition hover:border-[#28749a]/50 hover:bg-[#f3f8f8]"
              >
                Mostrar mais{" "}
                {toNumero(
                  Math.min(LIMITE_INICIAL, resultados.length - limiteVisivel),
                )}{" "}
                imóveis
              </button>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#173b50]/20 bg-white px-6 py-12 text-center">
            <p className="text-lg font-semibold text-[#173b50]">
              Nenhum destaque corresponde a esses filtros
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Experimente ampliar a faixa ou remover algum critério.
            </p>
            <button
              type="button"
              onClick={limparFiltros}
              className="mt-4 rounded-lg bg-[#173b50] px-4 py-2 text-sm font-semibold text-white hover:bg-[#24566d]"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
