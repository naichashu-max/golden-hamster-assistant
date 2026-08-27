// 健康评分引擎：根据体重、食量、活跃度趋势生成 0-100 分与温和提醒。
// 重要原则：只做饲养提醒，不输出任何疾病诊断。
import {
  HEALTH_WEIGHTS,
  WEIGHT_CHANGE_ALERT_RATIO,
  WEIGHT_CHANGE_WARN_RATIO,
} from './constants';
import type { ActivityRecord, FeedingRecord, HealthResult, WeightRecord } from '../types';
import { formatNumber } from './format';

interface HealthInput {
  weight: WeightRecord[];
  feeding: FeedingRecord[];
  activity: ActivityRecord[];
}

interface Dimension {
  score: number;
  message: string;
}

/** 把按日期升序的记录切成“近期”与“之前”两段，各最多 take 条。 */
function splitRecentAndPrevious<T>(records: T[], take = 3): { recent: T[]; previous: T[] } {
  const recent = records.slice(-take);
  const previous = records.slice(Math.max(0, records.length - take * 2), records.length - take);
  return { recent, previous };
}

function weightDimension(weights: WeightRecord[]): Dimension {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) {
    return { score: 60, message: '还没有体重记录，先记录第一笔吧。' };
  }

  const latest = sorted[sorted.length - 1];
  const { recent, previous } = splitRecentAndPrevious(sorted);
  const average = (list: WeightRecord[]) => list.reduce((sum, r) => sum + r.weight, 0) / list.length;
  const recentAvg = average(recent);
  const previousAvg = previous.length > 0 ? average(previous) : recentAvg;
  const ratio = Math.abs(recentAvg - previousAvg) / Math.max(previousAvg, 0.01);

  if (ratio <= WEIGHT_CHANGE_WARN_RATIO) {
    return { score: 100, message: `体重 ${formatNumber(latest.weight)}g，近期稳定。` };
  }
  if (ratio <= WEIGHT_CHANGE_ALERT_RATIO) {
    const direction = recentAvg > previousAvg ? '小幅上升' : '小幅下降';
    return { score: 70, message: `体重近期${direction}，建议连续观察。` };
  }
  const direction = recentAvg > previousAvg ? '明显上升' : '明显下降';
  return { score: 40, message: `体重近期${direction}，请留意饮食和活动。` };
}

function foodDimension(feeding: FeedingRecord[]): Dimension {
  const withAmount = feeding.filter((r) => r.amount !== undefined);
  const sorted = [...withAmount].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) {
    return { score: 60, message: '还没有食量记录，可以开始记录喂食量。' };
  }

  const { recent, previous } = splitRecentAndPrevious(sorted);
  const average = (list: FeedingRecord[]) =>
    list.reduce((sum, r) => sum + (r.amount ?? 0), 0) / list.length;
  const recentAvg = average(recent);
  const previousAvg = previous.length > 0 ? average(previous) : recentAvg;
  const ratio = previousAvg > 0 ? recentAvg / previousAvg : 1;

  if (ratio >= 0.7 && ratio <= 1.3) {
    return { score: 100, message: '食量近期稳定。' };
  }
  if (ratio < 0.7) {
    return { score: 50, message: '最近食量偏少，先观察是否挑食或换粮。' };
  }
  return { score: 85, message: '最近食欲不错。' };
}

function activityDimension(activity: ActivityRecord[]): Dimension {
  const sorted = [...activity].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) {
    return { score: 60, message: '还没有活动记录，今晚可以观察一下跑轮时间。' };
  }

  const { recent, previous } = splitRecentAndPrevious(sorted);
  const averageLevel = (list: ActivityRecord[]) =>
    list.reduce((sum, r) => sum + r.activeLevel, 0) / list.length;
  const averageWheel = (list: ActivityRecord[]) =>
    list.reduce((sum, r) => sum + r.wheelMinutes, 0) / list.length;

  const recentLevel = averageLevel(recent);
  const previousLevel = previous.length > 0 ? averageLevel(previous) : recentLevel;
  const recentWheel = averageWheel(recent);

  if (recentLevel >= 4 && recentWheel >= 60) {
    return { score: 100, message: `昨晚活动约 ${formatNumber(recentWheel, 0)} 分钟，活力满满。` };
  }
  if (recentLevel >= 3) {
    return { score: 80, message: '活动正常。' };
  }
  if (recentLevel < previousLevel - 1) {
    return { score: 50, message: '活动量相比之前减少，可能是天气或环境变化。' };
  }
  return { score: 70, message: '活动偏少，可以今晚再观察一下。' };
}

export function computeHealth(input: HealthInput): HealthResult {
  const weight = weightDimension(input.weight);
  const food = foodDimension(input.feeding);
  const activity = activityDimension(input.activity);

  const score = Math.round(
    weight.score * HEALTH_WEIGHTS.weight +
      food.score * HEALTH_WEIGHTS.food +
      activity.score * HEALTH_WEIGHTS.activity,
  );

  const weightTrend =
    weight.score >= 90 ? '体重稳定' : weight.score >= 70 ? '体重略有波动' : '体重变化需留意';
  const activityTrend =
    activity.score >= 90 ? '活动正常' : activity.score >= 70 ? '活动一般' : '活动偏少';

  const reminders: string[] = [];
  if (weight.score <= 70) reminders.push('体重有波动时先连续观察几天，坚持记录每日体重。');
  if (food.score <= 60) reminders.push('食量变化可能和换粮、天气有关，先保持观察，不要频繁更换食谱。');
  if (activity.score <= 70) reminders.push('活动减少时，检查笼内温度、垫料厚度和跑轮是否顺滑。');
  reminders.push('以上只是饲养提醒，不是诊断；若持续异常，请咨询有经验的兽医。');

  return {
    score,
    summary: `最近三天${weightTrend}，${activityTrend}。`,
    reminders,
    breakdown: [
      { label: '体重变化', score: weight.score, message: weight.message },
      { label: '食量变化', score: food.score, message: food.message },
      { label: '活跃度变化', score: activity.score, message: activity.message },
    ],
  };
}
