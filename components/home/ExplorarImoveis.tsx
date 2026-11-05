"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import mapData from "../../data/brasil-ufs.json";
import { toCurrencyCompacto, toNumero } from "../../lib/formatar";
import { nomeUf } from "../../lib/ufs";
import { TopDescontos } from "./TopDescontos";
import { FiltroPreco, type FaixaPreco } from "./FiltroPreco";
import type { CardImovelDados } from "./CardImovel";

type Position = [number, number];
type PolygonGeometry = {
  type: "Polygon";
  coordinates: Position[][];
};
type MultiPolygonGeometry = {
  type: "MultiPolygon";
  coordinates: Position[][][];
};
type EstadoFeature = {
  type: "Feature";
  properties: { sigla: string };
  geometry: PolygonGeometry | MultiPolygonGeometry;
};
type CategoriaImovel =
  "casa" | "apartamento" | "terreno" | "comercial" | "galpao" | "outros";

// Malha estadual do IBGE distribuída pelo br-geojson sob CC0 1.0.
export type CidadeExploravel = {
  nomeExibicao: string;
  slug: string;
  totalImoveis: number;
};

export type EstadoExploravel = {
  uf: string;
  totalImoveis: number;
  cidades: CidadeExploravel[];
};

type ExplorarImoveisProps = {
  imoveis: CardImovelDados[];
  ufs: EstadoExploravel[];
};

const REGIOES = [
  {
    nome: "Norte",
    ufs: ["AC", "AP", "AM", "PA", "RO", "RR", "TO"],
  },
  {
    nome: "Nordeste",
    ufs: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
  },
  {
    nome: "Centro-Oeste",
    ufs: ["DF", "GO", "MS", "MT"],
  },
  {
    nome: "Sudeste",
    ufs: ["ES", "MG", "RJ", "SP"],
  },
  {
    nome: "Sul",
    ufs: ["PR", "RS", "SC"],
  },
] as const;

const CATEGORIAS_IMOVEL: {
  id: CategoriaImovel;
  nome: string;
  cor: string;
}[] = [
  { id: "casa", nome: "Casas", cor: "#35e0c1" },
  { id: "apartamento", nome: "Apartamentos", cor: "#b28cff" },
  { id: "terreno", nome: "Terrenos", cor: "#ffbd55" },
  { id: "comercial", nome: "Comerciais", cor: "#58a9ff" },
  { id: "galpao", nome: "Galpões", cor: "#ff7182" },
  { id: "outros", nome: "Outros", cor: "#ec68b4" },
];

const FEATURES = mapData.features as EstadoFeature[];
const MAP_WIDTH = 620;
const MAP_HEIGHT = 500;
const MAP_PADDING = 18;
const LIMITE_RESULTADOS = 12;

function mercator(latitude: number) {
  const radians = (latitude * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + radians / 2));
}

function projectMap() {
  const positions = FEATURES.flatMap((feature) => {
    const polygons =
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;

    return polygons.flatMap((polygon) => polygon.flatMap((ring) => ring));
  });
  const longitudes = positions.map(
    ([longitude]) => (longitude * Math.PI) / 180,
  );
  const latitudes = positions.map(([, latitude]) => mercator(latitude));
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const scale = Math.min(
    (MAP_WIDTH - MAP_PADDING * 2) / (maxLongitude - minLongitude),
    (MAP_HEIGHT - MAP_PADDING * 2) / (maxLatitude - minLatitude),
  );
  const drawnWidth = (maxLongitude - minLongitude) * scale;
  const drawnHeight = (maxLatitude - minLatitude) * scale;
  const offsetX = (MAP_WIDTH - drawnWidth) / 2;
  const offsetY = (MAP_HEIGHT - drawnHeight) / 2;

  return (position: Position): [number, number] => {
    const [longitude, latitude] = position;
    const longitudeRadians = (longitude * Math.PI) / 180;
    const x = offsetX + (longitudeRadians - minLongitude) * scale;
    const y = offsetY + (maxLatitude - mercator(latitude)) * scale;
    return [x, y];
  };
}

