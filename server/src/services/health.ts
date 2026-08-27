// 服务端健康评分：与客户端规则保持一致，供云同步后生成报告使用。
// 只做饲养提醒，不做疾病诊断。

interface Row {
  [key: string]: unknown;
}

function average(rows: Row[], key: string): number {
  if (rows.length === 0) return 0;
  return rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0) / rows.length;
}

function trendScore(
  rows: Row[],
  key: string,
  neutral = 60,
): { score: number; message: string } {
  const sorted = [...rows].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (sorted.length === 0) return { score: neutral, message: '暂无足够记录' };
  const recent = sorted.slice(-3);
  const previous = sorted.slice(Math.max(0, sorted.length - 6), sorted.length - 3);
  const recentAvg = average(recent, key);
  const previousAvg = previous.length > 0 ? average(previous, key) : recentAvg;
  const ratio = previousAvg > 0 ? Math.abs(recentAvg - previousAvg) / previousAvg : 0;
  if (ratio <= 0.05) return { score: 100, message: '近期稳定' };
  if (ratio <= 0.1) return { score: 70, message: '略有波动，建议观察' };
  return { score: 40, message: '变化明显，请留意' };
}

export function computeHealth(weight: Row[], feeding: Row[], activity: Row[]) {
  const weightDim = trendScore(weight, 'weight');
  const foodDim = trendScore(feeding, 'amount');
  const activityDim = trendScore(activity, 'wheelMinutes');

  const score = Math.round(
    weightDim.score * 0.4 + foodDim.score * 0.3 + activityDim.score * 0.3,
  );

  const weightLabel = weightDim.score >= 90 ? '体重稳定' : weightDim.score >= 70 ? '体重略有波动' : '体重变化需留意';
  const activityLabel = activityDim.score >= 90 ? '活动正常' : activityDim.score >= 70 ? '活动一般' : '活动偏少';

  return {
    score,
    summary: `最近三天${weightLabel}，${activityLabel}。`,
    reminders: ['以上只是饲养提醒，不是诊断；若持续异常，请咨询有经验的兽医。'],
    breakdown: [
      { label: '体重变化', score: weightDim.score, message: weightDim.message },
      { label: '食量变化', score: foodDim.score, message: foodDim.message },
      { label: '活跃度变化', score: activityDim.score, message: activityDim.message },
    ],
  };
}
