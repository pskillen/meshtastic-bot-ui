import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NodesList } from '@/pages/nodes/NodesList';
import { NodeMap } from '@/pages/map/NodeMap';
import { MessageHistory } from '@/pages/messages/MessageHistory';
import { Settings } from '@/pages/settings/Settings';
import { Dashboard } from '@/pages/Dashboard';
import { NodeDetails } from '@/pages/nodes/NodeDetails';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Suspense } from 'react';
import { ConfigProvider } from '@/providers/ConfigProvider';
import { AuthProvider } from '@/providers/AuthProvider';

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfigProvider>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes with AppLayout */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/nodes" element={<NodesList />} />
                <Route path="/nodes/:id" element={<NodeDetails />} />
                <Route path="/map" element={<NodeMap />} />
                <Route path="/messages" element={<MessageHistory />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </ConfigProvider>
    </Suspense>
  );
}

export default App;
