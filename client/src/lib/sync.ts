// 云同步接口预留：本地优先存储，未来通过实现 SyncAdapter 接入云端。
// 当前默认使用 LocalOnlyAdapter（不推送任何数据）。
import { STORES, dbGetAll, dbPut } from './idb';
import { newId } from './id';
import type { SyncItem, SyncOperation } from '../types';

export interface RemoteChange {
  entity: string;
  entityId: string;
  operation: SyncOperation;
  payload: string;
}

export interface SyncAdapter {
  /** 将本地待同步队列推送到云端 */
  push(queue: SyncItem[]): Promise<void>;
  /** 拉取云端自某个时间点以来的变更 */
  pull(since: number): Promise<RemoteChange[]>;
}

/** 本地模式：数据只保存在设备上，不推送。 */
export class LocalOnlyAdapter implements SyncAdapter {
  async push(): Promise<void> {
    // 预留：本地模式无需网络请求。
  }
  async pull(): Promise<RemoteChange[]> {
    return [];
  }
}

/** 把一次本地写操作加入待同步队列。 */
export async function enqueue(
  entity: string,
  entityId: string,
  operation: SyncOperation,
  payload: unknown,
): Promise<void> {
  const item: SyncItem = {
    id: newId(),
    entity,
    entityId,
    operation,
    payload: JSON.stringify(payload),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  await dbPut(STORES.syncQueue, item);
}

export async function pendingSyncItems(): Promise<SyncItem[]> {
  const all = await dbGetAll<SyncItem>(STORES.syncQueue);
  return all.filter((item) => item.status === 'pending');
}

/** 同步服务：与具体适配器解耦，业务层只需调用 flush。 */
export class SyncService {
  constructor(private readonly adapter: SyncAdapter) {}

  async flush(): Promise<number> {
    const items = await pendingSyncItems();
    if (items.length === 0) return 0;
    await this.adapter.push(items);
    for (const item of items) {
      await dbPut(STORES.syncQueue, { ...item, status: 'synced' });
    }
    return items.length;
  }
}
