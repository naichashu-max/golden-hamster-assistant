// 健康分析引擎：体重趋势 + 食量 + 活跃度，输出温和提醒。
// 关键规则：
//   1. 成年金丝熊正常参考体重 120g~180g；
//   2. 连续两次体重环比下降超过 10% 时触发黄色警报并给出排查清单；
//   3. 只做饲养提醒，不做疾病诊断。
import {
  ADULT_WEIGHT,
  HEALTH_WEIGHTS,
  WEIGHT_DROP_ALERT_RATIO,
  WEIGHT_DROP_ALERT_STREAK,
} from './constants';
import type {
  ActivityRecord,
  FeedingRecord,
  HealthAlert,
  HealthResult,
  WeightRecord,
} from '../types';
import { formatNumber } from './format';

interface HealthInput {
  weight: WeightRecord[];
  feeding: FeedingRecord[];
  activity: ActivityRecord[];
}

interface Dimension {
  score: number;
  message: string;
  alert?: HealthAlert | null;
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
  const inRange = latest.weight >= ADULT_WEIGHT.min && latest.weight <= ADULT_WEIGHT.max;
  const direction = latest.weight < ADULT_WEIGHT.min ? '低于' : '高于';
  const rangeText = `当前 ${formatNumber(latest.weight)}g，${inRange ? '处于' : `${direction}`}成年金丝熊 ${ADULT_WEIGHT.min}-${ADULT_WEIGHT.max}g 参考区间`;

  // 连续环比下降检测
  let streak = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1].weight;
    const current = sorted[i].weight;
    if (previous > 0 && (previous - current) / previous > WEIGHT_DROP_ALERT_RATIO) {
      streak += 1;
    } else {
      streak = 0;
    }
  }

  if (streak >= WEIGHT_DROP_ALERT_STREAK) {
    return {
      score: 45,
      message: `连续 ${streak} 次体重环比下降超过 10%，需要留意。${rangeText}。`,
      alert: {
        title: '体重黄色警报',
        checklist: [
          '检查牙齿：是否有过长、断牙或咬合不正',
          '观察排泄：是否软便、拉稀',
          '摸摸颊囊：是否对称、有无硬块或异味',
          '若状态持续异常，请及时咨询有经验的兽医',
        ],
      },
    };
  }

  // 最近一次明显下降（未到连续两次）
  if (sorted.length >= 2) {
    const previous = sorted[sorted.length - 2].weight;
    if (previous > 0 && (previous - latest.weight) / previous > WEIGHT_DROP_ALERT_RATIO) {
      return { score: 70, message: `最近一次体重环比下降超过 10%，请先观察一天再称。${rangeText}。` };
    }
  }

  if (!inRange) {
    return {
      score: 78,
      message: `${rangeText}（幼年金丝熊体重可能更轻，属正常现象）。`,
    };
  }

  return { score: 100, message: `体重 ${formatNumber(latest.weight)}g，近期稳定。` };
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
  if (weight.score <= 70) {
    reminders.push('体重有波动时先连续观察几天，坚持记录每日体重，并留意牙齿、排泄与颊囊。');
  }
  if (food.score <= 60) {
    reminders.push('食量变化可能和换粮、天气有关，先保持观察，不要频繁更换食谱。');
  }
  if (activity.score <= 70) {
    reminders.push('活动减少时，检查笼内温度、垫料厚度和跑轮是否顺滑。');
  }
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
    alert: weight.alert ?? null,
  };
}

/** 顶部问候卡的状态文案：只表达观察到的状态，不做诊断。 */
export function getPetStatus(health: HealthResult, latestActivity?: ActivityRecord): string {
  if (health.alert) return '需要留意';
  if (!latestActivity) return '刚安顿下来，慢慢熟悉中';
  if (latestActivity.activeLevel >= 4) return '活蹦乱跳';
  if (latestActivity.activeLevel >= 3) return '状态平稳';
  return '有点安静';
}
