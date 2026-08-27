-- 金丝熊饲养助手 · 清洁任务拆分 + 相册标签
-- 用法：在 Supabase 控制台 SQL Editor 中完整执行一次。
-- 注意：金丝熊严禁水洗、也不使用浴沙，因此删除洗澡记录表。

-- 移除“洗澡”表（本应用不再提供洗澡功能）
drop table if exists public.bath_records;

-- 清洁任务：task_type = 'spot'（局部铲屎/清尿沙）或 'deep'（整笼大扫除换垫料）
create table if not exists public.cleaning_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  date date not null,
  task_type text not null,
  bedding_type text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_cleaning_pet_date on public.cleaning_records(pet_id, date);

alter table public.cleaning_records enable row level security;
create policy "cl_owner_all" on public.cleaning_records
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid())
  );

-- 相册照片支持专属标签（如：#塞满颊囊）
alter table public.growth_photos add column if not exists tag text;
