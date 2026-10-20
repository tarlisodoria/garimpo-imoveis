import type { Metadata } from "next";

import { DocumentoLegal } from "../../components/site/DocumentoLegal";
import { contatoUrl } from "../../lib/site";

export const metadata: Metadata = {
  title: "Política de Privacidade | Garimpo Imóveis",
  description:
    "O Garimpo Imóveis não tem cadastro e não coleta dados pessoais. Saiba o que a hospedagem trata em cada acesso.",
  alternates: {
    canonical: "/privacidade",
  },
};

export default function PrivacidadePage() {
  const contato = (
    <a
      href={contatoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-emerald-800 underline underline-offset-4"
    >
      issues do repositório no GitHub
    </a>
  );

  return (
    <DocumentoLegal
      titulo="Política de Privacidade"
      resumo="O Garimpo Imóveis é um site de consulta sem cadastro, sem login, sem formulários e sem cobrança. Não coletamos dados pessoais de quem visita."
    >
      <h2>1. O que coletamos</h2>
      <p>
        Nada que identifique você. O site é um conjunto de páginas estáticas:
        não há conta, formulário, newsletter, ferramenta de análise de
        audiência, publicidade nem rastreamento.
      </p>

      <h2>2. Hospedagem e dados técnicos</h2>
      <p>
        O site é hospedado pela Cloudflare. Para entregar as páginas e
        protegê-las contra abusos, a Cloudflare trata em cada acesso dados
        técnicos como endereço IP, navegador e horário, conforme a política de
        privacidade dela. Esse tratamento pode envolver servidores fora do
        Brasil. Não temos acesso a esses registros para identificar visitantes e
        não os combinamos com outros dados.
      </p>

      <h2>3. Cookies</h2>
      <p>
        Não usamos cookies. A Cloudflare pode definir cookies técnicos de
        segurança, necessários para proteger o site contra tráfego automatizado;
        eles não servem para publicidade nem para análise de comportamento.
      </p>

      <h2>4. Dados exibidos no site</h2>
      <p>
        As informações sobre imóveis vêm da lista pública de imóveis à venda
        divulgada pela Caixa Econômica Federal e se referem aos imóveis, não a
        pessoas. Os links levam ao site oficial da Caixa, que tem suas próprias
        regras de privacidade.
      </p>

      <h2>5. Contato</h2>
      <p>
        Dúvidas ou pedidos sobre privacidade podem ser enviados pelas {contato}.
        Não envie dados pessoais nesse canal, porque ele é público.
      </p>

      <h2>6. Alterações</h2>
      <p>
        Esta política pode ser atualizada. A versão e a data de vigência ficam
        no topo da página.
      </p>
    </DocumentoLegal>
  );
}
