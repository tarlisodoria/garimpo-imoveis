import { repositorioUrl } from "../../lib/site";

const ETAPAS = [
  {
    titulo: "Coleta",
    texto:
      "Às 03:15, um workflow do GitHub Actions baixa o CSV oficial de cada estado. O arquivo vem em Windows-1252 e só é processado se o hash mudou.",
  },
  {
    titulo: "Comparação",
    texto:
      "Cada lista é comparada com a anterior. Imóveis novos, quedas de preço, mudanças de modalidade e saídas viram eventos no Postgres (Neon), gravados em lotes.",
  },
  {
    titulo: "Snapshot",
    texto:
      "Um script gera um JSON com os números, os destaques e as quedas da semana, ignorando a carga inicial de cada estado para não inflar os “novos”.",
  },
  {
    titulo: "Publicação",
    texto:
      "O Next.js gera mais de mil páginas estáticas, por estado e cidade, publicadas no Cloudflare Pages. O site não acessa o banco.",
  },
];

export function ComoFunciona() {
  return (
    <section aria-labelledby="como-funciona" className="mt-20">
      <h2
        id="como-funciona"
        className="text-3xl font-semibold tracking-tight text-slate-950"
      >
        Como funciona o pipeline
      </h2>
      <ol className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {ETAPAS.map((etapa, indice) => (
          <li
            key={etapa.titulo}
            className="rounded-2xl border border-slate-900/10 bg-white/80 p-6"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-sm font-bold text-white">
              {indice + 1}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              {etapa.titulo}
            </h3>
            <p className="mt-2 leading-7 text-slate-700">{etapa.texto}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-slate-600">
        Detalhes, decisões de arquitetura e problemas resolvidos estão no{" "}
        <a
          href={repositorioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-emerald-800 underline underline-offset-4"
        >
          repositório
        </a>
        .
      </p>
    </section>
  );
}
