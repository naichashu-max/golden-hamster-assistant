// 日期与数值格式化工具。所有日期字符串均为本地 YYYY-MM-DD。

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 返回本地日期字符串 YYYY-MM-DD */
export function todayStr(date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** 在指定日期字符串上加/减天数 */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return todayStr(d);
}

/** 计算 from 到 to 的天数（to - from） */
export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** 展示为 “8月27日” */
export function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 计算年龄文字，如 “7个月12天” */
export function ageText(birthDate: string, now = new Date()): string {
  const birth = new Date(`${birthDate}T00:00:00`);
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  let days = now.getDate() - birth.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 1) return `${Math.max(days, 0)}天`;
  return `${months}个月${days}天`;
}

/** 护理倒计时的友好文案 */
export function careDueText(daysUntil: number): string {
  if (daysUntil < 0) return `已逾期 ${Math.abs(daysUntil)} 天`;
  if (daysUntil === 0) return '今天';
  if (daysUntil === 1) return '明天';
  return `${daysUntil} 天后`;
}

/** 数字保留一位小数，去掉多余的 .0 */
export function formatNumber(value: number | undefined, digits = 1): string {
  if (value === undefined || Number.isNaN(value)) return '—';
  return Number(value.toFixed(digits)).toString();
}
