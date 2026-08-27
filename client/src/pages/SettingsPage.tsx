// 设置：账号信息、数据备份（导出/导入）、重置示例数据与使用说明。
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Card } from '../components/Card';
import { useApp } from '../context/AppContext';
import type { BackupFile } from '../lib/cloudRepo';
import { createBackup, restoreBackup } from '../lib/cloudRepo';
import { todayStr } from '../lib/format';

export function SettingsPage() {
  const { user, pets, signOut, resetDemo, reload } = useApp();
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
      if (!window.confirm('导入会覆盖当前账号的全部数据，确定继续吗？')) return;
      await restoreBackup(parsed);
      await reload();
      setMessage('导入成功，数据已恢复。');
    } catch {
      setMessage('导入失败，文件可能已损坏。');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('确定清空当前账号的全部数据，并重新载入示例档案吗？')) return;
    await resetDemo();
    setMessage('已重置为示例数据。');
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">设置</h1>
          <div className="page-subtitle">账号与数据管理</div>
        </div>
      </header>

      <Card title="我的账号" icon="👤">
        <p className="muted text-sm" style={{ marginTop: 0 }}>
          当前登录：{user?.email ?? '未知邮箱'}
        </p>
        <button className="btn btn-ghost" type="button" onClick={() => void signOut()}>
          切换账号
        </button>
        <p className="muted text-sm" style={{ margin: '10px 0 0' }}>
          切换后回到登录页，可用其他邮箱登录；当前账号的数据会保存在云端。
        </p>
      </Card>

      <Card title="数据备份" icon="💾">
        <p className="muted text-sm" style={{ marginTop: 0 }}>
          数据保存在你的账号云端数据库里，换设备登录同一账号即可看到；导出备份可作为额外保险。
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
          当前账号有 {pets.length} 份档案。清空后可重新载入示例数据体验。
        </p>
        <button className="btn btn-danger" type="button" onClick={() => void handleReset()}>
          清空并载入示例
        </button>
      </Card>

      <Card title="关于" icon="ℹ️">
        <ul className="muted text-sm" style={{ margin: 0, paddingLeft: 20 }}>
          <li>数据保存在你的账号云端数据库，只有你自己能看到。</li>
          <li>在手机浏览器菜单选「添加到主屏幕」，可像 App 一样使用。</li>
          <li>请妥善保管密码；健康评分与 AI 建议仅供日常参考，不替代兽医诊断。</li>
        </ul>
      </Card>
    </>
  );
}
