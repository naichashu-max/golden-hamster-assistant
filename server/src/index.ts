// 服务端入口：提供云同步与 AI 的 REST API。
// 本地优先模式下，客户端无需启动本服务即可使用全部核心功能。
import express from 'express';
import cors from 'cors';
import { deleteEntity, isKnownTable, upsertEntity } from './db/database.js';
import { aiRouter } from './routes/ai.js';
import { healthRouter } from './routes/health.js';
import { petsRouter } from './routes/pets.js';
import { recordsRouter } from './routes/records.js';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health-check', (_req, res) => {
  res.json({ ok: true, name: 'golden-hamster-server' });
});

app.use('/api/pets', petsRouter);
app.use('/api/records', recordsRouter);
app.use('/api/health', healthRouter);
app.use('/api/ai', aiRouter);

// 云同步预留：接收客户端 sync_queue 的 upsert/delete 并写入 SQLite。
app.post('/api/sync/push', (req, res) => {
  const items = req.body?.items as
    | Array<{ entity?: string; entityId?: string; operation?: string; payload?: string }>
    | undefined;
  if (!Array.isArray(items)) {
    res.status(400).json({ error: 'items 必须为数组' });
    return;
  }

  let synced = 0;
  for (const item of items) {
    if (!item.entity || !isKnownTable(item.entity)) continue;
    if (item.operation === 'delete') {
      deleteEntity(item.entity, item.entityId ?? '');
      synced += 1;
      continue;
    }
    try {
      const record = item.payload ? (JSON.parse(item.payload) as Record<string, unknown>) : {};
      if (record.id) {
        upsertEntity(item.entity, record);
        synced += 1;
      }
    } catch {
      // 跳过无法解析的条目，避免单个坏数据阻断整批同步。
    }
  }
  res.json({ synced });
});

app.get('/api/sync/pull', (_req, res) => {
  // 预留：正式接入时按 since 时间戳返回服务端变更增量。
  res.json({ changes: [] });
});

app.listen(PORT, () => {
  console.log(`金丝熊饲养助手服务已启动：http://localhost:${PORT}`);
});
