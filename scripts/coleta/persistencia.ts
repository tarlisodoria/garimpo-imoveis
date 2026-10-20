/**
 * Inserts com milhares de linhas estouram a pilha do Drizzle ao montar o SQL
 * (RJ, 8.053 linhas, em 2026-10-18). Toda gravação em massa vai em lotes.
 */
export const TAMANHO_LOTE = 500;

export function emLotes<T>(itens: T[], tamanho = TAMANHO_LOTE): T[][] {
  if (!Number.isInteger(tamanho) || tamanho <= 0) {
    throw new Error("Tamanho de lote inválido.");
  }

  const lotes: T[][] = [];
  for (let inicio = 0; inicio < itens.length; inicio += tamanho) {
    lotes.push(itens.slice(inicio, inicio + tamanho));
  }
  return lotes;
}

export type GravacoesColeta<TImovel, THistorico, TEvento> = {
  upsertImoveis(lote: TImovel[]): Promise<void>;
  desativarImoveis(lote: string[]): Promise<void>;
  inserirHistorico(lote: THistorico[]): Promise<void>;
  inserirEventos(lote: TEvento[]): Promise<void>;
  /** Grava a linha `sucesso` com o hash; só roda depois de tudo persistido. */
  registrarSucesso(): Promise<void>;
};

export type DadosColeta<TImovel, THistorico, TEvento> = {
  imoveis: TImovel[];
  desativados: string[];
  historico: THistorico[];
  eventos: TEvento[];
};

/**
 * Persiste o resultado da coleta em lotes e registra `sucesso` por último.
 * Se qualquer lote falhar, a coleta não fica marcada como processada e o
 * mesmo arquivo é reprocessado na próxima execução.
 */
export async function persistirColeta<TImovel, THistorico, TEvento>(
  dados: DadosColeta<TImovel, THistorico, TEvento>,
  gravacoes: GravacoesColeta<TImovel, THistorico, TEvento>,
  tamanho = TAMANHO_LOTE,
): Promise<void> {
  for (const lote of emLotes(dados.imoveis, tamanho)) {
    await gravacoes.upsertImoveis(lote);
  }
  for (const lote of emLotes(dados.desativados, tamanho)) {
    await gravacoes.desativarImoveis(lote);
  }
  for (const lote of emLotes(dados.historico, tamanho)) {
    await gravacoes.inserirHistorico(lote);
  }
  for (const lote of emLotes(dados.eventos, tamanho)) {
    await gravacoes.inserirEventos(lote);
  }
  await gravacoes.registrarSucesso();
}

/**
 * Executa a coleta e, em qualquer erro, tenta registrar `falha` antes de
 * propagar. Uma falha ao registrar a falha não esconde o erro original.
 */
export async function executarRegistrandoFalha(
  uf: string,
  coletar: () => Promise<void>,
  registrarFalha: (uf: string, erro: string) => Promise<void>,
): Promise<void> {
  try {
    await coletar();
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : String(error);
    try {
      await registrarFalha(uf, mensagem);
    } catch (erroAoRegistrar) {
      console.error("Não foi possível registrar a falha da coleta.");
      console.error(erroAoRegistrar);
    }
    throw error;
  }
}
