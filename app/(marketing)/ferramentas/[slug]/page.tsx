import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TOOLS, getTool } from "@/lib/tools/registry";
import { ToolLayout } from "@/components/tools/ToolLayout";
import { ToolRunnerClient } from "@/components/tools/ToolRunnerClient";
import { publicEnv } from "@/lib/env";

// generateStaticParams pré-renderiza os 15 slugs (Vercel/Node). Mantemos
// dynamicParams habilitado (padrão) para permitir render on-demand no Cloudflare
// (OpenNext) — slugs desconhecidos caem em notFound() via getTool().
export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  return {
    title: tool.seo.title,
    description: tool.seo.description,
    alternates: { canonical: `/ferramentas/${tool.slug}` },
    openGraph: { title: tool.seo.title, description: tool.seo.description },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();
  const base = publicEnv.NEXT_PUBLIC_APP_URL;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `${tool.name} - Praticca`,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: tool.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ferramentas", item: `${base}/ferramentas` },
        { "@type": "ListItem", position: 2, name: tool.name, item: `${base}/ferramentas/${tool.slug}` },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolLayout tool={tool}>
        <ToolRunnerClient slug={slug} />
      </ToolLayout>
    </>
  );
}
