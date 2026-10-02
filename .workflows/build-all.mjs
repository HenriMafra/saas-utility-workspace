export const meta = {
  name: "praticca-build-all",
  description: "Implementa todo o codebase da Praticca em paralelo (ferramentas, auth, dashboard, admin, billing, edge functions, e-mails, marketing, legal, SEO, testes).",
  phases: [
    { title: "Ferramentas" },
    { title: "Auth & Conta" },
    { title: "Dashboard" },
    { title: "Admin" },
    { title: "Billing & API" },
    { title: "Edge Functions" },
    { title: "E-mails" },
    { title: "Marketing & Legal" },
    { title: "SEO & Testes" },
  ],
};

const ROOT = "C:/Users/henri/Desktop/praticca";

const CONTRACT = `
PROJETO: Praticca — Next.js 15 (App Router), TypeScript estrito, Tailwind, Supabase. Raiz ABSOLUTA do projeto: ${ROOT}
REGRAS:
- Escreva cada arquivo com a ferramenta Write usando CAMINHO ABSOLUTO sob a raiz acima, com barras normais (ex.: ${ROOT}/app/(marketing)/precos/page.tsx). Barras normais funcionam no Windows.
- NÃO rode npm, build, git ou testes. NÃO instale nada.
- NÃO edite arquivos de fundação: package.json, tsconfig.json, tailwind.config.ts, tokens.json, app/globals.css, app/layout.tsx, lib/tools/registry.ts, lib/tools/process-types.ts, lib/errors/*, lib/supabase/*, lib/utils.ts, lib/env.ts, lib/analytics/*, hooks/useToolRun.ts, components/ui/Button|Input|Card|Badge|Spinner|Toaster|UploadZone|ResultPanel|UsageMeter, components/tools/ToolLayout|ToolCard, components/marketing/SiteHeader|SiteFooter. Apenas crie/sobrescreva os arquivos da SUA lista.
- UI em PT-BR, acessível (labels, aria, foco). Nenhum segredo no client (use process.env só em código server/route/edge).
- Componentes interativos começam com "use client". Páginas server por padrão.

FUNDAÇÃO QUE JÁ EXISTE (importe via alias @/, NÃO recrie):
- UI base: @/components/ui/Button (Button, props variant primary|secondary|ghost|danger|link, size sm|md|lg|icon, loading, leftIcon), Input (label,hint,error), Card (Card,CardTitle,CardDescription), Badge (variant neutral|brand|success|warning|danger), Spinner. Toaster já montado no root; dispare com: import { toast } from "sonner".
- UI de ferramenta: @/components/ui/UploadZone (accept:string[], maxSizeMB:number, multiple?:boolean, toolSlug?:string, onFiles:(files:File[])=>void); @/components/ui/ResultPanel (result:ProcessResult, toolSlug:string, onReset?:()=>void); @/components/ui/UsageMeter (used:number, limit:number, blocked?:boolean).
- Tools: @/lib/tools/registry (TOOLS, getTool(slug), TOOLS_BY_SLUG, CATEGORIES, POPULAR_TOOLS; tipos ToolDef, ToolCategory). @/lib/tools/process-types (tipo ProcessResult = { files: {name:string, blob:Blob}[], summary:string, text?:string }; OutputFile; classe ToolError(code:string, message?)).
- @/components/tools/ToolLayout (props: tool, children), @/components/tools/ToolCard (props: tool).
- Hook: @/hooks/useToolRun -> useToolRun(slug) retorna { state:'idle'|'processing'|'success'|'error', result, progress, setProgress, error, run(fn:()=>Promise<ProcessResult>), reset }.
- Erros: @/lib/errors/codes (ERROR_CODES, ErrorCode), @/lib/errors/app-error (AppError, Result<T>, ok(data), fail(code,technical?), toAppError(e)).
- Supabase: @/lib/supabase/client -> createClient() (browser, RLS); @/lib/supabase/server -> await createClient() (server component/route); @/lib/supabase/admin -> createAdminClient() (service-role, SÓ server/route/edge, bypassa RLS).
- @/lib/analytics/track (track(event,props?)), @/lib/utils (cn, formatBytes, formatBRL(cents), reductionPercent(before,after), formatDateBR, getAnonId), @/lib/env (publicEnv, serverEnv(key)).
- Tailwind semântico: bg, fg, text-muted, bg-surface, border-border, brand-500/600, success/warning/danger-500/700, rounded-xl/lg/md. Dark mode automático (classes dark: quando útil).

TABELAS (migration 0001 já aplicada conceitualmente): profiles(id,plan,is_admin,display_name,locale), tools, tool_categories, tool_runs(user_id,anon_id,tool_slug,status,options,credits_spent,created_at,expires_at), uploaded_files, generated_files(user_id,storage_path,mime,size_bytes,expires_at), usage_counters(+ rpc increment_usage(p_subject,p_tool,p_window,p_period)), plans(id,name,price_month_cents,price_year_cents,monthly_credits,config), subscriptions(user_id,plan_id,status,provider_subscription_id,current_period_end,cancel_at_period_end), payments, credits(user_id,balance), credit_transactions(user_id,delta,reason,balance_after), coupons, favorites(user_id,tool_slug), feedbacks, error_logs, audit_logs(admin_id,action,entity,entity_id,before,after,reason), app_settings(key,value jsonb), feature_flags(key,enabled,rollout_percent,target), background_jobs, webhook_events(id,provider,type,processed,payload), seo_pages, blog_posts(slug,title,excerpt,body,cluster,keyword,published,published_at).

SAÍDA: retorne APENAS um manifesto curto — a lista de arquivos que você criou e 1 linha de status. NÃO cole o conteúdo dos arquivos no retorno.
`;

