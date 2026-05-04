import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import HRDashboard from './HRDashboard.jsx';
import HRUsers from './HRUsers.jsx';
import HRBatches from './HRBatches.jsx';
import HRAccounts from './HRAccounts.jsx';
import HRAnalytics from './HRAnalytics.jsx';

export default function HRPortal() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Routes>
            <Route index element={<HRDashboard />} />
            <Route path="users" element={<HRUsers />} />
            <Route path="batches" element={<HRBatches />} />
            <Route path="accounts" element={<HRAccounts />} />
            <Route path="analytics" element={<HRAnalytics />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
