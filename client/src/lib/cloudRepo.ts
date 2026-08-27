// 云仓储层：所有业务数据通过 Supabase 读写，并自动受行级安全策略隔离，
// 每个登录用户只能看到自己的数据。函数签名与原本地仓储保持一致，便于替换。
import { supabase } from './supabase';
import { newId, nowIso } from './id';
import type {
  ActivityRecord,
  BathRecord,
  BeddingRecord,
  DrinkingRecord,
  FeedingRecord,
  GrowthPhoto,
  Pet,
  WeightRecord,
} from '../types';
import type {
  ActivityRecordInput,
  BathRecordInput,
  BeddingRecordInput,
  DrinkingRecordInput,
  FeedingRecordInput,
  GrowthPhotoInput,
  PetInput,
  WeightRecordInput,
} from './repository';

// Postgres 行类型（蛇形命名）；无模式校验时用宽松类型。
type Row = Record<string, any>;

const TABLE = {
  pets: 'pets',
  weightRecords: 'weight_records',
  growthPhotos: 'growth_photos',
  feedingRecords: 'feeding_records',
  drinkingRecords: 'drinking_records',
  beddingRecords: 'bedding_records',
  bathRecords: 'bath_records',
  activityRecords: 'activity_records',
  dailyReports: 'daily_reports',
} as const;

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

function withMeta<T>(value: T): T & { id: string; createdAt: string } {
  return { ...value, id: newId(), createdAt: nowIso() };
}

// ---------- 宠物档案 ----------

const mapPet = (row: Row): Pet => ({
  id: row.id,
  name: row.name,
  birthDate: row.birth_date ?? '',
  breed: row.breed ?? '',
  gender: row.gender ?? 'unknown',
  photo: row.photo ?? undefined,
  personality: row.personality ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function listPets(): Promise<Pet[]> {
  const { data, error } = await supabase
    .from(TABLE.pets)
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapPet);
}

export async function getPet(id: string): Promise<Pet | undefined> {
  const { data, error } = await supabase.from(TABLE.pets).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapPet(data) : undefined;
}

export async function savePet(input: PetInput): Promise<Pet> {
  const existing = input.id ? await getPet(input.id) : undefined;
  const now = nowIso();
  const row = {
    id: input.id ?? newId(),
    name: input.name,
    birth_date: input.birthDate || null,
    breed: input.breed,
    gender: input.gender,
    photo: input.photo ?? null,
    personality: input.personality ?? null,
    created_at: existing?.createdAt ?? now,
    updated_at: now,
  };
  const { data, error } = await supabase.from(TABLE.pets).upsert(row).select().single();
  if (error) throw error;
  return mapPet(data);
}

export async function deletePet(id: string): Promise<void> {
  // 记录表设置了 ON DELETE CASCADE，删除档案会自动清理其所有记录。
  const { error } = await supabase.from(TABLE.pets).delete().eq('id', id);
  if (error) throw error;
}

// ---------- 各类记录 ----------

async function listForPet<T>(table: string, petId: string, map: (row: Row) => T): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('pet_id', petId)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(map);
}

const mapWeight = (row: Row): WeightRecord => ({
  id: row.id,
  petId: row.pet_id,
  date: row.date,
  weight: Number(row.weight),
  bodyLength: row.body_length == null ? undefined : Number(row.body_length),
  status: row.status ?? 'normal',
  note: row.note ?? undefined,
  createdAt: row.created_at,
});

const mapPhoto = (row: Row): GrowthPhoto => ({
  id: row.id,
  petId: row.pet_id,
  date: row.date,
  photo: row.photo,
  caption: row.caption ?? undefined,
  createdAt: row.created_at,
});

const mapFeeding = (row: Row): FeedingRecord => ({
  id: row.id,
  petId: row.pet_id,
  date: row.date,
  foodType: row.food_type ?? 'other',
  amount: row.amount == null ? undefined : Number(row.amount),
  note: row.note ?? undefined,
  createdAt: row.created_at,
});

const mapDrinking = (row: Row): DrinkingRecord => ({
  id: row.id,
  petId: row.pet_id,
  date: row.date,
  amount: row.amount == null ? undefined : Number(row.amount),
  note: row.note ?? undefined,
  createdAt: row.created_at,
});

