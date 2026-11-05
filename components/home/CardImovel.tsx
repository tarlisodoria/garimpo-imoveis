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
import { FotoImovel } from "./FotoImovel";

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
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#173b50]/10 bg-white shadow-[0_8px_28px_rgba(23,59,80,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(23,59,80,0.13)]">
      <div className="relative">
        <FotoImovel
          idCaixa={imovel.idCaixa}
          descricao={`Foto oficial do imóvel em ${local}`}
        />
        <p className="absolute right-4 bottom-4 rounded-xl bg-[#173b50] px-3 py-2 text-center text-white shadow-lg">
          <span className="block text-xl leading-none font-bold">
            {toPercent(imovel.descontoPct)}
          </span>
          <span className="mt-1 block text-[0.62rem] tracking-wide uppercase">
            de desconto
          </span>
        </p>
        {selo ? (
          <span
            className={`absolute top-4 left-4 rounded-full border bg-white/95 px-3 py-1 text-xs font-semibold shadow-sm ${selo.classe}`}
          >
            {selo.texto}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold tracking-wide text-[#54717e] uppercase">
          {local}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-[#173b50]">
          {imovel.tipo || "Imóvel"}
        </h3>

        {destaque}

        <dl className="mt-5 grid grid-cols-2 gap-3 border-y border-[#173b50]/10 py-4">
          <div>
            <dt className="text-xs text-slate-500">Valor de venda</dt>
            <dd className="mt-1 text-base font-semibold text-[#173b50]">
              {toCurrencyCompacto(imovel.preco)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Avaliação</dt>
            <dd className="mt-1 text-base font-medium text-slate-700">
              {toCurrencyCompacto(imovel.valorAvaliacao)}
            </dd>
          </div>
        </dl>

        {economia > 0 ? (
          <p className="mt-3 text-sm text-[#315769]">
            <strong className="font-semibold">
              {toCurrencyCompacto(economia)}
            </strong>{" "}
            abaixo da avaliação
          </p>
        ) : null}

        <ul className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
          <li className="rounded-full bg-[#f0f4f3] px-2.5 py-1">
            {imovel.modalidade}
          </li>
          <li className="rounded-full bg-[#f0f4f3] px-2.5 py-1">
            {imovel.aceitaFinanciamento
              ? "Aceita financiamento"
              : "Sem financiamento"}
          </li>
        </ul>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Modalidade informada na lista da Caixa
          {imovel.listaDe ? ` de ${toDiaMes(imovel.listaDe)}` : ""}. Confirme as
          condições na página oficial.
        </p>

        <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">
          {imovel.endereco}
        </p>
        {monitoradoDesde ? (
          <p className="mt-1 text-xs text-slate-500">
            Monitorado desde {monitoradoDesde}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-sm font-semibold">
          {contexto === "geral" ? (
            <Link
              href={`/${imovel.uf.toLowerCase()}/${imovel.cidadeSlug}`}
              className="text-[#315769] underline-offset-4 hover:underline"
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
            className="text-[#28749a] underline-offset-4 hover:underline"
          >
            Ver na Caixa ↗
          </a>
        </div>
      </div>
    </article>
  );
}
