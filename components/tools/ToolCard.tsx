import Link from "next/link";
import { FileText, Image as ImageIcon, Type, Briefcase, Calculator, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ToolDef, ToolCategory } from "@/lib/tools/registry";

const ICON: Record<ToolCategory, typeof FileText> = {
  pdf: FileText,
  imagem: ImageIcon,
  texto: Type,
  negocios: Briefcase,
  calculo: Calculator,
  validacao: ShieldCheck,
};

export function ToolCard({ tool }: { tool: ToolDef }) {
  const Icon = ICON[tool.category];
  return (
    <Link href={`/ferramentas/${tool.slug}`} className="group block">
      <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
        <div className="flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/40">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="flex gap-1">
            {tool.isNew && <Badge variant="brand">Novo</Badge>}
            {tool.isPremium && <Badge variant="warning">Pro</Badge>}
          </div>
        </div>
        <p className="mt-4 font-medium text-fg">{tool.name}</p>
        <p className="mt-1 text-sm text-muted">{tool.shortDescription}</p>
      </Card>
    </Link>
  );
}
