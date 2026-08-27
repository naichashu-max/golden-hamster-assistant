// AI 陪伴路由：当前使用本地规则，未来可替换为云端大模型代理。
import { Router } from 'express';
import { composeReply } from '../services/ai.js';

export const aiRouter = Router();

aiRouter.post('/chat', (req, res) => {
  const body = req.body as { input?: string; context?: Record<string, unknown> };
  if (!body.input) {
    res.status(400).json({ error: '缺少 input' });
    return;
  }
  res.json({ text: composeReply(body.input, body.context ?? {}) });
});
