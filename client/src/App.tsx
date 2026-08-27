// 应用入口：未登录时显示注册/登录页，登录后进入主界面。
import { Outlet, Route, Routes } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { EasterEgg } from './components/EasterEgg';
import { useApp } from './context/AppContext';
import { ActivityPage } from './pages/ActivityPage';
import { AiCompanionPage } from './pages/AiCompanionPage';
import { AuthPage } from './pages/AuthPage';
import { DailyCarePage } from './pages/DailyCarePage';
import { GrowthPage } from './pages/GrowthPage';
import { HealthPage } from './pages/HealthPage';
import { HomePage } from './pages/HomePage';
import { PetProfilePage } from './pages/PetProfilePage';
import { SettingsPage } from './pages/SettingsPage';

function Layout() {
  return (
    <>
      <main className="page-container">
        <Outlet />
      </main>
      <BottomNav />
    </>
  );
}

export default function App() {
  const { user, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="app-shell">
        <div className="empty-state" style={{ paddingTop: '42vh' }}>
          <span className="empty-icon">🐹</span>
          正在加载…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-shell">
        <AuthPage />
        <EasterEgg />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/growth" element={<GrowthPage />} />
          <Route path="/care" element={<DailyCarePage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="/ai" element={<AiCompanionPage />} />
          <Route path="/pet/new" element={<PetProfilePage />} />
          <Route path="/pet/:id" element={<PetProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      <EasterEgg />
    </div>
  );
}
