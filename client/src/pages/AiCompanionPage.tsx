// AI 陪伴：对话入口。当前使用本地规则引擎，依据历史记录给出温和建议。
import { useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { RuleBasedAiAdapter } from '../lib/ai';
import { newId } from '../lib/id';
import type { PetContext } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export function AiCompanionPage() {
  const { activePet, records } = useApp();
  const adapter = useMemo(() => new RuleBasedAiAdapter(), []);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: newId(),
      role: 'assistant',
      text: '嗨，我是你的金丝熊陪伴助手～ 告诉我它今天吃得怎么样、晚上有没有出来跑轮吧。',
    },
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  const context: PetContext | null = activePet
    ? {
        pet: activePet,
        recentActivity: records.activityRecords,
        recentWeight: records.weightRecords,
        recentFeeding: records.feedingRecords,
      }
    : null;

  const send = async () => {
    const text = input.trim();
    if (!text || !context) return;
    setMessages((prev) => [...prev, { id: newId(), role: 'user', text }]);
    setInput('');
    const reply = await adapter.reply(text, context);
    setMessages((prev) => [...prev, { id: newId(), role: 'assistant', text: reply.text }]);
    // 新消息加入后滚动到底部。
    window.setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  if (!activePet) {
    return (
      <div className="empty-state">
        <span className="empty-icon">✨</span>
        需要先创建档案，AI 才能结合它的历史记录给建议。
      </div>
    );
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">AI 陪伴</h1>
          <div className="page-subtitle">基于 {activePet.name} 的历史记录，温和地聊一聊</div>
        </div>
      </header>

      <div className="chat-list">
        {messages.map((message) => (
          <div key={message.id} className={`chat-bubble ${message.role}`}>
            {message.text}
          </div>
        ))}
        <div ref={listRef} />
      </div>

      <div className="chat-input-row">
        <input
          value={input}
          placeholder="比如：今天不怎么出来"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void send();
          }}
        />
        <button className="btn btn-primary" type="button" onClick={() => void send()}>
          发送
        </button>
      </div>

      <p className="muted text-sm" style={{ textAlign: 'center', marginTop: 12 }}>
        AI 只提供饲养陪伴，不替代兽医诊断。
      </p>
    </>
  );
}