// ---- Especificação das 15 ferramentas (cada uma => um runner client) ----
const RUNNER_HINT = (slug) => `
Crie/sobrescreva o arquivo: components/tools/runners/${slug}.tsx
Default export: componente client (\"use client\") SEM props, chamado de runner da ferramenta "${slug}".
Use useToolRun("${slug}"). Pegue limites/aceite com getTool("${slug}"). Para ferramentas de arquivo: renderize <UploadZone .../> e, no onFiles, chame run(async () => { /* processa no NAVEGADOR */ return { files:[{name, blob}], summary }; }). Mostre <Spinner/> quando state==="processing" e <ResultPanel result={result!} toolSlug="${slug}" onReset={reset}/> quando "success". Em erro de validação use: throw new ToolError("TOOL_FILE_TYPE_INVALID") etc. Inclua um <UsageMeter used={0} limit={getTool("${slug}").limits.anonPerDay} /> simples (uso anônimo é só visual aqui). Copy em PT-BR, acessível.`;

const TOOL_TASKS = [
  { slug: "comprimir-pdf", spec: `Comprima PDF 100% no navegador com pdf-lib: PDFDocument.load(bytes,{updateMetadata:false}) e save({useObjectStreams:true}). Opção de nível (Equilibrado/Máxima) — em Máxima, também remova metadados. summary com reductionPercent e formatBytes (ex.: "Reduzido 38% (8,1 MB → 5,0 MB)"). Nome de saída: <original>-comprimido.pdf.` },
  { slug: "juntar-pdf", spec: `Junte vários PDFs (multiple) com pdf-lib (copyPages). Permita reordenar a lista (mover para cima/baixo) e remover itens antes de juntar. Saída: documento-unido.pdf. summary: "N arquivos unidos em 1 PDF".` },
  { slug: "dividir-pdf", spec: `Divida PDF com pdf-lib. Dois modos: (a) separar TODAS as páginas em arquivos individuais; (b) extrair um intervalo (input ex.: "1-3,5"). Gere 1+ arquivos de saída no ResultPanel. summary descreve o resultado.` },
  { slug: "converter-pdf", spec: `Implemente DE VERDADE a direção Imagem→PDF (JPG/PNG → PDF) com pdf-lib (embedJpg/embedPng, 1 imagem por página). A direção PDF→imagem deve aparecer como opção porém DESABILITADA com aviso "Disponível em breve no servidor". Aceite imagens. summary informativo.` },
  { slug: "criar-pdf", spec: `Crie PDF a partir de imagens enviadas (multiple, JPG/PNG/WebP) com pdf-lib, uma imagem por página, mantendo proporção. Permita reordenar. Saída: documento.pdf.` },
  { slug: "assinar-pdf", spec: `Assinar PDF no navegador: o usuário envia 1 PDF, desenha a assinatura num <canvas> (pad simples com mouse/touch), escolhe a página (última por padrão) e posição aproximada (rodapé direito). Use pdf-lib para embutir a imagem PNG da assinatura. Inclua aviso: "Esta é uma assinatura visual, não substitui assinatura digital ICP-Brasil." Saída: <nome>-assinado.pdf.` },
  { slug: "comprimir-imagem", spec: `Comprima imagem com a lib "browser-image-compression" (import default imageCompression). Opção de qualidade/MB alvo. Suporte multiple. summary com reductionPercent. Mantenha o formato. Saída: <nome>-comprimida.<ext>.` },
  { slug: "redimensionar-imagem", spec: `Redimensione/converta imagem via <canvas> no navegador: inputs de largura/altura (manter proporção opcional) e formato de saída (JPG/PNG/WebP) com qualidade. Presets de redes sociais (ex.: Instagram 1080x1080, Story 1080x1920). Saída convertida.` },
  { slug: "remover-fundo", spec: `Remova o fundo no navegador com a lib "@imgly/background-removal" (import { removeBackground }). IMPORTANTE: importe a lib DINAMICAMENTE dentro do handler (await import) para não pesar o bundle; mostre progresso. Saída PNG com transparência: <nome>-sem-fundo.png. Avise que roda no aparelho e pode levar alguns segundos. creditCost=1 (apenas informe; não debite aqui).` },
  { slug: "ocr", spec: `OCR no navegador com "tesseract.js" (Tesseract.recognize(file,'por',{logger:m=>{ if(m.status==='recognizing text') setProgress(Math.round(m.progress*100)); }})). Import dinâmico. Aceite imagens (JPG/PNG). Para PDF, exiba aviso "OCR de PDF estará disponível no servidor (Pro)". Resultado: texto editável (use ResultPanel com result.text) + arquivo .txt para baixar.` },
  { slug: "gerador-de-documentos", spec: `Gerador de documentos com modelos: Contrato de Prestação de Serviços, Recibo, Declaração. Formulário (react-hook-form opcional ou estado simples) preenche o modelo; gere PDF com jspdf. SEMPRE inclua disclaimer no rodapé do PDF e na UI: "Modelo informativo — não substitui orientação jurídica. Revise antes de usar." Saída: <tipo>.pdf.` },
  { slug: "gerador-de-curriculo", spec: `Gerador de currículo: formulário (dados pessoais, resumo, experiências, formação, habilidades) -> PDF bonito com jspdf (layout limpo, 1 coluna). Pré-visualização simples em HTML antes de baixar. Saída: curriculo.pdf.` },
  { slug: "calculadoras", spec: `Conjunto de calculadoras/conversores em ABAS (sem upload, sem useToolRun necessário — pode usar estado próprio): Porcentagem, Regra de três, IMC, Conversor de unidades (comprimento/peso/temperatura), Dias entre datas. Resultados inline, acessível. NÃO use UploadZone/ResultPanel.` },
  { slug: "validador-gerador", spec: `Abas: (1) Validar CPF e CNPJ (algoritmo de dígitos verificadores, mensagens claras); (2) Gerar QR Code (lib "qrcode" -> toDataURL, baixar PNG); (3) Gerar CPF/CNPJ de TESTE com aviso destacado: "Apenas para testes de software. Uso indevido é crime." Sem upload. Use estado próprio.` },
  { slug: "assistente-de-texto", spec: `Assistente de texto com IA (premium, creditCost=2). UI: textarea + botões Corrigir/Resumir/Melhorar. Ao clicar, faça fetch POST para /api/assistant com { action, text }. Trate loading e erros (toast). Se a resposta vier 503/erro de chave, mostre "Assistente indisponível no momento". Mostre o resultado num campo editável + botão copiar. TAMBÉM crie a rota: app/api/assistant/route.ts (runtime nodejs) que lê AI_PROVIDER_API_KEY via serverEnv; se ausente, retorne 503 {error}. Se presente, chame a API da Anthropic (fetch https://api.anthropic.com/v1/messages, header x-api-key, anthropic-version 2023-06-01, model claude-haiku-4-5-20251001, monte prompt PT-BR conforme a action) e retorne { text }. Valide input com zod (min 1, max 5000 chars). Sem expor a chave ao client.` },
];

