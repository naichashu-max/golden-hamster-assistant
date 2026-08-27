// 宠物档案路由：REST 风格，供未来云同步客户端调用。
import { Router } from 'express';
import { deleteEntity, getEntity, listEntities, upsertEntity } from '../db/database.js';

export const petsRouter = Router();

petsRouter.get('/', (_req, res) => {
  res.json(listEntities('pets'));
});

petsRouter.get('/:id', (req, res) => {
  const pet = getEntity('pets', req.params.id);
  if (!pet) {
    res.status(404).json({ error: '未找到该档案' });
    return;
  }
  res.json(pet);
});

petsRouter.post('/', (req, res) => {
  const pet = req.body as Record<string, unknown>;
  if (!pet.id || !pet.name) {
    res.status(400).json({ error: '缺少 id 或 name' });
    return;
  }
  const record = { ...pet, updatedAt: new Date().toISOString() };
  upsertEntity('pets', record);
  res.status(201).json(record);
});

petsRouter.put('/:id', (req, res) => {
  const record = {
    ...(req.body as Record<string, unknown>),
    id: req.params.id,
    updatedAt: new Date().toISOString(),
  };
  upsertEntity('pets', record);
  res.json(record);
});

petsRouter.delete('/:id', (req, res) => {
  deleteEntity('pets', req.params.id);
  res.status(204).end();
});
