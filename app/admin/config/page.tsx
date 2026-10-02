"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  AlertTriangle,
  Building2,
  HeadphonesIcon,
  Wrench,
  Save,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AppSettings {
  // Brand
  brand_name: string;
  brand_tagline: string;
  brand_support_email: string;
  brand_support_url: string;
  // Maintenance
  maintenance_mode: boolean;
  maintenance_message: string;
  // Misc
  max_upload_mb: number;
  anon_daily_limit: number;
}

const DEFAULTS: AppSettings = {
  brand_name: "Praticca",
  brand_tagline: "Ferramentas online para o dia a dia",
  brand_support_email: "suporte@praticca.com.br",
  brand_support_url: "",
  maintenance_mode: false,
  maintenance_message: "O sistema está em manutenção. Voltamos em breve.",
  max_upload_mb: 25,
  anon_daily_limit: 3,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadSettings(): Promise<Partial<AppSettings>> {
  try {
    const res = await fetch("/api/admin/settings", { cache: "no-store" });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

async function saveSetting(key: string, value: unknown): Promise<void> {
  const res = await fetch("/api/admin/update-setting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Erro ao salvar.");
  }
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Toggle component
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  id: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          checked ? "bg-brand-500" : "bg-border",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
      <label htmlFor={id} className="cursor-pointer text-sm font-medium text-fg">
        {label}
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ConfigAdminPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [dirty, setDirty] = useState<Set<keyof AppSettings>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Maintenance confirm
  const [showMaintConfirm, setShowMaintConfirm] = useState(false);
  const [pendingMaint, setPendingMaint] = useState(false);

  useEffect(() => {
    loadSettings().then((remote) => {
      setSettings((prev) => ({ ...prev, ...remote }));
      setLoading(false);
    });
  }, []);

  function patch<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => new Set(prev).add(key));
  }

  function requestMaintenanceToggle(value: boolean) {
    if (value) {
      setPendingMaint(true);
      setShowMaintConfirm(true);
    } else {
      patch("maintenance_mode", false);
    }
  }

  async function saveAll() {
    setSaving(true);
    try {
      const entries = Array.from(dirty);
      await Promise.all(
        entries.map((key) => saveSetting(key, settings[key])),
      );
      setDirty(new Set());
      toast.success("Configurações salvas com sucesso.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        Carregando configurações…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">Configurações</h1>
          <p className="mt-1 text-sm text-muted">
            Dados da marca, suporte e comportamento global da plataforma.
          </p>
        </div>
        <Button
          size="sm"
          variant={dirty.size > 0 ? "primary" : "secondary"}
          disabled={dirty.size === 0 || saving}
          loading={saving}
          onClick={saveAll}
          leftIcon={<Save className="h-4 w-4" aria-hidden />}
          aria-label="Salvar todas as alterações"
        >
          Salvar alterações
        </Button>
      </div>

      {dirty.size > 0 && (
        <p className="rounded-lg border border-warning-500 bg-warning-500/10 px-4 py-2 text-sm text-warning-500">
          Você tem alterações não salvas.
        </p>
      )}

      {/* Modo Manutenção — destaque */}
      <Card
        className={cn(
          "border-2 transition-colors",
          settings.maintenance_mode ? "border-danger-500 bg-danger-500/5" : "border-border",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                settings.maintenance_mode ? "bg-danger-500/10 text-danger-500" : "bg-surface text-muted",
              )}
            >
              <Wrench className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-fg">Modo Manutenção</p>
              <p className="mt-0.5 text-sm text-muted">
                Quando ativo, exibe uma página de manutenção para todos os usuários não-admin.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={settings.maintenance_mode ? "danger" : "success"}>
              {settings.maintenance_mode ? "ATIVO" : "Desligado"}
            </Badge>
            <Toggle
              id="maintenance_mode"
              checked={settings.maintenance_mode}
              onChange={requestMaintenanceToggle}
              label="Ativar modo manutenção"
            />
          </div>
        </div>

        {settings.maintenance_mode && (
          <div className="mt-4">
            <Input
              label="Mensagem exibida durante manutenção"
              value={settings.maintenance_message}
              onChange={(e) => patch("maintenance_message", e.target.value)}
              hint="Exibida na página de manutenção para visitantes."
            />
          </div>
        )}
      </Card>

      {/* Marca */}
      <Section
        title="Marca"
        description="Nome, slogan e identidade exibidos na plataforma."
        icon={Building2}
      >
        <Input
          label="Nome da plataforma"
          value={settings.brand_name}
          onChange={(e) => patch("brand_name", e.target.value)}
        />
        <Input
          label="Tagline"
          value={settings.brand_tagline}
          onChange={(e) => patch("brand_tagline", e.target.value)}
          hint="Frase curta de apresentação."
        />
      </Section>

      {/* Suporte */}
      <Section
        title="Suporte"
        description="Como os usuários podem entrar em contato."
        icon={HeadphonesIcon}
      >
        <Input
          label="E-mail de suporte"
          type="email"
          value={settings.brand_support_email}
          onChange={(e) => patch("brand_support_email", e.target.value)}
        />
        <Input
          label="URL da central de ajuda"
          type="url"
          value={settings.brand_support_url}
          onChange={(e) => patch("brand_support_url", e.target.value)}
          hint="Deixe em branco para ocultar o link."
        />
      </Section>

      {/* Limites globais */}
      <Section
        title="Limites globais"
        description="Parâmetros padrão aplicados a usuários não autenticados e plano gratuito."
        icon={Settings}
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Tamanho máximo de upload (MB)"
            type="number"
            min={1}
            max={500}
            value={settings.max_upload_mb}
            onChange={(e) =>
              patch("max_upload_mb", Math.max(1, parseInt(e.target.value, 10) || 1))
            }
          />
          <Input
            label="Execuções anônimas por dia"
            type="number"
            min={0}
            max={999}
            value={settings.anon_daily_limit}
            onChange={(e) =>
              patch("anon_daily_limit", Math.max(0, parseInt(e.target.value, 10) || 0))
            }
          />
        </div>
      </Section>

      {/* Confirm manutenção */}
      <ConfirmDialog
        open={showMaintConfirm}
        title="Ativar modo manutenção?"
        impact="Todos os usuários não-admin verão a página de manutenção imediatamente. Certifique-se de salvar as alterações após confirmar."
        requireText="MANUTENÇÃO"
        onConfirm={() => {
          patch("maintenance_mode", pendingMaint);
          setShowMaintConfirm(false);
        }}
        onClose={() => setShowMaintConfirm(false)}
      />
    </div>
  );
}
