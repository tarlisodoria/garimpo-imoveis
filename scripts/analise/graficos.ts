// Gráficos em SVG puro para docs/resultados.md, sem biblioteca. Cada gráfico
// tem uma série só (um azul), modo claro e escuro próprios via
// prefers-color-scheme, grade e eixo recessivos e rótulos em cor de texto.
// O GitHub mostra SVG como imagem estática: a tabela ao lado faz o papel do
// tooltip.

const ESTILO = `
<style>
  svg { --superficie:#fcfcfb; --texto:#0b0b0b; --texto-2:#52514e; --mudo:#898781; --grade:#e1e0d9; --base:#c3c2b7; --serie:#2a78d6; }
  @media (prefers-color-scheme: dark) {
    svg { --superficie:#1a1a19; --texto:#f0efec; --texto-2:#c3c2b7; --mudo:#898781; --grade:#2c2c2a; --base:#383835; --serie:#3987e5; }
  }
  .fundo { fill: var(--superficie); }
  .titulo { fill: var(--texto); font: 600 15px system-ui, -apple-system, "Segoe UI", sans-serif; }
  .subtitulo { fill: var(--texto-2); font: 400 12px system-ui, -apple-system, "Segoe UI", sans-serif; }
  .rotulo { fill: var(--texto-2); font: 400 11px system-ui, -apple-system, "Segoe UI", sans-serif; }
  .valor { fill: var(--texto); font: 600 11px system-ui, -apple-system, "Segoe UI", sans-serif; }
  .eixo { fill: var(--mudo); font: 400 10px system-ui, -apple-system, "Segoe UI", sans-serif; }
  .grade { stroke: var(--grade); stroke-width: 1; }
  .base { stroke: var(--base); stroke-width: 1; }
  .marca { fill: var(--serie); }
</style>`;

export function escaparXml(texto: string): string {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Até ~5 marcas redondas (1, 2 ou 5 × 10^n) cobrindo 0..maximo. */
export function marcasLimpas(maximo: number, alvo = 4): number[] {
  if (!(maximo > 0)) return [0, 1];
  const bruto = maximo / alvo;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const passo =
    [1, 2, 5, 10].map((m) => m * potencia).find((p) => p >= bruto) ??
    10 * potencia;
  const marcas: number[] = [];
  for (let v = 0; v < maximo + passo; v += passo) {
    marcas.push(Number(v.toFixed(10)));
    if (v >= maximo) break;
  }
  return marcas;
}

const numeroBr = (valor: number) =>
  new Intl.NumberFormat("pt-BR").format(valor);

/** Marca com 4px arredondados na ponta e reta na base (path). */
function barraHorizontal(
  x: number,
  y: number,
  largura: number,
  altura: number,
) {
  const r = Math.min(4, largura / 2, altura / 2);
  if (largura <= 0) return "";
  return `<path class="marca" d="M${x},${y}h${(largura - r).toFixed(2)}a${r},${r} 0 0 1 ${r},${r}v${(altura - 2 * r).toFixed(2)}a${r},${r} 0 0 1 -${r},${r}h-${(largura - r).toFixed(2)}z"/>`;
}

function colunaVertical(
  x: number,
  base: number,
  largura: number,
  altura: number,
) {
  if (altura <= 0) return "";
  const r = Math.min(4, largura / 2, altura);
  return `<path class="marca" d="M${x},${base}v-${(altura - r).toFixed(2)}a${r},${r} 0 0 1 ${r},-${r}h${(largura - 2 * r).toFixed(2)}a${r},${r} 0 0 1 ${r},${r}v${(altura - r).toFixed(2)}z"/>`;
}

function cabecalho(
  largura: number,
  altura: number,
  titulo: string,
  subtitulo: string,
) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}" role="img" aria-labelledby="t s">`,
    ESTILO,
    `<title id="t">${escaparXml(titulo)}</title>`,
    `<desc id="s">${escaparXml(subtitulo)}</desc>`,
    `<rect class="fundo" width="${largura}" height="${altura}" rx="8"/>`,
    `<text class="titulo" x="20" y="28">${escaparXml(titulo)}</text>`,
    `<text class="subtitulo" x="20" y="47">${escaparXml(subtitulo)}</text>`,
  ];
}

export type ItemBarra = { rotulo: string; valor: number; textoValor: string };

