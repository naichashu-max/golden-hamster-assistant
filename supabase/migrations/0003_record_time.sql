-- 金丝熊饲养助手 · 记录精确到小时
-- 用法：在 Supabase 控制台 SQL Editor 中完整执行一次。

alter table public.feeding_records add column if not exists time text;
alter table public.drinking_records add column if not exists time text;
alter table public.cleaning_records add column if not exists time text;
alter table public.activity_records add column if not exists time text;
