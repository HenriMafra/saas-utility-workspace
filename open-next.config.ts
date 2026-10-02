import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import incrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Serve as páginas pré-renderizadas (SSG: ferramentas, categorias, blog) a partir
// dos static assets do Worker — sem precisar provisionar R2/KV. Adequado porque
// essas páginas são SSG puras (sem revalidação). Para ISR no futuro, troque por
// r2-incremental-cache + binding NEXT_INC_CACHE_R2_BUCKET.
export default defineCloudflareConfig({
  incrementalCache,
});
