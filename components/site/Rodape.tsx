import Link from "next/link";

import { repositorioUrl } from "../../lib/site";

const LINKS = [
  { href: "/termos", texto: "Termos de uso" },
  { href: "/privacidade", texto: "Privacidade" },
  { href: "/status", texto: "Status" },
];

export function Rodape() {
  return (
    <footer className="mx-auto mt-20 max-w-6xl border-t border-slate-900/10 px-4 py-10 text-sm leading-6 text-slate-600 sm:px-6">
      <nav aria-label="Links institucionais">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="font-medium text-slate-800 underline-offset-4 hover:underline"
              >
                {link.texto}
              </Link>
            </li>
          ))}
          <li>
            <a
              href={repositorioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-800 underline-offset-4 hover:underline"
            >
              Código-fonte ↗
            </a>
          </li>
        </ul>
      </nav>
      <p className="mt-4 max-w-3xl">
        Projeto de portfólio, sem fins comerciais. Não é afiliado à Caixa
        Econômica Federal e não a representa. Os dados vêm da lista pública de
        imóveis à venda da Caixa; confirme sempre as condições no site oficial
        antes de qualquer decisão.
      </p>
    </footer>
  );
}
