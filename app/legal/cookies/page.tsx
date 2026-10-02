import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies — Praticca",
  description:
    "Entenda quais cookies a Praticca utiliza, para que servem e como gerenciar suas preferências.",
};

const LAST_UPDATED = "01 de junho de 2026";

export default function CookiesPage() {
  return (
    <>
      <h1>Política de Cookies</h1>
      <p className="text-sm text-muted">Última atualização: {LAST_UPDATED}</p>
      <hr />

      <p>
        Esta Política explica o que são cookies, quais utilizamos na
        Plataforma <strong>Praticca</strong> e como você pode gerenciar suas
        preferências. Ela deve ser lida em conjunto com nossa{" "}
        <a href="/legal/privacidade">Política de Privacidade</a>.
      </p>

      {/* 1 */}
      <h2>1. O que são cookies?</h2>
      <p>
        Cookies são pequenos arquivos de texto armazenados no seu navegador
        quando você visita um site. Eles permitem que o site &quot;lembre&quot;
        de informações sobre sua visita (como preferências de idioma ou sessão
        de login), tornando sua próxima visita mais fácil e o site mais útil.
      </p>
      <p>
        Além de cookies tradicionais, podemos usar tecnologias similares como{" "}
        <em>localStorage</em> e <em>sessionStorage</em> para armazenar
        preferências localmente no seu dispositivo.
      </p>

      {/* 2 */}
      <h2>2. Cookies que utilizamos</h2>

      <h3>2.1 Cookies essenciais (sempre ativos)</h3>
      <p>
        Esses cookies são <strong>estritamente necessários</strong> para o
        funcionamento da Plataforma. Sem eles, recursos básicos como login e
        segurança não funcionariam. Por serem essenciais, não requerem seu
        consentimento, conforme art. 7º, V, da LGPD.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse border border-border">
          <thead>
            <tr className="bg-surface">
              <th className="border border-border px-3 py-2 text-left font-semibold">Nome</th>
              <th className="border border-border px-3 py-2 text-left font-semibold">Provedor</th>
              <th className="border border-border px-3 py-2 text-left font-semibold">Finalidade</th>
              <th className="border border-border px-3 py-2 text-left font-semibold">Expiração</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["sb-access-token", "Supabase / Praticca", "Sessão de autenticação do usuário", "Sessão"],
              ["sb-refresh-token", "Supabase / Praticca", "Renovação automática da sessão", "7 dias"],
              ["praticca-cookie-consent", "Praticca", "Armazena suas preferências de cookies", "12 meses"],
              ["praticca-theme", "Praticca", "Preferência de tema claro/escuro", "12 meses"],
            ].map(([nome, provedor, fim, exp]) => (
              <tr key={nome}>
                <td className="border border-border px-3 py-2 font-mono text-xs">{nome}</td>
                <td className="border border-border px-3 py-2">{provedor}</td>
                <td className="border border-border px-3 py-2">{fim}</td>
                <td className="border border-border px-3 py-2 whitespace-nowrap">{exp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>2.2 Cookies de analytics (opcionais — requerem consentimento)</h3>
      <p>
        Usamos ferramentas de análise para entender como os usuários interagem
        com a Plataforma e identificar oportunidades de melhoria. Esses cookies
        coletam dados <strong>agregados e anonimizados</strong>; não rastreamos
        você individualmente entre sites.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse border border-border">
          <thead>
            <tr className="bg-surface">
              <th className="border border-border px-3 py-2 text-left font-semibold">Ferramenta</th>
              <th className="border border-border px-3 py-2 text-left font-semibold">Provedor</th>
              <th className="border border-border px-3 py-2 text-left font-semibold">Dados coletados</th>
              <th className="border border-border px-3 py-2 text-left font-semibold">Expiração</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "Plausible Analytics",
                "Plausible Insights OÜ",
                "Páginas visitadas, país, tipo de dispositivo (sem PII, sem cross-site)",
                "Sessão",
              ],
            ].map(([ferr, prov, dados, exp]) => (
              <tr key={ferr}>
                <td className="border border-border px-3 py-2 font-medium">{ferr}</td>
                <td className="border border-border px-3 py-2">{prov}</td>
                <td className="border border-border px-3 py-2">{dados}</td>
                <td className="border border-border px-3 py-2 whitespace-nowrap">{exp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3 */}
      <h2>3. Cookies de terceiros</h2>
      <p>
        Não utilizamos cookies de redes sociais, publicidade comportamental ou
        rastreamento cross-site. Quando integramos serviços de terceiros (ex.:
        Stripe para pagamentos), esses serviços podem definir cookies próprios
        em suas páginas; recomendamos consultar as políticas de privacidade
        deles diretamente.
      </p>

      {/* 4 */}
      <h2>4. Como gerenciar suas preferências</h2>
      <h3>4.1 Painel de consentimento</h3>
      <p>
        Ao acessar a Plataforma pela primeira vez, exibimos um banner onde você
        pode aceitar apenas os cookies essenciais ou todos os cookies. Você
        pode alterar sua escolha a qualquer momento clicando em{" "}
        <strong>&quot;Gerenciar cookies&quot;</strong> no rodapé do site.
      </p>
      <h3>4.2 Configurações do navegador</h3>
      <p>
        Você também pode controlar ou excluir cookies diretamente pelo seu
        navegador. Consulte as instruções para os principais navegadores:
      </p>
      <ul>
        <li>
          <a
            href="https://support.google.com/chrome/answer/95647"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Chrome
          </a>
        </li>
        <li>
          <a
            href="https://support.mozilla.org/pt-BR/kb/cookies-informacoes-que-os-sites-armazenam-no-seu"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mozilla Firefox
          </a>
        </li>
        <li>
          <a
            href="https://support.apple.com/pt-br/guide/safari/sfri11471/mac"
            target="_blank"
            rel="noopener noreferrer"
          >
            Apple Safari
          </a>
        </li>
        <li>
          <a
            href="https://support.microsoft.com/pt-br/microsoft-edge/excluir-cookies-no-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
            target="_blank"
            rel="noopener noreferrer"
          >
            Microsoft Edge
          </a>
        </li>
      </ul>
      <p>
        Atenção: bloquear cookies essenciais pode prejudicar o funcionamento do
        login e de outras funcionalidades.
      </p>

      {/* 5 */}
      <h2>5. Alterações nesta Política</h2>
      <p>
        Podemos atualizar esta Política para refletir mudanças em nossas
        práticas ou na legislação aplicável. Notificaremos alterações
        significativas por e-mail e/ou banner na Plataforma.
      </p>

      {/* 6 */}
      <h2>6. Contato</h2>
      <p>
        Dúvidas sobre cookies ou privacidade:{" "}
        <a href="mailto:privacidade@praticca.com.br">
          privacidade@praticca.com.br
        </a>
        .
      </p>
    </>
  );
}
