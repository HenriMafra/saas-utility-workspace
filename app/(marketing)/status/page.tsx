import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Bell,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IncidentSubscribeForm } from "./IncidentSubscribeForm";

export const metadata: Metadata = {
  title: "Status do sistema — Praticca",
  description:
    "Verifique o status operacional das ferramentas da Praticca, integrações e infraestrutura. Inscreva-se para receber alertas de incidentes.",
  alternates: { canonical: "/status" },
};

// ---------- tipos e dados mock ----------

type ServiceStatus = "operational" | "degraded" | "outage" | "maintenance";

interface ServiceItem {
  name: string;
  status: ServiceStatus;
  latencyMs?: number;
}

interface IncidentItem {
  id: string;
  date: string;
  title: string;
  status: "resolved" | "monitoring" | "investigating";
  updates: { time: string; body: string }[];
}

// Status simulado — em produção viriam de um health-check endpoint ou tabela no Supabase
const SERVICES: ServiceItem[] = [
  { name: "Ferramentas no navegador (PDF, imagem)", status: "operational", latencyMs: 12 },
  { name: "API de processamento (OCR, conversão)", status: "operational", latencyMs: 134 },
  { name: "Assistente de Texto (IA)", status: "operational", latencyMs: 420 },
  { name: "Autenticação e contas", status: "operational", latencyMs: 98 },
  { name: "Armazenamento de arquivos", status: "operational", latencyMs: 55 },
  { name: "Pagamentos (Stripe)", status: "operational", latencyMs: 210 },
  { name: "Envio de e-mails", status: "operational", latencyMs: 180 },
];

const PAST_INCIDENTS: IncidentItem[] = [
  {
    id: "inc-2025-11-18",
    date: "18 nov 2025",
    title: "Lentidão na conversão de PDF para imagem",
    status: "resolved",
    updates: [
      {
        time: "14:32",
        body: "Identificado gargalo no worker de conversão. Escalando instâncias.",
      },
      { time: "15:10", body: "Capacidade restaurada. Monitorando." },
      { time: "15:45", body: "Incidente resolvido. Conversões voltando ao normal." },
    ],
  },
  {
    id: "inc-2025-10-03",
    date: "3 out 2025",
    title: "Manutenção programada no banco de dados",
    status: "resolved",
    updates: [
      {
        time: "02:00",
        body: "Início da janela de manutenção. Serviços de conta temporariamente indisponíveis.",
      },
      { time: "03:15", body: "Manutenção concluída com sucesso." },
    ],
  },
];

// ---------- helpers de UI ----------

const STATUS_CONFIG: Record<
  ServiceStatus,
  { label: string; icon: React.ReactNode; badgeVariant: "success" | "warning" | "danger" | "neutral" }
> = {
  operational: {
    label: "Operacional",
    icon: <CheckCircle2 className="h-4 w-4 text-success-700" aria-hidden />,
    badgeVariant: "success",
  },
  degraded: {
    label: "Degradado",
    icon: <AlertTriangle className="h-4 w-4 text-warning-500" aria-hidden />,
    badgeVariant: "warning",
  },
  outage: {
    label: "Fora do ar",
    icon: <XCircle className="h-4 w-4 text-danger-500" aria-hidden />,
    badgeVariant: "danger",
  },
  maintenance: {
    label: "Manutenção",
    icon: <Clock className="h-4 w-4 text-muted" aria-hidden />,
    badgeVariant: "neutral",
  },
};

const INCIDENT_STATUS_LABEL: Record<IncidentItem["status"], string> = {
  resolved: "Resolvido",
  monitoring: "Monitorando",
  investigating: "Investigando",
};

const INCIDENT_BADGE: Record<IncidentItem["status"], "success" | "warning" | "danger"> = {
  resolved: "success",
  monitoring: "warning",
  investigating: "danger",
};

// ---------- componente principal ----------

