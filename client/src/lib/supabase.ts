// Supabase 客户端与通用辅助：账号由 Supabase Auth 管理，数据存 Postgres。
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../supabaseConfig';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** 是否已经填入了真实项目密钥（未配置时前端会提示设置步骤）。 */
export function isSupabaseConfigured(): boolean {
  return (
    !SUPABASE_URL.includes('YOUR-PROJECT') &&
    !SUPABASE_ANON_KEY.includes('YOUR-SUPABASE')
  );
}

/** 把 Supabase 的英文错误信息翻译成中文，方便普通用户理解。 */
export function translateAuthError(message: string): string {
  const rules: Array<[string, string]> = [
    ['Invalid login credentials', '邮箱或密码不正确'],
    ['Email not confirmed', '邮箱还没有验证，请先查收验证邮件'],
    ['User already registered', '该邮箱已经注册，请直接登录'],
    ['Password should be at least 6 characters', '密码至少需要 6 位'],
    ['invalid format', '邮箱格式不正确'],
    ['only request this once every', '验证邮件发送太频繁，请稍等一分钟再试'],
    ['Email rate limit exceeded', '邮件发送次数已达上限，请稍后再试'],
  ];
  for (const [keyword, text] of rules) {
    if (message.includes(keyword)) return text;
  }
  return message;
}
