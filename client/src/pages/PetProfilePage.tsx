// 宠物档案：创建与编辑金丝熊的基本信息、照片和性格描述。
import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/Card';
import { useApp } from '../context/AppContext';
import { GENDER_LABELS } from '../lib/constants';
import { fileToResizedDataUrl } from '../lib/image';
import type { Gender } from '../types';

interface FormState {
  name: string;
  birthDate: string;
  breed: string;
  gender: Gender;
  personality: string;
  photo: string;
}

const DEFAULT_FORM: FormState = {
  name: '',
  birthDate: '2026-01-01',
  breed: '短毛奶油',
  gender: 'unknown',
  personality: '',
  photo: '',
};

export function PetProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pets, savePet, deletePet, loading } = useApp();

  const isNew = !id || id === 'new';
  const existing = pets.find((p) => p.id === id);
  const [form, setForm] = useState<FormState>(() =>
    existing
      ? {
          name: existing.name,
          birthDate: existing.birthDate,
          breed: existing.breed,
          gender: existing.gender,
          personality: existing.personality ?? '',
          photo: existing.photo ?? '',
        }
      : DEFAULT_FORM,
  );

  // 当档案从上下文中异步加载出来后，回填编辑表单。
  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        birthDate: existing.birthDate,
        breed: existing.breed,
        gender: existing.gender,
        personality: existing.personality ?? '',
        photo: existing.photo ?? '',
      });
    }
  }, [existing?.id]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onPhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      update('photo', await fileToResizedDataUrl(file));
    } catch {
      // 图片处理失败时保持原状
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.birthDate) return;
    await savePet({
      id: isNew ? undefined : id,
      name: form.name.trim(),
      birthDate: form.birthDate,
      breed: form.breed.trim() || '未填写',
      gender: form.gender,
      personality: form.personality.trim() || undefined,
      photo: form.photo || undefined,
    });
    navigate('/');
  };

  const handleDelete = async () => {
    if (!isNew && id && window.confirm(`确定删除「${form.name}」的档案吗？相关记录也会一并删除。`)) {
      await deletePet(id);
      navigate('/');
    }
  };

  if (!isNew && loading) {
    return <div className="empty-state">正在加载档案…</div>;
  }

  if (!isNew && !existing) {
    return <div className="empty-state">没有找到这只金丝熊的档案。</div>;
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">{isNew ? '创建档案' : '编辑档案'}</h1>
          <div className="page-subtitle">记录它的名字、生日和小性格</div>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <Card>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
            <div className="avatar">
              {form.photo ? <img src={form.photo} alt="头像预览" /> : '🐹'}
            </div>
            <label className="btn btn-ghost">
              上传照片
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(event) => void onPhotoChange(event)}
              />
            </label>
          </div>

          <div className="field">
            <label htmlFor="name">名字</label>
            <input
              id="name"
              value={form.name}
              placeholder="比如：团子"
              onChange={(e) => update('name', e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="birthDate">出生日</label>
            <input
              id="birthDate"
              type="date"
              value={form.birthDate}
              onChange={(e) => update('birthDate', e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="breed">品种</label>
              <input
                id="breed"
                value={form.breed}
                placeholder="短毛奶油"
                onChange={(e) => update('breed', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="gender">性别</label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) => update('gender', e.target.value as Gender)}
              >
                {(Object.keys(GENDER_LABELS) as Gender[]).map((key) => (
                  <option key={key} value={key}>
                    {GENDER_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="personality">性格描述</label>
            <textarea
              id="personality"
              rows={3}
              value={form.personality}
              placeholder="比如：白天睡觉，晚上爱跑轮，喜欢囤粮"
              onChange={(e) => update('personality', e.target.value)}
            />
          </div>
        </Card>

        <button className="btn btn-primary btn-block" type="submit">
          {isNew ? '创建这只金丝熊' : '保存修改'}
        </button>
        {!isNew && (
          <button
            className="btn btn-danger btn-block"
            type="button"
            style={{ marginTop: 10 }}
            onClick={handleDelete}
          >
            删除档案
          </button>
        )}
      </form>
    </>
  );
}
