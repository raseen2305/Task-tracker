import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import LoginPage from './pages/LoginPage.jsx';
import TakerPortal from './pages/taker/TakerPortal.jsx';
import HRPortal from './pages/hr/HRPortal.jsx';
import LeadPortal from './pages/lead/LeadPortal.jsx';
import QRPortal from './pages/qr/QRPortal.jsx';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const { user } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Tasker Portal */}
      <Route
        path="/portal/taker/*"
        element={
          <ProtectedRoute allowedRoles={['TAKER']}>
            <TakerPortal />
          </ProtectedRoute>
        }
      />

      {/* HR / CEO Portal */}
      <Route
        path="/portal/hr/*"
        element={
          <ProtectedRoute allowedRoles={['HR', 'CEO']}>
            <HRPortal />
          </ProtectedRoute>
        }
      />

      {/* Project Lead Portal */}
      <Route
        path="/portal/lead/*"
        element={
          <ProtectedRoute allowedRoles={['PROJECT_LEAD']}>
            <LeadPortal />
          </ProtectedRoute>
        }
      />

      {/* Quality Reviewer Portal */}
      <Route
        path="/portal/qr/*"
        element={
          <ProtectedRoute allowedRoles={['QUALITY_REVIEWER']}>
            <QRPortal />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate
              to={
                user.role === 'TAKER'
                  ? '/portal/taker'
                  : user.role === 'PROJECT_LEAD'
                  ? '/portal/lead'
                  : user.role === 'QUALITY_REVIEWER'
                  ? '/portal/qr'
                  : '/portal/hr'
              }
              replace
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