const project = projectMap();

function centroDaGeometria(geometry: PolygonGeometry | MultiPolygonGeometry) {
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const positions = polygons.flatMap((polygon) =>
    polygon.flatMap((ring) => ring),
  );
  const projected = positions.map(project);
  const center = projected.reduce(
    (total, [x, y]) => [total[0] + x, total[1] + y],
    [0, 0],
  );

  return [center[0] / projected.length, center[1] / projected.length] as const;
}

function pathForGeometry(geometry: PolygonGeometry | MultiPolygonGeometry) {
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

  return polygons
    .map((polygon) =>
      polygon
        .map((ring) => {
          const [first, ...remaining] = ring;
          if (!first) return "";
          const [firstX, firstY] = project(first);
          return `M${firstX.toFixed(2)},${firstY.toFixed(2)}${remaining
            .map((point) => {
              const [x, y] = project(point);
              return `L${x.toFixed(2)},${y.toFixed(2)}`;
            })
            .join("")}Z`;
        })
        .join(""),
    )
    .join("");
}

const ESTADO_PATHS = FEATURES.map((feature) => ({
  uf: feature.properties.sigla,
  d: pathForGeometry(feature.geometry),
  center: centroDaGeometria(feature.geometry),
}));

function regiaoDaUf(uf: string) {
  return REGIOES.find((regiao) => regiao.ufs.some((sigla) => sigla === uf));
}

