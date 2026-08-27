// 首页：我的金丝熊、今日状态、最近照片、成长曲线。
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { PhotoStrip } from '../components/PhotoStrip';
import { ProgressRing } from '../components/ProgressRing';
import { WeightChart } from '../components/WeightChart';
import { useApp } from '../context/AppContext';
import { ageText, formatNumber } from '../lib/format';
import { computeHealth } from '../lib/health';

export function HomePage() {
  const { activePet, records, loading, resetDemo } = useApp();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🐹</span>
        正在打开你的饲养手账…
      </div>
    );
  }

  if (!activePet) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🐹</span>
        <h2>还没有金丝熊档案</h2>
        <p className="muted">先创建一只金丝熊，开始记录它的成长吧。</p>
        <button className="btn btn-primary" onClick={() => navigate('/pet/new')}>
          创建档案
        </button>
        <div style={{ marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={resetDemo}>
            载入示例数据
          </button>
        </div>
      </div>
    );
  }

  const health = computeHealth({
    weight: records.weightRecords,
    feeding: records.feedingRecords,
    activity: records.activityRecords,
  });
  const latestWeight = records.weightRecords[records.weightRecords.length - 1]?.weight;
  const latestActivity = records.activityRecords[records.activityRecords.length - 1];

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">我的金丝熊</h1>
          <div className="page-subtitle">记录它每天的小日子</div>
        </div>
        <Link className="icon-link" to="/settings" aria-label="设置">
          ⚙️
        </Link>
      </header>

      {/* 宠物档案摘要 */}
      <Card>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div className="avatar">
            {activePet.photo ? <img src={activePet.photo} alt={activePet.name} /> : '🐹'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 800 }}>{activePet.name}</span>
              <span className="muted text-sm">{ageText(activePet.birthDate)}</span>
            </div>
            <div className="muted text-sm">
              {activePet.breed}
              {activePet.personality ? ` · ${activePet.personality}` : ''}
            </div>
          </div>
          <Link to={`/pet/${activePet.id}`} className="btn btn-ghost" style={{ padding: '8px 14px' }}>
            编辑
          </Link>
        </div>
      </Card>

      {/* 今日状态 */}
      <Card title="今日状态" icon="✨">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <ProgressRing value={health.score} size={100} stroke={9}>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{health.score}</div>
            <div className="muted" style={{ fontSize: 11 }}>
              健康评分
            </div>
          </ProgressRing>
          <div style={{ flex: 1, display: 'grid', gap: 10 }}>
            <div className="metric" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="metric-icon" style={{ margin: 0 }}>
                ⚖️
              </span>
              <div>
                <div className="metric-value">{formatNumber(latestWeight)}g</div>
                <div className="metric-label">最新体重</div>
              </div>
            </div>
            <div className="metric" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="metric-icon" style={{ margin: 0 }}>
                🌙
              </span>
              <div>
                <div className="metric-value">{formatNumber(latestActivity?.wheelMinutes ?? 0, 0)}分钟</div>
                <div className="metric-label">昨晚活动</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 最近照片 */}
      <Card title="最近照片" icon="📷" action={<Link className="muted text-sm" to="/growth">全部</Link>}>
        <PhotoStrip photos={records.growthPhotos.slice(-6)} />
      </Card>

      {/* 成长曲线 */}
      <Card title="成长曲线" icon="📈" action={<Link className="muted text-sm" to="/growth">更多</Link>}>
        <WeightChart points={records.weightRecords.slice(-7)} />
      </Card>
    </>
  );
}
