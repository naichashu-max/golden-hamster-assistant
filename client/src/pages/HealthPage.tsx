// 健康分析：温馨状态卡 + 趋势 + 饲养提醒；不做疾病诊断。
import { Card } from '../components/Card';
import { useApp } from '../context/AppContext';
import { daysBetween, todayStr } from '../lib/format';
import { computeHealth, getPetStatus } from '../lib/health';

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
  const latestActivity = records.activityRecords[records.activityRecords.length - 1];
  const status = getPetStatus(health, latestActivity);
  const daysAtHome = Math.max(1, daysBetween(activePet.createdAt.slice(0, 10), todayStr()) + 1);

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">健康分析</h1>
          <div className="page-subtitle">只看趋势，不做诊断</div>
        </div>
      </header>

      <Card>
        <div className="greeting">
          <div className="avatar">
            {activePet.photo ? <img src={activePet.photo} alt={activePet.name} /> : '🐹'}
          </div>
          <div className="greeting-main">
            <div className="greeting-title">已来到新家第 {daysAtHome} 天</div>
            <div className="greeting-status">状态：{status} 🐹</div>
            <div className="greeting-meta">{health.summary}</div>
          </div>
        </div>
      </Card>

      {health.alert && (
        <Card title={health.alert.title} icon="🟡">
          <ul className="checklist">
            {health.alert.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      )}

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
        <ul className="checklist">
          {health.reminders.map((reminder) => (
            <li key={reminder}>{reminder}</li>
          ))}
        </ul>
      </Card>

      <p className="muted text-sm" style={{ textAlign: 'center' }}>
        本应用仅提供日常饲养参考，不能替代专业兽医建议。
      </p>
    </>
  );
}
