// 日常护理：根据最近一次护理日期，自动计算距离下次护理的时间。
// 清洁任务分两级：局部铲屎/清尿沙（约 2~3 天）、整笼大扫除换垫料（约 30~45 天）。
import { CARE_INTERVALS } from './constants';
import type { CareKey, CareStatus, CleaningRecord, DrinkingRecord, FeedingRecord } from '../types';
import { addDays, daysBetween, todayStr } from './format';

interface CareInput {
  feeding: FeedingRecord[];
  drinking: DrinkingRecord[];
  cleaning: CleaningRecord[];
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

  const spotDates = input.cleaning.filter((r) => r.taskType === 'spot').map((r) => r.date);
  const deepDates = input.cleaning.filter((r) => r.taskType === 'deep').map((r) => r.date);

  return [
    build('feeding', input.feeding.map((r) => r.date)),
    build('drinking', input.drinking.map((r) => r.date)),
    build('spotClean', spotDates),
    build('deepClean', deepDates),
  ];
}
