// 日常管理：喂食、饮水、换垫料、洗澡，并自动计算距离下次护理时间。
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Card } from '../components/Card';
import { useApp } from '../context/AppContext';
import { BATH_TYPE_LABELS, FOOD_TYPE_LABELS } from '../lib/constants';
import { careDueText, formatDate, todayStr } from '../lib/format';
import { computeCareStatus } from '../lib/care';
import { STORES } from '../lib/idb';
import type { BathType, FoodType } from '../types';

interface RowItem {
  id: string;
  date: string;
}

function RecordRows<T extends RowItem>({
  items,
  onDelete,
  render,
}: {
  items: T[];
  onDelete: (id: string) => void;
  render: (item: T) => ReactNode;
}) {
  if (items.length === 0) return <div className="muted text-sm">还没有记录</div>;
  return (
    <div className="record-list">
      {items.slice(0, 3).map((item) => (
        <div className="record-item" key={item.id}>
          <div className="record-main">
            {render(item)}
            <div className="record-date">{formatDate(item.date)}</div>
          </div>
          <button className="delete-btn" type="button" onClick={() => onDelete(item.id)}>
            删除
          </button>
        </div>
      ))}
    </div>
  );
}

export function DailyCarePage() {
  const {
    activePet,
    records,
    addFeedingRecord,
    addDrinkingRecord,
    addBeddingRecord,
    addBathRecord,
    deleteRecord,
  } = useApp();

  const [feeding, setFeeding] = useState({
    date: todayStr(),
    foodType: 'staple' as FoodType,
    amount: '',
    note: '',
  });
  const [drinking, setDrinking] = useState({ date: todayStr(), amount: '', note: '' });
  const [bedding, setBedding] = useState({ date: todayStr(), beddingType: '纸棉', note: '' });
  const [bath, setBath] = useState({ date: todayStr(), bathType: 'sand' as BathType, note: '' });

  if (!activePet) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🐹</span>
        请先在首页创建金丝熊档案
      </div>
    );
  }

  const care = computeCareStatus({
    feeding: records.feedingRecords,
    drinking: records.drinkingRecords,
    bedding: records.beddingRecords,
    bath: records.bathRecords,
  });

  const submitFeeding = async (event: FormEvent) => {
    event.preventDefault();
    if (!feeding.date) return;
    await addFeedingRecord({
      petId: activePet.id,
      date: feeding.date,
      foodType: feeding.foodType,
      amount: feeding.amount ? Number(feeding.amount) : undefined,
      note: feeding.note.trim() || undefined,
    });
    setFeeding((p) => ({ ...p, amount: '', note: '' }));
  };

  const submitDrinking = async (event: FormEvent) => {
    event.preventDefault();
    if (!drinking.date) return;
    await addDrinkingRecord({
      petId: activePet.id,
      date: drinking.date,
      amount: drinking.amount ? Number(drinking.amount) : undefined,
      note: drinking.note.trim() || undefined,
    });
    setDrinking((p) => ({ ...p, amount: '', note: '' }));
  };

  const submitBedding = async (event: FormEvent) => {
    event.preventDefault();
    if (!bedding.date || !bedding.beddingType.trim()) return;
    await addBeddingRecord({
      petId: activePet.id,
      date: bedding.date,
      beddingType: bedding.beddingType.trim(),
      note: bedding.note.trim() || undefined,
    });
    setBedding((p) => ({ ...p, note: '' }));
  };

  const submitBath = async (event: FormEvent) => {
    event.preventDefault();
    if (!bath.date) return;
    await addBathRecord({
      petId: activePet.id,
      date: bath.date,
      bathType: bath.bathType,
      note: bath.note.trim() || undefined,
    });
    setBath((p) => ({ ...p, note: '' }));
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">日常管理</h1>
          <div className="page-subtitle">{activePet.name}的吃喝与清洁</div>
        </div>
      </header>

      <Card title="下次护理" icon="⏰">
        {care.map((item) => (
          <div className="care-item" key={item.key}>
            <div className="care-icon" aria-hidden>
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{item.label}</div>
              <div className="muted text-sm">
                {item.lastDate ? `上次 ${formatDate(item.lastDate)}` : '还没记录过'}
              </div>
            </div>
            <div className={`care-status-${item.status}`}>{careDueText(item.daysUntil)}</div>
          </div>
        ))}
      </Card>

      <Card title="喂食" icon="🌾">
        <form onSubmit={submitFeeding}>
          <div className="grid-2">
            <div className="field">
              <label>日期</label>
              <input
                type="date"
                value={feeding.date}
                onChange={(e) => setFeeding((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>食物类型</label>
              <select
                value={feeding.foodType}
                onChange={(e) => setFeeding((p) => ({ ...p, foodType: e.target.value as FoodType }))}
              >
                {(Object.keys(FOOD_TYPE_LABELS) as FoodType[]).map((key) => (
                  <option key={key} value={key}>
                    {FOOD_TYPE_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label>食量 (g，可选)</label>
            <input
              type="number"
              inputMode="decimal"
              value={feeding.amount}
              placeholder="8"
              onChange={(e) => setFeeding((p) => ({ ...p, amount: e.target.value }))}
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit">
            记录喂食
          </button>
        </form>
        <div className="divider" />
        <RecordRows
          items={records.feedingRecords.slice().reverse()}
          onDelete={(id) => deleteRecord(STORES.feedingRecords, id)}
          render={(item) => `${FOOD_TYPE_LABELS[item.foodType]}${item.amount ? ` · ${item.amount}g` : ''}`}
        />
      </Card>

      <Card title="饮水" icon="💧">
        <form onSubmit={submitDrinking}>
          <div className="grid-2">
            <div className="field">
              <label>日期</label>
              <input
                type="date"
                value={drinking.date}
                onChange={(e) => setDrinking((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>饮水量 (ml，可选)</label>
              <input
                type="number"
                inputMode="decimal"
                value={drinking.amount}
                placeholder="20"
                onChange={(e) => setDrinking((p) => ({ ...p, amount: e.target.value }))}
              />
            </div>
          </div>
          <button className="btn btn-primary btn-block" type="submit">
            记录饮水
          </button>
        </form>
        <div className="divider" />
        <RecordRows
          items={records.drinkingRecords.slice().reverse()}
          onDelete={(id) => deleteRecord(STORES.drinkingRecords, id)}
          render={(item) => (item.amount ? `${item.amount}ml` : '已换新水')}
        />
      </Card>

      <Card title="换垫料" icon="🛏️">
        <form onSubmit={submitBedding}>
          <div className="grid-2">
            <div className="field">
              <label>日期</label>
              <input
                type="date"
                value={bedding.date}
                onChange={(e) => setBedding((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>垫料类型</label>
              <input
                value={bedding.beddingType}
                placeholder="纸棉 / 木屑 / 混合"
                onChange={(e) => setBedding((p) => ({ ...p, beddingType: e.target.value }))}
              />
            </div>
          </div>
          <button className="btn btn-primary btn-block" type="submit">
            记录换垫料
          </button>
        </form>
        <div className="divider" />
        <RecordRows
          items={records.beddingRecords.slice().reverse()}
          onDelete={(id) => deleteRecord(STORES.beddingRecords, id)}
          render={(item) => item.beddingType}
        />
      </Card>

      <Card title="洗澡" icon="🛁">
        <form onSubmit={submitBath}>
          <div className="grid-2">
            <div className="field">
              <label>日期</label>
              <input
                type="date"
                value={bath.date}
                onChange={(e) => setBath((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>方式</label>
              <select
                value={bath.bathType}
                onChange={(e) => setBath((p) => ({ ...p, bathType: e.target.value as BathType }))}
              >
                {(Object.keys(BATH_TYPE_LABELS) as BathType[]).map((key) => (
                  <option key={key} value={key}>
                    {BATH_TYPE_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn btn-primary btn-block" type="submit">
            记录洗澡
          </button>
        </form>
        <div className="divider" />
        <RecordRows
          items={records.bathRecords.slice().reverse()}
          onDelete={(id) => deleteRecord(STORES.bathRecords, id)}
          render={(item) => BATH_TYPE_LABELS[item.bathType]}
        />
      </Card>
    </>
  );
}
