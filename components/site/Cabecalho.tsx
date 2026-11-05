"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";

const EVENTO_TEMA_ALTERADO = "garimpo-tema-alterado";

function temaAtual() {
  return document.documentElement.dataset.theme === "escuro";
}

function assinarTema(callback: () => void) {
  window.addEventListener(EVENTO_TEMA_ALTERADO, callback);
  return () => window.removeEventListener(EVENTO_TEMA_ALTERADO, callback);
}

export function Cabecalho() {
  const temaEscuro = useSyncExternalStore(assinarTema, temaAtual, () => false);

  useEffect(() => {
    const temaSalvo = window.localStorage.getItem("garimpo-tema");
    if (temaSalvo === "escuro") {
      document.documentElement.dataset.theme = "escuro";
      window.dispatchEvent(new Event(EVENTO_TEMA_ALTERADO));
    }
  }, []);

  function alternarTema() {
    const proximoTema = temaEscuro ? "claro" : "escuro";
    document.documentElement.dataset.theme = proximoTema;
    window.localStorage.setItem("garimpo-tema", proximoTema);
    window.dispatchEvent(new Event(EVENTO_TEMA_ALTERADO));
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-900/10 bg-[#f7f8f6]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Garimpo Imóveis — início"
          className="flex items-center gap-3"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#173b50] text-[#c8ec67]">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6"
            >
              <path
                d="M3.5 10.5 12 4l8.5 6.5v9a.5.5 0 0 1-.5.5h-16a.5.5 0 0 1-.5-.5v-9Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="M9 20v-6h6v6M7.5 10h9"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-bold tracking-tight text-[#173b50]">
              Garimpo
            </span>
            <span className="block text-[0.62rem] font-semibold tracking-[0.2em] text-slate-500 uppercase">
              Imóveis
            </span>
          </span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex"
        >
          <Link className="transition hover:text-[#173b50]" href="/#explorar">
            Explorar imóveis
          </Link>
          <Link className="transition hover:text-[#173b50]" href="/#quedas">
            Quedas recentes
          </Link>
          <Link
            className="transition hover:text-[#173b50]"
            href="/#como-funciona"
          >
            Como funciona
          </Link>
        </nav>

        <Link
          href="/#explorar"
          className="rounded-full bg-[#173b50] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#24526b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#173b50] sm:px-5"
        >
          Encontrar imóvel
        </Link>
        <button
          type="button"
          onClick={alternarTema}
          aria-label={`Ativar tema ${temaEscuro ? "claro" : "escuro"}`}
          title={`Ativar tema ${temaEscuro ? "claro" : "escuro"}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#173b50]/15 bg-white text-[#173b50] transition hover:bg-[#f3f8f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#28749a]"
        >
          {temaEscuro ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
            >
              <circle
                cx="12"
                cy="12"
                r="4"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
            >
              <path
                d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