const tasks = [];

// Phase: Ferramentas (15)
for (const t of TOOL_TASKS) {
  tasks.push({
    phase: "Ferramentas",
    label: `tool:${t.slug}`,
    prompt: `${CONTRACT}\n\nTAREFA: implemente a ferramenta "${t.slug}" DE VERDADE (funcional no navegador).\n${RUNNER_HINT(t.slug)}\nESPECÍFICO: ${t.spec}\nQualidade: TypeScript estrito, tratamento de erro, estados de loading/sucesso/erro, acessível. Teste mentalmente os imports.`,
  });
}

// Phase: Auth & Conta
tasks.push({
  phase: "Auth & Conta",
  label: "auth-pages",
  prompt: `${CONTRACT}\n\nTAREFA: fluxo de autenticação com Supabase Auth. Crie:\n- app/(auth)/layout.tsx (layout centralizado, card, link p/ home)\n- app/(auth)/login/page.tsx, app/(auth)/cadastro/page.tsx, app/(auth)/recuperar-senha/page.tsx, app/(auth)/redefinir-senha/page.tsx\n- app/(auth)/confirmar/route.ts (route handler GET que troca o code do e-mail por sessão via supabase.auth.exchangeCodeForSession e redireciona)\n- components/auth/AuthForm.tsx (client; modos login|signup|reset; usa @/lib/supabase/client; mensagens de erro humanas e NEUTRAS conforme ERROR_CODES; integra Turnstile se NEXT_PUBLIC_TURNSTILE_SITE_KEY existir)\n- components/auth/PasswordStrengthMeter.tsx (client; regras: 8+ chars, maiúscula, minúscula, número, símbolo; barra + checklist em tempo real)\n- schemas/auth.ts (zod: SignUp, SignIn, ResetRequest, NewPassword + tipos via z.infer)\nUse supabase.auth.signInWithPassword / signUp / resetPasswordForEmail / updateUser. Redirecione pós-login para ?next ou /dashboard. Copy PT-BR. Não revele se e-mail existe.`,
});
tasks.push({
  phase: "Auth & Conta",
  label: "conta-seguranca",
  prompt: `${CONTRACT}\n\nTAREFA: área da conta e segurança. Crie:\n- app/(app)/conta/page.tsx (server component que carrega o profile via @/lib/supabase/server; renderiza seções client)\n- components/account/ProfileForm.tsx (editar display_name)\n- components/account/ChangePassword.tsx (supabase.auth.updateUser)\n- components/auth/TwoFactorSetup.tsx (client; usa supabase.auth.mfa.enroll() TOTP -> mostra QR (svg/uri), pede código de 6 dígitos -> challenge+verify; gera/mostra códigos de backup fictícios para download; permite desativar)\n- components/account/ActiveSessions.tsx (lista simples; botão "encerrar todas" via supabase.auth.signOut({scope:'others'}))\n- hooks/useAuth.ts (client; expõe user, loading, signOut)\nMostre estados, loading e erros. Copy PT-BR.`,
});

