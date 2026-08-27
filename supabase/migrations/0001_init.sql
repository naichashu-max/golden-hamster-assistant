-- 金丝熊饲养助手 · 云数据库初始化
-- 用法：在 Supabase 控制台左侧 SQL Editor 中，把本文件完整粘贴执行一次即可。
-- 账号本身由 Supabase Auth 管理（auth.users），业务数据表全部挂在 user_id 上，
-- 并通过 RLS 行级安全策略保证每个人只能读写自己的数据。

create extension if not exists pgcrypto;

-- ---------- 宠物档案 ----------
create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  birth_date date,
  breed text,
  gender text,
  photo text,
  personality text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 体重 / 身长记录 ----------
create table if not exists public.weight_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  date date not null,
  weight real,
  body_length real,
  status text,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- 成长相册 ----------
create table if not exists public.growth_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  date date not null,
  photo text,
  caption text,
  created_at timestamptz not null default now()
);

-- ---------- 喂食记录 ----------
create table if not exists public.feeding_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  date date not null,
  food_type text,
  amount real,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- 饮水记录 ----------
create table if not exists public.drinking_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  date date not null,
  amount real,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- 换垫料记录 ----------
create table if not exists public.bedding_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  date date not null,
  bedding_type text,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- 洗澡记录 ----------
create table if not exists public.bath_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  date date not null,
  bath_type text,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- 夜间活动记录 ----------
create table if not exists public.activity_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  date date not null,
  wheel_minutes integer,
  active_level integer,
  active_time_range text,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- 每日报告 ----------
create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  date date not null,
  health_score integer,
  weight real,
  activity_minutes integer,
  summary text,
  generated_at timestamptz not null default now()
);

create index if not exists idx_pets_user on public.pets(user_id);
create index if not exists idx_weight_pet_date on public.weight_records(pet_id, date);
create index if not exists idx_feeding_pet_date on public.feeding_records(pet_id, date);
create index if not exists idx_activity_pet_date on public.activity_records(pet_id, date);

-- ---------- 行级安全：每个用户只能访问自己的数据 ----------
alter table public.pets enable row level security;
alter table public.weight_records enable row level security;
alter table public.growth_photos enable row level security;
alter table public.feeding_records enable row level security;
alter table public.drinking_records enable row level security;
alter table public.bedding_records enable row level security;
alter table public.bath_records enable row level security;
alter table public.activity_records enable row level security;
alter table public.daily_reports enable row level security;

create policy "pets_owner_all" on public.pets
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 记录表：读取/删除只看自己的行；写入时还要校验宠物归属自己。
create policy "wr_owner_all" on public.weight_records
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid())
  );

create policy "gp_owner_all" on public.growth_photos
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid())
  );

create policy "fr_owner_all" on public.feeding_records
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid())
  );

create policy "dr_owner_all" on public.drinking_records
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid())
  );

create policy "br_owner_all" on public.bedding_records
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid())
  );

create policy "bath_owner_all" on public.bath_records
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid())
  );

create policy "ar_owner_all" on public.activity_records
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid())
  );

create policy "drep_owner_all" on public.daily_reports
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.pets p where p.id = pet_id and p.user_id = auth.uid())
  );
