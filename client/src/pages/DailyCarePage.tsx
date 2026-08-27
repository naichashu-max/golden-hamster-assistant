// 日常管理：清洁任务（局部铲屎 / 整笼大扫除）+ 护理倒计时 + 吃喝记录。
// 注意：金丝熊严禁水洗、不使用浴沙，因此没有“洗澡”功能。
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Card } from '../components/Card';
import { useApp } from '../context/AppContext';
import { CLEANING_LABELS, FOOD_TYPE_LABELS } from '../lib/constants';
import { careDueText, formatDate, formatDateTime, nowTime, todayStr } from '../lib/format';
import { computeCareStatus } from '../lib/care';
import { CLOUD_TABLE } from '../lib/cloudRepo';

interface RowItem {
  id: string;
  date: string;
  time?: string;
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
      {items.slice(0, 4).map((item) => (
        <div className="record-item" key={item.id}>
          <div className="record-main">
            {render(item)}
            <div className="record-date">{formatDateTime(item.date, item.time)}</div>
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
  const { activePet, records, addCleaningRecord, deleteRecord } = useApp();
  const [spot, setSpot] = useState({ date: todayStr(), time: nowTime(), note: '' });
  const [deep, setDeep] = useState({
    date: todayStr(),
    time: nowTime(),
    beddingType: '纸棉',
    note: '',
  });
  const [spotError, setSpotError] = useState('');
  const [deepError, setDeepError] = useState('');

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
    cleaning: records.cleaningRecords,
  });

  const submitSpot = async (event: FormEvent) => {
    event.preventDefault();
    if (!spot.date) {
      setSpotError('请选择日期');
      return;
    }
    setSpotError('');
    await addCleaningRecord({
      petId: activePet.id,
      date: spot.date,
      time: spot.time || undefined,
      taskType: 'spot',
      note: spot.note.trim() || undefined,
    });
    setSpot((p) => ({ ...p, note: '' }));
  };

  const submitDeep = async (event: FormEvent) => {
    event.preventDefault();
    if (!deep.date) {
      setDeepError('请选择日期');
      return;
    }
    if (!deep.beddingType.trim()) {
      setDeepError('请填写垫料类型');
      return;
    }
    setDeepError('');
    await addCleaningRecord({
      petId: activePet.id,
      date: deep.date,
      time: deep.time || undefined,
      taskType: 'deep',
      beddingType: deep.beddingType.trim(),
      note: deep.note.trim() || undefined,
    });
    setDeep((p) => ({ ...p, note: '' }));
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">日常管理</h1>
          <div className="page-subtitle">清洁与护理</div>
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

      <Card title={CLEANING_LABELS.spot} icon="🧹">
        <p className="muted text-sm" style={{ marginTop: 0 }}>
          建议 2~3 天清理一次尿沙和粪便，保持干燥卫生。
        </p>
        <form onSubmit={submitSpot}>
          <div className="grid-2">
            <div className="field">
              <label>日期</label>
              <input
                type="date"
                value={spot.date}
                onChange={(e) => {
                  setSpot((p) => ({ ...p, date: e.target.value }));
                  setSpotError('');
                }}
              />
            </div>
            <div className="field">
              <label>时间</label>
              <input
                type="time"
                value={spot.time}
                onChange={(e) => setSpot((p) => ({ ...p, time: e.target.value }))}
              />
            </div>
          </div>
          <div className="field">
            <label>备注（可选）</label>
            <input
              value={spot.note}
              placeholder="比如：换了尿沙"
              onChange={(e) => setSpot((p) => ({ ...p, note: e.target.value }))}
            />
          </div>
          {spotError && <div className="form-error" style={{ marginBottom: 10 }}>{spotError}</div>}
          <button className="btn btn-primary btn-block" type="submit">
            记一次局部清理
          </button>
        </form>
      </Card>

      <Card title={CLEANING_LABELS.deep} icon="🏠">
        <p className="muted text-sm" style={{ marginTop: 0 }}>
          建议 30~45 天整笼大扫除一次：清洗笼具、全部更换垫料。
        </p>
        <form onSubmit={submitDeep}>
          <div className="grid-2">
            <div className="field">
              <label>日期</label>
              <input
                type="date"
                value={deep.date}
                onChange={(e) => {
                  setDeep((p) => ({ ...p, date: e.target.value }));
                  setDeepError('');
                }}
              />
            </div>
            <div className="field">
              <label>时间</label>
              <input
                type="time"
                value={deep.time}
                onChange={(e) => setDeep((p) => ({ ...p, time: e.target.value }))}
              />
            </div>
          </div>
          <div className="field">
            <label>新垫料类型</label>
            <input
              value={deep.beddingType}
              placeholder="纸棉 / 软木屑"
              onChange={(e) => {
                setDeep((p) => ({ ...p, beddingType: e.target.value }));
                setDeepError('');
              }}
            />
          </div>
          <div className="field">
            <label>备注（可选）</label>
            <input
              value={deep.note}
              placeholder="可选"
              onChange={(e) => setDeep((p) => ({ ...p, note: e.target.value }))}
            />
          </div>
          {deepError && <div className="form-error" style={{ marginBottom: 10 }}>{deepError}</div>}
          <button className="btn btn-primary btn-block" type="submit">
            记一次整笼大扫除
          </button>
        </form>
      </Card>

      <Card title="清洁记录" icon="🗂️">
        <RecordRows
          items={[...records.cleaningRecords].reverse()}
          onDelete={(id) => void deleteRecord(CLOUD_TABLE.cleaningRecords, id)}
          render={(item) =>
            item.taskType === 'deep'
              ? `${CLEANING_LABELS.deep} · ${item.beddingType ?? ''}`
              : CLEANING_LABELS.spot
          }
        />
      </Card>

      <Card title="最近吃喝" icon="🍽️">
        <div className="section-title" style={{ fontSize: 13 }}>
          喂食
        </div>
        <RecordRows
          items={[...records.feedingRecords].reverse()}
          onDelete={(id) => void deleteRecord(CLOUD_TABLE.feedingRecords, id)}
          render={(item) =>
            `${FOOD_TYPE_LABELS[item.foodType]}${item.amount ? ` · ${item.amount}g` : ''}`
          }
        />
        <div className="divider" />
        <div className="section-title" style={{ fontSize: 13 }}>
          饮水
        </div>
        <RecordRows
          items={[...records.drinkingRecords].reverse()}
          onDelete={(id) => void deleteRecord(CLOUD_TABLE.drinkingRecords, id)}
          render={(item) => (item.amount ? `${item.amount}ml` : '已换凉开水')}
        />
      </Card>
    </>
  );
}
