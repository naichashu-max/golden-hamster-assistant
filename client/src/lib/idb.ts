// IndexedDB 本地存储封装：数据默认保存在设备本地，离线可用。
// 页面不直接使用本模块，而是通过 repository.ts 统一读写。

const DB_NAME = 'golden-hamster-db';
const DB_VERSION = 1;

/** 所有对象仓库，keyPath 统一为实体 id */
export const STORES = {
  pets: 'pets',
  weightRecords: 'weight_records',
  growthPhotos: 'growth_photos',
  feedingRecords: 'feeding_records',
  drinkingRecords: 'drinking_records',
  beddingRecords: 'bedding_records',
  bathRecords: 'bath_records',
  activityRecords: 'activity_records',
  dailyReports: 'daily_reports',
  syncQueue: 'sync_queue',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      Object.values(STORES).forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' });
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

export async function dbGetAll<T>(store: string): Promise<T[]> {
  const database = await open();
  return new Promise((resolve, reject) => {
    const request = database.transaction(store, 'readonly').objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function dbGet<T>(store: string, id: string): Promise<T | undefined> {
  const database = await open();
  return new Promise((resolve, reject) => {
    const request = database.transaction(store, 'readonly').objectStore(store).get(id);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function dbPut<T>(store: string, value: T): Promise<void> {
  const database = await open();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(store, 'readwrite');
    transaction.objectStore(store).put(value);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function dbDelete(store: string, id: string): Promise<void> {
  const database = await open();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(store, 'readwrite');
    transaction.objectStore(store).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function dbClear(store: string): Promise<void> {
  const database = await open();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(store, 'readwrite');
    transaction.objectStore(store).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
