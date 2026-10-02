import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Reembolso — Praticca",
  description:
    "Saiba como solicitar reembolso na Praticca, prazos e condições de acordo com o Código de Defesa do Consumidor.",
};

const LAST_UPDATED = "01 de junho de 2026";

export default function ReembolsoPage() {
  return (
    <>
      <h1>Política de Reembolso</h1>
      <p className="text-sm text-muted">Última atualização: {LAST_UPDATED}</p>
      <hr />

      <p>
        A Praticca preza pela transparência e respeito aos direitos dos
        consumidores. Esta Política foi elaborada em conformidade com o{" "}
        <strong>Código de Defesa do Consumidor (Lei nº 8.078/1990)</strong> e
        demais legislações aplicáveis.
      </p>

      {/* 1 */}
      <h2>1. Direito de arrependimento — 7 dias (CDC)</h2>
      <p>
        Nos termos do <strong>art. 49 do Código de Defesa do Consumidor</strong>
        , você tem o direito de cancelar qualquer compra realizada fora de
        estabelecimento comercial (inclusive pela internet) no prazo de{" "}
        <strong>7 (sete) dias corridos</strong>, contados da data da contratação
        ou do recebimento do produto/serviço, o que ocorrer por último.
      </p>
      <p>
        O exercício do direito de arrependimento implica{" "}
        <strong>reembolso integral</strong> do valor pago, incluindo eventuais
        encargos, sem necessidade de justificativa.
      </p>

      {/* 2 */}
      <h2>2. Condições para reembolso após 7 dias</h2>
      <p>
        Fora do prazo de arrependimento legal, podemos conceder reembolso
        proporcional nas seguintes situações:
      </p>
      <ul>
        <li>
          <strong>Falha técnica grave:</strong> indisponibilidade da Plataforma
          por mais de 72 horas contínuas em um período de faturamento,
          documentada em nosso canal de status.
        </li>
        <li>
          <strong>Cobrança indevida:</strong> duplicidade de cobranças ou
          valores diferentes dos acordados.
        </li>
        <li>
          <strong>Descontinuação de funcionalidade essencial:</strong> quando
          uma ferramenta que motivou a assinatura for removida sem substituta
          equivalente, mediante aviso com menos de 30 dias de antecedência.
        </li>
      </ul>
      <p>
        Em todos os casos, a solicitação deve ser feita dentro de{" "}
        <strong>30 dias</strong> do evento que a originou.
      </p>

      {/* 3 */}
      <h2>3. O que não é reembolsável</h2>
      <ul>
        <li>
          <strong>Créditos avulsos já consumidos:</strong> créditos utilizados
          para processar arquivos não são reembolsáveis.
        </li>
        <li>
          <strong>Período já utilizado da assinatura</strong> (fora do prazo de
          7 dias), exceto nas condições da seção 2.
        </li>
        <li>
          Créditos ou bônus obtidos gratuitamente (promoções, indicações, etc.).
        </li>
        <li>
          Plano gratuito (não há valor financeiro a reembolsar).
        </li>
      </ul>

      {/* 4 */}
      <h2>4. Cancelamento de assinatura recorrente</h2>
      <p>
        Você pode cancelar sua assinatura a qualquer momento pela página{" "}
        <a href="/account/assinatura">Minha Conta &gt; Assinatura</a>. O
        cancelamento interrompe a cobrança futura, mas o acesso aos recursos do
        plano é mantido até o final do período já pago.
      </p>
      <p>
        <strong>Exemplo:</strong> se você assinou em 1º de junho e cancelou em
        15 de junho, continuará com acesso até 30 de junho, sem cobrança no
        mês seguinte.
      </p>

      {/* 5 */}
      <h2>5. Como solicitar reembolso</h2>
      <p>Siga os passos abaixo para solicitar um reembolso:</p>
      <ol>
        <li>
          <strong>Verifique o prazo:</strong> confirme que a solicitação está
          dentro do prazo de 7 dias (arrependimento) ou 30 dias (falhas).
        </li>
        <li>
          <strong>Reúna as informações:</strong> e-mail da conta, data da
          compra, valor e motivo da solicitação.
        </li>
        <li>
          <strong>Envie a solicitação</strong> para{" "}
          <a href="mailto:suporte@praticca.com.br">suporte@praticca.com.br</a>{" "}
          com o assunto <em>&quot;Solicitação de Reembolso — [seu e-mail]&quot;</em>.
        </li>
        <li>
          <strong>Aguarde confirmação:</strong> responderemos em até{" "}
          <strong>2 dias úteis</strong>.
        </li>
        <li>
          <strong>Processamento:</strong> reembolsos aprovados são processados
          em até <strong>10 dias úteis</strong>. Para cartão de crédito, o
          estorno pode levar até 2 faturas para aparecer, dependendo da operadora.
          Para Pix, o crédito é realizado em até 3 dias úteis.
        </li>
      </ol>

      {/* 6 */}
      <h2>6. Disputas e chargebacks</h2>
      <p>
        Antes de abrir uma disputa junto à operadora do cartão, pedimos que
        entre em contato conosco. Resolvemos a maioria das situações de forma
        rápida e amigável. Disputas abertas sem contato prévio podem resultar
        em suspensão temporária da conta enquanto o processo é analisado.
      </p>

      {/* 7 */}
      <h2>7. Contato e reclamações</h2>
      <p>
        Para reembolsos e suporte:{" "}
        <a href="mailto:suporte@praticca.com.br">suporte@praticca.com.br</a>
        <br />
        Resposta em até 2 dias úteis.
      </p>
      <p>
        Se não ficou satisfeito(a) com nossa resposta, você pode registrar uma
        reclamação no{" "}
        <a
          href="https://www.consumidor.gov.br"
          target="_blank"
          rel="noopener noreferrer"
        >
          consumidor.gov.br
        </a>{" "}
        (plataforma oficial do Governo Federal para resolução de conflitos de
        consumo).
      </p>

      {/* 8 */}
      <h2>8. Alterações nesta Política</h2>
      <p>
        Podemos atualizar esta Política com aviso por e-mail com antecedência
        mínima de 15 dias antes da vigência das alterações. O uso continuado
        após essa data implica concordância com os novos termos.
      </p>
    </>
  );
}
