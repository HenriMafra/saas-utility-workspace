import type { Metadata } from "next";
import Link from "next/link";
import { HelpSearch } from "./HelpSearch";
import type { FaqItem } from "./types";

export const metadata: Metadata = {
  title: "Central de Ajuda — Praticca",
  description:
    "Tire dúvidas sobre como usar as ferramentas da Praticca, limites de uso, privacidade, conta, pagamentos e mais.",
  alternates: { canonical: "/ajuda" },
};

const HELP_SECTIONS: {
  id: string;
  title: string;
  items: FaqItem[];
}[] = [
  {
    id: "como-usar",
    title: "Como usar as ferramentas",
    items: [
      {
        q: "Preciso criar uma conta para usar?",
        a: "Não. A maioria das ferramentas funciona sem cadastro. Crie uma conta se quiser salvar histórico, aumentar seus limites diários e acessar ferramentas premium.",
        tags: ["conta", "cadastro", "gratuito"],
      },
      {
        q: "Como envio um arquivo?",
        a: "Arraste o arquivo para a área de upload ou clique nela para abrir o seletor de arquivos. Formatos e tamanho máximo aceitos estão indicados em cada ferramenta.",
        tags: ["upload", "arquivo", "arrastar"],
      },
      {
        q: "O processamento é feito no meu computador ou no servidor?",
        a: "Depende da ferramenta. Ferramentas marcadas como 'Navegador' processam tudo localmente — seus arquivos nunca saem do dispositivo. Ferramentas que usam OCR ou IA avançada precisam enviar o arquivo para nossos servidores de forma segura e temporária.",
        tags: ["privacidade", "navegador", "servidor", "local"],
      },
      {
        q: "Funciona no celular?",
        a: "Sim. A Praticca funciona em qualquer navegador moderno (Chrome, Safari, Firefox, Edge) no computador, tablet ou celular.",
        tags: ["celular", "mobile", "navegador"],
      },
      {
        q: "Posso processar vários arquivos de uma vez?",
        a: "Ferramentas como Juntar PDF e Comprimir Imagem aceitam múltiplos arquivos. Para as demais, processe um arquivo por vez.",
        tags: ["múltiplos arquivos", "batch"],
      },
    ],
  },
  {
    id: "limites",
    title: "Limites de uso",
    items: [
      {
        q: "Qual é o limite de uso gratuito?",
        a: "Usuários sem conta podem usar cada ferramenta até 2–5 vezes por dia, dependendo da ferramenta. Usuários com conta gratuita têm limites um pouco maiores. O plano Pro libera uso ilimitado.",
        tags: ["limite", "gratuito", "diário", "cota"],
      },
      {
        q: "O que acontece quando atinjo o limite?",
        a: "Você verá uma mensagem informando que o limite diário foi atingido. Você pode criar uma conta (ou fazer login) para obter mais usos, ou assinar o plano Pro para uso ilimitado.",
        tags: ["limite", "bloqueado", "cota"],
      },
      {
        q: "O limite reinicia a meia-noite?",
        a: "Sim. Os limites diários reiniciam à meia-noite no horário de Brasília (UTC-3).",
        tags: ["limite", "reiniciar", "meia-noite"],
      },
      {
        q: "Qual é o tamanho máximo de arquivo?",
        a: "O limite padrão é 25 MB por arquivo na maioria das ferramentas. Ferramentas de IA (como Remover Fundo) têm limite de 15 MB. O plano Pro aumenta esses limites.",
        tags: ["tamanho", "arquivo", "máximo", "limite"],
      },
      {
        q: "O que são créditos?",
        a: "Ferramentas que usam IA ou processamento em servidor consomem créditos. O plano gratuito inclui um número limitado de créditos por dia. O plano Pro inclui um pacote mensal de créditos, com a opção de comprar créditos avulsos.",
        tags: ["créditos", "IA", "plano"],
      },
    ],
  },
  {
    id: "privacidade",
    title: "Privacidade e segurança",
    items: [
      {
        q: "A Praticca guarda meus arquivos?",
        a: "Arquivos processados localmente nunca chegam aos nossos servidores. Arquivos enviados para processamento em servidor são armazenados por no máximo 1 hora e depois apagados automaticamente. Nenhum arquivo é compartilhado com terceiros.",
        tags: ["privacidade", "arquivo", "armazenamento", "dados"],
      },
      {
        q: "Vocês vendem meus dados?",
        a: "Não. A Praticca não vende dados pessoais ou de uso a terceiros. Consulte nossa Política de Privacidade para detalhes completos.",
        tags: ["dados", "privacidade", "LGPD"],
      },
      {
        q: "A Praticca está em conformidade com a LGPD?",
        a: "Sim. A Praticca trata dados pessoais de acordo com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). Para exercer seus direitos, entre em contato pelo e-mail privacidade@praticca.com.br.",
        tags: ["LGPD", "privacidade", "dados pessoais"],
      },
      {
        q: "Minha conexão é criptografada?",
        a: "Sim. Toda comunicação entre o seu navegador e os servidores da Praticca usa HTTPS (TLS 1.2+).",
        tags: ["segurança", "HTTPS", "criptografia"],
      },
    ],
  },
  {
    id: "conta",
    title: "Conta e perfil",
    items: [
      {
        q: "Como crio uma conta?",
        a: "Clique em 'Entrar' no canto superior direito e depois em 'Criar conta'. Você pode se cadastrar com e-mail e senha ou usar o Google.",
        tags: ["conta", "cadastro", "criar conta"],
      },
      {
        q: "Esqueci minha senha. O que faço?",
        a: "Na tela de login, clique em 'Esqueci a senha'. Você receberá um e-mail com um link para redefinir sua senha em até 5 minutos. Verifique a caixa de spam se não encontrar.",
        tags: ["senha", "recuperar", "esqueci"],
      },
      {
        q: "Como altero meu nome ou e-mail?",
        a: "Acesse Minha Conta > Perfil para editar seu nome de exibição. A alteração de e-mail exige confirmação no novo endereço.",
        tags: ["perfil", "nome", "e-mail", "conta"],
      },
      {
        q: "Como excluo minha conta?",
        a: "Acesse Minha Conta > Segurança > Excluir conta. A exclusão é permanente e remove todos os seus dados. Cancelamentos de assinatura devem ser feitos antes da exclusão.",
        tags: ["excluir conta", "deletar", "dados"],
      },
    ],
  },
  {
    id: "pagamentos",
    title: "Pagamentos e assinaturas",
    items: [
      {
        q: "Quais formas de pagamento são aceitas?",
        a: "Aceitamos cartão de crédito (Visa, Mastercard, Elo, Amex) e Pix. O pagamento é processado pelo Stripe com segurança.",
        tags: ["pagamento", "cartão", "Pix", "Stripe"],
      },
      {
        q: "Posso cancelar a qualquer momento?",
        a: "Sim. Cancele quando quiser em Minha Conta > Assinatura. O acesso Pro continua até o final do período pago. Não há multa ou fidelidade.",
        tags: ["cancelar", "assinatura", "reembolso"],
      },
      {
        q: "Há reembolso?",
        a: "Oferecemos reembolso integral em até 7 dias após a cobrança, sem perguntas. Entre em contato pelo e-mail suporte@praticca.com.br com o assunto 'Reembolso'.",
        tags: ["reembolso", "devolução", "7 dias"],
      },
      {
        q: "O plano anual tem desconto?",
        a: "Sim. O plano Pro anual sai por cerca de 2 meses grátis em relação ao mensal. Veja os valores atualizados em nossa página de Preços.",
        tags: ["anual", "desconto", "plano Pro"],
      },
      {
        q: "Emitem nota fiscal?",
        a: "Sim. Nota fiscal eletrônica (NFS-e) é emitida automaticamente após cada cobrança e enviada ao e-mail da conta.",
        tags: ["nota fiscal", "NFS-e", "fatura"],
      },
      {
        q: "Tenho um cupom. Como uso?",
        a: "Na tela de checkout, insira o código do cupom no campo 'Cupom de desconto' antes de confirmar o pagamento.",
        tags: ["cupom", "desconto", "promoção"],
      },
    ],
  },
];

