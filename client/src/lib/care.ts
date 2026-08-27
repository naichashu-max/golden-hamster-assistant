// 日常护理：根据最近一次护理日期，自动计算距离下次护理的时间。
import { CARE_INTERVALS } from './constants';
import type {
  BathRecord,
  BeddingRecord,
  CareKey,
  CareStatus,
  DrinkingRecord,
  FeedingRecord,
} from '../types';
import { addDays, daysBetween, todayStr } from './format';

interface CareInput {
  feeding: FeedingRecord[];
  drinking: DrinkingRecord[];
  bedding: BeddingRecord[];
  bath: BathRecord[];
  today?: string;
}

export function computeCareStatus(input: CareInput): CareStatus[] {
  const today = input.today ?? todayStr();

  const latest = (dates: string[]): string | undefined => {
    if (dates.length === 0) return undefined;
    const sorted = [...dates].sort();
    return sorted[sorted.length - 1];
  };

  const build = (key: CareKey, dates: string[]): CareStatus => {
    const config = CARE_INTERVALS[key];
    const lastDate = latest(dates);
    // 从未护理过时，默认今天就该做，提醒用户建立习惯。
    const nextDate = lastDate ? addDays(lastDate, config.intervalDays) : today;
    const daysUntil = daysBetween(today, nextDate);
    const status: CareStatus['status'] =
      daysUntil < 0 ? 'overdue' : daysUntil <= 1 ? 'soon' : 'ok';
    return {
      key,
      label: config.label,
      icon: config.icon,
      lastDate,
      intervalDays: config.intervalDays,
      daysUntil,
      nextDate,
      status,
    };
  };

  return [
    build('feeding', input.feeding.map((r) => r.date)),
    build('drinking', input.drinking.map((r) => r.date)),
    build('bedding', input.bedding.map((r) => r.date)),
    build('bath', input.bath.map((r) => r.date)),
  ];
}