/** Barras horizontais ordenadas como recebidas, com o valor na ponta de cada barra. */
export function barrasHorizontais(opcoes: {
  titulo: string;
  subtitulo: string;
  itens: ItemBarra[];
  largura?: number;
}): string {
  const largura = opcoes.largura ?? 720;
  const espessura = 14;
  const passo = espessura + 6;
  const topo = 72;
  const esquerda = 60;
  const direita = 70;
  const altura = topo + opcoes.itens.length * passo + 34;
  const area = largura - esquerda - direita;
  const maximo = Math.max(...opcoes.itens.map((i) => i.valor), 0);
  const marcas = marcasLimpas(maximo);
  const escalaMax = marcas[marcas.length - 1]!;
  const x = (v: number) => esquerda + (v / escalaMax) * area;
  const fim = topo + opcoes.itens.length * passo;

  const partes = cabecalho(largura, altura, opcoes.titulo, opcoes.subtitulo);
  for (const m of marcas) {
    partes.push(
      `<line class="grade" x1="${x(m).toFixed(2)}" y1="${topo - 6}" x2="${x(m).toFixed(2)}" y2="${fim}"/>`,
      `<text class="eixo" x="${x(m).toFixed(2)}" y="${fim + 16}" text-anchor="middle">${numeroBr(m)}</text>`,
    );
  }
  opcoes.itens.forEach((item, i) => {
    const y = topo + i * passo;
    const w = x(item.valor) - esquerda;
    partes.push(
      `<text class="rotulo" x="${esquerda - 8}" y="${y + espessura - 3}" text-anchor="end">${escaparXml(item.rotulo)}</text>`,
      barraHorizontal(esquerda, y, w, espessura),
      `<text class="valor" x="${(esquerda + w + 6).toFixed(2)}" y="${y + espessura - 3}">${escaparXml(item.textoValor)}</text>`,
    );
  });
  partes.push(
    `<line class="base" x1="${esquerda}" y1="${topo - 6}" x2="${esquerda}" y2="${fim}"/>`,
    "</svg>",
  );
  return partes.filter(Boolean).join("\n") + "\n";
}

export type PontoDiario = { data: string; valor: number };

/**
 * Colunas por dia (AAAA-MM-DD, já ordenadas e contínuas). Rotula só o maior
 * valor; as datas no eixo aparecem a cada `passoDatas` dias.
 */
export function colunasDiarias(opcoes: {
  titulo: string;
  subtitulo: string;
  pontos: PontoDiario[];
  largura?: number;
  passoDatas?: number;
}): string {
  const largura = opcoes.largura ?? 720;
  const altura = 260;
  const topo = 76;
  const esquerda = 56;
  const direita = 20;
  const base = altura - 40;
  const area = largura - esquerda - direita;
  const n = Math.max(opcoes.pontos.length, 1);
  const faixa = area / n;
  // Coluna fina (<= 24px) com 2px de ar entre vizinhas.
  const espessura = Math.max(2, Math.min(24, faixa - 2));
  const maximo = Math.max(...opcoes.pontos.map((p) => p.valor), 0);
  const marcas = marcasLimpas(maximo);
  const escalaMax = marcas[marcas.length - 1]!;
  const y = (v: number) => base - (v / escalaMax) * (base - topo);
  const passoDatas = opcoes.passoDatas ?? 7;
  const indiceMaior = opcoes.pontos.findIndex((p) => p.valor === maximo);

  const partes = cabecalho(largura, altura, opcoes.titulo, opcoes.subtitulo);
  for (const m of marcas) {
    partes.push(
      `<line class="grade" x1="${esquerda}" y1="${y(m).toFixed(2)}" x2="${largura - direita}" y2="${y(m).toFixed(2)}"/>`,
      `<text class="eixo" x="${esquerda - 8}" y="${(y(m) + 3).toFixed(2)}" text-anchor="end">${numeroBr(m)}</text>`,
    );
  }
  opcoes.pontos.forEach((ponto, i) => {
    const cx = esquerda + i * faixa + (faixa - espessura) / 2;
    partes.push(colunaVertical(cx, base, espessura, base - y(ponto.valor)));
    if (i % passoDatas === 0) {
      const [, mes, dia] = ponto.data.split("-");
      partes.push(
        `<text class="eixo" x="${(cx + espessura / 2).toFixed(2)}" y="${base + 16}" text-anchor="middle">${dia}/${mes}</text>`,
      );
    }
    if (i === indiceMaior && maximo > 0) {
      const [, mes, dia] = ponto.data.split("-");
      const meio = cx + espessura / 2;
      const ancora =
        meio > largura - 120
          ? "end"
          : meio < esquerda + 60
            ? "start"
            : "middle";
      partes.push(
        `<text class="valor" x="${meio.toFixed(2)}" y="${(y(ponto.valor) - 6).toFixed(2)}" text-anchor="${ancora}">${numeroBr(ponto.valor)} em ${dia}/${mes}</text>`,
      );
    }
  });
  partes.push(
    `<line class="base" x1="${esquerda}" y1="${base}" x2="${largura - direita}" y2="${base}"/>`,
    "</svg>",
  );
  return partes.filter(Boolean).join("\n") + "\n";
}

/** Preenche com zero os dias sem evento entre o primeiro e o último dia. */
export function diasContinuos(
  inicio: string,
  fim: string,
  valores: Map<string, number>,
): PontoDiario[] {
  const pontos: PontoDiario[] = [];
  const dia = new Date(`${inicio}T00:00:00Z`);
  const ultimo = new Date(`${fim}T00:00:00Z`);
  while (dia <= ultimo) {
    const chave = dia.toISOString().slice(0, 10);
    pontos.push({ data: chave, valor: valores.get(chave) ?? 0 });
    dia.setUTCDate(dia.getUTCDate() + 1);
  }
  return pontos;
}
