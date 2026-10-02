import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso — Praticca",
  description:
    "Leia os Termos de Uso da Praticca: objeto, conta, uso aceitável, pagamentos, propriedade intelectual e limitação de responsabilidade.",
};

const LAST_UPDATED = "01 de junho de 2026";

export default function TermosPage() {
  return (
    <>
      <h1>Termos de Uso</h1>
      <p className="text-sm text-muted">Última atualização: {LAST_UPDATED}</p>
      <hr />

      <p>
        Bem-vindo(a) à <strong>Praticca</strong>. Ao acessar ou utilizar nosso
        site e ferramentas disponíveis em <strong>praticca.com.br</strong>{" "}
        (doravante &quot;Plataforma&quot;), você concorda com os presentes
        Termos de Uso (&quot;Termos&quot;). Se não concordar com qualquer
        disposição, interrompa imediatamente o uso da Plataforma.
      </p>

      {/* 1 */}
      <h2>1. Objeto</h2>
      <p>
        A Praticca oferece um conjunto de ferramentas digitais para processamento
        de arquivos (PDF, imagens, documentos e texto), acessíveis via
        navegador. A Plataforma é operada por{" "}
        <strong>Praticca Tecnologia Ltda.</strong>, inscrita no CNPJ sob o nº
        XX.XXX.XXX/0001-XX, com sede na cidade de São Paulo/SP.
      </p>

      {/* 2 */}
      <h2>2. Criação e gerenciamento de conta</h2>
      <p>
        Algumas funcionalidades exigem cadastro. Ao criar uma conta, você
        declara que:
      </p>
      <ul>
        <li>tem capacidade civil plena (18 anos ou mais, ou assistido/representado legalmente);</li>
        <li>as informações fornecidas são verdadeiras, completas e atualizadas;</li>
        <li>é responsável pela confidencialidade de sua senha e por todas as atividades realizadas em sua conta.</li>
      </ul>
      <p>
        Notifique-nos imediatamente em{" "}
        <a href="mailto:suporte@praticca.com.br">suporte@praticca.com.br</a>{" "}
        se suspeitar de uso não autorizado.
      </p>

      {/* 3 */}
      <h2>3. Uso aceitável</h2>
      <p>Você concorda em não utilizar a Plataforma para:</p>
      <ul>
        <li>processar conteúdo ilegal, difamatório, pornográfico infantil ou que viole direitos de terceiros;</li>
        <li>realizar engenharia reversa, decompilação ou tentativas de extração do código-fonte;</li>
        <li>sobrecarregar infraestrutura por meio de acesso automatizado abusivo (scraping, bots);</li>
        <li>burlar mecanismos de limitação de uso ou cobrança;</li>
        <li>praticar qualquer ato que viole legislação brasileira vigente.</li>
      </ul>
      <p>
        Reservamo-nos o direito de suspender ou encerrar contas que violem
        estas regras, sem prejuízo de outras medidas legais cabíveis.
      </p>

      {/* 4 */}
      <h2>4. Planos, pagamento e créditos</h2>
      <h3>4.1 Plano gratuito</h3>
      <p>
        O plano gratuito oferece um número limitado de operações mensais. Limites
        podem ser alterados mediante aviso com antecedência mínima de 30 dias.
      </p>
      <h3>4.2 Planos pagos</h3>
      <p>
        Os planos pagos são cobrados de forma recorrente (mensal ou anual) via
        cartão de crédito ou Pix, conforme disponibilidade. Os valores vigentes
        estão em{" "}
        <a href="/precos">praticca.com.br/precos</a>. A cobrança é antecipada
        ao período de uso.
      </p>
      <h3>4.3 Créditos adicionais</h3>
      <p>
        Créditos avulsos não expiram no mesmo ciclo do plano, salvo disposição
        específica no momento da compra. Créditos adquiridos como bônus
        promocional podem ter prazo de validade indicado.
      </p>
      <h3>4.4 Reajuste</h3>
      <p>
        Podemos reajustar preços com aviso por e-mail com antecedência mínima
        de 30 dias. Assinantes anuais vigentes mantêm o preço até o fim do
        período contratado.
      </p>
      <p>
        Para cancelamentos e reembolsos, consulte nossa{" "}
        <a href="/legal/reembolso">Política de Reembolso</a>.
      </p>

      {/* 5 */}
      <h2>5. Propriedade intelectual</h2>
      <h3>5.1 Da Praticca</h3>
      <p>
        Todo o código-fonte, design, marca, logotipos e textos da Plataforma são
        de propriedade exclusiva da Praticca ou licenciados por terceiros. É
        proibida reprodução, distribuição ou criação de obras derivadas sem
        autorização prévia e expressa por escrito.
      </p>
      <h3>5.2 Dos usuários</h3>
      <p>
        Os arquivos que você faz upload permanecem de sua propriedade. Ao usar a
        Plataforma, você concede à Praticca uma licença limitada, não exclusiva
        e temporária, <strong>exclusivamente para executar o processamento
        solicitado</strong>. Não vendemos, compartilhamos nem utilizamos seus
        arquivos para qualquer outra finalidade. Consulte a{" "}
        <a href="/legal/privacidade">Política de Privacidade</a> para detalhes
        sobre retenção e exclusão.
      </p>

      {/* 6 */}
      <h2>6. Disponibilidade e modificações</h2>
      <p>
        A Praticca não garante disponibilidade ininterrupta da Plataforma. Podemos
        alterar, suspender ou descontinuar funcionalidades a qualquer momento,
        comunicando-o com antecedência razoável quando possível. Em casos de
        manutenção programada, avisaremos com pelo menos 24 horas de antecedência.
      </p>

      {/* 7 */}
      <h2>7. Limitação de responsabilidade</h2>
      <p>
        Nos limites permitidos pela legislação brasileira:
      </p>
      <ul>
        <li>
          A Praticca não se responsabiliza por danos indiretos, lucros cessantes,
          perda de dados ou interrupção de negócios decorrentes do uso ou
          incapacidade de uso da Plataforma.
        </li>
        <li>
          Nossa responsabilidade total perante você, por qualquer causa, fica
          limitada ao valor pago à Praticca nos 12 meses anteriores ao evento
          que gerou o dano.
        </li>
        <li>
          Não somos responsáveis pelo conteúdo dos arquivos processados nem por
          decisões tomadas com base nos resultados gerados.
        </li>
      </ul>
      <p>
        Nada nesta cláusula exclui responsabilidade por dolo, culpa grave ou
        direitos do consumidor previstos no Código de Defesa do Consumidor
        (Lei nº 8.078/1990).
      </p>

      {/* 8 */}
      <h2>8. Privacidade e proteção de dados</h2>
      <p>
        O tratamento de dados pessoais é regido pela nossa{" "}
        <a href="/legal/privacidade">Política de Privacidade</a>, em
        conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 —
        LGPD).
      </p>

      {/* 9 */}
      <h2>9. Alterações nos Termos</h2>
      <p>
        Podemos revisar estes Termos a qualquer momento. A versão atualizada
        será publicada nesta página com nova data de &quot;última
        atualização&quot;. Notificaremos por e-mail alterações materiais com
        pelo menos 15 dias de antecedência. O uso continuado após a data de
        vigência das alterações implica aceitação.
      </p>

      {/* 10 */}
      <h2>10. Foro e lei aplicável</h2>
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil.
        As partes elegem o foro da comarca de <strong>São Paulo/SP</strong>{" "}
        como competente para dirimir quaisquer controvérsias, renunciando a
        qualquer outro, por mais privilegiado que seja, salvo nos casos em que
        a legislação consumerista determinar foro diverso em favor do
        consumidor.
      </p>

      {/* 11 */}
      <h2>11. Contato</h2>
      <p>
        Em caso de dúvidas sobre estes Termos, entre em contato:{" "}
        <a href="mailto:juridico@praticca.com.br">juridico@praticca.com.br</a>
        .
      </p>
    </>
  );
}