// Phase: Dashboard
tasks.push({
  phase: "Dashboard",
  label: "dashboard",
  prompt: `${CONTRACT}\n\nTAREFA: área logada. Crie:\n- app/(app)/layout.tsx (shell com sidebar: Dashboard, Histórico, Favoritos, Conta; topo com saldo de créditos e plano; usa @/lib/supabase/server p/ pegar user/profile/credits)\n- app/(app)/dashboard/page.tsx (resumo: créditos, plano, ferramentas recentes (tool_runs), arquivos recentes/expirando (generated_files), atalhos, sugestões)\n- app/(app)/historico/page.tsx (lista paginada de tool_runs do usuário, com filtro por ferramenta e status; ações baixar/excluir quando houver generated_files)\n- app/(app)/favoritos/page.tsx (grid de ToolCard a partir de favorites)\n- hooks/useFavorites.ts (client; toggle favorite via supabase, tabela favorites)\n- components/app/EmptyState.tsx (reutilizável: title, description, action)\nUse RLS (cliente normal). Datas com formatDateBR, tamanhos com formatBytes. Copy PT-BR, estados vazios amigáveis.`,
});

// Phase: Admin
tasks.push({
  phase: "Admin",
  label: "admin-core",
  prompt: `${CONTRACT}\n\nTAREFA: núcleo do admin (acesso já protegido por middleware via profiles.is_admin). Crie:\n- app/admin/layout.tsx (sidebar com módulos: Visão geral, Usuários, Pagamentos, Logs, Ferramentas, Config, Flags, SEO, Atualizações)\n- app/admin/page.tsx (KPIs: contagem de usuários, pagantes, execuções 24h, erros 24h; saúde das integrações (placeholder); atalhos de diagnóstico que chamam /api/admin/<action>)\n- components/admin/StatCard.tsx, components/admin/AdminLogTable.tsx (tabela com nível colorido, categoria, mensagem amigável, ação recomendada, botões Resolver/Copiar/Abrir)\n- components/admin/ConfirmDialog.tsx (client; props: title, impact, requireText?:"CONFIRMAR", reasonRequired?:boolean, onConfirm(reason); modal acessível, foco preso, Esc fecha)\n- lib/admin/audit.ts (writeAudit({adminId,action,entity,entityId,before,after,reason}) usando createAdminClient -> insert em audit_logs)\nUse createAdminClient SOMENTE em server. Copy PT-BR.`,
});
tasks.push({
  phase: "Admin",
  label: "admin-usuarios-pagamentos-logs",
  prompt: `${CONTRACT}\n\nTAREFA: módulos admin (parte 1). Crie:\n- app/admin/usuarios/page.tsx (busca e lista de profiles via createAdminClient; link p/ detalhe) e app/admin/usuarios/[id]/page.tsx (detalhe: plano, créditos, assinaturas, execuções recentes; ações: conceder/remover créditos, bloquear/desbloquear, resetar limite — cada ação usa <ConfirmDialog> e POST /api/admin/<action>)\n- app/admin/pagamentos/page.tsx (lista payments + subscriptions, filtros por status; botão "reenviar webhook")\n- app/admin/logs/page.tsx (usa AdminLogTable lendo error_logs; filtros por categoria/nível/data; exportar CSV no client)\nImporte ConfirmDialog e AdminLogTable de @/components/admin. Server components carregam dados; ações client chamam as rotas. Copy PT-BR.`,
});
tasks.push({
  phase: "Admin",
  label: "admin-ferramentas-config-flags-seo",
  prompt: `${CONTRACT}\n\nTAREFA: módulos admin (parte 2). Crie:\n- app/admin/ferramentas/page.tsx (lista tools; toggle status active/paused/hidden; editar credit_cost e is_premium; salva via /api/admin/update-tool)\n- app/admin/config/page.tsx (editor de app_settings: brand, support, maintenance — form que salva /api/admin/update-setting; inclui toggle de Modo Manutenção)\n- app/admin/flags/page.tsx (lista feature_flags; toggle enabled, ajustar rollout_percent; /api/admin/update-flag)\n- app/admin/seo/page.tsx (editor de seo_pages por slug: title, description, h1, conteúdo, noindex; /api/admin/update-seo)\n- app/admin/atualizacoes/page.tsx (Centro de Atualizações: versão atual (de package.json via leitura server), changelog placeholder, migrations aplicadas (lista), checklist pós-deploy, botões de diagnóstico)\nUse ConfirmDialog para ações sensíveis. Copy PT-BR.`,
});

