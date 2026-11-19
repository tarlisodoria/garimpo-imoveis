# Política de segurança

## Como reportar

Use o relato privado do GitHub: na aba **Security** do repositório, clique em **Report a vulnerability** ([link direto](https://github.com/tarlisodoria/garimpo-imoveis/security/advisories/new)). O relato fica visível só para quem mantém o projeto.

Não abra issue pública para vulnerabilidades. Inclua, se possível:

1. O que é afetado (arquivo, workflow, página ou dependência).
2. Como reproduzir, passo a passo.
3. O impacto que você enxerga.

Este é um projeto pessoal de portfólio, mantido nas horas livres. A meta é responder em até 7 dias e, quando o problema for confirmado, corrigir ou documentar uma mitigação em até 30 dias.

## Versões cobertas

Só a versão atual da branch `main` (1.1.x) recebe correções.

## Escopo

Dentro do escopo:

- Código deste repositório: coleta, geração do snapshot e site estático.
- Workflows do GitHub Actions: vazamento de secrets, injeção de comandos, permissões além do necessário.
- O site publicado em garimpo-imoveis.pages.dev: XSS ou injeção de conteúdo a partir dos dados do snapshot, links que levem para fora dos domínios esperados.
- Dependências declaradas no `package.json`, quando a falha for explorável neste projeto.
- Dados pessoais ou credenciais expostos em código, documentação, histórico do Git ou logs públicos.

Fora do escopo:

- Sites e sistemas da Caixa Econômica Federal, do IBGE, do GitHub, do Neon ou da Cloudflare. Reporte diretamente a eles.
- Ataques de negação de serviço, testes de carga e varreduras automatizadas contra o site publicado.
- Engenharia social e ataques que exigem acesso físico ou à conta de quem mantém o projeto.
- Qualquer técnica para contornar o bloqueio da Caixa à coleta automatizada. O projeto decidiu não contornar esse bloqueio ([ADR 0009](docs/adr/0009-congelamento-da-coleta.md)).
- Erros nos dados de imóveis (preço, situação, endereço). Isso não é falha de segurança: confira na página oficial e, se quiser, abra uma issue comum.

## Boas práticas já adotadas

- O site é 100% estático, sem banco nem credenciais em tempo de execução.
- Os workflows usam `permissions: contents: read` por padrão e ampliam só no job que precisa.
- Actions fixadas por SHA e atualizadas pelo Dependabot.
- Host, endpoint e usuário do banco são mascarados nos logs públicos; mensagens de erro passam por `scripts/lib/erro-seguro.ts` para não expor a URL de conexão.
