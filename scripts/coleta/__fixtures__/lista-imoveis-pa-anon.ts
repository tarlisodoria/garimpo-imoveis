const fixtureLines = [
  "",
  " Lista de Imóveis da Caixa;;Data de geração:;15/10/2026;;;;;;;",
  " N° do imóvel;UF;Cidade;Bairro;Endereço;Preço;Valor de avaliação;Desconto;Financiamento;Descrição;Modalidade de venda;Link de acesso",
  "",
  " 9000000000001 ;PA ;ALTAMIRA ;CENTRO ;RUA EXEMPLO, N. 10 ;111.638,68;239.000,00;53.29;Sim;Casa, 0.00 de área total, 120.00 de área privativa, 120.00 de área do terreno,  2 qto(s), varanda, a.serv, WC, 1 sala(s), cozinha.;Venda Direta Online;https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?hdnimovel=9000000000001",
  " 9000000000002 ;PA ;ANANINDEUA ;CIDADE NOVA ;AVENIDA MODELO, N. 200 ;206.888,15;371.000,00;44.24;Não;Apartamento, 64.00 de área total, 58.00 de área privativa,  2 qto(s), WC, 1 sala(s), cozinha, 1 vaga(s) de garagem.;Venda Online;https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?hdnimovel=9000000000002",
].join("\r\n");

export const listaImoveisPaAnonFixture = Buffer.from(fixtureLines, "latin1");