// Phase: Billing & API
tasks.push({
  phase: "Billing & API",
  label: "billing-stripe-pricing",
  prompt: `${CONTRACT}\n\nTAREFA: billing + página de preços. Crie:\n- lib/billing/provider.ts (interface PaymentProvider: createCheckoutSession(opts), createPortalSession(customerId), verifyAndParseWebhook(rawBody,sig))\n- lib/billing/stripe.ts (implementa PaymentProvider com a lib "stripe"; usa serverEnv('STRIPE_SECRET_KEY'); price ids via STRIPE_PRICE_PRO_MONTH/YEAR e BUSINESS_*; suporta pix e card; só server)\n- app/api/checkout/route.ts (POST; body zod {plan:'pro'|'business', interval:'month'|'year'}; cria sessão Stripe Checkout em BRL; exige usuário logado (server supabase); retorna {url})\n- app/(marketing)/precos/page.tsx (3 PricingCard Free/Pro/Business, toggle Mensal/Anual com -17%, tabela comparativa, bloco de créditos, FAQ; CTA chama /api/checkout e redireciona; mostra plano atual se logado)\n- components/marketing/PricingCard.tsx (props: plan, billing, highlighted?, currentPlan?; usa formatBRL)\n- components/marketing/BillingToggle.tsx (client)\n- components/ui/UpgradeModal.tsx (client; props: open, onClose, context; CTA p/ /precos) \nPreços (centavos): Pro 1990/19900, Business 4990/49900. Copy PT-BR.`,
});
tasks.push({
  phase: "Billing & API",
  label: "billing-webhook",
  prompt: `${CONTRACT}\n\nTAREFA: webhook de pagamento Stripe (idempotente). Crie:\n- app/api/webhooks/stripe/route.ts (runtime nodejs; lê corpo RAW (await req.text()) e header 'stripe-signature'; valida com lib stripe e STRIPE_WEBHOOK_SECRET; DEDUPE inserindo em webhook_events por event.id (se já existe -> 200 ignora); trata checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.deleted; usa createAdminClient)\n- lib/billing/fulfillment.ts (funções: releasePlan(userId,planId,subId,periodEnd) -> atualiza subscriptions + profiles.plan + credita monthly_credits em credits/credit_transactions; downgradeToFree(userId); markPastDue(userId)) \nTudo server, idempotente. Em erro, insira em error_logs (categoria 'webhook') e retorne 200 se já tratado. Comente o mapeamento de eventos.`,
});
tasks.push({
  phase: "Billing & API",
  label: "api-core",
  prompt: `${CONTRACT}\n\nTAREFA: rotas de API e segurança. Crie:\n- app/api/tool-runs/route.ts (POST; zod CreateToolRun {toolSlug, inputFilePath?, options}; exige login OU permite anon com anon_id; checa limite via rpc increment_usage e plano; debita créditos se a tool tiver credit_cost (transação credits/credit_transactions); cria tool_runs (status 'queued' p/ server, 'completed' p/ client) ; respostas {ok,data}|{ok,false,error} com status corretos 200/401/402/422/429)\n- app/api/tool-runs/[id]/route.ts (GET; retorna status/result; valida posse via RLS server client)\n- app/api/uploads/sign/route.ts (POST; zod {fileName,mime,sizeBytes,toolSlug}; valida tamanho/mime; cria signed upload URL no Storage bucket privado 'uploads' via createAdminClient.storage.from('uploads').createSignedUploadUrl)\n- app/api/admin/[action]/route.ts (POST; exige is_admin (server); aceita actions: grant-credits, remove-credits, block-user, unblock-user, reset-limit, pause-tool, activate-tool, update-tool, update-setting, update-flag, update-seo, resend-webhook, run-health-check, clear-expired; cada ação valida body, executa via createAdminClient e chama writeAudit de @/lib/admin/audit; retorna {ok})\n- lib/security/rate-limit.ts (checkLimit(subject,toolSlug,window,limit) usando rpc increment_usage; retorna {allowed,count})\n- lib/security/captcha.ts (verifyTurnstile(token) -> POST siteverify com TURNSTILE_SECRET_KEY; no-op true se não configurado)\n- schemas/tool-inputs.ts (zod CreateToolRun + por-ferramenta) e schemas/billing.ts (zod Checkout)\n- hooks/useUsageLimit.ts (client; lê contagem do dia p/ uma tool; retorna {used,limit,blocked})\nTudo server salvo o hook. Idempotência onde fizer sentido. Copy de erro via ERROR_CODES.`,
});

