import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { ConfigProvider } from '@/providers/ConfigProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { WebSocketProvider } from '@/providers/WebSocketProvider';

import { NodesList } from '@/pages/nodes/NodesList';
import { NodeMap } from '@/pages/map/NodeMap';
import { MessageHistory } from '@/pages/messages/MessageHistory';
import { Dashboard } from '@/pages/Dashboard';
import { NodeDetails } from '@/pages/nodes/NodeDetails';
import { ClaimNode } from '@/pages/nodes/ClaimNode';
import { NodeSettings } from '@/pages/user/NodeSettings';
import { MyNodes } from '@/pages/nodes/MyNodes';
import { LoginPage } from '@/pages/auth/LoginPage';
import { OAuthCallback } from '@/pages/auth/OAuthCallback';
import { UserPage } from '@/pages/user/UserPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layouts/AppLayout';
import MonitorNodes from '@/pages/nodes/monitor';

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfigProvider>
        <Router>
          <AuthProvider>
            <WebSocketProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<OAuthCallback />} />

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
                  <Route path="/nodes/my-nodes" element={<MyNodes />} />
                  <Route path="/nodes/monitor" element={<MonitorNodes />} />
                  <Route path="/nodes/:id/claim" element={<ClaimNode />} />
                  <Route path="/nodes/:id" element={<NodeDetails />} />
                  <Route path="/map" element={<NodeMap />} />
                  <Route path="/messages" element={<MessageHistory />} />
                  <Route path="/user/nodes" element={<NodeSettings />} />
                  <Route path="/user" element={<UserPage />} />
                </Route>

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </WebSocketProvider>
          </AuthProvider>
        </Router>
      </ConfigProvider>
    </Suspense>
  );
}

export default App;
