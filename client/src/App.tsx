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
import { TopicOfTheWeekPage } from './pages/TopicOfTheWeekPage';
import { ForwardOutlookPage } from './pages/ForwardOutlookPage';
import { BottomUpEpsPage } from './pages/BottomUpEpsPage';
import { GeographicPage } from './pages/GeographicPage';
import { SurprisesPage } from './pages/SurprisesPage';
import { RatingsPage } from './pages/RatingsPage';

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
        <Route path="/topic-of-the-week" element={<TopicOfTheWeekPage />} />
        <Route path="/forward-outlook" element={<ForwardOutlookPage />} />
        <Route path="/bottom-up-eps" element={<BottomUpEpsPage />} />
        <Route path="/geographic" element={<GeographicPage />} />
        <Route path="/surprises" element={<SurprisesPage />} />
        <Route path="/ratings" element={<RatingsPage />} />
      </Routes>
    </Shell>
  );
}
