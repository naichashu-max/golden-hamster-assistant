// 健康分析路由：根据云端已同步的记录生成评分。
import { Router } from 'express';
import { listEntities } from '../db/database.js';
import { computeHealth } from '../services/health.js';

export const healthRouter = Router();

healthRouter.get('/:petId', (req, res) => {
  const petId = req.params.petId;
  const weight = listEntities('weight_records', petId);
  const feeding = listEntities('feeding_records', petId);
  const activity = listEntities('activity_records', petId);
  res.json(computeHealth(weight, feeding, activity));
});
