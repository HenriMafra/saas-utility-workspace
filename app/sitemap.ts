import type { MetadataRoute } from "next";
import { TOOLS, CATEGORIES } from "@/lib/tools/registry";
import { publicEnv } from "@/lib/env";

const BASE = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE}/ferramentas`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE}/precos`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const toolRoutes: MetadataRoute.Sitemap = TOOLS.filter(
    (t) => t.status !== "hidden" && t.status !== "paused",
  ).map((tool) => ({
    url: `${BASE}/ferramentas/${tool.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: tool.popular ? 0.9 : 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = (
    Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]
  ).map((slug) => ({
    url: `${BASE}/categorias/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...toolRoutes, ...categoryRoutes];
}
