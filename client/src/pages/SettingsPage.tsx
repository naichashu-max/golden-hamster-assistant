// 设置：数据备份（导出/导入）、重置示例数据、关于本地存储的说明。
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Card } from '../components/Card';
import { useApp } from '../context/AppContext';
import type { BackupFile } from '../lib/backup';
import { createBackup, restoreBackup } from '../lib/backup';
import { todayStr } from '../lib/format';

export function SettingsPage() {
  const { pets, resetDemo, reload } = useApp();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState('');

  const handleExport = async () => {
    const backup = await createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `金丝熊饲养助手-备份-${todayStr()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage('备份文件已导出，记得保存好它。');
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as BackupFile;
      if (parsed.app !== 'golden-hamster-assistant' || !parsed.stores) {
        setMessage('这不是本应用导出的备份文件。');
        return;
      }
      if (!window.confirm('导入会覆盖当前全部数据，确定继续吗？')) return;
      await restoreBackup(parsed);
      await reload();
      setMessage('导入成功，数据已恢复。');
    } catch {
      setMessage('导入失败，文件可能已损坏。');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('确定清空所有数据，并重新载入示例档案吗？')) return;
    await resetDemo();
    setMessage('已重置为示例数据。');
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">设置</h1>
          <div className="page-subtitle">备份与数据管理</div>
        </div>
      </header>

      <Card title="数据备份" icon="💾">
        <p className="muted text-sm" style={{ marginTop: 0 }}>
          数据保存在当前设备的浏览器里，换设备或清理浏览器前，请先导出备份。
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" type="button" onClick={() => void handleExport()}>
            导出备份
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => fileInput.current?.click()}>
            导入备份
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(event) => void handleImport(event)}
        />
        {message && (
          <p className="text-sm" style={{ margin: '12px 0 0', color: 'var(--primary-deep)' }}>
            {message}
          </p>
        )}
      </Card>

      <Card title="重置" icon="🔄">
        <p className="muted text-sm" style={{ marginTop: 0 }}>
          当前有 {pets.length} 份档案。清空后可重新载入示例数据体验。
        </p>
        <button className="btn btn-danger" type="button" onClick={() => void handleReset()}>
          清空并载入示例
        </button>
      </Card>

      <Card title="关于" icon="ℹ️">
        <ul className="muted text-sm" style={{ margin: 0, paddingLeft: 20 }}>
          <li>在手机浏览器菜单中选「添加到主屏幕」，可像 App 一样使用并离线打开。</li>
          <li>不同设备之间数据相互独立，不会上传到任何服务器。</li>
          <li>健康评分与 AI 建议仅供日常参考，不替代兽医诊断。</li>
        </ul>
      </Card>
    </>
  );
}
