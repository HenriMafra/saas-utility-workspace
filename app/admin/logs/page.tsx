import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import type { AdminLogEntry } from "@/components/admin/AdminLogTable";
import { LogsClient } from "./LogsClient";

export const metadata = { title: "Logs do Sistema — Admin" };
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const LEVEL_OPTIONS = ["all", "info", "debug", "warning", "error"] as const;
type LevelOption = (typeof LEVEL_OPTIONS)[number];

async function fetchLogs(
  level: LevelOption,
  category: string,
  from: string,
  to: string,
): Promise<AdminLogEntry[]> {
  const admin = createAdminClient();

  let q = admin
    .from("error_logs")
    .select(
      "id, level, category, message, friendly_message, recommended_action, detail, created_at, resolved, entity_id, entity_type",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (level && level !== "all") {
    q = q.eq("level", level);
  }

  if (category.trim()) {
    q = q.ilike("category", `%${category.trim()}%`);
  }

  if (from) {
    q = q.gte("created_at", new Date(from).toISOString());
  }

  if (to) {
    // Add 1 day so "to" is inclusive
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1);
    q = q.lt("created_at", toDate.toISOString());
  }

  const { data, error } = await q;
  if (error) return [];
  return (data as AdminLogEntry[]) ?? [];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    level?: string;
    category?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/logs");

  const { level = "all", category = "", from = "", to = "" } = await searchParams;

  const safeLevel = (LEVEL_OPTIONS as readonly string[]).includes(level)
    ? (level as LevelOption)
    : "all";

  const logs = await fetchLogs(safeLevel, category, from, to);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-fg">Logs do Sistema</h1>
        <p className="mt-1 text-sm text-muted">
          Registros de erros e eventos internos. Use os filtros para depurar problemas.
        </p>
      </div>

      <Suspense fallback={<LogsSkeleton />}>
        <LogsClient
          logs={logs}
          initialLevel={safeLevel}
          initialCategory={category}
          initialFrom={from}
          initialTo={to}
        />
      </Suspense>
    </div>
  );
}

function LogsSkeleton() {
  return (
    <Card className="animate-pulse p-4">
      <div className="mb-4 flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-32 rounded-lg bg-surface" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-surface" />
        ))}
      </div>
    </Card>
  );
}
