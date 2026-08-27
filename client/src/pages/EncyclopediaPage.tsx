// 百科：金丝熊能吃吗速查 + 垫料容积计算器。
import { useMemo, useState } from 'react';
import { Card } from '../components/Card';
import type { FoodSafety } from '../lib/foodData';
import { searchFoods } from '../lib/foodData';

const LEVEL_META: Record<FoodSafety, { emoji: string; label: string }> = {
  safe: { emoji: '🟢', label: '安全' },
  caution: { emoji: '🟡', label: '微量慎食' },
  forbidden: { emoji: '🔴', label: '严禁剧毒' },
};

interface CalcResult {
  area: number;
  liters: number;
  advice: string;
  tone: 'warn' | 'mid' | 'good';
}

function computeBedding(length: number, width: number, depth: number): CalcResult | null {
  if (length <= 0 || width <= 0 || depth <= 0) return null;
  const area = length * width;
  const liters = Math.round(((area * depth) / 1000) * 10) / 10;
  let advice = '';
  let tone: CalcResult['tone'] = 'mid';
  if (area < 3000) {
    advice = '底面积偏小（低于 3000 cm²），金丝熊需要更大的活动空间，建议考虑更大的笼具。';
    tone = 'warn';
  } else if (area < 5000) {
    advice = '空间尚可，但金丝熊更推荐 ≥ 5000 cm² 的底面积，能跑动、挖洞会更开心。';
    tone = 'mid';
  } else {
    advice = '空间很宽敞，符合金丝熊的理想居住标准 👍';
    tone = 'good';
  }
  return { area, liters, advice, tone };
}

export function EncyclopediaPage() {
  const [tab, setTab] = useState<'food' | 'calc'>('food');
  const [query, setQuery] = useState('');
  const [cage, setCage] = useState({ length: '100', width: '50', depth: '15' });

  const results = useMemo(() => searchFoods(query), [query]);
  const calc = useMemo(
    () => computeBedding(Number(cage.length), Number(cage.width), Number(cage.depth)),
    [cage],
  );

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">百科小助手</h1>
          <div className="page-subtitle">科学喂养，从“能吃吗”开始</div>
        </div>
      </header>

      <div className="seg-tabs">
        <button
          type="button"
          className={`seg-tab${tab === 'food' ? ' active' : ''}`}
          onClick={() => setTab('food')}
        >
          🍎 能吃吗
        </button>
        <button
          type="button"
          className={`seg-tab${tab === 'calc' ? ' active' : ''}`}
          onClick={() => setTab('calc')}
        >
          🧮 垫料计算器
        </button>
      </div>

      {tab === 'food' ? (
        <>
          <Card title="金丝熊能吃吗？" icon="🍎">
            <div className="field">
              <input
                type="search"
                value={query}
                placeholder="输入食材名，比如：苹果、洋葱…"
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <p className="muted text-sm" style={{ margin: '0 0 10px' }}>
              共 {results.length} 条结果，不确定的食材先查再喂。
            </p>
            <div className="food-list">
              {results.map((food) => (
                <div className="food-item" key={food.name}>
                  <div className="food-main">
                    <div className="food-name">{food.name}</div>
                    <div className="food-note">{food.note}</div>
                  </div>
                  <span className={`level-badge ${food.level}`}>
                    {LEVEL_META[food.level].emoji} {LEVEL_META[food.level].label}
                  </span>
                </div>
              ))}
              {results.length === 0 && (
                <div className="empty-state">
                  <span className="empty-icon">🔍</span>
                  没找到，换个名字试试；不确定就选不喂
                </div>
              )}
            </div>
          </Card>
          <p className="muted text-sm" style={{ textAlign: 'center' }}>
            内容为常见饲养经验汇总，仅供参考；如有疑问请咨询有经验的兽医。
          </p>
        </>
      ) : (
        <>
          <Card title="垫料容积计算器" icon="🧮">
            <div className="field">
              <label htmlFor="cage-length">笼具长 (cm)</label>
              <input
                id="cage-length"
                type="number"
                inputMode="decimal"
                value={cage.length}
                onChange={(e) => setCage((p) => ({ ...p, length: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="cage-width">笼具宽 (cm)</label>
              <input
                id="cage-width"
                type="number"
                inputMode="decimal"
                value={cage.width}
                onChange={(e) => setCage((p) => ({ ...p, width: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="cage-depth">目标铺设厚度 (cm，推荐 15)</label>
              <input
                id="cage-depth"
                type="number"
                inputMode="decimal"
                value={cage.depth}
                onChange={(e) => setCage((p) => ({ ...p, depth: e.target.value }))}
              />
            </div>

            {calc && (
              <div className={`calc-result ${calc.tone}`}>
                <div className="calc-big">
                  需要垫料约 <strong>{calc.liters} L</strong>
                </div>
                <div className="calc-sub">底面积 {calc.area} cm²</div>
                <p className="calc-advice">{calc.advice}</p>
              </div>
            )}
          </Card>
          <Card title="垫料小知识" icon="💡">
            <ul className="muted text-sm" style={{ margin: 0, paddingLeft: 20 }}>
              <li>金丝熊爱挖洞，垫料建议铺 15cm 以上，越厚越有安全感。</li>
              <li>纸棉吸湿柔软；木屑选择无粉尘的软木屑，避免松木、雪松。</li>
              <li>局部铲屎/清尿沙约 2~3 天一次，整笼大扫除换垫料约 30~45 天一次。</li>
            </ul>
          </Card>
        </>
      )}
    </>
  );
}
