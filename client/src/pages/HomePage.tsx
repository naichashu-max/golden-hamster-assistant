// 首页：温馨问候卡 + 今日快捷打卡 + 最近照片 + 成长曲线。
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { PhotoStrip } from '../components/PhotoStrip';
import { WeightChart } from '../components/WeightChart';
import { useApp } from '../context/AppContext';
import { ageText, daysBetween, todayStr } from '../lib/format';
import { computeHealth, getPetStatus } from '../lib/health';
import type { FoodType } from '../types';

interface CapsuleProps {
  done: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}

/** 快捷打卡胶囊：点击即记录，完成后显示已打卡状态。 */
function CheckCapsule({ done, icon, label, onClick }: CapsuleProps) {
  return (
    <button
      type="button"
      className={`check-capsule${done ? ' done' : ''}`}
      onClick={onClick}
      disabled={done}
    >
      <span className="check-icon" aria-hidden>
        {icon}
      </span>
      <span className="check-label">{label}</span>
      <span className="check-state">{done ? '✓ 已打卡' : '点击打卡'}</span>
    </button>
  );
}

export function HomePage() {
  const { activePet, records, loading, resetDemo, addDrinkingRecord, addFeedingRecord } =
    useApp();
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
          <button className="btn btn-ghost" onClick={() => void resetDemo()}>
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
  const latestActivity = records.activityRecords[records.activityRecords.length - 1];
  const status = getPetStatus(health, latestActivity);
  const today = todayStr();
  const daysAtHome = Math.max(1, daysBetween(activePet.createdAt.slice(0, 10), today) + 1);

  const waterDone = records.drinkingRecords.some((r) => r.date === today);
  const foodDone = (type: FoodType) =>
    records.feedingRecords.some((r) => r.date === today && r.foodType === type);

  const checkWater = async () => {
    if (waterDone) return;
    await addDrinkingRecord({ petId: activePet.id, date: today });
  };
  const checkFood = async (type: FoodType) => {
    if (foodDone(type)) return;
    await addFeedingRecord({ petId: activePet.id, date: today, foodType: type });
  };

  return (
    <>
      {/* 温馨问候卡：不显示生硬的评分数字 */}
      <Card>
        <div className="greeting">
          <div className="avatar">
            {activePet.photo ? <img src={activePet.photo} alt={activePet.name} /> : '🐹'}
          </div>
          <div className="greeting-main">
            <div className="greeting-title">已来到新家第 {daysAtHome} 天</div>
            <div className="greeting-status">状态：{status} 🐹</div>
            <div className="greeting-meta">
              {activePet.name} · {ageText(activePet.birthDate)} · {activePet.breed}
            </div>
          </div>
          <Link className="icon-link" to={`/pet/${activePet.id}`} aria-label="编辑档案">
            ✏️
          </Link>
        </div>
      </Card>

      {/* 今日打卡：把繁琐表单变成四个胶囊 */}
      <Card title="今日打卡" icon="✅">
        <div className="check-grid">
          <CheckCapsule
            done={waterDone}
            icon="💧"
            label="换凉开水"
            onClick={() => void checkWater()}
          />
          <CheckCapsule
            done={foodDone('staple')}
            icon="🥣"
            label="添主粮"
            onClick={() => void checkFood('staple')}
          />
          <CheckCapsule
            done={foodDone('vegetable')}
            icon="🥦"
            label="加点新鲜蔬菜"
            onClick={() => void checkFood('vegetable')}
          />
          <CheckCapsule
            done={foodDone('freeze_dried')}
            icon="🍗"
            label="投喂冻干"
            onClick={() => void checkFood('freeze_dried')}
          />
        </div>
      </Card>

      {/* 体重黄色警报：连续两次环比下降超过 10% 时出现 */}
      {health.alert && (
        <Card title={health.alert.title} icon="🟡">
          <ul className="checklist">
            {health.alert.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card
        title="最近照片"
        icon="📷"
        action={
          <Link className="muted text-sm" to="/growth">
            全部
          </Link>
        }
      >
        <PhotoStrip photos={records.growthPhotos.slice(-6)} />
      </Card>

      <Card
        title="成长曲线"
        icon="📈"
        action={
          <Link className="muted text-sm" to="/growth">
            更多
          </Link>
        }
      >
        <WeightChart points={records.weightRecords.slice(-7)} />
      </Card>
    </>
  );
}