const mapBedding = (row: Row): BeddingRecord => ({
  id: row.id,
  petId: row.pet_id,
  date: row.date,
  beddingType: row.bedding_type ?? '',
  note: row.note ?? undefined,
  createdAt: row.created_at,
});

const mapBath = (row: Row): BathRecord => ({
  id: row.id,
  petId: row.pet_id,
  date: row.date,
  bathType: row.bath_type ?? 'other',
  note: row.note ?? undefined,
  createdAt: row.created_at,
});

const mapActivity = (row: Row): ActivityRecord => ({
  id: row.id,
  petId: row.pet_id,
  date: row.date,
  wheelMinutes: Number(row.wheel_minutes ?? 0),
  activeLevel: Number(row.active_level ?? 3),
  activeTimeRange: row.active_time_range ?? undefined,
  note: row.note ?? undefined,
  createdAt: row.created_at,
});

export const listWeightRecords = (petId: string) =>
  listForPet(TABLE.weightRecords, petId, mapWeight);
export const listGrowthPhotos = (petId: string) =>
  listForPet(TABLE.growthPhotos, petId, mapPhoto);
export const listFeedingRecords = (petId: string) =>
  listForPet(TABLE.feedingRecords, petId, mapFeeding);
export const listDrinkingRecords = (petId: string) =>
  listForPet(TABLE.drinkingRecords, petId, mapDrinking);
export const listBeddingRecords = (petId: string) =>
  listForPet(TABLE.beddingRecords, petId, mapBedding);
export const listBathRecords = (petId: string) => listForPet(TABLE.bathRecords, petId, mapBath);
export const listActivityRecords = (petId: string) =>
  listForPet(TABLE.activityRecords, petId, mapActivity);

export async function addWeightRecord(input: WeightRecordInput): Promise<WeightRecord> {
  const record = withMeta(input);
  const { data, error } = await supabase
    .from(TABLE.weightRecords)
    .insert({
      id: record.id,
      pet_id: record.petId,
      date: record.date,
      weight: record.weight,
      body_length: record.bodyLength ?? null,
      status: record.status,
      note: record.note ?? null,
      created_at: record.createdAt,
    })
    .select()
    .single();
  if (error) throw error;
  return mapWeight(data);
}

export async function addGrowthPhoto(input: GrowthPhotoInput): Promise<GrowthPhoto> {
  const record = withMeta(input);
  const { data, error } = await supabase
    .from(TABLE.growthPhotos)
    .insert({
      id: record.id,
      pet_id: record.petId,
      date: record.date,
      photo: record.photo,
      caption: record.caption ?? null,
      created_at: record.createdAt,
    })
    .select()
    .single();
  if (error) throw error;
  return mapPhoto(data);
}

export async function addFeedingRecord(input: FeedingRecordInput): Promise<FeedingRecord> {
  const record = withMeta(input);
  const { data, error } = await supabase
    .from(TABLE.feedingRecords)
    .insert({
      id: record.id,
      pet_id: record.petId,
      date: record.date,
      food_type: record.foodType,
      amount: record.amount ?? null,
      note: record.note ?? null,
      created_at: record.createdAt,
    })
    .select()
    .single();
  if (error) throw error;
  return mapFeeding(data);
}

export async function addDrinkingRecord(input: DrinkingRecordInput): Promise<DrinkingRecord> {
  const record = withMeta(input);
  const { data, error } = await supabase
    .from(TABLE.drinkingRecords)
    .insert({
      id: record.id,
      pet_id: record.petId,
      date: record.date,
      amount: record.amount ?? null,
      note: record.note ?? null,
      created_at: record.createdAt,
    })
    .select()
    .single();
  if (error) throw error;
  return mapDrinking(data);
}

export async function addBeddingRecord(input: BeddingRecordInput): Promise<BeddingRecord> {
  const record = withMeta(input);
  const { data, error } = await supabase
    .from(TABLE.beddingRecords)
    .insert({
      id: record.id,
      pet_id: record.petId,
      date: record.date,
      bedding_type: record.beddingType,
      note: record.note ?? null,
      created_at: record.createdAt,
    })
    .select()
    .single();
  if (error) throw error;
  return mapBedding(data);
}

