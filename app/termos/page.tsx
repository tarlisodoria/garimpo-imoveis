import type { Metadata } from "next";

import { DocumentoLegal } from "../../components/site/DocumentoLegal";
import { contatoUrl, repositorioUrl } from "../../lib/site";

export const metadata: Metadata = {
  title: "Termos de Uso | Garimpo Imóveis",
  description:
    "Condições de uso do Garimpo Imóveis: projeto de portfólio com dados públicos da Caixa, sem afiliação e sem garantia.",
  alternates: {
    canonical: "/termos",
  },
};

const link = "font-medium text-emerald-800 underline underline-offset-4";

export default function TermosPage() {
  return (
    <DocumentoLegal
      titulo="Termos de Uso"
      resumo="O Garimpo Imóveis é um projeto de portfólio, sem fins comerciais, que organiza dados públicos da lista de imóveis à venda da Caixa. Ao usar o site, você concorda com estas condições."
    >
      <h2>1. O que é o site</h2>
      <ul>
        <li>
          Todos os dias, um processo automático baixa a lista pública de imóveis
          à venda da Caixa Econômica Federal, compara com a do dia anterior e
          publica os imóveis por estado e cidade, os maiores descontos e as
          quedas de preço.
        </li>
        <li>
          O site é gratuito, não tem cadastro e não vende nada. É um projeto de
          demonstração técnica.
        </li>
      </ul>

      <h2>2. Sem afiliação</h2>
      <p>
        <strong>O Garimpo Imóveis não é afiliado à Caixa</strong> e não a
        representa. Não intermedeia a compra, não participa das disputas e não
        presta assessoria jurídica, imobiliária ou financeira.
      </p>

      <h2>3. Sem garantia</h2>
      <ul>
        <li>
          A lista da Caixa é atualizada por ela, com atrasos e mudanças que não
          controlamos. Valores, modalidade e condições podem mudar, e o imóvel
          pode sair da lista a qualquer momento.
        </li>
        <li>
          O valor exibido é o valor mínimo de venda; na Venda Online há disputa
          e o valor final pode ser maior. A modalidade é a informada na lista da
          data indicada em cada imóvel.
        </li>
        <li>
          Não garantimos que os dados estejam completos, corretos ou
          atualizados, nem que o site fique disponível sem interrupções.{" "}
          <strong>Confirme sempre na página oficial da Caixa</strong> antes de
          qualquer decisão. Não respondemos por decisões tomadas com base no
          site.
        </li>
      </ul>

      <h2>4. Uso dos dados e do código</h2>
      <ul>
        <li>
          Os dados dos imóveis são públicos e pertencem à fonte oficial; a
          reutilização deve respeitar as condições da Caixa.
        </li>
        <li>
          O código-fonte está disponível em{" "}
          <a
            href={repositorioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            github.com/tarlisodoria/garimpo-imoveis
          </a>
          , sob a licença indicada no repositório.
        </li>
        <li>
          Não é permitido automatizar acessos ao site de forma abusiva nem
          usá-lo para fins ilegais.
        </li>
      </ul>

      <h2>5. Contato</h2>
      <p>
        Sugestões e correções podem ser enviadas pelas{" "}
        <a
          href={contatoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={link}
        >
          issues do repositório
        </a>
        .
      </p>

      <h2>6. Alterações e lei aplicável</h2>
      <p>
        Estes termos podem ser atualizados; a versão e a data de vigência ficam
        no topo da página. Aplica-se a lei brasileira.
      </p>
    </DocumentoLegal>
  );
}
