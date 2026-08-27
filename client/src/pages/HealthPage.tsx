// 健康分析：展示健康评分、三个维度趋势与温和饲养提醒。
// 强调：只做饲养提醒，不做疾病诊断。
import { Card } from '../components/Card';
import { ProgressRing } from '../components/ProgressRing';
import { useApp } from '../context/AppContext';
import { computeHealth } from '../lib/health';

export function HealthPage() {
  const { activePet, records } = useApp();

  if (!activePet) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🐹</span>
        请先在首页创建金丝熊档案
      </div>
    );
  }

  const health = computeHealth({
    weight: records.weightRecords,
    feeding: records.feedingRecords,
    activity: records.activityRecords,
  });

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">健康分析</h1>
          <div className="page-subtitle">只看趋势，不做诊断</div>
        </div>
      </header>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <ProgressRing value={health.score} size={116} stroke={10}>
            <div style={{ fontSize: 30, fontWeight: 800 }}>{health.score}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              健康评分
            </div>
          </ProgressRing>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>给 {activePet.name} 的小结</div>
            <p className="muted" style={{ margin: 0 }}>
              {health.summary}
            </p>
          </div>
        </div>
      </Card>

      <Card title="趋势分析" icon="📊">
        {health.breakdown.map((item) => (
          <div key={item.label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 700 }}>{item.label}</span>
              <span className="muted">{item.score}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${item.score}%` }} />
            </div>
            <div className="muted text-sm" style={{ marginTop: 6 }}>
              {item.message}
            </div>
          </div>
        ))}
      </Card>

      <Card title="饲养提醒" icon="💡">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {health.reminders.map((reminder) => (
            <li key={reminder} style={{ marginBottom: 8 }}>
              {reminder}
            </li>
          ))}
        </ul>
      </Card>

      <p className="muted text-sm" style={{ textAlign: 'center' }}>
        本应用仅提供日常饲养参考，不能替代专业兽医建议。
      </p>
    </>
  );
}