function categoriaDoTipo(tipo: string | null): CategoriaImovel {
  const nome = (tipo ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

  if (/casa|sobrado/.test(nome)) return "casa";
  if (/apartamento/.test(nome)) return "apartamento";
  if (/terreno/.test(nome)) return "terreno";
  if (/galpao/.test(nome)) return "galpao";
  if (/comercial|predio|loja|sala/.test(nome)) return "comercial";
  return "outros";
}

export function ExplorarImoveis({ imoveis, ufs }: ExplorarImoveisProps) {
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const botaoAbrirFiltrosRef = useRef<HTMLButtonElement>(null);
  const botaoFecharFiltrosRef = useRef<HTMLButtonElement>(null);
  const painelFiltrosRef = useRef<HTMLElement>(null);
  const [regiaoSelecionada, setRegiaoSelecionada] = useState<string | null>(
    null,
  );
  const [ufSelecionada, setUfSelecionada] = useState<string | null>(null);
  const [ufEmFoco, setUfEmFoco] = useState<string | null>(null);
  const [buscaCidade, setBuscaCidade] = useState("");
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState(
    () => new Set(CATEGORIAS_IMOVEL.map((categoria) => categoria.id)),
  );
  const [faixaPreco, setFaixaPreco] = useState<FaixaPreco | null>(null);

  useEffect(() => {
    if (!filtrosAbertos) return;

    const botaoAbrirFiltros = botaoAbrirFiltrosRef.current;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    botaoFecharFiltrosRef.current?.focus();

    function manterFocoNoPainel(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFiltrosAbertos(false);
        return;
      }
      if (event.key !== "Tab") return;

      const elementosFocaveis =
        painelFiltrosRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
      if (!elementosFocaveis?.length) return;

      const primeiro = elementosFocaveis[0];
      const ultimo = elementosFocaveis[elementosFocaveis.length - 1];
      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo?.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro?.focus();
      }
    }

    window.addEventListener("keydown", manterFocoNoPainel);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", manterFocoNoPainel);
      botaoAbrirFiltros?.focus();
    };
  }, [filtrosAbertos]);

  const limitePreco = useMemo(() => {
    const maiorPreco = Math.max(
      100_000,
      ...imoveis.map((imovel) => Number(imovel.preco)).filter(Number.isFinite),
    );
    return Math.ceil(maiorPreco / 100_000) * 100_000;
  }, [imoveis]);

  const totaisPorCategoria = useMemo(() => {
    const totais = new Map<CategoriaImovel, number>();
    for (const imovel of imoveis) {
      const categoria = categoriaDoTipo(imovel.tipo);
      totais.set(categoria, (totais.get(categoria) ?? 0) + 1);
    }
    return totais;
  }, [imoveis]);

  const totaisPorUfECategoria = useMemo(() => {
    const totais = new Map<string, Map<CategoriaImovel, number>>();
    for (const imovel of imoveis) {
      const preco = Number(imovel.preco);
      if (
        faixaPreco &&
        (!Number.isFinite(preco) ||
          preco < faixaPreco.minimo ||
          preco > faixaPreco.maximo)
      ) {
        continue;
      }
      const categorias = totais.get(imovel.uf) ?? new Map();
      const categoria = categoriaDoTipo(imovel.tipo);
      categorias.set(categoria, (categorias.get(categoria) ?? 0) + 1);
      totais.set(imovel.uf, categorias);
    }
    return totais;
  }, [faixaPreco, imoveis]);

  const categoriasVisiveis = CATEGORIAS_IMOVEL.filter(
    (categoria) => (totaisPorCategoria.get(categoria.id) ?? 0) > 0,
  );
  const imoveisFiltradosPorCategoria = imoveis.filter((imovel) =>
    categoriasSelecionadas.has(categoriaDoTipo(imovel.tipo)),
  );
  const estadoSelecionado = ufs.find((estado) => estado.uf === ufSelecionada);
  const regiaoAtual = REGIOES.find(
    (regiao) => regiao.nome === regiaoSelecionada,
  );
  const ufsDaRegiao: readonly string[] | null = regiaoAtual?.ufs ?? null;
  const imoveisDoRecorte = imoveisFiltradosPorCategoria.filter((imovel) =>
    ufSelecionada
      ? imovel.uf === ufSelecionada
      : !ufsDaRegiao || ufsDaRegiao.includes(imovel.uf),
  );
  const imoveisComPreco = imoveisFiltradosPorCategoria.filter((imovel) => {
    if (!faixaPreco) return true;
    const preco = Number(imovel.preco);
    return (
      Number.isFinite(preco) &&
      preco >= faixaPreco.minimo &&
      preco <= faixaPreco.maximo
    );
  });
  const imoveisResultados = imoveisComPreco.filter((imovel) =>
    ufSelecionada
      ? imovel.uf === ufSelecionada
      : !ufsDaRegiao || ufsDaRegiao.includes(imovel.uf),
  );
  const cidades = useMemo(() => {
    if (!estadoSelecionado) return [];
    return [...estadoSelecionado.cidades].sort(
      (a, b) =>
        b.totalImoveis - a.totalImoveis ||
        a.nomeExibicao.localeCompare(b.nomeExibicao, "pt-BR"),
    );
  }, [estadoSelecionado]);
  const cidadesFiltradas = useMemo(() => {
    const query = buscaCidade.trim().toLocaleLowerCase("pt-BR");
    const encontrados = query
      ? cidades.filter((cidade) =>
          cidade.nomeExibicao.toLocaleLowerCase("pt-BR").includes(query),
        )
      : cidades;
    return query ? encontrados : encontrados.slice(0, 12);
  }, [buscaCidade, cidades]);

  function selecionarRegiao(nome: string) {
    setRegiaoSelecionada((atual) => (atual === nome ? null : nome));
    setUfSelecionada(null);
    setBuscaCidade("");
  }

  function selecionarUf(uf: string) {
    const regiao = regiaoDaUf(uf);
    setUfSelecionada((atual) => (atual === uf ? null : uf));
    setRegiaoSelecionada(regiao?.nome ?? null);
    setBuscaCidade("");
  }

  function limparSelecao() {
    setUfSelecionada(null);
    setRegiaoSelecionada(null);
    setBuscaCidade("");
  }

  const localSelecionado = ufSelecionada
    ? nomeUf(ufSelecionada)
    : regiaoSelecionada
      ? `Região ${regiaoSelecionada}`
      : "Brasil";

  return (
    <section
      id="explorar"
      aria-labelledby="explorar-titulo"
      className="scroll-mt-24 pt-12 sm:pt-16"
    >
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-[#54717e] uppercase">
            Encontre pelo lugar
          </p>
          <h2
            id="explorar-titulo"
            className="mt-3 max-w-2xl text-3xl leading-tight font-semibold tracking-tight text-[#173b50] sm:text-4xl"
          >
            O Brasil inteiro, no seu próximo endereço.
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Escolha uma região ou selecione um estado no mapa para descobrir as
            cidades com imóveis disponíveis.
          </p>
        </div>
      </div>

      {filtrosAbertos ? (
        <button
          type="button"
          aria-label="Fechar filtros"
          onClick={() => setFiltrosAbertos(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      ) : null}

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(19rem,24rem)_minmax(0,1fr)]">
        <aside
          ref={painelFiltrosRef}
          aria-label="Filtros de imóveis"
          role={filtrosAbertos ? "dialog" : undefined}
          aria-modal={filtrosAbertos || undefined}
          className={`barra-filtros min-w-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain lg:rounded-[1.75rem] lg:pr-1 ${
            filtrosAbertos
              ? "fixed inset-x-0 top-[72px] bottom-0 z-50 overflow-y-auto bg-[#f7f8f6] p-4 lg:inset-auto lg:bottom-auto lg:z-auto lg:bg-transparent lg:p-0"
              : "hidden lg:block"
          }`}
        >
          <div className="mb-3 flex items-center justify-between lg:hidden">
            <p className="text-sm font-semibold text-[#173b50]">
              Mapa e filtros
            </p>
            <button
              ref={botaoFecharFiltrosRef}
              type="button"
              onClick={() => setFiltrosAbertos(false)}
              className="rounded-full border border-[#173b50]/15 bg-white px-3 py-2 text-sm font-semibold text-[#173b50]"
            >
              Fechar
            </button>
          </div>
          <div className="overflow-hidden rounded-[1.75rem] border border-[#173b50]/10 bg-white shadow-[0_24px_70px_rgba(23,59,80,0.08)]">
            <div className="mapa-painel min-w-0 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Mapa de oportunidades
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    Passe o cursor para ver os dados; clique ou toque para
                    selecionar.
                  </p>
                </div>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                  {ufs.length} UFs
                </span>
              </div>

              <div className="mt-3 flex min-h-7 items-center justify-between gap-3 text-xs">
                <p aria-live="polite" className="font-medium text-[#78f1de]">
                  {ufSelecionada || ufEmFoco
                    ? `${nomeUf(ufSelecionada ?? ufEmFoco ?? "")} · ${toNumero(ufs.find((estado) => estado.uf === (ufSelecionada ?? ufEmFoco))?.totalImoveis ?? 0)} imóveis`
                    : regiaoSelecionada
                      ? `Região ${regiaoSelecionada}`
                      : "27 unidades federativas"}
                </p>
                {(regiaoSelecionada || ufSelecionada) && (
                  <button
                    type="button"
                    onClick={limparSelecao}
                    className="font-semibold text-[#78f1de] underline-offset-4 hover:underline"
                  >
                    Limpar seleção
                  </button>
                )}
              </div>

              <svg
                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                role="group"
                aria-label="Mapa interativo dos estados brasileiros"
                className="mx-auto block h-auto w-full max-w-[620px]"
              >
                {ESTADO_PATHS.map(({ uf, d, center }) => {
                  const estado = ufs.find((item) => item.uf === uf);
                  const naRegiaoSelecionada =
                    !regiaoAtual ||
                    regiaoAtual.ufs.some((sigla) => sigla === uf);
                  const selecionado = ufSelecionada === uf;
                  const emFoco = ufEmFoco === uf;
                  const desabilitado =
                    Boolean(regiaoAtual) && !naRegiaoSelecionada;
                  const quantidade = estado?.totalImoveis ?? 0;
                  const marcadores = categoriasVisiveis
                    .filter(
                      (categoria) =>
                        categoriasSelecionadas.has(categoria.id) &&
                        (totaisPorUfECategoria.get(uf)?.get(categoria.id) ??
                          0) > 0,
                    )
                    .map((categoria) => ({
                      ...categoria,
                      quantidade:
                        totaisPorUfECategoria.get(uf)?.get(categoria.id) ?? 0,
                    }));
                  const fill = desabilitado
                    ? "#102027"
                    : selecionado
                      ? "#123c45"
                      : emFoco
                        ? "#0e3039"
                        : "#091d25";

                  return (
                    <g key={uf}>
                      <path
                        d={d}
                        role="button"
                        tabIndex={0}
                        aria-label={`${nomeUf(uf)}: ${toNumero(quantidade)} imóveis`}
                        aria-pressed={selecionado}
                        onClick={() => selecionarUf(uf)}
                        onMouseEnter={() => setUfEmFoco(uf)}
                        onMouseLeave={() => setUfEmFoco(null)}
                        onFocus={() => setUfEmFoco(uf)}
                        onBlur={() => setUfEmFoco(null)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            selecionarUf(uf);
                          }
                        }}
                        className="cursor-pointer transition-colors duration-150 outline-none focus-visible:brightness-150"
                        fill={fill}
                        stroke={selecionado || emFoco ? "#54f3dc" : "#126275"}
                        strokeWidth={selecionado || emFoco ? 2 : 1}
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      {marcadores.map((categoria, index) => {
                        const angulo =
                          (index / Math.max(marcadores.length, 1)) *
                            Math.PI *
                            2 -
                          Math.PI / 2;
                        const x = center[0] + Math.cos(angulo) * 8;
                        const y = center[1] + Math.sin(angulo) * 8;

                        return (
                          <g
                            key={categoria.id}
                            role="img"
                            aria-label={`${nomeUf(uf)} · ${categoria.nome}: ${toNumero(categoria.quantidade)} imóveis em destaque`}
                            style={{ pointerEvents: "none" }}
                          >
                            <circle
                              cx={Number(x.toFixed(2))}
                              cy={Number(y.toFixed(2))}
                              r={Number(
                                Math.min(
                                  7,
                                  4 + Math.log2(categoria.quantidade + 1) * 0.3,
                                ).toFixed(2),
                              )}
                              fill={categoria.cor}
                              stroke="#07151b"
                              strokeWidth="2"
                              style={{
                                filter: `drop-shadow(0 0 4px ${categoria.cor})`,
                              }}
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-slate-300">
                <span>Selecione um estado para ver as cidades</span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#54f3dc]" />
                  Estados com oportunidades
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <fieldset>
                <legend className="text-sm font-semibold text-[#173b50]">
                  Tipos de imóvel
                </legend>
                <div className="mt-1 flex items-start justify-between gap-3">
                  <p className="text-xs leading-5 text-slate-500">
                    Marque o que quer ver. As cores dos pontos indicam os tipos
                    encontrados em cada estado.
                  </p>
                  {categoriasVisiveis.some(
                    (categoria) => !categoriasSelecionadas.has(categoria.id),
                  ) ? (
                    <button
                      type="button"
                      onClick={() =>
                        setCategoriasSelecionadas(
                          new Set(
                            categoriasVisiveis.map((categoria) => categoria.id),
                          ),
                        )
                      }
                      className="shrink-0 text-xs font-semibold text-[#28749a] hover:underline"
                    >
                      Selecionar todos
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {categoriasVisiveis.map((categoria) => {
                    const selecionada = categoriasSelecionadas.has(
                      categoria.id,
                    );
                    const quantidade =
                      totaisPorCategoria.get(categoria.id) ?? 0;

                    return (
                      <label
                        key={categoria.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition focus-within:ring-2 focus-within:ring-[#28749a] ${
                          selecionada
                            ? "border-[#173b50]/15 bg-white text-[#173b50]"
                            : "border-transparent bg-[#f6f8f7] text-slate-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selecionada}
                          onChange={() =>
                            setCategoriasSelecionadas((atual) => {
                              const proxima = new Set(atual);
                              if (proxima.has(categoria.id)) {
                                proxima.delete(categoria.id);
                              } else {
                                proxima.add(categoria.id);
                              }
                              return proxima;
                            })
                          }
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: categoria.cor,
                            boxShadow: `0 0 8px ${categoria.cor}80`,
                            opacity: selecionada ? 1 : 0.35,
                          }}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {categoria.nome}
                        </span>
                        <span className="text-xs text-slate-500">
                          {toNumero(quantidade)}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-2 text-[0.7rem] leading-5 text-slate-500">
                  Contagens dos imóveis em destaque; cada ponto indica um
                  estado, não o endereço exato.
                </p>
              </fieldset>

              <div className="mt-6 border-t border-[#173b50]/10 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#173b50]">
                    Explore por região
                  </p>
                  {regiaoSelecionada ? (
                    <button
                      type="button"
                      onClick={() => {
                        setUfSelecionada(null);
                        setBuscaCidade("");
                      }}
                      className="text-xs font-semibold text-[#28749a] hover:underline"
                    >
                      Ver estados
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {REGIOES.map((regiao) => {
                    const quantidade = ufs
                      .filter((estado) =>
                        regiao.ufs.some((sigla) => sigla === estado.uf),
                      )
                      .reduce(
                        (total, estado) => total + estado.totalImoveis,
                        0,
                      );
                    const ativa = regiaoSelecionada === regiao.nome;

                    return (
                      <button
                        key={regiao.nome}
                        type="button"
                        aria-pressed={ativa}
                        onClick={() => selecionarRegiao(regiao.nome)}
                        className={`rounded-xl border px-3 py-3 text-left transition ${
                          ativa
                            ? "border-[#173b50] bg-[#173b50] text-white"
                            : "border-[#173b50]/10 bg-white text-[#173b50] hover:border-[#28749a]/40 hover:bg-[#f3f8f8]"
                        }`}
                      >
                        <span className="block text-sm font-semibold">
                          {regiao.nome}
                        </span>
                        <span
                          className={`mt-1 block text-xs ${ativa ? "text-white/70" : "text-slate-500"}`}
                        >
                          {toNumero(quantidade)} imóveis
                        </span>
                      </button>
                    );
                  })}
                </div>

                {regiaoSelecionada && !ufSelecionada ? (
                  <div className="mt-6 border-t border-[#173b50]/10 pt-5">
                    <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                      Estados da região
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {ufsDaRegiao?.map((uf) => {
                        const estado = ufs.find((item) => item.uf === uf);

                        return (
                          <li key={uf}>
                            <button
                              type="button"
                              onClick={() => selecionarUf(uf)}
                              className="rounded-full border border-[#173b50]/10 bg-[#f6f8f7] px-3 py-1.5 text-xs font-medium text-[#315769] transition hover:border-[#28749a]/40 hover:bg-[#eaf2f2]"
                            >
                              {uf} · {toNumero(estado?.totalImoveis ?? 0)}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}

                {estadoSelecionado ? (
                  <div className="mt-6 border-t border-[#173b50]/10 pt-5">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                          Cidades em {ufSelecionada}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-[#173b50]">
                          {estadoSelecionado.cidades.length} cidades
                        </p>
                      </div>
                      <Link
                        href={`/${ufSelecionada?.toLowerCase()}`}
                        className="text-xs font-semibold text-[#28749a] underline-offset-4 hover:underline"
                      >
                        Ver estado
                      </Link>
                    </div>
                    {cidades.length > 12 ? (
                      <label className="mt-4 block">
                        <span className="sr-only">Buscar cidade</span>
                        <input
                          type="search"
                          value={buscaCidade}
                          onChange={(event) =>
                            setBuscaCidade(event.target.value)
                          }
                          placeholder={`Buscar entre ${cidades.length} cidades`}
                          className="w-full rounded-xl border border-[#173b50]/15 bg-[#f8faf9] px-4 py-3 text-sm text-[#173b50] transition outline-none placeholder:text-slate-400 focus:border-[#28749a] focus:ring-4 focus:ring-[#28749a]/10"
                        />
                      </label>
                    ) : null}
                    <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1">
                      {cidadesFiltradas.map((cidade) => (
                        <li key={cidade.slug}>
                          <Link
                            href={`/${ufSelecionada?.toLowerCase()}/${cidade.slug}`}
                            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-[#f0f5f4] hover:text-[#173b50]"
                          >
                            <span>{cidade.nomeExibicao}</span>
                            <span className="shrink-0 text-xs text-slate-500">
                              {toNumero(cidade.totalImoveis)}
                            </span>
                          </Link>
                        </li>
                      ))}
                      {cidadesFiltradas.length === 0 ? (
                        <li className="px-3 py-4 text-sm text-slate-500">
                          Nenhuma cidade encontrada com esse nome.
                        </li>
                      ) : null}
                    </ul>
                    {!buscaCidade && cidades.length > 12 ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Mostrando as 12 cidades com mais imóveis. Use a busca
                        para encontrar qualquer município.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {!regiaoSelecionada ? (
                  <p className="mt-6 rounded-xl bg-[#f3f7f6] p-4 text-sm leading-6 text-slate-600">
                    Escolha uma região ou clique diretamente em um estado no
                    mapa. Ao selecionar um estado, você encontra cidades e
                    acessa os imóveis disponíveis em cada uma.
                  </p>
                ) : null}

                {regiaoSelecionada && !estadoSelecionado ? (
                  <p className="mt-5 text-xs leading-5 text-slate-500">
                    Clique em um estado no mapa ou na lista para filtrar os
                    imóveis e abrir as cidades.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <FiltroPreco
            imoveis={imoveisDoRecorte}
            limite={limitePreco}
            faixa={faixaPreco}
            onChange={setFaixaPreco}
          />
        </aside>

        <div className="min-w-0">
          <div className="sticky top-[72px] z-20 -mx-4 mb-4 border-y border-[#173b50]/10 bg-[#f7f8f6]/95 px-4 py-2 backdrop-blur lg:hidden">
            <button
              ref={botaoAbrirFiltrosRef}
              type="button"
              aria-haspopup="dialog"
              onClick={() => setFiltrosAbertos(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-[#173b50]/10 bg-white px-3 py-2.5 text-left shadow-sm"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 shrink-0 text-[#12675e]"
              >
                <path
                  d="M4 6h16M7 12h10m-7 6h4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[#173b50]">
                  Mapa e filtros
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {localSelecionado} · {categoriasSelecionadas.size} tipos
                  {faixaPreco
                    ? ` · ${toCurrencyCompacto(faixaPreco.minimo)}–${toCurrencyCompacto(faixaPreco.maximo)}`
                    : ""}
                </span>
              </span>
              <span className="resultados-contagem shrink-0 rounded-full bg-[#e8f7f4] px-2.5 py-1 text-xs font-semibold text-[#12675e]">
                {toNumero(
                  Math.min(imoveisResultados.length, LIMITE_RESULTADOS),
                )}
              </span>
            </button>
          </div>
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-[#54717e] uppercase">
                Oportunidades em destaque
              </p>
              <h3
                id="descontos"
                className="mt-2 text-2xl font-semibold tracking-tight text-[#173b50] sm:text-3xl"
              >
                Maiores descontos agora
              </h3>
            </div>
            <div className="flex items-center justify-between gap-4 sm:text-right">
              <p className="text-sm text-slate-500">
                Resultados para {localSelecionado}
              </p>
              <p
                aria-live="polite"
                className="resultados-contagem shrink-0 rounded-full bg-[#e8f7f4] px-3 py-1.5 text-xs font-semibold text-[#12675e]"
              >
                {toNumero(
                  Math.min(imoveisResultados.length, LIMITE_RESULTADOS),
                )}{" "}
                imóveis em destaque
              </p>
            </div>
          </div>
          <TopDescontos
            imoveis={imoveisResultados}
            limite={LIMITE_RESULTADOS}
            ufSelecionada={null}
            ufsSelecionadas={null}
          />
        </div>
      </div>
    </section>
  );
}
