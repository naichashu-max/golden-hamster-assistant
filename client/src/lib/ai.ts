// AI 陪伴：默认使用本地规则引擎，基于历史记录给出温和建议。
// 保留 CloudAiAdapter，未来可无缝切换到大模型，而不改动页面代码。
import type { AiReply, PetContext } from '../types';
import { formatNumber } from './format';

export interface AiAdapter {
  reply(input: string, context: PetContext): Promise<AiReply>;
}

type Category =
  | 'activity_low'
  | 'wheel'
  | 'eat_low'
  | 'eat_high'
  | 'water'
  | 'weight_low'
  | 'weight_high'
  | 'care'
  | 'mood'
  | 'general';

const RULES: Array<{ category: Category; keywords: string[] }> = [
  { category: 'activity_low', keywords: ['不怎么出来', '不太出来', '没怎么出来', '很少出来', '不出来', '不活动', '没精神', '懒', '少动', '躲着', '睡觉', '不动', '没力气', '蔫'] },
  { category: 'wheel', keywords: ['跑轮', '跑步', '运动', '转轮', '跑步机'] },
  { category: 'eat_low', keywords: ['不吃', '吃得少', '没胃口', '食欲不好', '挑食', '饭量小'] },
  { category: 'eat_high', keywords: ['吃得多', '贪吃', '食欲好', '老想吃', '能吃'] },
  { category: 'water', keywords: ['喝水', '饮水', '不喝水', '口渴'] },
  { category: 'weight_low', keywords: ['瘦', '轻了', '变轻', '掉体重', '太轻'] },
  { category: 'weight_high', keywords: ['胖', '重了', '变重', '长胖', '太胖'] },
  { category: 'care', keywords: ['垫料', '洗澡', '沙浴', '换笼', '清理', '打扫'] },
  { category: 'mood', keywords: ['害怕', '紧张', '咬人', '亲人', '情绪', '脾气', '怕我'] },
];

function detectCategory(input: string): Category {
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => input.includes(kw))) return rule.category;
  }
  return 'general';
}

/** 输入中出现较值得警惕的描述时，追加一句温和的线下建议，而不是给出诊断。 */
function containsConcerningWord(input: string): boolean {
  const words = ['病', '死', '软便', '拉稀', '湿尾', '流血', '呼吸', '抽搐', '不吃不喝', '摔'];
  return words.some((w) => input.includes(w));
}

function recentAverageWheel(context: PetContext): number | null {
  const acts = context.recentActivity.slice(-3);
  if (acts.length === 0) return null;
  return acts.reduce((sum, a) => sum + a.wheelMinutes, 0) / acts.length;
}

function compose(category: Category, input: string, context: PetContext): string {
  const name = context.pet.name || '它';
  const suffix = containsConcerningWord(input)
    ? ' 如果这种情况持续，建议尽快联系有经验的兽医，我这边只能给你日常观察建议。'
    : '';

  switch (category) {
    case 'activity_low': {
      const wheel = recentAverageWheel(context);
      const wheelText = wheel === null ? '' : ` 最近它平均跑轮约 ${formatNumber(wheel, 0)} 分钟。`;
      return `${name} 是夜行动物，白天不怎么出来其实很常见。${wheelText} 可以今晚睡前留意一下它出窝和吃粮的情况；连续两三天都几乎不活动、也不怎么吃，再考虑带去给有经验的兽医看看。${suffix}`;
    }
    case 'wheel':
      return `跑轮对金丝熊来说既是运动也是解压，记得选择静音、直径足够的跑轮，并定期检查是否顺滑。${name} 如果每晚都能跑一会儿，通常是心情不错的表现。${suffix}`;
    case 'eat_low':
      return `${name} 食量减少可能和换粮、天气或藏粮习惯有关。可以先检查一下它是不是把粮食囤进了窝里，再连续记录几天食量，暂时不要频繁更换食谱。${suffix}`;
    case 'eat_high':
      return `${name} 食欲好是让人安心的事。金丝熊有囤粮习惯，喂食量以“第二天有少量剩余”为宜，避免一次给太多高糖零食。${suffix}`;
    case 'water':
      return `饮水变化可以结合天气和食物来看：天气热或吃了较干的粮时，喝水量会多一些。记得每天换新鲜的水，如果连续明显不喝水或狂喝水，建议咨询有经验的兽医。${suffix}`;
    case 'weight_low':
      return `体重下降要先看趋势，而不是单次数字。建议每天在相近时间称重并记录，如果一周内持续下降，再考虑带去检查。这里不判断疾病，只帮你把变化看清楚。${suffix}`;
    case 'weight_high':
      return `体重上升可能是吃得好、动得少，也可能只是囤粮后的“毛重”。可以结合跑轮时间和食量一起看，适当控制高糖零食、保持运动。${suffix}`;
    case 'care':
      return `日常护理里，饮水每天换、垫料一般 7 天左右换一次，沙浴可以每 2-3 天给一次。记录完成后，首页会帮你自动算好距离下次护理的时间。${suffix}`;
    case 'mood':
      return `${name} 刚到新环境或被打扰时，会有一段适应期。保持动作轻柔、固定时间喂食，慢慢它就会熟悉你的气味。观察它的耳朵和身体状态，是了解情绪的好办法。${suffix}`;
    default:
      return `我在听～ 你可以告诉我 ${name} 今天吃得怎么样、晚上有没有出来跑轮，或者体重有没有变化，我会结合最近的记录给你一些温和的建议。${suffix}`;
  }
}

/** 本地规则引擎：无需网络，依据历史记录即时回复。 */
export class RuleBasedAiAdapter implements AiAdapter {
  async reply(input: string, context: PetContext): Promise<AiReply> {
    return { text: compose(detectCategory(input), input, context), source: 'rule-based' };
  }
}

/** 云端大模型适配器（预留）：由后端代理真实大模型，前端无需暴露密钥。 */
export class CloudAiAdapter implements AiAdapter {
  constructor(private readonly endpoint = '/api/ai/chat') {}

  async reply(input: string, context: PetContext): Promise<AiReply> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, context }),
    });
    if (!response.ok) throw new Error('AI 服务暂不可用');
    const data = (await response.json()) as { text: string };
    return { text: data.text, source: 'cloud' };
  }
}
