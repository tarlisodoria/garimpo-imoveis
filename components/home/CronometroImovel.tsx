"use client";

import { useEffect, useState } from "react";

type CronometroImovelProps = {
  encerramentoEm: string;
};

type Tempo = {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
};

function calcularTempo(restante: number): Tempo {
  const totalSegundos = Math.max(0, Math.floor(restante / 1000));
  return {
    dias: Math.floor(totalSegundos / 86400),
    horas: Math.floor((totalSegundos % 86400) / 3600),
    minutos: Math.floor((totalSegundos % 3600) / 60),
    segundos: totalSegundos % 60,
  };
}

function partesTempo(
  dias: number,
  horas: number,
  minutos: number,
  segundos: number,
) {
  return [
    { valor: dias, rotulo: "dias" },
    { valor: horas, rotulo: "horas" },
    { valor: minutos, rotulo: "min" },
    { valor: segundos, rotulo: "seg" },
  ];
}

export function CronometroImovel({ encerramentoEm }: CronometroImovelProps) {
  const [agora, setAgora] = useState<number | null>(null);

  useEffect(() => {
    const atualizar = () => setAgora(Date.now());
    atualizar();
    const intervalo = window.setInterval(atualizar, 1000);
    return () => window.clearInterval(intervalo);
  }, []);

  const encerramento = Date.parse(encerramentoEm);
  if (!Number.isFinite(encerramento) || agora === null) return null;

  const restante = encerramento - agora;
  if (restante <= 0) return null;

  const tempo = calcularTempo(restante);

  return (
    <div
      aria-label={`Prazo previsto: ${tempo.dias} dias, ${tempo.horas} horas e ${tempo.minutos} minutos`}
      className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5"
    >
      <p className="text-xs font-semibold text-amber-950">
        Venda Online · prazo previsto
      </p>
      <div
        aria-hidden="true"
        className="mt-1.5 flex flex-wrap gap-1.5 tabular-nums"
      >
        {partesTempo(
          tempo.dias,
          tempo.horas,
          tempo.minutos,
          tempo.segundos,
        ).map(({ valor, rotulo }) => (
          <span
            key={rotulo}
            className="inline-flex items-baseline gap-1 rounded-md bg-white px-2 py-1 text-sm font-bold text-amber-950"
          >
            {String(valor).padStart(2, "0")}
            <span className="text-[0.6rem] font-medium text-amber-800 uppercase">
              {rotulo}
            </span>
          </span>
        ))}
      </div>
      <p className="mt-1.5 text-[0.65rem] leading-4 text-amber-900">
        O prazo pode ser prorrogado por novas propostas; confirme na Caixa.
      </p>
    </div>
  );
}
