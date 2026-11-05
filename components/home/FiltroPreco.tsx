"use client";

import { useMemo } from "react";

import { toCurrency, toCurrencyCompacto, toNumero } from "../../lib/formatar";
import type { CardImovelDados } from "./CardImovel";

export type FaixaPreco = {
  minimo: number;
  maximo: number;
};

type FiltroPrecoProps = {
  imoveis: CardImovelDados[];
  limite: number;
  faixa: FaixaPreco | null;
  onChange: (faixa: FaixaPreco | null) => void;
};

const POSICAO_MAXIMA = 1000;
const PRECO_MINIMO_SEPARACAO = 1000;
const TOTAL_BARRAS = 20;

const PRESETS = [
  { nome: "Até R$ 50 mil", minimo: 0, maximo: 50_000 },
  { nome: "R$ 50–150 mil", minimo: 50_000, maximo: 150_000 },
  { nome: "R$ 150–300 mil", minimo: 150_000, maximo: 300_000 },
  { nome: "R$ 300–500 mil", minimo: 300_000, maximo: 500_000 },
  { nome: "Acima de R$ 500 mil", minimo: 500_000, maximo: Infinity },
];

function precoParaPosicao(preco: number, limite: number) {
  return Math.round(
    (Math.log1p(Math.max(0, preco)) / Math.log1p(limite)) * POSICAO_MAXIMA,
  );
}

function posicaoParaPreco(posicao: number, limite: number) {
  const valor = Math.expm1((posicao / POSICAO_MAXIMA) * Math.log1p(limite));
  return Math.min(limite, Math.round(valor / 100) * 100);
}

function normalizarPreco(valor: string, padrao: number, limite: number) {
  if (valor.trim() === "") return padrao;
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? Math.max(0, Math.min(limite, numero))
    : padrao;
}

