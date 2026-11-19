# ADR 0009: Congelar a coleta após o bloqueio da fonte, sem contornar

**Status:** aceita (18/11/2026)

## Contexto

Desde 16/11/2026, a Caixa responde HTTP 403 ao download do CSV de todas as 27 UFs quando a requisição parte do GitHub Actions. De um IP residencial, o mesmo arquivo baixa normalmente. A última coleta bem-sucedida foi a de 15/11/2026.

Entre 05/11 e 15/11, o projeto também consultava até 120 páginas de detalhe da Caixa por execução, o que elevou o volume diário de 27 para cerca de 147 requisições. Essa mudança provavelmente contribuiu para o bloqueio. A análise completa está no [pós-mortem](../incidentes/2026-11-bloqueio-403.md).

O [ADR 0002](0002-coleta-diaria-no-github-actions.md) já definia uma coleta educada com a fonte, sem contornar bloqueios.

## Decisão

- Não contornar o bloqueio: nada de proxy, troca ou rotação de IP, coleta automatizada a partir de rede residencial ou disfarce de navegador.
- Remover o agendamento do `coleta-diaria.yml`. O disparo manual continua disponível para testar se o acesso voltou.
- Manter o site publicado com o snapshot de 15/11/2026, com aviso visível na home e em `/status`.
- Remover a consulta às páginas de detalhe e o cronômetro que dependia dela. Se a coleta voltar, volta com uma requisição por UF por dia.
- Fechar as issues automáticas abertas pelas execuções que falharam, com explicação.

## Consequências

- Os dados ficam parados em 15/11/2026. Imóveis vendidos ou retirados depois dessa data continuam aparecendo; o aviso no site e o link para a página oficial de cada imóvel reduzem esse risco.
- O banco e o histórico do período monitorado (outubro a 15/11/2026) continuam íntegros e podem ser publicados como conjunto de dados.
- O custo segue zero, e não há mais execuções diárias falhando nem issues automáticas novas.
- A coleta só deve ser reativada se a Caixa liberar o acesso a partir de servidores em nuvem ou oferecer um canal oficial para os dados. Nesse caso, a reativação é um novo ADR.
