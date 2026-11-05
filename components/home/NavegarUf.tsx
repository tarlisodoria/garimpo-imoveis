import Link from "next/link";

import { toNumero } from "../../lib/formatar";
import type { PublicUf } from "../../lib/public-data";
import { nomeUf } from "../../lib/ufs";

type NavegarUfProps = {
  ufs: Pick<PublicUf, "uf" | "totalImoveis">[];
};

export function NavegarUf({ ufs }: NavegarUfProps) {
  if (ufs.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="navegar-uf"
      className="mt-20 scroll-mt-24 border-t border-[#173b50]/10 pt-12"
    >
      <h2
        id="navegar-uf"
        className="text-2xl font-semibold tracking-tight text-[#173b50]"
      >
        Acesse todos os estados
      </h2>
      <ul className="mt-5 flex flex-wrap gap-2">
        {ufs.map((entry) => (
          <li key={entry.uf}>
            <Link
              href={`/${entry.uf.toLowerCase()}`}
              className="inline-block rounded-full border border-[#173b50]/10 bg-white px-3 py-2 text-sm font-medium text-[#315769] transition hover:border-[#28749a]/50 hover:text-[#173b50]"
            >
              {nomeUf(entry.uf)}{" "}
              <span className="text-slate-500">
                ({toNumero(entry.totalImoveis)})
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
