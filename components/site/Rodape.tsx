import Link from "next/link";

import { repositorioUrl } from "../../lib/site";

const LINKS = [
  { href: "/termos", texto: "Termos de uso" },
  { href: "/privacidade", texto: "Privacidade" },
  { href: "/status", texto: "Status" },
];

export function Rodape() {
  return (
    <footer className="mt-20 bg-[#173b50] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] md:items-end lg:px-8">
        <div className="max-w-2xl">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-white"
          >
            Garimpo Imóveis
          </Link>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Projeto independente, sem fins comerciais e sem vínculo com a Caixa
            Econômica Federal. As informações são organizadas a partir da lista
            pública de imóveis; confirme preço, edital e condições no site
            oficial antes de qualquer decisão.
          </p>
        </div>
        <nav aria-label="Links institucionais">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
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
                className="font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
              >
                Código-fonte ↗
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
