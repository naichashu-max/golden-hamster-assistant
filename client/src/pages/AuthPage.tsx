// 注册 / 登录页面：账号由 Supabase Auth 管理，登录后才能读写云端数据。
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { isSupabaseConfigured } from '../lib/supabase';

export function AuthPage() {
  const { signIn, signUp } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(() => localStorage.getItem('hamster-last-email') ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: 'info' | 'error'; text: string } | null>(null);

  const configured = isSupabaseConfigured();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!configured) return;
    const mail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setNotice({ type: 'error', text: '请输入正确的邮箱地址' });
      return;
    }
    if (password.length < 6) {
      setNotice({ type: 'error', text: '密码至少需要 6 位' });
      return;
    }
    if (mode === 'register' && password !== confirm) {
      setNotice({ type: 'error', text: '两次输入的密码不一致' });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      if (mode === 'register') {
        const result = await signUp(mail, password);
        localStorage.setItem('hamster-last-email', mail);
        if (result.needsEmailConfirmation) {
          setNotice({
            type: 'info',
            text: '注册成功！请先查收验证邮件完成验证，然后回来登录。',
          });
          setMode('login');
          setPassword('');
          setConfirm('');
        }
        // 未开启邮箱验证时，注册即自动登录，随后由鉴权状态切换进主页。
      } else {
        await signIn(mail, password);
        localStorage.setItem('hamster-last-email', mail);
      }
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : '操作失败，请稍后再试',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo" aria-hidden>
          🐹
        </div>
        <h1 className="auth-title">金丝熊饲养助手</h1>
        <p className="auth-subtitle">记录它每天的小日子，数据只属于你的账号</p>

        {!configured && (
          <div className="auth-notice">
            云端数据库还没配置：请在 client/src/supabaseConfig.ts 中填入 Supabase 的
            URL 与 anon key 后重新发布。
          </div>
        )}

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab${mode === 'login' ? ' active' : ''}`}
            onClick={() => {
              setMode('login');
              setNotice(null);
            }}
          >
            登录
          </button>
          <button
            type="button"
            className={`auth-tab${mode === 'register' ? ' active' : ''}`}
            onClick={() => {
              setMode('register');
              setNotice(null);
            }}
          >
            注册
          </button>
        </div>

        <form onSubmit={(event) => void submit(event)}>
          <div className="field">
            <label htmlFor="auth-email">邮箱</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="auth-password">密码</label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="至少 6 位"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {mode === 'register' && (
            <div className="field">
              <label htmlFor="auth-confirm">确认密码</label>
              <input
                id="auth-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="再输入一次"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          )}

          {notice && <div className={`auth-msg ${notice.type}`}>{notice.text}</div>}

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? '请稍候…' : mode === 'login' ? '登录' : '创建账号'}
          </button>
        </form>

        <p className="auth-footnote">
          {mode === 'login' ? '还没有账号？点击上方「注册」创建一个。' : '注册即表示同意仅用账号保存自己的饲养记录。'}
        </p>
      </div>
    </div>
  );
}
