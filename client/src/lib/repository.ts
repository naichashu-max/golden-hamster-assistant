// 仓储层：业务代码统一通过这里读写数据。
// 后续接入云同步时，只需在此处拦截写操作并写入 sync_queue，页面无需改动。
import { STORES, dbClear, dbDelete, dbGet, dbGetAll, dbPut } from './idb';
import { newId, nowIso } from './id';
import { enqueue } from './sync';
import type {
  ActivityRecord,
  BeddingRecord,
  DrinkingRecord,
  FeedingRecord,
  GrowthPhoto,
  Pet,
  WeightRecord,
} from '../types';

export type PetInput = Omit<Pet, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
export type WeightRecordInput = Omit<WeightRecord, 'id' | 'createdAt'>;
export type GrowthPhotoInput = Omit<GrowthPhoto, 'id' | 'createdAt'>;
export type FeedingRecordInput = Omit<FeedingRecord, 'id' | 'createdAt'>;
export type DrinkingRecordInput = Omit<DrinkingRecord, 'id' | 'createdAt'>;
export type BeddingRecordInput = Omit<BeddingRecord, 'id' | 'createdAt'>;
export type ActivityRecordInput = Omit<ActivityRecord, 'id' | 'createdAt'>;

/** 给新记录补齐 id 与创建时间 */
function withMeta<T>(value: T): T & { id: string; createdAt: string } {
  return { ...value, id: newId(), createdAt: nowIso() };
}

// ---------- 宠物档案 ----------

export async function listPets(): Promise<Pet[]> {
  const pets = await dbGetAll<Pet>(STORES.pets);
  return pets.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getPet(id: string): Promise<Pet | undefined> {
  return dbGet<Pet>(STORES.pets, id);
}

export async function savePet(input: PetInput): Promise<Pet> {
  const existing = input.id ? await getPet(input.id) : undefined;
  const now = nowIso();
  const pet: Pet = {
    id: input.id ?? newId(),
    name: input.name,
    birthDate: input.birthDate,
    breed: input.breed,
    gender: input.gender,
    photo: input.photo,
    personality: input.personality,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await dbPut(STORES.pets, pet);
  // 预留云同步：档案变更进入待同步队列，本地模式不会真正推送。
  await enqueue(STORES.pets, pet.id, 'upsert', pet);
  return pet;
}

export async function deletePet(id: string): Promise<void> {
  // 删除档案时级联清理其所有记录，保持本地数据一致。
  await dbDelete(STORES.pets, id);
  await enqueue(STORES.pets, id, 'delete', { id });
  const recordStores = [
    STORES.weightRecords,
    STORES.growthPhotos,
    STORES.feedingRecords,
    STORES.drinkingRecords,
    STORES.beddingRecords,
    STORES.activityRecords,
    STORES.dailyReports,
  ];
  for (const store of recordStores) {
    const all = await dbGetAll<{ id: string; petId: string }>(store);
    const targets = all.filter((r) => r.petId === id);
    await Promise.all(
      targets.map(async (r) => {
        await dbDelete(store, r.id);
        await enqueue(store, r.id, 'delete', { id: r.id });
      }),
    );
  }
}

// ---------- 通用记录读取 ----------

async function listRecords<T extends { petId: string; date: string; createdAt: string }>(
  store: string,
  petId: string,
): Promise<T[]> {
  const all = await dbGetAll<T>(store);
  return all
    .filter((r) => r.petId === petId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

// ---------- 体重记录 ----------

export const listWeightRecords = (petId: string) =>
  listRecords<WeightRecord>(STORES.weightRecords, petId);

export async function addWeightRecord(input: WeightRecordInput): Promise<WeightRecord> {
  const record = withMeta(input);
  await dbPut(STORES.weightRecords, record);
  await enqueue(STORES.weightRecords, record.id, 'upsert', record);
  return record;
}

// ---------- 成长相册 ----------

export const listGrowthPhotos = (petId: string) =>
  listRecords<GrowthPhoto>(STORES.growthPhotos, petId);

export async function addGrowthPhoto(input: GrowthPhotoInput): Promise<GrowthPhoto> {
  const record = withMeta(input);
  await dbPut(STORES.growthPhotos, record);
  await enqueue(STORES.growthPhotos, record.id, 'upsert', record);
  return record;
}

// ---------- 喂食 / 饮水 / 换垫料 / 洗澡 ----------

export const listFeedingRecords = (petId: string) =>
  listRecords<FeedingRecord>(STORES.feedingRecords, petId);

export const listDrinkingRecords = (petId: string) =>
  listRecords<DrinkingRecord>(STORES.drinkingRecords, petId);

export const listBeddingRecords = (petId: string) =>
  listRecords<BeddingRecord>(STORES.beddingRecords, petId);

export async function addFeedingRecord(input: FeedingRecordInput): Promise<FeedingRecord> {
  const record = withMeta(input);
  await dbPut(STORES.feedingRecords, record);
  await enqueue(STORES.feedingRecords, record.id, 'upsert', record);
  return record;
}

export async function addDrinkingRecord(input: DrinkingRecordInput): Promise<DrinkingRecord> {
  const record = withMeta(input);
  await dbPut(STORES.drinkingRecords, record);
  await enqueue(STORES.drinkingRecords, record.id, 'upsert', record);
  return record;
}

export async function addBeddingRecord(input: BeddingRecordInput): Promise<BeddingRecord> {
  const record = withMeta(input);
  await dbPut(STORES.beddingRecords, record);
  await enqueue(STORES.beddingRecords, record.id, 'upsert', record);
  return record;
}

// ---------- 活动记录 ----------

export const listActivityRecords = (petId: string) =>
  listRecords<ActivityRecord>(STORES.activityRecords, petId);

export async function addActivityRecord(input: ActivityRecordInput): Promise<ActivityRecord> {
  const record = withMeta(input);
  await dbPut(STORES.activityRecords, record);
  await enqueue(STORES.activityRecords, record.id, 'upsert', record);
  return record;
}

// ---------- 删除单条记录 ----------

export async function deleteRecord(store: string, id: string): Promise<void> {
  await dbDelete(store, id);
  await enqueue(store, id, 'delete', { id });
}

// ---------- 清空全部本地数据（开发/重置用） ----------

export async function resetAllData(): Promise<void> {
  await Promise.all(Object.values(STORES).map((store) => dbClear(store)));
}

// ---------- 示例数据 ----------
// 首次进入时用于演示完整界面；用户可以删除后建立自己的档案。

let seedPromise: Promise<void> | null = null;

// 用模块级 Promise 防止 React StrictMode 在开发环境重复挂载时重复写入示例数据。
export function seedDemoData(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().finally(() => {
      seedPromise = null;
    });
  }
  return seedPromise;
}

async function runSeed(): Promise<void> {
  const pets = await listPets();
  if (pets.length > 0) return;

  const base = new Date();
  const dateOffset = (days: number) => {
    const d = new Date(base);
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
}
