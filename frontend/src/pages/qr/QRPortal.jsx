import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import QRDashboard from './QRDashboard.jsx';
import QRReview from './QRReview.jsx';
import QRAnalytics from './QRAnalytics.jsx';

export default function QRPortal() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl mx-auto">
          <Routes>
            <Route index element={<QRDashboard />} />
            <Route path="review" element={<QRReview />} />
            <Route path="analytics" element={<QRAnalytics />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
