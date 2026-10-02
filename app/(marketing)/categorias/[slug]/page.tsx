import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  CATEGORIES,
  TOOLS,
  type ToolCategory,
} from "@/lib/tools/registry";
import { ToolCard } from "@/components/tools/ToolCard";

// ---------- static params ----------

export function generateStaticParams() {
  return Object.keys(CATEGORIES).map((slug) => ({ slug }));
}

// ---------- metadata ----------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = CATEGORIES[slug as ToolCategory];
  if (!cat) return { title: "Categoria não encontrada — Praticca" };

  const baseUrl = "https://praticca.com.br";
  const canonicalUrl = `${baseUrl}/categorias/${slug}`;

  return {
    title: `Ferramentas de ${cat.name} Online Grátis | Praticca`,
    description: `${cat.description} Rápido, privado e gratuito. Experimente agora sem cadastro.`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `Ferramentas de ${cat.name} | Praticca`,
      description: cat.description,
      url: canonicalUrl,
      type: "website",
    },
  };
}

// ---------- texto SEO por categoria ----------

const SEO_TEXT: Record<ToolCategory, { intro: string; benefits: string[]; closing: string }> = {
  pdf: {
    intro:
      "PDFs estão em todo lugar — contratos, notas fiscais, relatórios, currículos. As ferramentas de PDF da Praticca foram criadas para resolver os problemas mais comuns sem instalar nada e sem enviar seus arquivos para servidores de terceiros.",
    benefits: [
      "Compressão e organização de PDFs diretamente no seu navegador.",
      "Sem limite de dispositivo — funciona no computador e no celular.",
      "Arquivos processados localmente: seus documentos não saem do seu dispositivo.",
      "Gratuito com limite diário generoso; plano Pro para uso intensivo.",
    ],
    closing:
      "Escolha a ferramenta abaixo e resolva agora mesmo — sem cadastro para começar.",
  },
  imagem: {
    intro:
      "Comprimir, redimensionar ou remover o fundo de imagens são tarefas do dia a dia para quem trabalha com conteúdo, e-commerce, redes sociais ou apresentações. Faça tudo no navegador, com privacidade total.",
    benefits: [
      "Suporte a JPG, PNG e WebP em todas as ferramentas.",
      "Presets para redes sociais e e-commerce pré-configurados.",
      "Remoção de fundo com IA — sem enviar a foto para servidores externos.",
      "Resultados em segundos, sem filas de processamento.",
    ],
    closing:
      "Selecione a ferramenta ideal para sua necessidade de imagem abaixo.",
  },
  texto: {
    intro:
      "Extrair texto de documentos escaneados ou melhorar a redação de um e-mail importante são tarefas que consomem tempo. As ferramentas de texto da Praticca automatizam essas etapas para você focar no que importa.",
    benefits: [
      "OCR em português com suporte a imagens e PDFs escaneados.",
      "Assistente de IA para correção, resumo e melhoria de textos.",
      "Privacidade por padrão — textos e imagens processados localmente sempre que possível.",
      "Resultados editáveis e exportáveis em segundos.",
    ],
    closing:
      "Escolha a ferramenta de texto adequada ao seu caso abaixo.",
  },
  negocios: {
    intro:
      "Gerar um contrato simples, criar um recibo ou montar um currículo são tarefas rotineiras que podem tomar horas se feitas do zero. A Praticca oferece modelos prontos, editáveis e exportáveis em PDF.",
    benefits: [
      "Modelos de contrato, recibo e declaração pré-formatados.",
      "Gerador de currículo com layout profissional em PDF.",
      "Dados preenchidos localmente — nenhuma informação sensível sai do dispositivo.",
      "Gratuito e sem necessidade de conta para criar o primeiro documento.",
    ],
    closing:
      "Comece por uma das ferramentas de negócios abaixo.",
  },
  calculo: {
    intro:
      "Calcular porcentagem, converter unidades ou montar uma regra de três são necessidades frequentes no trabalho e no dia a dia. Faça tudo em segundos com as calculadoras online da Praticca.",
    benefits: [
      "Calculadora de porcentagem, IMC, desconto e muito mais.",
      "Conversores de unidades de comprimento, peso, temperatura e moeda.",
      "Interface simples, sem anúncios ou distrações.",
      "Cálculos 100% no navegador — sem latência de servidor.",
    ],
    closing:
      "Acesse a calculadora ou conversor que você precisa agora.",
  },
  validacao: {
    intro:
      "Validar CPF, CNPJ ou gerar um QR Code são operações técnicas que ninguém deveria precisar programar do zero. As ferramentas de validação da Praticca resolvem isso em um clique.",
    benefits: [
      "Validação de CPF e CNPJ com explicação do algoritmo de dígito verificador.",
      "Gerador de QR Code personalizável para links, textos e contatos.",
      "Geração de dados de teste para CPF/CNPJ — ideal para ambientes de homologação.",
      "Sem envio de dados sensíveis — tudo processado no navegador.",
    ],
    closing:
      "Use as ferramentas de validação abaixo de forma totalmente gratuita.",
  },
};

// ---------- page ----------

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = CATEGORIES[slug as ToolCategory];
  if (!cat) notFound();

  const tools = TOOLS.filter(
    (t) => t.category === (slug as ToolCategory) && t.status !== "hidden",
  );

  const seo = SEO_TEXT[slug as ToolCategory];
  const otherCats = Object.entries(CATEGORIES).filter(([s]) => s !== slug);

  return (
    <main className="mx-auto max-w-content px-4 py-12">
      {/* Breadcrumb */}
      <nav aria-label="Navegação estrutural" className="mb-8">
        <Link
          href="/ferramentas"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand-500"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Todas as ferramentas
        </Link>
      </nav>

      {/* Cabeçalho */}
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Ferramentas de {cat.name}
        </h1>
        <p className="mt-2 max-w-2xl text-muted">{cat.description}</p>
      </header>

      {/* Grade de ferramentas */}
      {tools.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma ferramenta disponível nesta categoria ainda.</p>
      ) : (
        <section aria-labelledby="tools-grid-title">
          <h2 id="tools-grid-title" className="sr-only">
            Ferramentas disponíveis em {cat.name}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      )}

      {/* Texto SEO */}
      <section
        className="mt-12 rounded-xl border border-border bg-surface p-6"
        aria-labelledby="seo-section-title"
      >
        <h2 id="seo-section-title" className="font-display text-xl font-semibold">
          Por que usar as ferramentas de {cat.name} da Praticca?
        </h2>
        <p className="mt-3 text-sm text-muted leading-relaxed">{seo.intro}</p>
        <ul className="mt-4 space-y-2">
          {seo.benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" aria-hidden />
              {b}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">{seo.closing}</p>
      </section>

      {/* Outras categorias */}
      <section className="mt-10" aria-labelledby="other-cats-title">
        <h2 id="other-cats-title" className="mb-3 font-display text-base font-semibold">
          Outras categorias
        </h2>
        <div className="flex flex-wrap gap-2">
          {otherCats.map(([s, c]) => (
            <Link
              key={s}
              href={`/categorias/${s}`}
              className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm hover:border-brand-500 hover:text-brand-600 transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
