import type { ReactNode } from "react";

import { DOCUMENTOS_LEGAIS, vigenciaPorExtenso } from "../../lib/site";

type DocumentoLegalProps = {
  titulo: string;
  resumo: string;
  children: ReactNode;
};

/** Layout comum de /termos e /privacidade. */
export function DocumentoLegal({
  titulo,
  resumo,
  children,
}: DocumentoLegalProps) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.2em] text-emerald-800 uppercase">
        Garimpo Imóveis
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
        {titulo}
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        Versão {DOCUMENTOS_LEGAIS.versao} · em vigor desde{" "}
        {vigenciaPorExtenso()}
      </p>
      <p className="mt-6 text-lg leading-8 text-slate-700">{resumo}</p>

      <div className="mt-8 space-y-4 rounded-2xl border border-slate-900/10 bg-white/85 p-6 leading-7 text-slate-700 sm:p-8 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-950 [&_h2:first-child]:mt-0 [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:text-slate-900 [&_table]:w-full [&_table]:text-sm [&_td]:border-t [&_td]:border-slate-900/10 [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top [&_th]:pr-3 [&_th]:pb-2 [&_th]:text-left [&_th]:text-slate-900 [&_ul]:list-disc [&_ul]:pl-6">
        {children}
      </div>
    </main>
  );
}