// Phase: Edge Functions
tasks.push({
  phase: "Edge Functions",
  label: "edge-functions",
  prompt: `${CONTRACT}\n\nTAREFA: Supabase Edge Functions (Deno, TypeScript). Estes arquivos são Deno — use imports estilo "https://" e Deno.env.get. NÃO precisam compilar no Next (tsconfig os exclui). Crie index.ts em cada pasta:\n- supabase/functions/limpar-expirados/index.ts (cron: apaga generated_files/uploaded_files com expires_at < now no Storage e no banco; usa SERVICE_ROLE; retorna contagem)\n- supabase/functions/health-check/index.ts (testa conexão DB, Storage; retorna JSON de status por integração; grava system_health_checks se existir)\n- supabase/functions/webhook-pagamento/index.ts (variante edge do webhook Stripe — espelha a lógica de fulfillment; idempotente via webhook_events)\n- supabase/functions/processar-ocr/index.ts (recebe path; placeholder honesto: marca tool_run e retorna 501 "OCR server em breve" — deixe ponto de integração claro)\n- supabase/functions/remover-fundo/index.ts (idem: ponto de integração p/ modelo/API; placeholder honesto)\n- supabase/functions/gerar-sitemap/index.ts (gera sitemap.xml a partir de tools/seo_pages e salva em Storage público ou retorna XML)\nCada função: header CORS, tratamento de erro, comentário no topo explicando gatilho/entrada/saída. Use Deno.serve.`,
});

