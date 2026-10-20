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
    <section aria-labelledby="navegar-uf" className="mt-20">
      <h2
        id="navegar-uf"
        className="text-3xl font-semibold tracking-tight text-slate-950"
      >
        Imóveis por estado
      </h2>
      <ul className="mt-6 flex flex-wrap gap-3">
        {ufs.map((entry) => (
          <li key={entry.uf}>
            <Link
              href={`/${entry.uf.toLowerCase()}`}
              className="inline-block rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-emerald-700 hover:text-emerald-800"
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
