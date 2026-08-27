// 数据备份：把本地 IndexedDB 的全部内容导出为 JSON 文件，或从文件恢复。
// 用于换设备前备份、以及没有云同步时的数据安全兜底。
import { STORES, dbClear, dbGetAll, dbPut } from './idb';

export interface BackupFile {
  app: 'golden-hamster-assistant';
  version: number;
  exportedAt: string;
  stores: Record<string, unknown[]>;
}

const BACKUP_VERSION = 1;
// 同步队列属于内部状态，不随备份导出。
const EXCLUDED_STORES = new Set<string>([STORES.syncQueue]);

export async function createBackup(): Promise<BackupFile> {
  const stores: Record<string, unknown[]> = {};
  for (const store of Object.values(STORES)) {
    if (EXCLUDED_STORES.has(store)) continue;
    stores[store] = await dbGetAll<unknown>(store);
  }
  return {
    app: 'golden-hamster-assistant',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    stores,
  };
}

export async function restoreBackup(file: BackupFile): Promise<void> {
  for (const store of Object.values(STORES)) {
    await dbClear(store);
  }
  for (const [store, items] of Object.entries(file.stores)) {
    for (const item of items) {
      await dbPut(store, item);
    }
  }
}
