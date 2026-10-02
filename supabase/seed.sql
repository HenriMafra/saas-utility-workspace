-- Praticca — seed (safe to re-run; uses upserts). Demo data only.

insert into tool_categories (slug,name,description,sort_order) values
 ('pdf','PDF','Comprima, junte, divida e converta PDFs.',1),
 ('imagem','Imagem','Comprima, redimensione e edite imagens.',2),
 ('texto','Texto','Extraia e trabalhe com texto.',3),
 ('negocios','Negócios','Documentos e modelos para o seu trabalho.',4),
 ('calculo','Cálculo','Calculadoras e conversores.',5),
 ('validacao','Validação','Valide e gere dados e códigos.',6)
on conflict (slug) do update set name=excluded.name, description=excluded.description;

insert into tools (slug,name,category,status,processing_mode,is_premium,credit_cost,sort_order) values
 ('comprimir-pdf','Comprimir PDF','pdf','active','client',false,0,1),
 ('juntar-pdf','Juntar PDF','pdf','active','client',false,0,2),
 ('dividir-pdf','Dividir PDF','pdf','active','client',false,0,3),
 ('converter-pdf','Converter PDF','pdf','active','hybrid',false,1,4),
 ('criar-pdf','Criar PDF','pdf','active','client',false,0,5),
 ('assinar-pdf','Assinar PDF','pdf','active','client',false,0,6),
 ('comprimir-imagem','Comprimir Imagem','imagem','active','client',false,0,7),
 ('redimensionar-imagem','Redimensionar Imagem','imagem','active','client',false,0,8),
 ('remover-fundo','Remover Fundo','imagem','active','client',false,1,9),
 ('ocr','OCR — Extrair Texto','texto','active','hybrid',false,0,10),
 ('gerador-de-documentos','Gerador de Documentos','negocios','active','client',false,0,11),
 ('gerador-de-curriculo','Gerador de Currículo','negocios','active','client',false,0,12),
 ('calculadoras','Calculadoras e Conversores','calculo','active','client',false,0,13),
 ('validador-gerador','Validador e Gerador','validacao','active','client',false,0,14),
 ('assistente-de-texto','Assistente de Texto','texto','beta','server',true,2,15)
on conflict (slug) do update set name=excluded.name, status=excluded.status;

insert into plans (id,name,tier,price_month_cents,price_year_cents,monthly_credits,config) values
 ('free','Gratuito','free',0,0,0,'{"maxSizeMB":25,"retentionHours":24}'),
 ('pro','Pro','pro',1990,19900,100,'{"maxSizeMB":200,"retentionDays":30}'),
 ('business','Business','business',4990,49900,400,'{"maxSizeMB":1024,"retentionDays":90}')
on conflict (id) do update set price_month_cents=excluded.price_month_cents;

insert into app_settings (key,value) values
 ('brand', '{"name":"Praticca","tagline":"Tudo que você precisa resolver, em um só lugar."}'),
 ('support', '{"email":"ola@praticca.com.br"}'),
 ('maintenance', '{"enabled":false,"message":""}')
on conflict (key) do nothing;

insert into feature_flags (key,enabled,rollout_percent) values
 ('tool.assistente-de-texto', true, 100),
 ('tool.remover-fundo', true, 100),
 ('ab.home_hero_v2', false, 0)
on conflict (key) do nothing;

-- Storage buckets privados usados pelo app (uploads e arquivos gerados).
-- Cria automaticamente no `supabase db reset` (local) e ao rodar o seed (cloud).
insert into storage.buckets (id, name, public) values
 ('uploads', 'uploads', false),
 ('generated', 'generated', false)
on conflict (id) do nothing;