export async function addBathRecord(input: BathRecordInput): Promise<BathRecord> {
  const record = withMeta(input);
  const { data, error } = await supabase
    .from(TABLE.bathRecords)
    .insert({
      id: record.id,
      pet_id: record.petId,
      date: record.date,
      bath_type: record.bathType,
      note: record.note ?? null,
      created_at: record.createdAt,
    })
    .select()
    .single();
  if (error) throw error;
  return mapBath(data);
}

export async function addActivityRecord(input: ActivityRecordInput): Promise<ActivityRecord> {
  const record = withMeta(input);
  const { data, error } = await supabase
    .from(TABLE.activityRecords)
    .insert({
      id: record.id,
      pet_id: record.petId,
      date: record.date,
      wheel_minutes: record.wheelMinutes,
      active_level: record.activeLevel,
      active_time_range: record.activeTimeRange ?? null,
      note: record.note ?? null,
      created_at: record.createdAt,
    })
    .select()
    .single();
  if (error) throw error;
  return mapActivity(data);
}

export async function deleteRecord(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

// ---------- 备份：导出 / 导入当前账号的全部数据 ----------

export interface BackupFile {
  app: 'golden-hamster-assistant';
  version: number;
  exportedAt: string;
  stores: Record<string, unknown[]>;
}

const BACKUP_TABLES = [
  TABLE.pets,
  TABLE.weightRecords,
  TABLE.growthPhotos,
  TABLE.feedingRecords,
  TABLE.drinkingRecords,
  TABLE.beddingRecords,
  TABLE.bathRecords,
  TABLE.activityRecords,
  TABLE.dailyReports,
];

/** 去掉 user_id：备份文件里不保存账号归属，导入到哪个账号就归哪个账号。 */
function stripUserId(row: Row): Row {
  const { user_id: _ignored, ...rest } = row;
  return rest;
}

function sanitizeRows(rows: unknown[]): Row[] {
  return rows.map((row) => stripUserId(row as Row));
}

export async function createBackup(): Promise<BackupFile> {
  const stores: Record<string, unknown[]> = {};
  for (const table of BACKUP_TABLES) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw error;
    stores[table] = sanitizeRows(data ?? []);
  }
  return {
    app: 'golden-hamster-assistant',
    version: 1,
    exportedAt: nowIso(),
    stores,
  };
}

export async function restoreBackup(file: BackupFile): Promise<void> {
  await clearAllData();
  for (const table of BACKUP_TABLES) {
    const rows = sanitizeRows(file.stores[table] ?? []);
    if (rows.length === 0) continue;
    const { error } = await supabase.from(table).insert(rows);
    if (error) throw error;
  }
}

// ---------- 清空当前账号数据 ----------

export async function clearAllData(): Promise<void> {
  // 记录表有 ON DELETE CASCADE，删除全部宠物即可级联清空所有记录。
  const { error } = await supabase.from(TABLE.pets).delete().neq('id', ZERO_UUID);
  if (error) throw error;
}

// ---------- 示例数据（写入当前账号） ----------

export async function seedDemoData(): Promise<void> {
  const dateOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const pet = await savePet({
    name: '团子',
    birthDate: '2026-01-15',
    breed: '短毛奶油',
    gender: 'female',
    personality: '白天呼呼大睡，晚上爱跑轮，喜欢把粮食藏进窝里。',
  });

  const weights = [45.2, 44.8, 45.1, 45.0, 44.9, 45.2, 45.0];
  for (let i = 0; i < weights.length; i += 1) {
    await addWeightRecord({
      petId: pet.id,
      date: dateOffset(i - (weights.length - 1)),
      weight: weights[i],
      bodyLength: 16.5,
      status: 'normal',
      note: i === weights.length - 1 ? '状态不错' : undefined,
    });
  }

  for (let i = 0; i < 4; i += 1) {
    await addFeedingRecord({
      petId: pet.id,
      date: dateOffset(-i),
      foodType: 'staple',
      amount: 8 + (i % 2),
    });
    await addActivityRecord({
      petId: pet.id,
      date: dateOffset(-i),
      wheelMinutes: 70 + i * 3,
      activeLevel: 4,
      activeTimeRange: '22:00-03:00',
    });
  }

  await addBeddingRecord({ petId: pet.id, date: dateOffset(-5), beddingType: '纸棉' });
  await addBathRecord({ petId: pet.id, date: dateOffset(-2), bathType: 'sand' });
}