export default function StatusPage() {
  const hasIssues = SERVICES.some((s) => s.status !== "operational");
  const activeIncidents = PAST_INCIDENTS.filter((i) => i.status !== "resolved");

  return (
    <main className="mx-auto max-w-content px-4 py-12">
      {/* Cabeçalho */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Status do sistema
        </h1>
        <p className="mt-2 text-muted">
          Situação atual das ferramentas e integrações da Praticca.
        </p>
      </div>

      {/* Banner geral */}
      <div
        role="status"
        aria-live="polite"
        className={`mb-8 flex items-center gap-3 rounded-xl border p-4 ${
          hasIssues
            ? "border-warning-500 bg-warning-50 dark:bg-warning-900/20"
            : "border-success-500 bg-success-50 dark:bg-success-900/20"
        }`}
      >
        {hasIssues ? (
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning-500" aria-hidden />
        ) : (
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success-700" aria-hidden />
        )}
        <p className="font-medium">
          {hasIssues
            ? "Alguns serviços apresentam instabilidades. Estamos trabalhando para resolver."
            : "Todos os sistemas operacionais."}
        </p>
      </div>

      {/* Incidentes ativos */}
      {activeIncidents.length > 0 && (
        <section className="mb-10" aria-labelledby="active-incidents-title">
          <h2 id="active-incidents-title" className="mb-4 font-display text-xl font-semibold">
            Incidentes ativos
          </h2>
          <div className="space-y-4">
            {activeIncidents.map((inc) => (
              <Card key={inc.id}>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-base">{inc.title}</CardTitle>
                  <Badge variant={INCIDENT_BADGE[inc.status]}>
                    {INCIDENT_STATUS_LABEL[inc.status]}
                  </Badge>
                </div>
                <ul className="mt-4 space-y-2 border-l-2 border-border pl-4 text-sm text-muted">
                  {inc.updates.map((u, i) => (
                    <li key={i}>
                      <span className="font-medium text-fg">{u.time}</span> — {u.body}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Status por serviço */}
      <section aria-labelledby="services-title">
        <h2 id="services-title" className="mb-4 font-display text-xl font-semibold">
          Serviços
        </h2>
        <Card className="p-0 overflow-hidden">
          <ul role="list" className="divide-y divide-border">
            {SERVICES.map((svc) => {
              const cfg = STATUS_CONFIG[svc.status];
              return (
                <li
                  key={svc.name}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    {cfg.icon}
                    <span className="text-sm font-medium">{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {svc.latencyMs !== undefined && (
                      <span className="hidden text-xs text-muted sm:block">
                        {svc.latencyMs} ms
                      </span>
                    )}
                    <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      {/* Histórico de incidentes */}
      <section className="mt-12" aria-labelledby="history-title">
        <h2 id="history-title" className="mb-4 font-display text-xl font-semibold">
          Histórico de incidentes
        </h2>
        {PAST_INCIDENTS.length === 0 ? (
          <p className="text-sm text-muted">Nenhum incidente registrado nos últimos 90 dias.</p>
        ) : (
          <div className="space-y-4">
            {PAST_INCIDENTS.map((inc) => (
              <Card key={inc.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted">{inc.date}</p>
                    <CardTitle className="mt-1 text-base">{inc.title}</CardTitle>
                  </div>
                  <Badge variant={INCIDENT_BADGE[inc.status]}>
                    {INCIDENT_STATUS_LABEL[inc.status]}
                  </Badge>
                </div>
                <ul className="mt-4 space-y-2 border-l-2 border-border pl-4 text-sm text-muted">
                  {inc.updates.map((u, i) => (
                    <li key={i}>
                      <span className="font-medium text-fg">{u.time}</span> — {u.body}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Assinar alertas */}
      <section
        className="mt-12 rounded-2xl border border-border bg-surface p-8"
        aria-labelledby="subscribe-title"
      >
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-500" aria-hidden />
          <div className="flex-1">
            <h2 id="subscribe-title" className="font-display text-lg font-semibold">
              Receber alertas de incidentes
            </h2>
            <p className="mt-1 text-sm text-muted">
              Digite seu e-mail para ser notificado quando houver um incidente ou resolução.
            </p>
            <div className="mt-4">
              <IncidentSubscribeForm />
            </div>
          </div>
        </div>
      </section>

      {/* Interlinking */}
      <div className="mt-10 text-center text-sm text-muted">
        Algum problema com uma ferramenta específica?{" "}
        <Link href="/ajuda" className="text-brand-500 hover:underline">
          Veja a Central de Ajuda
        </Link>{" "}
        ou{" "}
        <Link href="/ajuda#contato" className="text-brand-500 hover:underline">
          fale conosco
        </Link>
        .
      </div>
    </main>
  );
}
