import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SAMPLE_POSTS, type BlogPost } from "@/lib/blog/sample-posts";
import { formatDateBR } from "@/lib/utils";

// ---------- data helpers ----------

async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, title, excerpt, body, cluster, keyword, published, published_at")
      .eq("published", true);
    if (error || !data || data.length === 0) return SAMPLE_POSTS;
    return data as BlogPost[];
  } catch {
    return SAMPLE_POSTS;
  }
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, title, excerpt, body, cluster, keyword, published, published_at")
      .eq("slug", slug)
      .eq("published", true)
      .single();
    if (!error && data) return data as BlogPost;
  } catch {
    // fallthrough to sample
  }
  return SAMPLE_POSTS.find((p) => p.slug === slug) ?? null;
}

// ---------- static params ----------

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

// ---------- metadata ----------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Artigo não encontrado — Praticca" };

  const baseUrl = "https://praticca.com.br";
  const canonicalUrl = `${baseUrl}/blog/${slug}`;

  return {
    title: `${post.title} | Blog Praticca`,
    description: post.excerpt,
    keywords: post.keyword ? [post.keyword] : undefined,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: canonicalUrl,
      publishedTime: post.published_at,
    },
  };
}

// ---------- page ----------

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const allPosts = await getAllPosts();
  const related = allPosts
    .filter((p) => p.slug !== slug && p.cluster === post.cluster)
    .slice(0, 3);

  const baseUrl = "https://praticca.com.br";
  const canonicalUrl = `${baseUrl}/blog/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    url: canonicalUrl,
    publisher: {
      "@type": "Organization",
      name: "Praticca",
      url: baseUrl,
    },
    author: {
      "@type": "Organization",
      name: "Praticca",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto max-w-3xl px-4 py-12">
        {/* Breadcrumb / back */}
        <nav aria-label="Navegação estrutural" className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand-500"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar ao blog
          </Link>
        </nav>

        <article>
          <header className="mb-8">
            {post.published_at && (
              <time
                dateTime={post.published_at}
                className="text-xs text-muted"
              >
                {formatDateBR(post.published_at).split(",")[0]}
              </time>
            )}
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-3 text-lg text-muted leading-relaxed">{post.excerpt}</p>
            )}
          </header>

          {/* Corpo do post: renderizado como markdown simples (paragrafos, h2, listas, negrito) */}
          <div className="prose prose-neutral max-w-none dark:prose-invert">
            {post.body
              ? renderBody(post.body)
              : <p className="text-muted">Conteúdo não disponível.</p>}
          </div>
        </article>

        {/* Artigos relacionados */}
        {related.length > 0 && (
          <section className="mt-14" aria-labelledby="related-title">
            <h2 id="related-title" className="font-display text-xl font-semibold">
              Artigos relacionados
            </h2>
            <ul className="mt-4 space-y-3" role="list">
              {related.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="text-brand-500 hover:underline"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA */}
        <div className="mt-14 rounded-xl border border-border bg-surface p-6 text-center">
          <p className="text-sm text-muted">
            Pronto para colocar em prática?{" "}
            <Link href="/ferramentas" className="text-brand-500 hover:underline">
              Explore as ferramentas gratuitas
            </Link>{" "}
            da Praticca — sem cadastro.
          </p>
        </div>
      </main>
    </>
  );
}

// ---------- renderizador de markdown simples ----------

function renderBody(body: string) {
  const lines = body.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  let inList = false;
  let listItems: React.ReactNode[] = [];

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key++}`} className="my-4 list-disc pl-6 text-muted space-y-1 text-sm">
          {listItems}
        </ul>,
      );
      listItems = [];
      inList = false;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2
          key={key++}
          className="mt-8 mb-3 font-display text-xl font-semibold text-fg"
        >
          {parseLine(line.slice(3))}
        </h2>,
      );
    } else if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3
          key={key++}
          className="mt-6 mb-2 font-display text-base font-semibold text-fg"
        >
          {parseLine(line.slice(4))}
        </h3>,
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      inList = true;
      listItems.push(
        <li key={key++} className="leading-relaxed">
          {parseLine(line.slice(2))}
        </li>,
      );
    } else if (line.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote
          key={key++}
          className="my-4 border-l-4 border-brand-500 pl-4 text-sm italic text-muted"
        >
          {parseLine(line.slice(2))}
        </blockquote>,
      );
    } else if (line === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={key++} className="my-3 text-sm leading-relaxed text-muted">
          {parseLine(line)}
        </p>,
      );
    }
  }

  flushList();
  return <>{elements}</>;
}

function parseLine(text: string): React.ReactNode {
  // Bold (**text**) and inline code (`code`) and links ([text](href))
  const parts: React.ReactNode[] = [];
  const pattern = /\*\*(.*?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIdx = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={match.index}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(
        <code
          key={match.index}
          className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800"
        >
          {match[2]}
        </code>,
      );
    } else if (match[3] !== undefined && match[4] !== undefined) {
      const href = match[4];
      const isInternal = href.startsWith("/");
      parts.push(
        isInternal ? (
          <Link key={match.index} href={href} className="text-brand-500 hover:underline">
            {match[3]}
          </Link>
        ) : (
          <a
            key={match.index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-500 hover:underline"
          >
            {match[3]}
          </a>
        ),
      );
    }
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}