// Phase: E-mails
tasks.push({
  phase: "E-mails",
  label: "emails",
  prompt: `${CONTRACT}\n\nTAREFA: e-mails transacionais com Resend + React Email. Crie:\n- lib/email/index.ts (sendEmail({to,subject,react}) usando a lib "resend" e RESEND_API_KEY/EMAIL_FROM via serverEnv; no-op logado se sem chave; só server)\n- lib/email/templates/ConfirmAccount.tsx, ResetPassword.tsx, PaymentApproved.tsx, FileReady.tsx, FileExpiring.tsx, LimitReached.tsx, SubscriptionCreated.tsx, OnboardingD0.tsx — cada um usando @react-email/components (Html, Body, Container, Heading, Text, Button, etc.), copy PT-BR conforme docs do produto (assunto + corpo + 1 CTA). Props tipadas (ex.: ConfirmAccount({url}), FileExpiring({fileName,url})).\nVisual limpo, marca "Praticca". Não inclua segredos.`,
});

// Phase: Marketing & Legal
tasks.push({
  phase: "Marketing & Legal",
  label: "marketing-pages",
  prompt: `${CONTRACT}\n\nTAREFA: páginas públicas. Crie:\n- app/(marketing)/status/page.tsx (status geral + por ferramenta + integrações; usa dados mock/health; assinatura de incidentes (form simples))\n- app/(marketing)/blog/page.tsx e app/(marketing)/blog/[slug]/page.tsx (leem de blog_posts via @/lib/supabase/server; se vazio, use 3 posts de exemplo definidos em lib/blog/sample-posts.ts que VOCÊ cria; generateStaticParams; schema Article JSON-LD; metadata)\n- app/(marketing)/categorias/[slug]/page.tsx (generateStaticParams a partir de CATEGORIES; lista ToolCard da categoria; metadata + canonical + H1; texto SEO)\n- app/(marketing)/ajuda/page.tsx (central de ajuda: como usar, limites, privacidade, conta, pagamentos — accordions; busca simples client)\nCopy PT-BR, acessível, com interlinking. Reaproveite ToolCard, Card, Button.`,
});
tasks.push({
  phase: "Marketing & Legal",
  label: "legal",
  prompt: `${CONTRACT}\n\nTAREFA: conteúdo legal (LGPD). Crie:\n- app/legal/layout.tsx (tipografia de leitura, sumário lateral)\n- app/legal/termos/page.tsx, app/legal/privacidade/page.tsx, app/legal/cookies/page.tsx, app/legal/reembolso/page.tsx — textos PT-BR completos e adequados à LGPD: Termos (objeto, conta, uso aceitável, pagamento, propriedade, limitação de responsabilidade, foro), Privacidade (dados coletados, finalidades, base legal, retenção por plano, direitos do titular, "Como protegemos seus arquivos" destacando processamento no navegador e exclusão automática, contato DPO), Cookies (essenciais vs analytics, gestão), Reembolso (prazo 7 dias CDC, condições, como solicitar). Inclua data de "última atualização".\n- components/legal/CookieConsent.tsx (client; banner de consentimento, salva escolha em localStorage; só essenciais por padrão)\nAdicione <CookieConsent/> no app/(marketing)/layout.tsx? NÃO edite o layout existente — em vez disso documente no manifesto que ele deve ser incluído (eu integro depois).`,
});

