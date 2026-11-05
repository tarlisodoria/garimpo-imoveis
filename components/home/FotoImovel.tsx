"use client";

import Image from "next/image";
import { useState } from "react";

type FotoImovelProps = {
  idCaixa: string;
  descricao: string;
};

function urlFotoCaixa(idCaixa: string) {
  const numeroImovel = idCaixa.padStart(13, "0");
  return `https://venda-imoveis.caixa.gov.br/fotos/F${numeroImovel}21.jpg`;
}

export function FotoImovel({ idCaixa, descricao }: FotoImovelProps) {
  const [indisponivel, setIndisponivel] = useState(false);

  return (
    <div
      role="img"
      aria-label={
        indisponivel ? `Foto não disponível. ${descricao}` : descricao
      }
      className="relative h-52 overflow-hidden bg-[#e6edf0]"
    >
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[linear-gradient(145deg,#e8eff0,#d6e2e5)] text-[#54717e] ${
          indisponivel ? "" : "invisible"
        }`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          className="h-10 w-10"
          aria-hidden="true"
        >
          <path
            d="m6 22 18-14 18 14v18H6V22Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M18 40V26h12v14M12 22h24"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-xs font-medium">Foto não disponível</span>
      </div>
      {!indisponivel ? (
        <Image
          src={urlFotoCaixa(idCaixa)}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
          referrerPolicy="no-referrer"
          onError={() => setIndisponivel(true)}
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
      ) : null}
    </div>
  );
}
