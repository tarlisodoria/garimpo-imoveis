import type { ReactNode } from "react";
import Link from "next/link";

import { formatarLocal } from "../../lib/formatar-local";
import {
  toCurrencyCompacto,
  toDataCurta,
  toDiaMes,
  toPercent,
} from "../../lib/formatar";
import type { PublicImovel } from "../../lib/public-data";

export type CardImovelDados = Pick<
  PublicImovel,
  | "idCaixa"
  | "uf"
  | "cidade"
  | "cidadeSlug"
  | "bairro"
  | "endereco"
  | "tipo"
  | "preco"
  | "valorAvaliacao"
  | "descontoPct"
  | "modalidade"
  | "aceitaFinanciamento"
  | "linkOficial"
  | "economiaReais"
  | "entrouEm"
  | "selo"
  | "cidadeNome"
  | "listaDe"
>;

type CardImovelProps = {
  imovel: CardImovelDados;
  /** Na página da cidade, o bairro substitui a cidade e o link "Ver cidade" some. */
  contexto?: "geral" | "cidade";
  /** Destaque opcional logo abaixo do cabeçalho (ex.: queda de preço). */
  destaque?: ReactNode;
};

const SELOS = {
  novo: {
    texto: "Novo",
    classe: "border-sky-700/20 bg-sky-50 text-sky-800",
  },
  baixou: {
    texto: "Preço baixou",
    classe: "border-amber-700/25 bg-amber-50 text-amber-800",
  },
} as const;

export function CardImovel({
  imovel,
  contexto = "geral",
  destaque,
}: CardImovelProps) {
  const local =
    contexto === "cidade"
      ? formatarLocal(imovel.bairro) || "Bairro não informado"
      : `${imovel.cidadeNome}/${imovel.uf}`;
  const economia = Number(imovel.economiaReais);
  const monitoradoDesde = toDataCurta(imovel.entrouEm);
  const selo = imovel.selo ? SELOS[imovel.selo] : null;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-900/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">
              {imovel.tipo || "Imóvel"}
            </h3>
            {selo ? (
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${selo.classe}`}
              >
                {selo.texto}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-medium text-slate-700">{local}</p>
        </div>
        <p className="shrink-0 rounded-xl bg-emerald-800 px-3 py-2 text-center text-white">
          <span className="block text-xl leading-none font-bold">
            {toPercent(imovel.descontoPct)}
          </span>
          <span className="mt-1 block text-[0.65rem] tracking-wide uppercase">
            desconto
          </span>
        </p>
      </div>

      {destaque}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-600">Valor mínimo de venda</dt>
          <dd className="text-base font-semibold text-slate-900">
            {toCurrencyCompacto(imovel.preco)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-600">Avaliação da Caixa</dt>
          <dd className="text-base text-slate-700">
            {toCurrencyCompacto(imovel.valorAvaliacao)}
          </dd>
        </div>
        {economia > 0 ? (
          <div className="col-span-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
            <dt className="sr-only">Diferença para a avaliação</dt>
            <dd>
              <strong className="font-semibold">
                {toCurrencyCompacto(economia)}
              </strong>{" "}
              abaixo da avaliação
            </dd>
          </div>
        ) : null}
      </dl>

      <ul className="mt-4 flex flex-wrap gap-2 text-xs text-slate-700">
        <li className="rounded-full bg-slate-100 px-2.5 py-1">
          {imovel.modalidade}
        </li>
        <li className="rounded-full bg-slate-100 px-2.5 py-1">
          {imovel.aceitaFinanciamento
            ? "Aceita financiamento"
            : "Sem financiamento"}
        </li>
      </ul>
      <p className="mt-2 text-xs text-slate-500">
        Modalidade informada na lista da Caixa
        {imovel.listaDe ? ` de ${toDiaMes(imovel.listaDe)}` : ""} — confirme na
        fonte.
      </p>

      <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">
        {imovel.endereco}
      </p>
      {monitoradoDesde ? (
        <p className="mt-1 text-xs text-slate-500">
          Monitorado desde {monitoradoDesde}
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm font-medium">
        {contexto === "geral" ? (
          <Link
            href={`/${imovel.uf.toLowerCase()}/${imovel.cidadeSlug}`}
            className="text-emerald-800 underline-offset-4 hover:underline"
          >
            Ver cidade
          </Link>
        ) : (
          <span className="text-xs font-normal text-slate-500">
            Nº {imovel.idCaixa}
          </span>
        )}
        <a
          href={imovel.linkOficial}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-900 underline-offset-4 hover:underline"
        >
          Fonte oficial ↗
        </a>
      </div>
    </article>
  );
}
