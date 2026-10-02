export interface HistoricoRun {
  id: string;
  tool_slug: string;
  status: string;
  options: Record<string, unknown> | null;
  credits_spent: number;
  created_at: string;
  expires_at: string | null;
}

export interface GeneratedFile {
  id: string;
  storage_path: string;
  size_bytes: number;
  mime: string;
  expires_at: string | null;
}
