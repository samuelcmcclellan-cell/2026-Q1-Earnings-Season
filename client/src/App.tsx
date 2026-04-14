import { Routes, Route } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { DashboardPage } from './pages/DashboardPage';
import { CalendarPage } from './pages/CalendarPage';
import { EarningsPage } from './pages/EarningsPage';
import { CompanyDetailPage } from './pages/CompanyDetailPage';
import { SectorsPage } from './pages/SectorsPage';
import { SectorDetailPage } from './pages/SectorDetailPage';
import { RegionsPage } from './pages/RegionsPage';
import { RegionDetailPage } from './pages/RegionDetailPage';
import { SegmentsPage } from './pages/SegmentsPage';
import { ThemesPage } from './pages/ThemesPage';
import { AiInsightsPage } from './pages/AiInsightsPage';

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/earnings" element={<EarningsPage />} />
        <Route path="/company/:ticker" element={<CompanyDetailPage />} />
        <Route path="/sectors" element={<SectorsPage />} />
        <Route path="/sectors/:sectorName" element={<SectorDetailPage />} />
        <Route path="/regions" element={<RegionsPage />} />
        <Route path="/regions/:regionName" element={<RegionDetailPage />} />
        <Route path="/segments" element={<SegmentsPage />} />
        <Route path="/themes" element={<ThemesPage />} />
        <Route path="/ai" element={<AiInsightsPage />} />
      </Routes>
    </Shell>
  );
}
