import type { ReactNode } from "react";
import Link from "next/link";

import { formatarLocal } from "../../lib/formatar-local";
import {
  toCurrency,
  toDataCurta,
  toDiaMes,
  toPercent,
} from "../../lib/formatar";
import type { PublicImovel } from "../../lib/public-data";
import { IconeLinha } from "../site/IconeLinha";
import { CronometroImovel } from "./CronometroImovel";
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
  | "caracteristicas"
  | "cidadeNome"
  | "listaDe"
  | "encerramentoEm"
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
  const dataLista = toDiaMes(imovel.listaDe);
  const selo = imovel.selo ? SELOS[imovel.selo] : null;
  const area = imovel.caracteristicas.areaPrivativa
    ? {
        valor: imovel.caracteristicas.areaPrivativa,
        rotulo: "privativos",
      }
    : imovel.caracteristicas.areaTotal
      ? { valor: imovel.caracteristicas.areaTotal, rotulo: "totais" }
      : imovel.caracteristicas.areaTerreno
        ? { valor: imovel.caracteristicas.areaTerreno, rotulo: "de terreno" }
        : null;
  const caracteristicas = [
    imovel.caracteristicas.quartos
      ? {
          icone: "quartos" as const,
          texto: `${imovel.caracteristicas.quartos} ${imovel.caracteristicas.quartos === 1 ? "quarto" : "quartos"}`,
        }
      : null,
    imovel.caracteristicas.banheiros
      ? {
          icone: "banheiro" as const,
          texto: `${imovel.caracteristicas.banheiros} ${imovel.caracteristicas.banheiros === 1 ? "banheiro" : "banheiros"}`,
        }
      : null,
    area
      ? {
          icone: "area" as const,
          texto: `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(area.valor)} m² ${area.rotulo}`,
        }
      : null,
    imovel.caracteristicas.vagas
      ? {
          icone: "vaga" as const,
          texto: `${imovel.caracteristicas.vagas} ${imovel.caracteristicas.vagas === 1 ? "vaga" : "vagas"}`,
        }
      : null,
    imovel.caracteristicas.salas
      ? {
          icone: "sala" as const,
          texto: `${imovel.caracteristicas.salas} ${imovel.caracteristicas.salas === 1 ? "sala" : "salas"}`,
        }
      : null,
  ].filter((item) => item !== null);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#173b50]/10 bg-white shadow-[0_8px_28px_rgba(23,59,80,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(23,59,80,0.13)]">
      <div className="relative">
        <FotoImovel
          idCaixa={imovel.idCaixa}
          descricao={`Foto oficial do imóvel em ${local}`}
        />
        <p className="absolute right-4 bottom-4 rounded-xl bg-[#173b50] px-3 py-2 text-center text-white shadow-lg">
          <span className="block text-xl leading-tight font-bold">
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
        <div className="flex items-start gap-2 text-sm font-medium text-[#54717e]">
          <IconeLinha nome="local" className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="min-w-0 break-words">{local}</p>
        </div>
        <h3 className="mt-2 text-lg leading-snug font-semibold text-[#173b50]">
          {imovel.tipo || "Imóvel"}
        </h3>

        {destaque}

        {imovel.encerramentoEm ? (
          <CronometroImovel encerramentoEm={imovel.encerramentoEm} />
        ) : null}

        {caracteristicas.length > 0 ? (
          <ul
            aria-label="Características informadas pela Caixa"
            className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-xs font-medium text-slate-600"
          >
            {caracteristicas.map((item) => (
              <li key={item.icone} className="inline-flex items-center gap-1.5">
                <IconeLinha
                  nome={item.icone}
                  className="h-4 w-4 shrink-0 text-[#28749a]"
                />
                {item.texto}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 rounded-xl bg-[#f3f7f6] p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <IconeLinha nome="preco" className="h-4 w-4 text-[#28749a]" />
            Valor de venda
          </div>
          <p className="mt-1 text-2xl leading-tight font-bold tracking-tight text-[#173b50]">
            {toCurrency(imovel.preco)}
          </p>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-[#173b50]/10 pt-3">
            <span className="text-xs text-slate-500">Avaliação</span>
            <span className="text-sm font-medium text-slate-700">
              {toCurrency(imovel.valorAvaliacao)}
            </span>
          </div>
          {economia > 0 ? (
            <p className="economia-imovel mt-2 flex items-center gap-2 text-sm font-semibold text-[#12675e]">
              <IconeLinha nome="queda" className="h-4 w-4 shrink-0" />
              {toCurrency(economia)} abaixo da avaliação
            </p>
          ) : null}
        </div>

        <ul className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
          <li className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f4f3] px-2.5 py-1.5">
            <IconeLinha nome="casa" className="h-3.5 w-3.5" />
            {imovel.modalidade}
          </li>
          <li className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f4f3] px-2.5 py-1.5">
            <IconeLinha nome="financiamento" className="h-3.5 w-3.5 shrink-0" />
            {imovel.aceitaFinanciamento
              ? "Aceita financiamento"
              : "Sem financiamento"}
          </li>
        </ul>

        <div className="mt-4 space-y-2 border-t border-[#173b50]/10 pt-3">
          <p
            title={imovel.endereco}
            className="flex items-start gap-2 text-sm leading-5 text-slate-600"
          >
            <IconeLinha
              nome="local"
              className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
            />
            <span className="min-w-0 break-words">{imovel.endereco}</span>
          </p>
          {dataLista || monitoradoDesde ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {dataLista ? (
                <span className="inline-flex items-center gap-1.5">
                  <IconeLinha nome="calendario" className="h-3.5 w-3.5" />
                  Lista Caixa · {dataLista}
                </span>
              ) : null}
              {monitoradoDesde ? (
                <span className="inline-flex items-center gap-1.5">
                  <IconeLinha nome="relogio" className="h-3.5 w-3.5" />
                  Monitorado desde {monitoradoDesde}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

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
            className="inline-flex items-center gap-1 text-[#28749a] underline-offset-4 hover:underline"
          >
            Ver na Caixa
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </article>
  );
}
