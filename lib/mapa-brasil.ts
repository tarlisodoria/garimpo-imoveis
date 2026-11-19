/** Projeção de Mercator da malha estadual (IBGE via br-geojson, CC0 1.0) para o SVG da home. */

export type Posicao = [number, number];
export type GeometriaEstado =
  | { type: "Polygon"; coordinates: Posicao[][] }
  | { type: "MultiPolygon"; coordinates: Posicao[][][] };
export type FeatureEstado = {
  type: "Feature";
  properties: { sigla: string };
  geometry: GeometriaEstado;
};
export type Projecao = (posicao: Posicao) => [number, number];

export const MAPA_LARGURA = 620;
export const MAPA_ALTURA = 500;
export const MAPA_MARGEM = 18;

export function mercator(latitude: number): number {
  const radianos = (latitude * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + radianos / 2));
}

function poligonos(geometria: GeometriaEstado): Posicao[][][] {
  return geometria.type === "Polygon"
    ? [geometria.coordinates]
    : geometria.coordinates;
}

function pontos(geometria: GeometriaEstado): Posicao[] {
  return poligonos(geometria).flatMap((poligono) =>
    poligono.flatMap((anel) => anel),
  );
}

/** Ajusta todas as features à área do SVG, centralizadas e com a mesma escala nos dois eixos. */
export function criarProjecao(
  features: FeatureEstado[],
  largura = MAPA_LARGURA,
  altura = MAPA_ALTURA,
  margem = MAPA_MARGEM,
): Projecao {
  const posicoes = features.flatMap((feature) => pontos(feature.geometry));
  const longitudes = posicoes.map(([longitude]) => (longitude * Math.PI) / 180);
  const latitudes = posicoes.map(([, latitude]) => mercator(latitude));
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const escala = Math.min(
    (largura - margem * 2) / (maxLongitude - minLongitude),
    (altura - margem * 2) / (maxLatitude - minLatitude),
  );
  const larguraDesenhada = (maxLongitude - minLongitude) * escala;
  const alturaDesenhada = (maxLatitude - minLatitude) * escala;
  const deslocamentoX = (largura - larguraDesenhada) / 2;
  const deslocamentoY = (altura - alturaDesenhada) / 2;

  return ([longitude, latitude]) => {
    const longitudeRadianos = (longitude * Math.PI) / 180;
    const x = deslocamentoX + (longitudeRadianos - minLongitude) * escala;
    const y = deslocamentoY + (maxLatitude - mercator(latitude)) * escala;
    return [x, y];
  };
}

/** Média dos vértices projetados; serve para ancorar os marcadores do estado. */
export function centroDaGeometria(
  geometria: GeometriaEstado,
  projetar: Projecao,
): readonly [number, number] {
  const projetados = pontos(geometria).map(projetar);
  const soma = projetados.reduce(
    (total, [x, y]) => [total[0] + x, total[1] + y],
    [0, 0],
  );
  return [soma[0] / projetados.length, soma[1] / projetados.length] as const;
}

export function caminhoDaGeometria(
  geometria: GeometriaEstado,
  projetar: Projecao,
): string {
  return poligonos(geometria)
    .map((poligono) =>
      poligono
        .map((anel) => {
          const [primeiro, ...restantes] = anel;
          if (!primeiro) return "";
          const [x0, y0] = projetar(primeiro);
          return `M${x0.toFixed(2)},${y0.toFixed(2)}${restantes
            .map((ponto) => {
              const [x, y] = projetar(ponto);
              return `L${x.toFixed(2)},${y.toFixed(2)}`;
            })
            .join("")}Z`;
        })
        .join(""),
    )
    .join("");
}

export function caminhosDosEstados(features: FeatureEstado[]) {
  const projetar = criarProjecao(features);
  return features.map((feature) => ({
    uf: feature.properties.sigla,
    d: caminhoDaGeometria(feature.geometry, projetar),
    center: centroDaGeometria(feature.geometry, projetar),
  }));
}

/** Distribui os marcadores em círculo (raio 8) em volta do centro, começando no topo. */
export function posicaoDoMarcador(
  centro: readonly [number, number],
  indice: number,
  total: number,
): [number, number] {
  const angulo = (indice / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
  const x = centro[0] + Math.cos(angulo) * 8;
  const y = centro[1] + Math.sin(angulo) * 8;
  return [Number(x.toFixed(2)), Number(y.toFixed(2))];
}

/** Cresce em escala logarítmica com a quantidade, entre 4 e 7. */
export function raioDoMarcador(quantidade: number): number {
  return Number(Math.min(7, 4 + Math.log2(quantidade + 1) * 0.3).toFixed(2));
}
