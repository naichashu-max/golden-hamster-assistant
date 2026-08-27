// 底部导航：首页 / 成长 / 日常 / 活动 / 健康，外加悬浮 AI 入口。
import { Link, NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: '首页', icon: '🏠' },
  { to: '/growth', label: '成长', icon: '📈' },
  { to: '/care', label: '日常', icon: '🛁' },
  { to: '/activity', label: '活动', icon: '🌙' },
  { to: '/health', label: '健康', icon: '❤️' },
];

export function BottomNav() {
  return (
    <>
      <nav className="bottom-nav" aria-label="主导航">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon" aria-hidden>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <Link className="ai-fab" to="/ai" aria-label="AI 陪伴">
        ✨
      </Link>
    </>
  );
}
