import type { Metadata } from "next";

const serviceCards = [
  {
    name: "Coleta diária",
    status: "Configurada",
    detail: "Workflow cron + dispatch com coleta sequencial por UF.",
  },
  {
    name: "Issue automática",
    status: "Configurada",
    detail: "Falhas criam issue no GitHub para acompanhamento.",
  },
  {
    name: "Site público",
    status: "Publicado",
    detail: "Páginas públicas estáticas publicadas na Cloudflare Pages.",
  },
];

const checkpoints = [
  "A coleta cobre as 27 UFs, uma requisição por UF por dia, às 03:15 (Brasília).",
  "O workflow diário roda os testes e aplica migrations antes da coleta.",
  "Falhas ficam registradas no banco e geram issue automaticamente no GitHub.",
  "O site público é gerado estaticamente a partir do snapshot versionado.",
  "O front-end continua sem acesso direto ao banco.",
];

export const metadata: Metadata = {
  title: "Status | Garimpo Imóveis",
  description:
    "Visão da configuração da coleta, publicação e mecanismos de falha.",
};

export default function StatusPage() {
  return (
    <main className="relative mx-auto min-h-screen max-w-6xl px-6 py-12 sm:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.24),_transparent_55%)]" />

      <section className="overflow-hidden rounded-[2rem] border border-emerald-950/10 bg-white/82 shadow-[0_28px_90px_rgba(15,23,42,0.10)] backdrop-blur">
        <div className="border-b border-slate-900/5 px-8 py-10 sm:px-12">
          <p className="text-sm font-semibold tracking-[0.32em] text-emerald-800 uppercase">
            Estado do projeto
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Coleta, publicação e mecanismos de falha em um só lugar.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
                Esta página é um resumo estático da configuração do projeto. Ela
                não consulta execuções do GitHub Actions nem dados do banco em
                tempo real.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-900/10 bg-emerald-50 px-5 py-4 text-sm text-emerald-950 shadow-sm">
              <p className="font-semibold">Fonte deste resumo</p>
              <p className="mt-1 leading-6">
                Configuração versionada do projeto no repositório público.
              </p>
            </div>
          </div>
        </div>

        <section className="grid gap-4 px-8 py-8 sm:px-12 lg:grid-cols-2">
          {serviceCards.map((card) => (
            <article
              key={card.name}
              className="rounded-[1.5rem] border border-slate-900/6 bg-slate-50/80 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-950">
                  {card.name}
                </h2>
                <span className="rounded-full border border-emerald-900/10 bg-white px-3 py-1 text-xs font-semibold tracking-[0.18em] text-emerald-800 uppercase">
                  {card.status}
                </span>
              </div>
              <p className="mt-4 text-base leading-7 text-slate-700">
                {card.detail}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-8 border-t border-slate-900/5 px-8 py-8 sm:px-12 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[1.75rem] border border-slate-900/6 bg-slate-950 px-7 py-7 text-slate-50 shadow-[0_18px_60px_rgba(15,23,42,0.20)]">
            <p className="text-sm font-semibold tracking-[0.28em] text-emerald-300 uppercase">
              O que está configurado
            </p>
            <ul className="mt-5 space-y-4 text-base leading-7 text-slate-200">
              {checkpoints.map((checkpoint) => (
                <li key={checkpoint} className="flex gap-3">
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" />
                  <span>{checkpoint}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[1.75rem] border border-slate-900/6 bg-white p-7 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold tracking-[0.28em] text-slate-500 uppercase">
              Próximos sinais
            </p>
            <div className="mt-5 space-y-4 text-base leading-7 text-slate-700">
              <p>
                A próxima evolução é ligar esta página a dados reais de execução
                quando existir telemetria dedicada.
              </p>
              <p>
                Enquanto isso, ela apresenta a configuração do pipeline e os
                mecanismos de falha documentados.
              </p>
            </div>
          </article>
        </section>
      </section>

      <footer className="mt-8 border-t border-slate-900/10 pt-6 text-sm leading-6 text-slate-600">
        Não somos afiliados à Caixa Econômica Federal. Dados públicos agregados;
        confirme sempre no site oficial.
      </footer>
    </main>
  );
}
