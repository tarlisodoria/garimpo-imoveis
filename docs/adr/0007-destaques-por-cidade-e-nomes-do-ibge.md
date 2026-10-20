# ADR 0007 — Destaques limitados por cidade e nomes oficiais do IBGE

**Status:** aceita

## Contexto

- Os maiores descontos se concentravam numa cidade: 21 imóveis de São Gonçalo/RJ com 90%. A investigação mostrou que não é arredondamento: nesses imóveis o valor mínimo de venda é exatamente 10% da avaliação, porque eles passaram por leilões sem comprador.
- A Caixa publica as cidades em caixa alta e, na maioria, sem acento.
- O valor de avaliação não é um "preço anterior"; exibi-lo tachado sugeriria uma promoção.

## Decisão

- Destaques globais e por UF com no máximo 2 imóveis por cidade, mantendo a ordem por desconto e desempatando pelo número do imóvel.
- Mapa versionado `data/municipios-ibge.json` (UF → slug → nome oficial), gerado por script a partir da API de localidades do IBGE e usado só no servidor, para não aumentar o JavaScript do navegador. Sem correspondência, o nome vira formato título, sem tentativa de reacentuar.
- Os cards mostram "Valor mínimo de venda" e "Avaliação da Caixa", sem tachado, e a data da lista de onde vieram a modalidade e os valores.

## Consequências

- 1.175 de 1.187 cidades aparecem com o nome oficial; as demais são regiões administrativas do DF, distritos ou grafias diferentes na fonte.
- O build e o site não acessam a rede para obter os nomes; o mapa precisa ser regerado se o IBGE criar ou renomear municípios.
