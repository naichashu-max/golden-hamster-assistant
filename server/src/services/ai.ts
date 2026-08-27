// 服务端 AI 陪伴（预留云端大模型入口前的本地规则实现）。
// 未来可在此处替换为调用大模型，前端 CloudAiAdapter 无需改动。

interface AiContext {
  pet?: { name?: string };
  recentActivity?: Array<{ wheelMinutes?: number }>;
  [key: string]: unknown;
}

export function composeReply(input: string, context: AiContext): string {
  const name = context.pet?.name || '它';
  const acts = context.recentActivity ?? [];
  const wheel = acts.length
    ? Math.round(acts.reduce((sum, a) => sum + Number(a.wheelMinutes ?? 0), 0) / acts.length)
    : null;

  if (/(不怎么出来|不太出来|没怎么出来|很少出来|不出来|不活动|没精神|懒|少动|躲着|不动)/.test(input)) {
    return `${name} 是夜行动物，白天不怎么出来很常见。${
      wheel !== null ? `最近平均跑轮约 ${wheel} 分钟。` : ''
    }今晚睡前可以留意一下它出窝和吃粮的情况，连续两三天都几乎不活动再考虑带去给有经验的兽医看看。`;
  }
  if (/(不吃|吃得少|没胃口|挑食)/.test(input)) {
    return `${name} 食量减少可能和换粮、天气或藏粮习惯有关。先检查它是不是把粮食囤进窝里，再连续记录几天，不要频繁更换食谱。`;
  }
  if (/(瘦|轻了|掉体重|太轻)/.test(input)) {
    return `体重要看趋势而不是单次数字。建议每天在相近时间称重并记录，一周内持续下降再带去检查。这里不判断疾病，只帮你把变化看清楚。`;
  }
  if (/(胖|重了|长胖|太胖)/.test(input)) {
    return `体重上升可能和吃得多、动得少有关，可以结合跑轮时间和食量一起看，适当控制高糖零食、保持运动。`;
  }
  return `我在听～ 你可以告诉我 ${name} 今天吃得怎么样、晚上有没有出来跑轮，或者体重有没有变化。`;
}
