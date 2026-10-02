import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — Praticca",
  description:
    "Saiba como a Praticca coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.",
};

const LAST_UPDATED = "01 de junho de 2026";

export default function PrivacidadePage() {
  return (
    <>
      <h1>Política de Privacidade</h1>
      <p className="text-sm text-muted">Última atualização: {LAST_UPDATED}</p>
      <hr />

      <p>
        A <strong>Praticca Tecnologia Ltda.</strong> (&quot;Praticca&quot;,
        &quot;nós&quot;) leva a sério a privacidade de seus usuários. Esta
        Política descreve como coletamos, usamos, armazenamos e protegemos
        dados pessoais em conformidade com a{" "}
        <strong>
          Lei Geral de Proteção de Dados — LGPD (Lei nº 13.709/2018)
        </strong>
        .
      </p>

      {/* 1 */}
      <h2>1. Controlador e Encarregado (DPO)</h2>
      <p>
        O <strong>controlador</strong> dos seus dados é a Praticca Tecnologia
        Ltda., CNPJ nº XX.XXX.XXX/0001-XX, Rua [Endereço], São Paulo/SP.
      </p>
      <p>
        Nosso <strong>Encarregado de Proteção de Dados (DPO)</strong> pode ser
        contatado em:{" "}
        <a href="mailto:privacidade@praticca.com.br">
          privacidade@praticca.com.br
        </a>
        .
      </p>

      {/* 2 */}
      <h2>2. Dados que coletamos</h2>
      <h3>2.1 Dados fornecidos diretamente</h3>
      <ul>
        <li>
          <strong>Cadastro:</strong> nome, e-mail e senha (armazenada com hash
          seguro via Supabase Auth).
        </li>
        <li>
          <strong>Pagamento:</strong> os dados de cartão são tratados
          exclusivamente pelo processador de pagamentos (Stripe); não
          armazenamos número completo do cartão.
        </li>
        <li>
          <strong>Comunicações:</strong> mensagens enviadas via formulários de
          suporte ou e-mail.
        </li>
      </ul>
      <h3>2.2 Dados coletados automaticamente</h3>
      <ul>
        <li>
          <strong>Logs de acesso:</strong> endereço IP (anonimizado após 90
          dias), user-agent, páginas visitadas e horário de acesso — conforme
          exigido pelo Marco Civil da Internet (Lei nº 12.965/2014).
        </li>
        <li>
          <strong>Métricas de uso:</strong> ferramentas utilizadas, número de
          operações, duração das sessões — sem identificação do conteúdo dos
          arquivos processados.
        </li>
        <li>
          <strong>Cookies e tecnologias similares:</strong> ver nossa{" "}
          <a href="/legal/cookies">Política de Cookies</a>.
        </li>
      </ul>
      <h3>2.3 Arquivos enviados</h3>
      <p>
        Os arquivos que você faz upload para processamento são tratados com
        confidencialidade rigorosa. Veja a seção 7 para detalhes sobre como
        protegemos seus arquivos.
      </p>

      {/* 3 */}
      <h2>3. Finalidades e bases legais</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse border border-border">
          <thead>
            <tr className="bg-surface">
              <th className="border border-border px-3 py-2 text-left font-semibold">Finalidade</th>
              <th className="border border-border px-3 py-2 text-left font-semibold">Base legal (LGPD)</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Prestação dos serviços contratados", "Art. 7º, V — execução de contrato"],
              ["Cobrança e gestão de assinaturas", "Art. 7º, V — execução de contrato"],
              ["Comunicações transacionais (recibos, alertas de uso)", "Art. 7º, V — execução de contrato"],
              ["Registro de logs de acesso", "Art. 7º, II — obrigação legal (MCI)"],
              ["Prevenção a fraudes e segurança da plataforma", "Art. 7º, IX — interesse legítimo"],
              ["Melhoria dos serviços e análises agregadas", "Art. 7º, IX — interesse legítimo"],
              ["Marketing e comunicações promocionais", "Art. 7º, I — consentimento (opt-in)"],
              ["Atendimento a requisições de autoridades", "Art. 7º, II — obrigação legal"],
            ].map(([fin, base]) => (
              <tr key={fin}>
                <td className="border border-border px-3 py-2">{fin}</td>
                <td className="border border-border px-3 py-2 text-muted">{base}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4 */}
      <h2>4. Retenção de dados por plano</h2>
      <p>
        O prazo de retenção varia conforme o plano ativo do usuário:
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse border border-border">
          <thead>
            <tr className="bg-surface">
              <th className="border border-border px-3 py-2 text-left font-semibold">Plano</th>
              <th className="border border-border px-3 py-2 text-left font-semibold">Arquivos processados</th>
              <th className="border border-border px-3 py-2 text-left font-semibold">Histórico de operações</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Gratuito", "Excluídos em até 1 hora após download", "30 dias"],
              ["Pro", "Excluídos em até 24 horas após download", "12 meses"],
              ["Business", "Excluídos em até 7 dias após download", "24 meses"],
            ].map(([plano, arq, hist]) => (
              <tr key={plano}>
                <td className="border border-border px-3 py-2 font-medium">{plano}</td>
                <td className="border border-border px-3 py-2">{arq}</td>
                <td className="border border-border px-3 py-2">{hist}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Dados de conta (nome, e-mail) são mantidos enquanto a conta estiver
        ativa. Após encerramento, são excluídos em até 90 dias, salvo obrigação
        legal de retenção maior (ex.: dados fiscais — 5 anos).
      </p>

      {/* 5 */}
      <h2>5. Compartilhamento de dados</h2>
      <p>
        Não vendemos seus dados pessoais. Compartilhamos apenas com:
      </p>
      <ul>
        <li>
          <strong>Fornecedores de infraestrutura:</strong> Supabase (banco de
          dados e autenticação), Stripe (pagamentos), Vercel (hospedagem) —
          todos com contratos de processamento alinhados à LGPD.
        </li>
        <li>
          <strong>Ferramentas de análise:</strong> dados agregados e
          anonimizados para análise de desempenho (ex.: Plausible Analytics,
          sem cookies de rastreamento de terceiros).
        </li>
        <li>
          <strong>Autoridades públicas:</strong> quando exigido por lei,
          decisão judicial ou autoridade competente.
        </li>
      </ul>

      {/* 6 */}
      <h2>6. Transferência internacional</h2>
      <p>
        Alguns fornecedores acima podem processar dados fora do Brasil. Nesses
        casos, adotamos cláusulas contratuais padrão ou nos baseamos em
        decisões de adequação reconhecidas pela ANPD para garantir nível de
        proteção equivalente.
      </p>

      {/* 7 — destaque */}
      <h2>7. Como protegemos seus arquivos</h2>
      <p>
        A proteção dos seus arquivos é nossa prioridade central. Adotamos uma
        arquitetura de <strong>privacidade por design</strong>:
      </p>
      <ul>
        <li>
          <strong>Processamento no navegador:</strong> a grande maioria das
          nossas ferramentas processa os arquivos inteiramente no seu
          dispositivo, sem que o conteúdo sequer trafegue pelos nossos
          servidores. Quando isso ocorre, o ícone{" "}
          <span className="inline-block bg-success-500/10 text-success-700 text-xs font-semibold px-2 py-0.5 rounded-full">
            100% local
          </span>{" "}
          é exibido na ferramenta.
        </li>
        <li>
          <strong>Exclusão automática:</strong> quando um arquivo precisa
          passar pelo servidor (ex.: operações que requerem processamento
          pesado), ele é excluído automaticamente após o prazo definido pelo
          seu plano (ver seção 4) — sem intervenção manual necessária.
        </li>
        <li>
          <strong>Sem acesso humano ao conteúdo:</strong> membros da nossa
          equipe não têm acesso ao conteúdo dos arquivos que você processa.
          Acessos a dados de produção são auditados.
        </li>
        <li>
          <strong>Criptografia em trânsito e em repouso:</strong> toda
          comunicação utiliza TLS 1.2+. Arquivos armazenados são protegidos
          com criptografia AES-256.
        </li>
        <li>
          <strong>URLs assinadas e expiráveis:</strong> links de download de
          arquivos gerados expiram automaticamente e são acessíveis apenas
          pelo usuário autenticado que os criou.
        </li>
      </ul>

      {/* 8 */}
      <h2>8. Direitos do titular</h2>
      <p>
        De acordo com os artigos 17 a 22 da LGPD, você tem os seguintes
        direitos:
      </p>
      <ul>
        <li>
          <strong>Confirmação e acesso:</strong> saber se tratamos seus dados e
          obter uma cópia.
        </li>
        <li>
          <strong>Correção:</strong> solicitar correção de dados incompletos,
          inexatos ou desatualizados.
        </li>
        <li>
          <strong>Anonimização, bloqueio ou eliminação:</strong> de dados
          desnecessários ou tratados em desconformidade.
        </li>
        <li>
          <strong>Portabilidade:</strong> receber seus dados em formato
          estruturado e interoperável.
        </li>
        <li>
          <strong>Eliminação:</strong> exclusão de dados tratados com base no
          seu consentimento.
        </li>
        <li>
          <strong>Informação sobre compartilhamento:</strong> com quais
          entidades compartilhamos seus dados.
        </li>
        <li>
          <strong>Revogação do consentimento:</strong> a qualquer momento, sem
          prejuízo do tratamento já realizado.
        </li>
        <li>
          <strong>Oposição:</strong> ao tratamento baseado em interesse
          legítimo, quando aplicável.
        </li>
      </ul>
      <p>
        Para exercer seus direitos, envie uma solicitação para{" "}
        <a href="mailto:privacidade@praticca.com.br">
          privacidade@praticca.com.br
        </a>
        . Responderemos em até <strong>15 dias úteis</strong>.
      </p>
      <p>
        Você também tem o direito de peticionar à{" "}
        <strong>
          Autoridade Nacional de Proteção de Dados (ANPD)
        </strong>{" "}
        em caso de descumprimento.
      </p>

      {/* 9 */}
      <h2>9. Segurança</h2>
      <p>
        Adotamos medidas técnicas e organizacionais adequadas para proteger
        seus dados contra acesso não autorizado, perda, destruição ou
        divulgação indevida. Em caso de incidente de segurança que possa
        acarretar risco aos titulares, notificaremos a ANPD e os afetados no
        prazo legal.
      </p>

      {/* 10 */}
      <h2>10. Menores de idade</h2>
      <p>
        Não coletamos intencionalmente dados de menores de 18 anos sem
        consentimento dos pais ou responsáveis, conforme art. 14 da LGPD. Se
        você identificar que um menor criou uma conta sem autorização, entre em
        contato conosco para exclusão.
      </p>

      {/* 11 */}
      <h2>11. Alterações nesta Política</h2>
      <p>
        Podemos atualizar esta Política periodicamente. Notificaremos por
        e-mail alterações relevantes. A data de &quot;última atualização&quot;
        no topo indica a versão vigente.
      </p>

      {/* 12 */}
      <h2>12. Contato</h2>
      <p>
        Dúvidas sobre privacidade:{" "}
        <a href="mailto:privacidade@praticca.com.br">
          privacidade@praticca.com.br
        </a>
        <br />
        Praticca Tecnologia Ltda. — Rua [Endereço], São Paulo/SP — CEP
        XX.XXX-XXX
      </p>
    </>
  );
}