export function FiltroPreco({
  imoveis,
  limite,
  faixa,
  onChange,
}: FiltroPrecoProps) {
  const minimo = Math.max(0, Math.min(faixa?.minimo ?? 0, limite));
  const maximo = Math.max(minimo, Math.min(faixa?.maximo ?? limite, limite));
  const posicaoMinima = precoParaPosicao(minimo, limite);
  const posicaoMaxima = precoParaPosicao(maximo, limite);

  const histograma = useMemo(() => {
    const barras = Array<number>(TOTAL_BARRAS).fill(0);
    for (const imovel of imoveis) {
      const preco = Number(imovel.preco);
      if (!Number.isFinite(preco) || preco < 0) continue;
      const indice = Math.min(
        TOTAL_BARRAS - 1,
        Math.floor(
          (precoParaPosicao(preco, limite) / POSICAO_MAXIMA) * TOTAL_BARRAS,
        ),
      );
      barras[indice] += 1;
    }
    return barras;
  }, [imoveis, limite]);

  const maiorBarra = Math.max(...histograma, 1);
  const quantidadeNoRecorte = imoveis.filter((imovel) => {
    const preco = Number(imovel.preco);
    return Number.isFinite(preco) && preco >= minimo && preco <= maximo;
  }).length;

  function atualizarFaixa(proximoMinimo: number, proximoMaximo: number) {
    const proxima = {
      minimo: Math.max(0, Math.min(proximoMinimo, limite)),
      maximo: Math.max(0, Math.min(proximoMaximo, limite)),
    };

    if (proxima.minimo === 0 && proxima.maximo === limite) {
      onChange(null);
      return;
    }
    onChange(proxima);
  }

  function escolherPreset(preset: (typeof PRESETS)[number]) {
    atualizarFaixa(
      Math.min(preset.minimo, limite),
      Math.min(preset.maximo, limite),
    );
  }

  const presetSelecionado = PRESETS.find(
    (preset) =>
      minimo === Math.min(preset.minimo, limite) &&
      maximo === Math.min(preset.maximo, limite),
  );

  return (
    <section
      aria-labelledby="filtro-preco-titulo"
      className="filtro-preco-painel mt-10 rounded-[1.75rem] border p-5 shadow-[0_18px_48px_rgba(23,59,80,0.07)] sm:p-7"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-[#28749a] uppercase">
            Seu próximo passo
          </p>
          <h3
            id="filtro-preco-titulo"
            className="mt-2 text-xl font-semibold tracking-tight text-[#173b50] sm:text-2xl"
          >
            Quanto cabe no seu plano?
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Escolha uma faixa que faça sentido para o seu bolso.
          </p>
        </div>
        <p
          aria-live="polite"
          className="shrink-0 rounded-full bg-[#e8f7f4] px-4 py-2 text-sm font-semibold text-[#12675e]"
        >
          {toNumero(quantidadeNoRecorte)}{" "}
          {quantidadeNoRecorte === 1 ? "oportunidade" : "oportunidades"}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={!faixa}
          onClick={() => onChange(null)}
          className={`rounded-full border px-3.5 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#28749a] ${
            !faixa
              ? "border-[#12675e] bg-[#12675e] text-white shadow-sm"
              : "border-[#173b50]/10 bg-white text-[#315769] hover:border-[#35bda9]/50 hover:bg-[#eff9f7]"
          }`}
        >
          Todos os preços
          <span
            className={`ml-1.5 text-xs ${!faixa ? "text-white/70" : "text-slate-400"}`}
          >
            {toNumero(imoveis.length)}
          </span>
        </button>
        {PRESETS.map((preset) => {
          const selecionado = presetSelecionado?.nome === preset.nome;
          const teto = Math.min(preset.maximo, limite);
          const quantidade = imoveis.filter((imovel) => {
            const preco = Number(imovel.preco);
            return (
              Number.isFinite(preco) && preco >= preset.minimo && preco <= teto
            );
          }).length;

          return (
            <button
              key={preset.nome}
              type="button"
              aria-pressed={selecionado}
              onClick={() => escolherPreset(preset)}
              className={`rounded-full border px-3.5 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#28749a] ${
                selecionado
                  ? "border-[#12675e] bg-[#12675e] text-white shadow-sm"
                  : "border-[#173b50]/10 bg-white text-[#315769] hover:border-[#35bda9]/50 hover:bg-[#eff9f7]"
              }`}
            >
              {preset.nome}
              <span
                className={`ml-1.5 text-xs ${selecionado ? "text-white/70" : "text-slate-400"}`}
              >
                {toNumero(quantidade)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-7">
        <div aria-hidden="true" className="flex h-12 items-end gap-1 px-2">
          {histograma.map((quantidade, indice) => {
            const dentroDaFaixa =
              indice >= (posicaoMinima / POSICAO_MAXIMA) * TOTAL_BARRAS &&
              indice <= (posicaoMaxima / POSICAO_MAXIMA) * TOTAL_BARRAS;
            const altura = Math.max(
              12,
              Math.round((quantidade / maiorBarra) * 100),
            );

            return (
              <span
                key={indice}
                className={`min-w-0 flex-1 rounded-t-sm transition-colors ${
                  dentroDaFaixa ? "bg-[#48cbb5]" : "bg-[#dce8e7]"
                }`}
                style={{ height: `${altura}%` }}
              />
            );
          })}
        </div>

        <div className="relative mx-2 h-8">
          <div
            aria-hidden="true"
            className="filtro-preco-trilho absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full"
            style={{
              background: `linear-gradient(to right, #dce8e7 ${posicaoMinima / 10}%, #35bda9 ${posicaoMinima / 10}%, #35bda9 ${posicaoMaxima / 10}%, #dce8e7 ${posicaoMaxima / 10}%)`,
            }}
          />
          <input
            type="range"
            min={0}
            max={POSICAO_MAXIMA}
            step={1}
            value={posicaoMinima}
            aria-label="Preço mínimo"
            aria-valuetext={toCurrency(minimo)}
            onChange={(event) => {
              const proximo = posicaoParaPreco(
                Number(event.target.value),
                limite,
              );
              atualizarFaixa(
                Math.min(proximo, Math.max(0, maximo - PRECO_MINIMO_SEPARACAO)),
                maximo,
              );
            }}
            className="preco-range-input absolute inset-0 z-20 h-full w-full"
          />
          <input
            type="range"
            min={0}
            max={POSICAO_MAXIMA}
            step={1}
            value={posicaoMaxima}
            aria-label="Preço máximo"
            aria-valuetext={toCurrency(maximo)}
            onChange={(event) => {
              const proximo = posicaoParaPreco(
                Number(event.target.value),
                limite,
              );
              atualizarFaixa(
                minimo,
                Math.max(proximo, minimo + PRECO_MINIMO_SEPARACAO),
              );
            }}
            className="preco-range-input absolute inset-0 z-10 h-full w-full"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-500">
            A partir de
            <span className="relative mt-1 block">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-slate-400"
              >
                R$
              </span>
              <input
                type="number"
                min={0}
                max={Math.max(0, maximo - PRECO_MINIMO_SEPARACAO)}
                step={1000}
                value={minimo}
                aria-label="Preço mínimo em reais"
                onChange={(event) =>
                  atualizarFaixa(
                    Math.min(
                      normalizarPreco(event.target.value, 0, limite),
                      Math.max(0, maximo - PRECO_MINIMO_SEPARACAO),
                    ),
                    maximo,
                  )
                }
                className="filtro-preco-campo w-full rounded-xl border border-[#173b50]/10 bg-white py-2.5 pr-3 pl-10 text-sm font-semibold text-[#173b50] transition outline-none focus:border-[#35bda9] focus:ring-4 focus:ring-[#35bda9]/15"
              />
            </span>
          </label>
          <label className="text-xs font-medium text-slate-500">
            Até
            <span className="relative mt-1 block">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-slate-400"
              >
                R$
              </span>
              <input
                type="number"
                min={minimo + PRECO_MINIMO_SEPARACAO}
                max={limite}
                step={1000}
                value={maximo}
                aria-label="Preço máximo em reais"
                onChange={(event) =>
                  atualizarFaixa(
                    minimo,
                    Math.max(
                      normalizarPreco(event.target.value, limite, limite),
                      minimo + PRECO_MINIMO_SEPARACAO,
                    ),
                  )
                }
                className="filtro-preco-campo w-full rounded-xl border border-[#173b50]/10 bg-white py-2.5 pr-3 pl-10 text-sm font-semibold text-[#173b50] transition outline-none focus:border-[#35bda9] focus:ring-4 focus:ring-[#35bda9]/15"
              />
            </span>
          </label>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-400">
          <span>{toCurrencyCompacto(minimo)}</span>
          <span>até {toCurrencyCompacto(maximo)}</span>
        </div>
      </div>

      <p className="mt-5 border-t border-[#173b50]/10 pt-4 text-xs leading-5 text-slate-500">
        A régua usa escala progressiva para facilitar o ajuste das faixas
        menores. Valores e contagens consideram os imóveis em destaque no
        recorte atual; confirme as condições na página oficial.
      </p>
    </section>
  );
}
