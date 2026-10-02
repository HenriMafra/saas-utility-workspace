/**
 * Single source of truth for the 15 tools.
 * Used by: catalog, tool pages, SEO, admin, usage limits, analytics.
 */

export type ToolCategory =
  | "pdf"
  | "imagem"
  | "texto"
  | "negocios"
  | "calculo"
  | "validacao";

export type ProcessingMode = "client" | "server" | "hybrid";

export interface ToolDef {
  slug: string;
  name: string;
  shortDescription: string;
  category: ToolCategory;
  processingMode: ProcessingMode;
  isPremium: boolean;
  usesAI: boolean;
  usesOCR: boolean;
  creditCost: number; // credits per execution (0 = free/client-side)
  accept: string[]; // MIME types ([] = no file upload)
  maxSizeMB: number; // free tier cap
  limits: { anonPerDay: number; freePerDay: number };
  status: "active" | "beta" | "paused" | "hidden";
  popular?: boolean;
  isNew?: boolean;
  seo: { title: string; description: string; h1: string; keywords: string[] };
  faq: { q: string; a: string }[];
  relatedSlugs: string[];
}

export const CATEGORIES: Record<ToolCategory, { name: string; description: string }> = {
  pdf: { name: "PDF", description: "Comprima, junte, divida e converta arquivos PDF." },
  imagem: { name: "Imagem", description: "Comprima, redimensione e edite imagens." },
  texto: { name: "Texto", description: "Extraia e trabalhe com texto." },
  negocios: { name: "Negócios", description: "Documentos e modelos para o seu trabalho." },
  calculo: { name: "Cálculo", description: "Calculadoras e conversores do dia a dia." },
  validacao: { name: "Validação", description: "Valide e gere dados e códigos." },
};

const baseFaq = [
  { q: "É grátis?", a: "Sim, com limite diário. Os planos pagos liberam uso ilimitado e recursos extras." },
  { q: "Meus arquivos ficam salvos?", a: "Não. A maioria das ferramentas processa tudo no seu navegador e nada é enviado para nossos servidores." },
  { q: "Funciona no celular?", a: "Sim. A Praticca funciona em qualquer navegador moderno, no computador ou no celular." },
];

