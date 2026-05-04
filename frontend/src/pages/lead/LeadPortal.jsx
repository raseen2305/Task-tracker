import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import LeadDashboard from './LeadDashboard.jsx';
import LeadProjects from './LeadProjects.jsx';
import LeadAnalytics from './LeadAnalytics.jsx';

export default function LeadPortal() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Routes>
            <Route index element={<LeadDashboard />} />
            <Route path="projects" element={<LeadProjects />} />
            <Route path="analytics" element={<LeadAnalytics />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
