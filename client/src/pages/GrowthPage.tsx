// 成长记录：体重/身长记录、体重曲线、拍立得时光相册。
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Card } from '../components/Card';
import { WeightChart } from '../components/WeightChart';
import { useApp } from '../context/AppContext';
import { PHOTO_TAGS, WEIGHT_STATUS_LABELS } from '../lib/constants';
import { formatDate, formatNumber, todayStr } from '../lib/format';
import { CLOUD_TABLE } from '../lib/cloudRepo';
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
  const [photoForm, setPhotoForm] = useState({ date: todayStr(), caption: '', tag: '' });
  const [photoData, setPhotoData] = useState('');
  const [weightError, setWeightError] = useState('');
  const [photoError, setPhotoError] = useState('');

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
    if (!weightForm.date) {
      setWeightError('请选择日期');
      return;
    }
    const weight = Number(weightForm.weight);
    if (!weightForm.weight.trim() || Number.isNaN(weight) || weight <= 0) {
      setWeightError('请填写有效的体重（大于 0）');
      return;
    }
    setWeightError('');
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
    if (!photoForm.date) {
      setPhotoError('请选择日期');
      return;
    }
    if (!photoData) {
      setPhotoError('请先选择一张照片');
      return;
    }
    setPhotoError('');
    await addGrowthPhoto({
      petId: activePet.id,
      date: photoForm.date,
      photo: photoData,
      caption: photoForm.caption.trim() || undefined,
      tag: photoForm.tag || undefined,
    });
    setPhotoData('');
    setPhotoForm((prev) => ({ ...prev, caption: '', tag: '' }));
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">成长记录</h1>
          <div className="page-subtitle">{activePet.name}的体重与时光</div>
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
                onChange={(e) => {
                  setWeightForm((p) => ({ ...p, date: e.target.value }));
                  setWeightError('');
                }}
              />
            </div>
            <div className="field">
              <label htmlFor="weight-value">体重 (g)</label>
              <input
                id="weight-value"
                type="number"
                inputMode="decimal"
                placeholder="150"
                value={weightForm.weight}
                onChange={(e) => {
                  setWeightForm((p) => ({ ...p, weight: e.target.value }));
                  setWeightError('');
                }}
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

          {weightError && <div className="form-error" style={{ marginBottom: 10 }}>{weightError}</div>}
          <button className="btn btn-primary btn-block" type="submit">
            保存体重
          </button>
        </form>
      </Card>

      <Card title="拍立得时光" icon="📸">
        {records.growthPhotos.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📷</span>
            还没有照片，记录下第一张吧
          </div>
        ) : (
          <div className="polaroid-grid">
            {[...records.growthPhotos].reverse().map((photo, index) => (
              <figure
                key={photo.id}
                className="polaroid"
                style={{ transform: `rotate(${((index % 3) - 1) * 1.4}deg)` }}
              >
                <img src={photo.photo} alt={photo.caption ?? '成长照片'} />
                <figcaption>
                  {photo.tag && <span className="polaroid-tag">#{photo.tag}</span>}
                  {photo.caption && <span className="polaroid-caption">{photo.caption}</span>}
                </figcaption>
                <button
                  className="polaroid-delete"
                  type="button"
                  aria-label="删除照片"
                  onClick={() => void deleteRecord(CLOUD_TABLE.growthPhotos, photo.id)}
                >
                  ✕
                </button>
              </figure>
            ))}
          </div>
        )}

        <div className="divider" />
        <form onSubmit={handleAddPhoto}>
          <div className="field">
            <label htmlFor="photo-date">日期</label>
            <input
              id="photo-date"
              type="date"
              value={photoForm.date}
              onChange={(e) => {
                setPhotoForm((p) => ({ ...p, date: e.target.value }));
                setPhotoError('');
              }}
            />
          </div>
          <div className="field">
            <label>选个标签</label>
            <div className="chip-row">
              {PHOTO_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className={`chip${photoForm.tag === tag ? ' active' : ''}`}
                  onClick={() =>
                    setPhotoForm((p) => ({ ...p, tag: p.tag === tag ? '' : tag }))
                  }
                >
                  #{tag}
                </button>
              ))}
            </div>
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
          <label className="btn btn-ghost btn-block" style={{ marginBottom: 10 }}>
            {photoData ? '已选择照片，点击重新选择' : '选择照片'}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(event) => void onPhotoChange(event)}
            />
          </label>
          {photoError && <div className="form-error" style={{ marginBottom: 10 }}>{photoError}</div>}
          <button className="btn btn-primary btn-block" type="submit">
            冲印这张拍立得
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
                  onClick={() => void deleteRecord(CLOUD_TABLE.weightRecords, record.id)}
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
