// 应用入口：路由与布局。底部导航常驻，AI 悬浮入口由 BottomNav 提供。
import { Outlet, Route, Routes } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { EasterEgg } from './components/EasterEgg';
import { ActivityPage } from './pages/ActivityPage';
import { AiCompanionPage } from './pages/AiCompanionPage';
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