export const TOOLS: ToolDef[] = [
  {
    slug: "comprimir-pdf",
    name: "Comprimir PDF",
    shortDescription: "Reduza o tamanho de PDFs sem perder qualidade.",
    category: "pdf",
    processingMode: "client",
    isPremium: false,
    usesAI: false,
    usesOCR: false,
    creditCost: 0,
    accept: ["application/pdf"],
    maxSizeMB: 25,
    limits: { anonPerDay: 3, freePerDay: 5 },
    status: "active",
    popular: true,
    seo: {
      title: "Comprimir PDF Online Grátis e Rápido | Praticca",
      description:
        "Reduza o tamanho do seu PDF em segundos, grátis e sem instalar. Processado no seu navegador — seus arquivos não saem do dispositivo.",
      h1: "Comprimir PDF online — grátis e privado",
      keywords: ["comprimir pdf", "reduzir tamanho pdf", "diminuir pdf"],
    },
    faq: baseFaq,
    relatedSlugs: ["juntar-pdf", "dividir-pdf", "assinar-pdf"],
  },
  {
    slug: "juntar-pdf",
    name: "Juntar PDF",
    shortDescription: "Combine vários PDFs em um único arquivo, na ordem que quiser.",
    category: "pdf",
    processingMode: "client",
    isPremium: false,
    usesAI: false,
    usesOCR: false,
    creditCost: 0,
    accept: ["application/pdf"],
    maxSizeMB: 25,
    limits: { anonPerDay: 3, freePerDay: 10 },
    status: "active",
    popular: true,
    seo: {
      title: "Juntar PDF Online Grátis — Unir Vários PDFs | Praticca",
      description:
        "Una vários arquivos PDF em um só, na ordem que quiser, direto no navegador. Grátis, rápido e privado.",
      h1: "Juntar PDF online — una vários arquivos em um",
      keywords: ["juntar pdf", "unir pdf", "combinar pdf"],
    },
    faq: baseFaq,
    relatedSlugs: ["comprimir-pdf", "dividir-pdf", "criar-pdf"],
  },
  {
    slug: "dividir-pdf",
    name: "Dividir PDF",
    shortDescription: "Separe páginas ou extraia intervalos de um PDF.",
    category: "pdf",
    processingMode: "client",
    isPremium: false,
    usesAI: false,
    usesOCR: false,
    creditCost: 0,
    accept: ["application/pdf"],
    maxSizeMB: 25,
    limits: { anonPerDay: 3, freePerDay: 10 },
    status: "active",
    seo: {
      title: "Dividir PDF Online Grátis — Separar Páginas | Praticca",
      description:
        "Divida um PDF em páginas separadas ou extraia intervalos específicos, grátis e no seu navegador.",
      h1: "Dividir PDF online — separe páginas em segundos",
      keywords: ["dividir pdf", "separar pdf", "extrair páginas pdf"],
    },
    faq: baseFaq,
    relatedSlugs: ["juntar-pdf", "comprimir-pdf"],
  },
  {
    slug: "converter-pdf",
    name: "Converter PDF",
    shortDescription: "Converta PDF para imagens (JPG/PNG) e vice-versa.",
    category: "pdf",
    processingMode: "hybrid",
    isPremium: false,
    usesAI: false,
    usesOCR: false,
    creditCost: 1,
    accept: ["application/pdf", "image/jpeg", "image/png"],
    maxSizeMB: 25,
    limits: { anonPerDay: 2, freePerDay: 5 },
    status: "active",
    seo: {
      title: "Converter PDF Online — PDF para JPG e JPG para PDF | Praticca",
      description:
        "Converta PDF em imagens ou imagens em PDF rapidamente. Conversões básicas no navegador, grátis.",
      h1: "Converter PDF — para imagem e de imagem",
      keywords: ["converter pdf", "pdf para jpg", "jpg para pdf"],
    },
    faq: baseFaq,
    relatedSlugs: ["comprimir-pdf", "criar-pdf"],
  },
  {
    slug: "criar-pdf",
    name: "Criar PDF",
    shortDescription: "Monte um PDF a partir de imagens ou texto.",
    category: "pdf",
    processingMode: "client",
    isPremium: false,
    usesAI: false,
    usesOCR: false,
    creditCost: 0,
    accept: ["image/jpeg", "image/png", "image/webp"],
    maxSizeMB: 25,
    limits: { anonPerDay: 3, freePerDay: 10 },
    status: "active",
    seo: {
      title: "Criar PDF Online Grátis — Imagens para PDF | Praticca",
      description:
        "Junte fotos e imagens em um PDF organizado, direto no navegador. Grátis e privado.",
      h1: "Criar PDF — transforme imagens em um PDF",
      keywords: ["criar pdf", "imagem para pdf", "fotos em pdf"],
    },
    faq: baseFaq,
    relatedSlugs: ["juntar-pdf", "comprimir-pdf"],
  },
  {
    slug: "assinar-pdf",
    name: "Assinar PDF",
    shortDescription: "Adicione sua assinatura a um PDF sem imprimir.",
    category: "pdf",
    processingMode: "client",
    isPremium: false,
    usesAI: false,
    usesOCR: false,
    creditCost: 0,
    accept: ["application/pdf"],
    maxSizeMB: 25,
    limits: { anonPerDay: 2, freePerDay: 5 },
    status: "active",
    seo: {
      title: "Assinar PDF Online Grátis — Assinatura sem Imprimir | Praticca",
      description:
        "Assine documentos PDF desenhando ou enviando sua assinatura, direto no navegador. Sem impressora.",
      h1: "Assinar PDF online — sem imprimir nem escanear",
      keywords: ["assinar pdf", "assinatura pdf", "assinar documento online"],
    },
    faq: baseFaq,
    relatedSlugs: ["juntar-pdf", "comprimir-pdf"],
  },
  {
    slug: "comprimir-imagem",
    name: "Comprimir Imagem",
    shortDescription: "Reduza o peso de fotos JPG, PNG e WebP.",
    category: "imagem",
    processingMode: "client",
    isPremium: false,
    usesAI: false,
    usesOCR: false,
    creditCost: 0,
    accept: ["image/jpeg", "image/png", "image/webp"],
    maxSizeMB: 25,
    limits: { anonPerDay: 5, freePerDay: 20 },
    status: "active",
    popular: true,
    seo: {
      title: "Comprimir Imagem Online Grátis — JPG, PNG, WebP | Praticca",
      description:
        "Reduza o tamanho das suas fotos sem perder qualidade visível, direto no navegador. Grátis e privado.",
      h1: "Comprimir imagem online — grátis e rápido",
      keywords: ["comprimir imagem", "reduzir tamanho foto", "comprimir jpg"],
    },
    faq: baseFaq,
    relatedSlugs: ["redimensionar-imagem", "remover-fundo", "criar-pdf"],
  },
  {
    slug: "redimensionar-imagem",
    name: "Redimensionar Imagem",
    shortDescription: "Mude as dimensões ou o formato de uma imagem.",
    category: "imagem",
    processingMode: "client",
    isPremium: false,
    usesAI: false,
    usesOCR: false,
    creditCost: 0,
    accept: ["image/jpeg", "image/png", "image/webp"],
    maxSizeMB: 25,
    limits: { anonPerDay: 5, freePerDay: 20 },
    status: "active",
    seo: {
      title: "Redimensionar Imagem Online Grátis — Mudar Tamanho | Praticca",
      description:
        "Altere largura, altura e formato (JPG/PNG/WebP) das suas imagens com presets para redes sociais.",
      h1: "Redimensionar imagem online — tamanho e formato",
      keywords: ["redimensionar imagem", "mudar tamanho imagem", "converter imagem"],
    },
    faq: baseFaq,
    relatedSlugs: ["comprimir-imagem", "remover-fundo"],
  },
  {
    slug: "remover-fundo",
    name: "Remover Fundo",
    shortDescription: "Remova o fundo de uma imagem automaticamente.",
    category: "imagem",
    processingMode: "client",
    isPremium: false,
    usesAI: true,
    usesOCR: false,
    creditCost: 1,
    accept: ["image/jpeg", "image/png", "image/webp"],
    maxSizeMB: 15,
    limits: { anonPerDay: 1, freePerDay: 3 },
    status: "active",
    isNew: true,
    seo: {
      title: "Remover Fundo de Imagem Online Grátis | Praticca",
      description:
        "Deixe o fundo da sua foto transparente automaticamente, com IA que roda no seu navegador. Grátis.",
      h1: "Remover fundo de imagem — automático e grátis",
      keywords: ["remover fundo", "tirar fundo de imagem", "fundo transparente"],
    },
    faq: baseFaq,
    relatedSlugs: ["redimensionar-imagem", "comprimir-imagem", "criar-pdf"],
  },
  {
    slug: "ocr",
    name: "OCR — Extrair Texto",
    shortDescription: "Extraia o texto de imagens e PDFs escaneados.",
    category: "texto",
    processingMode: "hybrid",
    isPremium: false,
    usesAI: false,
    usesOCR: true,
    creditCost: 0,
    accept: ["image/jpeg", "image/png", "application/pdf"],
    maxSizeMB: 15,
    limits: { anonPerDay: 2, freePerDay: 5 },
    status: "active",
    seo: {
      title: "OCR Online Grátis — Extrair Texto de Imagem e PDF | Praticca",
      description:
        "Converta imagens e PDFs escaneados em texto editável (PT-BR), direto no navegador. Grátis.",
      h1: "OCR online — extraia texto de imagens e PDFs",
      keywords: ["ocr online", "extrair texto de imagem", "pdf escaneado para texto"],
    },
    faq: baseFaq,
    relatedSlugs: ["assistente-de-texto", "converter-pdf"],
  },
  {
    slug: "gerador-de-documentos",
    name: "Gerador de Documentos",
    shortDescription: "Crie contratos, recibos e declarações a partir de modelos.",
    category: "negocios",
    processingMode: "client",
    isPremium: false,
    usesAI: false,
    usesOCR: false,
    creditCost: 0,
    accept: [],
    maxSizeMB: 0,
    limits: { anonPerDay: 2, freePerDay: 5 },
    status: "active",
    seo: {
      title: "Gerador de Documentos Online — Contrato, Recibo, Declaração | Praticca",
      description:
        "Preencha modelos prontos de contrato, recibo e declaração e baixe em PDF. Modelos não substituem orientação jurídica.",
      h1: "Gerador de documentos — modelos prontos em PDF",
      keywords: ["gerar contrato simples", "modelo de recibo", "modelo de declaração"],
    },
    faq: baseFaq,
    relatedSlugs: ["gerador-de-curriculo", "assinar-pdf"],
  },
  {
    slug: "gerador-de-curriculo",
    name: "Gerador de Currículo",
    shortDescription: "Monte um currículo bonito e baixe em PDF.",
    category: "negocios",
    processingMode: "client",
    isPremium: false,
    usesAI: false,
    usesOCR: false,
    creditCost: 0,
    accept: [],
    maxSizeMB: 0,
    limits: { anonPerDay: 2, freePerDay: 5 },
    status: "active",
    seo: {
      title: "Gerador de Currículo Online Grátis — Modelo em PDF | Praticca",
      description:
        "Crie um currículo profissional preenchendo um formulário e baixe em PDF. Grátis e sem cadastro.",
      h1: "Gerador de currículo — pronto em minutos",
      keywords: ["gerador de currículo", "criar currículo online", "modelo de currículo"],
    },
    faq: baseFaq,
    relatedSlugs: ["gerador-de-documentos", "criar-pdf"],
  },
  {
    slug: "calculadoras",
    name: "Calculadoras e Conversores",
    shortDescription: "Porcentagem, regra de três, conversão de unidades e mais.",
    category: "calculo",
    processingMode: "client",
    isPremium: false,
    usesAI: false,
    usesOCR: false,
    creditCost: 0,
    accept: [],
    maxSizeMB: 0,
    limits: { anonPerDay: 9999, freePerDay: 9999 },
    status: "active",
    seo: {
      title: "Calculadoras e Conversores Online Grátis | Praticca",
      description:
        "Calculadora de porcentagem, regra de três, IMC, conversão de unidades e mais — tudo grátis e rápido.",
      h1: "Calculadoras e conversores online",
      keywords: ["calculadora de porcentagem", "regra de três", "conversor de unidades"],
    },
    faq: baseFaq,
    relatedSlugs: ["validador-gerador"],
  },
  {
    slug: "validador-gerador",
    name: "Validador e Gerador",
    shortDescription: "Valide CPF/CNPJ e gere QR Code e dados de teste.",
    category: "validacao",
    processingMode: "client",
    isPremium: false,
    usesAI: false,
    usesOCR: false,
    creditCost: 0,
    accept: [],
    maxSizeMB: 0,
    limits: { anonPerDay: 9999, freePerDay: 9999 },
    status: "active",
    seo: {
      title: "Gerar QR Code e Validar CPF/CNPJ Online Grátis | Praticca",
      description:
        "Gere QR Codes, valide CPF e CNPJ e crie dados de teste para desenvolvimento. Grátis e no navegador.",
      h1: "Validador e gerador — QR Code, CPF e CNPJ",
      keywords: ["gerar qr code", "validar cpf", "validar cnpj"],
    },
    faq: baseFaq,
    relatedSlugs: ["calculadoras"],
  },
  {
    slug: "assistente-de-texto",
    name: "Assistente de Texto",
    shortDescription: "Corrija, resuma e melhore textos com IA.",
    category: "texto",
    processingMode: "server",
    isPremium: true,
    usesAI: true,
    usesOCR: false,
    creditCost: 2,
    accept: [],
    maxSizeMB: 0,
    limits: { anonPerDay: 1, freePerDay: 3 },
    status: "beta",
    isNew: true,
    seo: {
      title: "Assistente de Texto com IA — Corrigir e Resumir | Praticca",
      description:
        "Corrija a gramática, resuma e melhore seus textos com inteligência artificial. Rápido e em português.",
      h1: "Assistente de texto com IA",
      keywords: ["corretor de texto online", "resumir texto", "melhorar texto com ia"],
    },
    faq: baseFaq,
    relatedSlugs: ["ocr", "gerador-de-documentos"],
  },
];

export const TOOLS_BY_SLUG: Record<string, ToolDef> = Object.fromEntries(
  TOOLS.map((t) => [t.slug, t]),
);

export function getTool(slug: string): ToolDef | undefined {
  return TOOLS_BY_SLUG[slug];
}

export function getToolsByCategory(category: ToolCategory): ToolDef[] {
  return TOOLS.filter((t) => t.category === category && t.status !== "hidden");
}

export const POPULAR_TOOLS = TOOLS.filter((t) => t.popular);
