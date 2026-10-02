import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

const BASE = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/conta/",
          "/dashboard/",
          "/historico/",
          "/favoritos/",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
