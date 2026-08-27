// 成长记录：每日体重/身长记录、体重曲线、成长相册。
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Card } from '../components/Card';
import { PhotoStrip } from '../components/PhotoStrip';
import { WeightChart } from '../components/WeightChart';
import { useApp } from '../context/AppContext';
import { WEIGHT_STATUS_LABELS } from '../lib/constants';
import { formatDate, formatNumber, todayStr } from '../lib/format';
import { STORES } from '../lib/idb';
import { fileToResizedDataUrl } from '../lib/image';
import type { WeightStatus } from '../types';

export function GrowthPage() {
  const { activePet, records, addWeightRecord, addGrowthPhoto, deleteRecord } = useApp();
  const [weightForm, setWeightForm] = useState({
    date: todayStr(),
    weight: '',
    bodyLength: '',
    status: 'normal' as WeightStatus,
    note: '',
  });
  const [photoForm, setPhotoForm] = useState({ date: todayStr(), caption: '' });
  const [photoData, setPhotoData] = useState('');

  if (!activePet) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🐹</span>
        请先在首页创建金丝熊档案
      </div>
    );
  }

  const handleAddWeight = async (event: FormEvent) => {
    event.preventDefault();
    const weight = Number(weightForm.weight);
    if (!weightForm.date || Number.isNaN(weight) || weight <= 0) return;
    await addWeightRecord({
      petId: activePet.id,
      date: weightForm.date,
      weight,
      bodyLength: weightForm.bodyLength ? Number(weightForm.bodyLength) : undefined,
      status: weightForm.status,
      note: weightForm.note.trim() || undefined,
    });
    setWeightForm((prev) => ({ ...prev, weight: '', bodyLength: '', note: '' }));
  };

  const onPhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setPhotoData(await fileToResizedDataUrl(file));
    } catch {
      // 图片处理失败时保持原状
    }
  };

  const handleAddPhoto = async (event: FormEvent) => {
    event.preventDefault();
    if (!photoData || !photoForm.date) return;
    await addGrowthPhoto({
      petId: activePet.id,
      date: photoForm.date,
      photo: photoData,
      caption: photoForm.caption.trim() || undefined,
    });
    setPhotoData('');
    setPhotoForm((prev) => ({ ...prev, caption: '' }));
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">成长记录</h1>
          <div className="page-subtitle">{activePet.name}的体重与照片</div>
        </div>
      </header>

      <Card title="体重曲线" icon="📈">
        <WeightChart points={records.weightRecords} />
      </Card>

      <Card title="记录体重 / 身长" icon="⚖️">
        <form onSubmit={handleAddWeight}>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="weight-date">日期</label>
              <input
                id="weight-date"
                type="date"
                value={weightForm.date}
                onChange={(e) => setWeightForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="weight-value">体重 (g)</label>
              <input
                id="weight-value"
                type="number"
                inputMode="decimal"
                placeholder="45.0"
                value={weightForm.weight}
                onChange={(e) => setWeightForm((p) => ({ ...p, weight: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="body-length">身长 (cm)</label>
              <input
                id="body-length"
                type="number"
                inputMode="decimal"
                placeholder="16.5"
                value={weightForm.bodyLength}
                onChange={(e) => setWeightForm((p) => ({ ...p, bodyLength: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="weight-status">状态</label>
              <select
                id="weight-status"
                value={weightForm.status}
                onChange={(e) => setWeightForm((p) => ({ ...p, status: e.target.value as WeightStatus }))}
              >
                {(Object.keys(WEIGHT_STATUS_LABELS) as WeightStatus[]).map((key) => (
                  <option key={key} value={key}>
                    {WEIGHT_STATUS_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="weight-note">备注</label>
            <input
              id="weight-note"
              value={weightForm.note}
              placeholder="可选"
              onChange={(e) => setWeightForm((p) => ({ ...p, note: e.target.value }))}
            />
          </div>

          <button className="btn btn-primary btn-block" type="submit">
            保存体重
          </button>
        </form>
      </Card>

      <Card title="体重历史" icon="🗂️">
        {records.weightRecords.length === 0 ? (
          <div className="muted text-sm">还没有记录</div>
        ) : (
          <div className="record-list">
            {[...records.weightRecords].reverse().map((record) => (
              <div className="record-item" key={record.id}>
                <div className="record-main">
                  <div>
                    {formatNumber(record.weight)}g · {WEIGHT_STATUS_LABELS[record.status]}
                  </div>
                  <div className="record-date">{formatDate(record.date)}</div>
                </div>
                <button
                  className="delete-btn"
                  type="button"
                  onClick={() => deleteRecord(STORES.weightRecords, record.id)}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="成长相册" icon="📷">
        <PhotoStrip photos={records.growthPhotos} />
        <div className="divider" />
        <form onSubmit={handleAddPhoto}>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="photo-date">日期</label>
              <input
                id="photo-date"
                type="date"
                value={photoForm.date}
                onChange={(e) => setPhotoForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="photo-caption">一句话说明</label>
              <input
                id="photo-caption"
                value={photoForm.caption}
                placeholder="可选"
                onChange={(e) => setPhotoForm((p) => ({ ...p, caption: e.target.value }))}
              />
            </div>
          </div>
          <label className="btn btn-ghost btn-block" style={{ marginBottom: 10 }}>
            {photoData ? '已选择照片，点击重新选择' : '选择照片'}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(event) => void onPhotoChange(event)}
            />
          </label>
          <button className="btn btn-primary btn-block" type="submit" disabled={!photoData}>
            上传照片
          </button>
        </form>
      </Card>
    </>
  );
}
