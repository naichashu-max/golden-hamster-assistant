// 记录路由：以 type 区分实体类型，统一处理各类成长/日常/活动记录。
import { Router } from 'express';
import { deleteEntity, isKnownTable, listEntities, upsertEntity } from '../db/database.js';

export const recordsRouter = Router();

const RECORD_TYPES = [
  'weight_records',
  'growth_photos',
  'feeding_records',
  'drinking_records',
  'bedding_records',
  'bath_records',
  'activity_records',
  'daily_reports',
] as const;

recordsRouter.get('/types', (_req, res) => {
  res.json(RECORD_TYPES);
});

recordsRouter.get('/:type', (req, res) => {
  const type = req.params.type;
  if (!RECORD_TYPES.includes(type as (typeof RECORD_TYPES)[number])) {
    res.status(400).json({ error: '未知记录类型' });
    return;
  }
  const petId = String(req.query.petId ?? '');
  res.json(listEntities(type, petId || undefined));
});

recordsRouter.post('/:type', (req, res) => {
  const type = req.params.type;
  if (!isKnownTable(type)) {
    res.status(400).json({ error: '未知记录类型' });
    return;
  }
  const record = req.body as Record<string, unknown>;
  if (!record.id) {
    res.status(400).json({ error: '缺少 id' });
    return;
  }
  upsertEntity(type, record);
  res.status(201).json(record);
});

recordsRouter.delete('/:type/:id', (req, res) => {
  const type = req.params.type;
  if (!isKnownTable(type)) {
    res.status(400).json({ error: '未知记录类型' });
    return;
  }
  deleteEntity(type, req.params.id);
  res.status(204).end();
});