export default function AjudaPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      {/* Cabeçalho */}
      <header className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Central de Ajuda
        </h1>
        <p className="mt-2 text-muted">
          Respostas para as dúvidas mais comuns sobre a Praticca.
        </p>
      </header>

      {/* Busca + accordions (client component) */}
      <HelpSearch sections={HELP_SECTIONS} />

      {/* Contato */}
      <section
        id="contato"
        className="mt-12 rounded-xl border border-border bg-surface p-6"
        aria-labelledby="contato-title"
      >
        <h2 id="contato-title" className="font-display text-lg font-semibold">
          Não encontrou o que procurava?
        </h2>
        <p className="mt-2 text-sm text-muted">
          Entre em contato — respondemos em até 1 dia útil.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="mailto:suporte@praticca.com.br"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-brand-500 hover:text-brand-600 transition-colors"
          >
            suporte@praticca.com.br
          </a>
          <Link
            href="/status"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-brand-500 hover:text-brand-600 transition-colors"
          >
            Ver status do sistema
          </Link>
        </div>
      </section>

      {/* Interlinking */}
      <div className="mt-8 text-center text-sm text-muted">
        <Link href="/ferramentas" className="text-brand-500 hover:underline">
          Explorar ferramentas
        </Link>
        {" · "}
        <Link href="/precos" className="text-brand-500 hover:underline">
          Ver planos
        </Link>
        {" · "}
        <Link href="/legal/privacidade" className="text-brand-500 hover:underline">
          Política de Privacidade
        </Link>
        {" · "}
        <Link href="/legal/termos" className="text-brand-500 hover:underline">
          Termos de Uso
        </Link>
      </div>
    </main>
  );
}
