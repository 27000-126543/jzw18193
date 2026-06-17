import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Campaigns from '@/pages/Campaigns';
import CreateCampaign from '@/pages/CreateCampaign';
import CampaignDetail from '@/pages/CampaignDetail';
import KOLSearch from '@/pages/KOLSearch';
import KOLDetail from '@/pages/KOLDetail';
import Invitations from '@/pages/Invitations';
import Schedule from '@/pages/Schedule';
import ContentReview from '@/pages/ContentReview';
import Reports from '@/pages/Reports';
import Finance from '@/pages/Finance';
import Archive from '@/pages/Archive';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/create" element={<CreateCampaign />} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
          <Route path="/kol" element={<KOLSearch />} />
          <Route path="/kol/:id" element={<KOLDetail />} />
          <Route path="/invitations" element={<Invitations />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/content" element={<ContentReview />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/archive" element={<Archive />} />
        </Route>
      </Routes>
    </Router>
  );
}
