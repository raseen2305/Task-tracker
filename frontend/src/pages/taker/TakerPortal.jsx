import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import TakerDashboard from './TakerDashboard.jsx';
import TakerTasks from './TakerTasks.jsx';
import TakerProjects from './TakerProjects.jsx';
import TakerFeedback from './TakerFeedback.jsx';

export default function TakerPortal() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl mx-auto">
          <Routes>
            <Route index element={<TakerDashboard />} />
            <Route path="tasks" element={<TakerTasks />} />
            <Route path="projects" element={<TakerProjects />} />
            <Route path="feedback" element={<TakerFeedback />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