// Phase: SEO & Testes
tasks.push({
  phase: "SEO & Testes",
  label: "seo-infra",
  prompt: `${CONTRACT}\n\nTAREFA: infraestrutura de SEO. Crie:\n- app/sitemap.ts (MetadataRoute.Sitemap: home, /ferramentas, cada /ferramentas/<slug>, cada /categorias/<slug>, /precos, /blog; usa TOOLS e CATEGORIES e publicEnv.NEXT_PUBLIC_APP_URL)\n- app/robots.ts (permite tudo exceto /admin, /api, /conta, /dashboard, /historico, /favoritos; aponta sitemap)\n- public/robots.txt NÃO (use o app/robots.ts). \n- components/marketing/Faq.tsx (componente reutilizável de FAQ acessível com JSON-LD FAQPage opcional)\nSem segredos. TypeScript estrito.`,
});
tasks.push({
  phase: "SEO & Testes",
  label: "tests-docs-ci",
  prompt: `${CONTRACT}\n\nTAREFA: testes, CI e docs. Crie:\n- vitest.config.ts (ambiente jsdom) e tests/unit/utils.test.ts (testa reductionPercent, formatBytes, formatBRL) e tests/unit/cpf.test.ts (testa validação de CPF — implemente uma função pura util se precisar em lib/validators/cpf.ts e teste-a; CPFs válidos/ inválidos conhecidos)\n- tests/rls/README.md (descreve a suíte de RLS: tentar ler tool_runs de outro usuário deve retornar 0 linhas; passos para rodar com supabase local) e tests/rls/policies.spec.ts (esqueleto skipável com it.skip explicando)\n- playwright.config.ts e tests/e2e/home.spec.ts (abre /, vê o H1, navega para /ferramentas)\n- .github/workflows/ci.yml (jobs: install, lint, typecheck, test, build; preview/prod deploy comentado p/ Cloudflare Pages)\n- README.md (visão geral, stack, como rodar: cp .env.example .env.local; npm install; supabase db push; npm run dev; estrutura de pastas; link para ../praticca-blueprint)\n- docs/RUNBOOK.md (resumo operacional apontando para o blueprint)\nNÃO edite package.json. Use as libs já presentes (vitest, @playwright/test, @testing-library/react, jsdom).`,
});

// ---------- Execução ----------
log(`Praticca — gerando ${tasks.length} fatias do codebase em paralelo (Sonnet, ${tasks.length} agentes).`);

const results = await parallel(
  tasks.map((t) => () =>
    agent(t.prompt, {
      label: t.label,
      phase: t.phase,
      model: "sonnet",
      agentType: "general-purpose",
    }).then((out) => ({ label: t.label, ok: true, manifest: out }))
      .catch((e) => ({ label: t.label, ok: false, manifest: String(e) })),
  ),
);

const okCount = results.filter((r) => r && r.ok).length;
const failed = results.filter((r) => !r || !r.ok).map((r) => (r ? r.label : "desconhecido"));

log(`Concluído: ${okCount}/${tasks.length} fatias OK. Falhas: ${failed.length ? failed.join(", ") : "nenhuma"}.`);

return {
  total: tasks.length,
  ok: okCount,
  failed,
  manifests: results.map((r) => ({ label: r && r.label, ok: r && r.ok })),
};
