// 活动记录：夜间活动、跑轮时间、活跃度，并生成每日报告。
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card } from '../components/Card';
import { useApp } from '../context/AppContext';
import { formatDateTime, formatNumber, nowTime, todayStr } from '../lib/format';
import { computeHealth } from '../lib/health';
import { STORES } from '../lib/idb';

const LEVEL_LABELS = ['很安静', '较安静', '一般', '活泼', '超级活泼'];

export function ActivityPage() {
  const { activePet, records, addActivityRecord, deleteRecord } = useApp();
  const [form, setForm] = useState({
    date: todayStr(),
    time: nowTime(),
    wheelMinutes: '',
    activeLevel: '4',
    activeTimeRange: '22:00-03:00',
    note: '',
  });
  const [formError, setFormError] = useState('');

  if (!activePet) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🐹</span>
        请先在首页创建金丝熊档案
      </div>
    );
  }

  const health = computeHealth({
    weight: records.weightRecords,
    feeding: records.feedingRecords,
    activity: records.activityRecords,
  });
  const latest = records.activityRecords[records.activityRecords.length - 1];

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.date) {
      setFormError('请选择日期');
      return;
    }
    const wheelMinutes = Number(form.wheelMinutes);
    if (!form.wheelMinutes.trim() || Number.isNaN(wheelMinutes) || wheelMinutes < 0) {
      setFormError('请填写有效的跑轮时间（分钟）');
      return;
    }
    setFormError('');
    await addActivityRecord({
      petId: activePet.id,
      date: form.date,
      time: form.time || undefined,
      wheelMinutes,
      activeLevel: Number(form.activeLevel),
      activeTimeRange: form.activeTimeRange.trim() || undefined,
      note: form.note.trim() || undefined,
    });
    setForm((p) => ({ ...p, wheelMinutes: '', note: '' }));
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">活动记录</h1>
          <div className="page-subtitle">{activePet.name}昨晚过得怎么样</div>
        </div>
      </header>

      <Card title="每日报告" icon="📝">
        <div className="grid-3" style={{ marginBottom: 12 }}>
          <div className="metric">
            <span className="metric-icon">🌙</span>
            <span className="metric-value">{formatNumber(latest?.wheelMinutes ?? 0, 0)}</span>
            <span className="metric-label">跑轮(分钟)</span>
          </div>
          <div className="metric">
            <span className="metric-icon">✨</span>
            <span className="metric-value">{latest ? `${latest.activeLevel}/5` : '—'}</span>
            <span className="metric-label">活跃度</span>
          </div>
          <div className="metric">
            <span className="metric-icon">📅</span>
            <span className="metric-value">{records.activityRecords.length}</span>
            <span className="metric-label">记录天数</span>
          </div>
        </div>
        <p style={{ margin: '0 0 6px', fontWeight: 700 }}>今日小结</p>
        <p className="muted" style={{ margin: 0 }}>
          {health.summary} 这只是日常观察，不是诊断。
        </p>
      </Card>

      <Card title="记录昨晚活动" icon="🌙">
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="grid-2">
              <div className="field">
                <label>日期</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, date: e.target.value }));
                    setFormError('');
                  }}
                />
              </div>
              <div className="field">
                <label>时间</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                />
              </div>
            </div>
            <div className="field">
              <label>跑轮时间 (分钟)</label>
              <input
                type="number"
                inputMode="numeric"
                value={form.wheelMinutes}
                placeholder="76"
                onChange={(e) => {
                  setForm((p) => ({ ...p, wheelMinutes: e.target.value }));
                  setFormError('');
                }}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>活跃程度</label>
              <select
                value={form.activeLevel}
                onChange={(e) => setForm((p) => ({ ...p, activeLevel: e.target.value }))}
              >
                {LEVEL_LABELS.map((label, index) => (
                  <option key={label} value={String(index + 1)}>
                    {index + 1} · {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>活动时段</label>
              <input
                value={form.activeTimeRange}
                placeholder="22:00-03:00"
                onChange={(e) => setForm((p) => ({ ...p, activeTimeRange: e.target.value }))}
              />
            </div>
          </div>

          <div className="field">
            <label>备注</label>
            <input
              value={form.note}
              placeholder="可选"
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            />
          </div>

          {formError && <div className="form-error" style={{ marginBottom: 10 }}>{formError}</div>}
          <button className="btn btn-primary btn-block" type="submit">
            保存活动记录
          </button>
        </form>
      </Card>

      <Card title="最近活动" icon="🗂️">
        {records.activityRecords.length === 0 ? (
          <div className="muted text-sm">还没有记录</div>
        ) : (
          <div className="record-list">
            {[...records.activityRecords].reverse().map((record) => (
              <div className="record-item" key={record.id}>
                <div className="record-main">
                  <div>
                    {formatNumber(record.wheelMinutes, 0)} 分钟 · 活跃度 {record.activeLevel}/5
                  </div>
                  <div className="record-date">{formatDateTime(record.date, record.time)}</div>
                </div>
                <button
                  className="delete-btn"
                  type="button"
                  onClick={() => deleteRecord(STORES.activityRecords, record.id)}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
