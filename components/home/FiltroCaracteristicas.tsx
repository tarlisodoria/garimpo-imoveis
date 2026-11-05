"use client";

import {
  FILTROS_CARACTERISTICAS_VAZIOS,
  type FiltrosCaracteristicas,
} from "../../lib/filtro-caracteristicas";

const CONTAGENS = [
  { campo: "quartos", rotulo: "Quartos" },
  { campo: "banheiros", rotulo: "Banheiros" },
  { campo: "salas", rotulo: "Salas" },
  { campo: "vagas", rotulo: "Vagas de garagem" },
] as const;

function valorNumerico(valor: string) {
  if (valor.trim() === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

type FiltroCaracteristicasProps = {
  value: FiltrosCaracteristicas;
  onChange: (value: FiltrosCaracteristicas) => void;
};

export function FiltroCaracteristicas({
  value,
  onChange,
}: FiltroCaracteristicasProps) {
  const ativo = Object.values(value).some((item) => item !== null);

  return (
    <div
      role="group"
      aria-labelledby="filtro-caracteristicas-titulo"
      className="mt-5 border-t border-[#173b50]/10 pt-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3
          id="filtro-caracteristicas-titulo"
          className="text-sm font-semibold text-[#173b50]"
        >
          Características
        </h3>
        {ativo ? (
          <button
            type="button"
            onClick={() => onChange(FILTROS_CARACTERISTICAS_VAZIOS)}
            className="text-xs font-semibold text-[#28749a] hover:underline"
          >
            Limpar
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Só contamos o que a descrição oficial informa.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {CONTAGENS.map(({ campo, rotulo }) => (
          <label key={campo} className="block">
            <span className="text-xs font-medium text-slate-600">{rotulo}</span>
            <select
              aria-label={`Mínimo de ${rotulo.toLocaleLowerCase("pt-BR")}`}
              value={value[campo] ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  [campo]: event.target.value
                    ? Number(event.target.value)
                    : null,
                })
              }
              className="mt-1 w-full rounded-lg border border-[#173b50]/15 bg-white px-2.5 py-2 text-sm text-[#173b50] focus:border-[#28749a] focus:ring-2 focus:ring-[#28749a]/10 focus:outline-none"
            >
              <option value="">Qualquer</option>
              {[1, 2, 3, 4].map((quantidade) => (
                <option key={quantidade} value={quantidade}>
                  {quantidade === 4 ? "4 ou mais" : `${quantidade} ou mais`}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-slate-600">Área (m²)</p>
        <div className="mt-1 grid grid-cols-2 gap-3">
          <label>
            <span className="sr-only">Área mínima em metros quadrados</span>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              placeholder="A partir de"
              value={value.areaMinima ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  areaMinima: valorNumerico(event.target.value),
                })
              }
              className="w-full rounded-lg border border-[#173b50]/15 bg-white px-2.5 py-2 text-sm text-[#173b50] placeholder:text-slate-400 focus:border-[#28749a] focus:ring-2 focus:ring-[#28749a]/10 focus:outline-none"
            />
          </label>
          <label>
            <span className="sr-only">Área máxima em metros quadrados</span>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              placeholder="Até"
              value={value.areaMaxima ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  areaMaxima: valorNumerico(event.target.value),
                })
              }
              className="w-full rounded-lg border border-[#173b50]/15 bg-white px-2.5 py-2 text-sm text-[#173b50] placeholder:text-slate-400 focus:border-[#28749a] focus:ring-2 focus:ring-[#28749a]/10 focus:outline-none"
            />
          </label>
        </div>
        <p className="mt-1 text-[0.7rem] leading-5 text-slate-500">
          Área privativa; se não houver, área total ou do terreno.
        </p>
      </div>
    </div>
  );
}
