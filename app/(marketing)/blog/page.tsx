import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SAMPLE_POSTS, type BlogPost } from "@/lib/blog/sample-posts";
import { formatDateBR } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Blog — Praticca",
  description:
    "Dicas práticas sobre PDF, imagens, documentos e produtividade. Aprenda a usar as ferramentas da Praticca e economize tempo no dia a dia.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog — Praticca",
    description: "Dicas sobre PDF, imagens e produtividade.",
    type: "website",
    url: "/blog",
  },
};

const CLUSTER_LABEL: Record<string, string> = {
  pdf: "PDF",
  imagem: "Imagem",
  texto: "Texto",
  negocios: "Negócios",
  calculo: "Cálculo",
  validacao: "Validação",
};

async function getPosts(): Promise<BlogPost[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, title, excerpt, cluster, keyword, published, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) return SAMPLE_POSTS;
    return data as BlogPost[];
  } catch {
    return SAMPLE_POSTS;
  }
}

export default async function BlogListPage() {
  const posts = await getPosts();

  return (
    <main className="mx-auto max-w-content px-4 py-12">
      <header className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">Blog</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Dicas sobre PDF, imagens, documentos e produtividade — para quem quer resolver mais em
          menos tempo.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-muted">Nenhum artigo publicado ainda. Volte em breve!</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block"
              aria-label={`Ler artigo: ${post.title}`}
            >
              <Card className="flex h-full flex-col transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <div className="flex items-center justify-between gap-2">
                  {post.cluster && (
                    <Badge variant="neutral">
                      {CLUSTER_LABEL[post.cluster] ?? post.cluster}
                    </Badge>
                  )}
                  {post.published_at && (
                    <time
                      dateTime={post.published_at}
                      className="text-xs text-muted"
                    >
                      {formatDateBR(post.published_at).split(",")[0]}
                    </time>
                  )}
                </div>
                <h2 className="mt-3 font-display text-base font-semibold leading-snug text-fg group-hover:text-brand-600">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 flex-1 text-sm text-muted line-clamp-3">
                    {post.excerpt}
                  </p>
                )}
                <span className="mt-4 text-sm font-medium text-brand-500">
                  Ler artigo →
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Interlinking */}
      <div className="mt-12 rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-sm text-muted">
          Pronto para colocar em prática?{" "}
          <Link href="/ferramentas" className="text-brand-500 hover:underline">
            Acesse as ferramentas gratuitas
          </Link>{" "}
          da Praticca.
        </p>
      </div>
    </main>
  );
}
